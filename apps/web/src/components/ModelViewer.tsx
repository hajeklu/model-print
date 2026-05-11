import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import type { OcctImportResultMesh } from "occt-import-js";
import { cn } from "@/lib/utils";

interface ModelViewerProps {
  file: File | null;
  modelColor: string;
  className?: string;
}

type ViewerStatus = "idle" | "loading" | "ready" | "unsupported" | "error";

const VIEWABLE_EXTENSIONS = new Set(["stl", "step", "stp"]);
const EDGE_COLOR = "#111111";
const EDGE_OPACITY = 0.7;

function extensionOf(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

function createEdgeOverlay(geometry: THREE.BufferGeometry): THREE.LineSegments {
  return new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 18),
    new THREE.LineBasicMaterial({
      color: EDGE_COLOR,
      transparent: true,
      opacity: EDGE_OPACITY,
      depthTest: true,
      depthWrite: false,
    }),
  );
}

function buildStepMesh(source: OcctImportResultMesh, modelColor: string): THREE.Group {
  const group = new THREE.Group();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(source.attributes.position.array, 3),
  );
  if (source.attributes.normal) {
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(source.attributes.normal.array, 3),
    );
  } else {
    geometry.computeVertexNormals();
  }
  geometry.setIndex(new THREE.BufferAttribute(Uint32Array.from(source.index.array), 1));
  geometry.name = source.name;

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(modelColor),
    metalness: 0.05,
    roughness: 0.72,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);

  group.add(createEdgeOverlay(geometry));

  return group;
}

async function loadModelObject(file: File, modelColor: string): Promise<THREE.Object3D> {
  const ext = extensionOf(file);
  const buffer = await file.arrayBuffer();

  if (ext === "stl") {
    const group = new THREE.Group();
    const geometry = new STLLoader().parse(buffer);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: modelColor,
        metalness: 0.05,
        roughness: 0.72,
        side: THREE.DoubleSide,
      }),
    );
    group.add(mesh);
    group.add(createEdgeOverlay(geometry));
    return group;
  }

  if (ext === "step" || ext === "stp") {
    const [{ default: occtImportJs }, { default: occtWasmUrl }] = await Promise.all([
      import("occt-import-js"),
      import("occt-import-js/dist/occt-import-js.wasm?url"),
    ]);
    const occt = await occtImportJs({
      locateFile: (path) => (path.endsWith(".wasm") ? occtWasmUrl : path),
    });
    const result = occt.ReadStepFile(new Uint8Array(buffer), {
      linearUnit: "millimeter",
      linearDeflectionType: "bounding_box_ratio",
      linearDeflection: 0.001,
      angularDeflection: 0.5,
    });
    if (!result.success || result.meshes.length === 0) {
      throw new Error("STEP model could not be triangulated for preview.");
    }

    const group = new THREE.Group();
    for (const mesh of result.meshes) {
      group.add(buildStepMesh(mesh, modelColor));
    }
    return group;
  }

  throw new Error("Unsupported preview format.");
}

function frameObject(object: THREE.Object3D, camera: THREE.PerspectiveCamera, controls: OrbitControls) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  object.position.sub(center);

  const maxDim = Math.max(size.x, size.y, size.z, 1);
  const distance = maxDim * 1.75;
  camera.position.set(distance, distance * 0.75, distance);
  camera.near = Math.max(distance / 1000, 0.1);
  camera.far = distance * 100;
  camera.updateProjectionMatrix();

  controls.target.set(0, 0, 0);
  controls.update();
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
      child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        material.dispose();
      }
    }
  });
}

export function ModelViewer({ file, modelColor, className }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<ViewerStatus>("idle");

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !file) {
      setStatus(file ? "loading" : "idle");
      return;
    }

    const ext = extensionOf(file);
    if (!VIEWABLE_EXTENSIONS.has(ext)) {
      setStatus("unsupported");
      container.replaceChildren();
      return;
    }

    let cancelled = false;
    let previewObject: THREE.Object3D | undefined;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.replaceChildren(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x26211d, 2.4));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(2, 3, 4);
    scene.add(keyLight);

    const resize = () => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
    };
    renderer.setAnimationLoop(animate);

    setStatus("loading");
    loadModelObject(file, modelColor)
      .then((object) => {
        if (cancelled) {
          disposeObject(object);
          return;
        }
        previewObject = object;
        scene.add(object);
        frameObject(object, camera, controls);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        console.error(error);
        if (!cancelled) {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      renderer.setAnimationLoop(null);
      controls.dispose();
      if (previewObject) {
        disposeObject(previewObject);
      }
      renderer.dispose();
      container.replaceChildren();
    };
  }, [file, modelColor]);

  return (
    <div className={cn("relative overflow-hidden border border-border bg-background", className)}>
      <div ref={containerRef} className="h-72 w-full" />
      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 p-6 text-center">
          {status === "loading" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
              Připravuji 3D náhled…
            </div>
          )}
          {status === "unsupported" && (
            <div className="text-sm text-muted-foreground">
              Náhled je teď dostupný pro STL a STEP/STP. Soubor můžete odeslat i bez náhledu.
            </div>
          )}
          {status === "error" && (
            <div className="text-sm text-muted-foreground">
              Náhled se nepodařilo načíst. Soubor můžete odeslat, model zkontrolujeme ručně.
            </div>
          )}
          {status === "idle" && <div className="text-sm text-muted-foreground">Nahrajte STL nebo STEP model.</div>}
        </div>
      )}
    </div>
  );
}

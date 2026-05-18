import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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

/** Slightly lighter than black filament (#111111) so dark models stay visible. */
const VIEWER_BG_HEX = 0x1c1c1c;
const VIEWER_BG_CSS = "#1c1c1c";

function hexToLuminance(hex: string): number {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return 0.5;
  const r = Number.parseInt(raw.slice(0, 2), 16) / 255;
  const g = Number.parseInt(raw.slice(2, 4), 16) / 255;
  const b = Number.parseInt(raw.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function edgeStyleForModel(modelColor: string): { color: string; opacity: number } {
  const lum = hexToLuminance(modelColor);
  if (lum < 0.35) {
    return { color: "#5a5a5a", opacity: 0.85 };
  }
  return { color: "#111111", opacity: 0.7 };
}

function extensionOf(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

function createEdgeOverlay(
  geometry: THREE.BufferGeometry,
  modelColor: string,
): THREE.LineSegments {
  const edge = edgeStyleForModel(modelColor);
  return new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 18),
    new THREE.LineBasicMaterial({
      color: edge.color,
      transparent: true,
      opacity: edge.opacity,
      depthTest: true,
      depthWrite: false,
    }),
  );
}

function createModelMaterial(modelColor: string): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: modelColor,
    side: THREE.DoubleSide,
  });
}

/** Architectural CAD meshes are usually Z-up (mm). */
const VIEWER_UP = new THREE.Vector3(0, 0, 1);

function prepareGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  geometry.center();
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();
  return geometry;
}

function centerGroupAtOrigin(group: THREE.Group): void {
  const box = new THREE.Box3().setFromObject(group, true);
  if (box.isEmpty()) return;
  const center = box.getCenter(new THREE.Vector3());
  group.position.sub(center);
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
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, createModelMaterial(modelColor));
  group.add(mesh);

  group.add(createEdgeOverlay(geometry, modelColor));

  return group;
}

async function loadModelObject(file: File, modelColor: string): Promise<THREE.Object3D> {
  const ext = extensionOf(file);
  const buffer = await file.arrayBuffer();

  if (ext === "stl") {
    const group = new THREE.Group();
    const geometry = prepareGeometry(new STLLoader().parse(buffer));
    const mesh = new THREE.Mesh(
      geometry,
      createModelMaterial(modelColor),
    );
    group.add(mesh);
    group.add(createEdgeOverlay(geometry, modelColor));
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
    centerGroupAtOrigin(group);
    return group;
  }

  throw new Error("Unsupported preview format.");
}

function frameCamera(
  object: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
) {
  object.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(object, true);
  if (box.isEmpty()) return;

  const center = box.getCenter(new THREE.Vector3());
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const radius = Math.max(sphere.radius, 1e-6);

  const fovRad = (camera.fov * Math.PI) / 180;
  const fitHeight = radius / Math.sin(fovRad / 2);
  const fitWidth = fitHeight / Math.max(camera.aspect, 0.1);
  const distance = Math.max(fitHeight, fitWidth) * 1.3;

  camera.up.copy(VIEWER_UP);
  const viewDir = new THREE.Vector3(1, 1, 0.72).normalize().multiplyScalar(distance);
  camera.position.copy(center).add(viewDir);
  camera.lookAt(center);
  camera.near = Math.max(distance / 2000, 0.01);
  camera.far = distance * 200;
  camera.updateProjectionMatrix();

  controls.target.copy(center);
  controls.minDistance = distance * 0.15;
  controls.maxDistance = distance * 20;
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
  const { t } = useTranslation();
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
    let framed = false;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(VIEWER_BG_HEX);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100000);
    camera.up.copy(VIEWER_UP);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(VIEWER_BG_HEX, 1);
    container.replaceChildren(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.45;
    controls.rotateSpeed = 0.9;
    controls.panSpeed = 0.8;
    controls.zoomSpeed = 0.9;
    controls.screenSpacePanning = false;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    renderer.domElement.style.cursor = "grab";
    renderer.domElement.style.touchAction = "none";

    const pauseAutoRotate = () => {
      controls.autoRotate = false;
    };
    const resumeAutoRotate = () => {
      controls.autoRotate = true;
    };
    const handlePointerDown = () => {
      renderer.domElement.style.cursor = "grabbing";
    };
    const handlePointerUp = () => {
      renderer.domElement.style.cursor = "grab";
    };
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("pointerleave", handlePointerUp);
    controls.addEventListener("start", pauseAutoRotate);
    controls.addEventListener("end", resumeAutoRotate);

    const resize = () => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (framed && previewObject) {
        frameCamera(previewObject, camera, controls);
      }
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
        frameCamera(object, camera, controls);
        framed = true;
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
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointerleave", handlePointerUp);
      controls.removeEventListener("start", pauseAutoRotate);
      controls.removeEventListener("end", resumeAutoRotate);
      controls.dispose();
      if (previewObject) {
        disposeObject(previewObject);
      }
      renderer.dispose();
      container.replaceChildren();
    };
  }, [file, modelColor]);

  return (
    <div
      className={cn("relative overflow-hidden border border-border bg-card", className)}
      style={{ backgroundColor: VIEWER_BG_CSS }}
    >
      <div ref={containerRef} className="h-72 w-full" />
      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 p-6 text-center">
          {status === "loading" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
              {t("viewer.loading")}
            </div>
          )}
          {status === "unsupported" && (
            <div className="text-sm text-muted-foreground">
              {t("viewer.unsupported")}
            </div>
          )}
          {status === "error" && (
            <div className="text-sm text-muted-foreground">
              {t("viewer.error")}
            </div>
          )}
          {status === "idle" && <div className="text-sm text-muted-foreground">{t("viewer.idle")}</div>}
        </div>
      )}
    </div>
  );
}

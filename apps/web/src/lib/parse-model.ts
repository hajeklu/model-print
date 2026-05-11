import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";

export interface ModelStats {
  bboxMm: { x: number; y: number; z: number };
  volumeCm3: number;
}

function meshVolume(geom: THREE.BufferGeometry): number {
  const pos = geom.attributes.position;
  if (!pos) return 0;
  let v = 0;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const idx = geom.index;
  const triCount = idx ? idx.count / 3 : pos.count / 3;
  for (let i = 0; i < triCount; i++) {
    if (idx) {
      a.fromBufferAttribute(pos, idx.getX(i * 3));
      b.fromBufferAttribute(pos, idx.getX(i * 3 + 1));
      c.fromBufferAttribute(pos, idx.getX(i * 3 + 2));
    } else {
      a.fromBufferAttribute(pos, i * 3);
      b.fromBufferAttribute(pos, i * 3 + 1);
      c.fromBufferAttribute(pos, i * 3 + 2);
    }
    v += a.dot(new THREE.Vector3().crossVectors(b, c)) / 6;
  }
  return Math.abs(v);
}

function statsFromObject(obj: THREE.Object3D): ModelStats {
  // Aggregate bbox
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  box.getSize(size);

  // Sum volume across all meshes (units = source units, assume mm)
  let volumeMm3 = 0;
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh && mesh.geometry) {
      volumeMm3 += meshVolume(mesh.geometry as THREE.BufferGeometry);
    }
  });

  return {
    bboxMm: { x: round(size.x), y: round(size.y), z: round(size.z) },
    volumeCm3: round(volumeMm3 / 1000), // mm^3 → cm^3
  };
}

function statsFromGeometry(geom: THREE.BufferGeometry): ModelStats {
  geom.computeBoundingBox();
  const box = geom.boundingBox!;
  const size = new THREE.Vector3();
  box.getSize(size);
  const volumeMm3 = meshVolume(geom);
  return {
    bboxMm: { x: round(size.x), y: round(size.y), z: round(size.z) },
    volumeCm3: round(volumeMm3 / 1000),
  };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

export async function parseModel(file: File): Promise<ModelStats | null> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const buf = await file.arrayBuffer();

  try {
    if (ext === "stl") {
      const geom = new STLLoader().parse(buf);
      return statsFromGeometry(geom);
    }
    if (ext === "obj") {
      const text = new TextDecoder().decode(buf);
      const obj = new OBJLoader().parse(text);
      return statsFromObject(obj);
    }
    if (ext === "3mf") {
      const obj = new ThreeMFLoader().parse(buf);
      return statsFromObject(obj);
    }
  } catch (e) {
    console.error("parseModel failed", e);
    return null;
  }
  return null;
}

// Pricing (CZK)
export const PRICING = {
  setup: 250,
  perCm3: 12,
  scaleFactor: { "1:100": 1.0, "1:200": 0.6, "1:500": 0.35 } as Record<string, number>,
  nozzleFactor: { standard: 1.0, detail: 1.25 } as Record<string, number>,
};

export function estimatePrice(volumeCm3: number, scale: string, quality: string): number {
  const sf = PRICING.scaleFactor[scale] ?? 1;
  const nf = PRICING.nozzleFactor[quality] ?? 1;
  const raw = PRICING.setup + volumeCm3 * PRICING.perCm3 * sf * sf * sf * nf;
  // round to 10 CZK
  return Math.max(PRICING.setup, Math.round(raw / 10) * 10);
}

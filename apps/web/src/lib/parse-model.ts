import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";

export interface ModelStats {
  bboxMm: { x: number; y: number; z: number };
  volumeCm3: number;
}

export interface MaterialEstimate {
  grams: number;
  filamentMeters: number;
}

/** How we approximate filament use without running a slicer (Cura/Prusa). */
export const MATERIAL_ESTIMATE_METHOD = {
  volumeSource: "Signed tetrahedron sum over mesh triangles (assumes mm, watertight mesh).",
  infill: "100 % — full scaled mesh volume is treated as solid PLA (no slicer infill %).",
  density: "PLA 1.24 g/cm³, 1.75 mm filament for length.",
} as const;

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
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  box.getSize(size);

  let volumeMm3 = 0;
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh && mesh.geometry) {
      volumeMm3 += meshVolume(mesh.geometry as THREE.BufferGeometry);
    }
  });

  return {
    bboxMm: { x: round(size.x), y: round(size.y), z: round(size.z) },
    volumeCm3: round(volumeMm3 / 1000),
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

/** Indicative shop pricing in EUR (not binding). */
export const PRICING = {
  baseEur: 95,
};

/** Linear size ratio for scale labels like `1:100` → 0.01. `1:1` → 1. */
export function parseScaleLinearRatio(scale: string): number {
  const match = /^1:(\d+)$/.exec(scale);
  if (!match) return 1;
  const denominator = Number(match[1]);
  return denominator > 0 ? 1 / denominator : 1;
}

export function scaledVolumeCm3(volumeCm3: number, scale: string): number {
  const linear = parseScaleLinearRatio(scale);
  return round(volumeCm3 * linear ** 3);
}

export function scaledBboxMm(
  bboxMm: ModelStats["bboxMm"],
  scale: string,
): ModelStats["bboxMm"] {
  const linear = parseScaleLinearRatio(scale);
  return {
    x: round(bboxMm.x * linear),
    y: round(bboxMm.y * linear),
    z: round(bboxMm.z * linear),
  };
}

/** Smallest printable axis length at the given scale (mm, unrounded). */
export const MIN_PRINT_AXIS_MM = 1;

export function smallestScaledAxisMm(
  bboxMm: ModelStats["bboxMm"],
  scale: string,
): number {
  const linear = parseScaleLinearRatio(scale);
  return Math.min(bboxMm.x, bboxMm.y, bboxMm.z) * linear;
}

export function meetsMinimumPrintSize(
  bboxMm: ModelStats["bboxMm"],
  scale: string,
): boolean {
  return smallestScaledAxisMm(bboxMm, scale) >= MIN_PRINT_AXIS_MM;
}

const PLA_DENSITY_G_CM3 = 1.24;
const FILAMENT_DIAMETER_MM = 1.75;

export function estimatePrice(volumeCm3: number, scale: string): number {
  const { grams } = estimateMaterialUsage(volumeCm3, scale);
  return Math.round(PRICING.baseEur + grams / 10);
}

export function estimateMaterialUsage(volumeCm3: number, scale: string): MaterialEstimate {
  const materialVolumeCm3 = scaledVolumeCm3(volumeCm3, scale);
  const grams = materialVolumeCm3 * PLA_DENSITY_G_CM3;
  const filamentRadiusCm = FILAMENT_DIAMETER_MM / 10 / 2;
  const filamentAreaCm2 = Math.PI * filamentRadiusCm * filamentRadiusCm;
  const filamentMeters = materialVolumeCm3 / filamentAreaCm2 / 100;

  return {
    grams: Math.round(grams),
    filamentMeters: Math.round(filamentMeters * 10) / 10,
  };
}

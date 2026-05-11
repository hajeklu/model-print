export type FormatGroup = "ready" | "architectural";

export interface FormatInfo {
  ext: string;
  label: string;
  group: FormatGroup;
  description: string;
  parsable: boolean; // can we compute volume in browser
}

export const FORMATS: FormatInfo[] = [
  { ext: "stl", label: "STL", group: "ready", description: "Standard pro 3D tisk", parsable: true },
  { ext: "3mf", label: "3MF", group: "ready", description: "Moderní formát s metadaty", parsable: true },
  { ext: "obj", label: "OBJ", group: "ready", description: "Mesh s geometrií", parsable: true },
  { ext: "step", label: "STEP", group: "ready", description: "Přesný CAD model", parsable: false },
  { ext: "stp", label: "STP", group: "ready", description: "Přesný CAD model", parsable: false },
  { ext: "ifc", label: "IFC", group: "architectural", description: "BIM model (Revit, ArchiCAD)", parsable: false },
  { ext: "skp", label: "SKP", group: "architectural", description: "SketchUp projekt", parsable: false },
  { ext: "3dm", label: "3DM", group: "architectural", description: "Rhinoceros model", parsable: false },
  { ext: "dae", label: "DAE", group: "architectural", description: "Collada export", parsable: false },
];

export const ACCEPTED_EXTS = FORMATS.map((f) => f.ext);

export function getFormatInfo(filename: string): FormatInfo | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  return FORMATS.find((f) => f.ext === ext) ?? null;
}

export const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100 MB

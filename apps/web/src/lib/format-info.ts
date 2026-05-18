export type FormatGroup = "ready" | "architectural";

export interface FormatInfo {
  ext: string;
  label: string;
  group: FormatGroup;
  parsable: boolean; // can we compute volume in browser
}

export const FORMATS: FormatInfo[] = [
  { ext: "stl", label: "STL", group: "ready", parsable: true },
  { ext: "3mf", label: "3MF", group: "ready", parsable: true },
  { ext: "obj", label: "OBJ", group: "ready", parsable: true },
  { ext: "step", label: "STEP", group: "ready", parsable: false },
  { ext: "stp", label: "STP", group: "ready", parsable: false },
  { ext: "ifc", label: "IFC", group: "architectural", parsable: false },
  { ext: "skp", label: "SKP", group: "architectural", parsable: false },
  { ext: "3dm", label: "3DM", group: "architectural", parsable: false },
  { ext: "dae", label: "DAE", group: "architectural", parsable: false },
];

export const ACCEPTED_EXTS = FORMATS.map((f) => f.ext);

export function getFormatInfo(filename: string): FormatInfo | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  return FORMATS.find((f) => f.ext === ext) ?? null;
}

export const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100 MB

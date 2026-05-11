declare module "occt-import-js" {
  export interface OcctImportOptions {
    locateFile?: (path: string, scriptDirectory: string) => string;
  }

  export interface OcctImportResultMesh {
    name: string;
    color?: [number, number, number];
    brep_faces?: Array<{
      first: number;
      last: number;
      color: [number, number, number] | null;
    }>;
    attributes: {
      position: { array: number[] };
      normal?: { array: number[] };
    };
    index: { array: number[] };
  }

  export interface OcctImportResult {
    success: boolean;
    meshes: OcctImportResultMesh[];
  }

  export interface OcctImporter {
    ReadStepFile(content: Uint8Array, params: unknown): OcctImportResult;
  }

  export default function occtImportJs(options?: OcctImportOptions): Promise<OcctImporter>;
}

declare module "*.wasm?url" {
  const url: string;
  export default url;
}

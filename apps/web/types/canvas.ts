import { TLEditorSnapshot } from "tldraw";
export * from "@workspace/canvas";

// --- Frontend Canvas Types ---

export type FrontendDesignDoc = {
  snapshot: TLEditorSnapshot | null;
};

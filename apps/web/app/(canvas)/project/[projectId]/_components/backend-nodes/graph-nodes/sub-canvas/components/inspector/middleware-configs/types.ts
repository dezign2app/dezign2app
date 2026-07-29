import type { MiddlewareNodeData } from "../../../types";

export interface MiddlewareConfigProps {
  data: MiddlewareNodeData;
  onUpdate: (changes: Partial<MiddlewareNodeData>) => void;
}

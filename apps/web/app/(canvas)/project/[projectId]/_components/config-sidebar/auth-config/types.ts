import { BackendNode, BackendEdge, BackendNodeData } from "@/types/canvas";

export interface AuthConfigSectionProps {
  data: BackendNodeData;
  updateData: (changes: Partial<BackendNodeData>) => void;
  allNodes: BackendNode[];
  edges: BackendEdge[];
  nodeId: string;
}

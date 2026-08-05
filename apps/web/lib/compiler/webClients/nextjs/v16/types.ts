export interface LinkedEndpointInfo {
  targetNodeId: string;
  targetNodeName: string;
  targetNodePort: string;
  endpointId?: string;
  endpointName: string;
  method: string;
  path: string;
  fullUrl: string;
}

export interface PageInfo {
  nodeId: string;
  label: string;
  description?: string;
  slug: string;
  routePath: string;
  componentName: string;
  isRoot: boolean;
}

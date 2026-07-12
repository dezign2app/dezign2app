import { z } from 'zod';

export const CreateServiceSchema = z.object({
  projectId: z.string(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
});

export const ConnectNodesSchema = z.object({
  projectId: z.string(),
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
});

export class CanvasOperations {
  static async createService(params: z.infer<typeof CreateServiceSchema>) {
    // Generate operation to create a service node
    return {
      type: 'CREATE_NODE',
      nodeType: 'Service',
      ...params
    };
  }

  static async connectNodes(params: z.infer<typeof ConnectNodesSchema>) {
    // Generate operation to connect two nodes
    return {
      type: 'CREATE_EDGE',
      ...params
    };
  }
}

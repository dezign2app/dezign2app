import { NodeMemory, RelationshipMemory, ResourceMemory } from '../knowledge/documents.js';

/**
 * Abstract interface to isolate the engine from the underlying persistence layer.
 * Can be implemented by Convex, Supermemory, Neo4J, or in-memory for testing.
 */
export interface GraphRepository {
  getNode(projectId: string, nodeId: string): Promise<NodeMemory | null>;
  getResource(projectId: string, resourceId: string): Promise<ResourceMemory | null>;
  getRelationshipsBySource(projectId: string, sourceId: string): Promise<RelationshipMemory[]>;
  getRelationshipsByTarget(projectId: string, targetId: string): Promise<RelationshipMemory[]>;
  searchNodes(projectId: string, query: string): Promise<NodeMemory[]>;
}

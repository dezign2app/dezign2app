import { GraphRepository } from './repository.js';
import { NodeMemory, RelationshipMemory, ResourceMemory } from '../knowledge/documents.js';

export class GraphTraverser {
  constructor(private readonly repo: GraphRepository) {}

  async traceUpstream(projectId: string, targetId: string): Promise<any[]> {
    const relationships = await this.repo.getRelationshipsByTarget(projectId, targetId);
    // TODO: Traverse recursively
    return relationships;
  }

  async traceDownstream(projectId: string, sourceId: string): Promise<any[]> {
    const relationships = await this.repo.getRelationshipsBySource(projectId, sourceId);
    // TODO: Traverse recursively
    return relationships;
  }

  async findPublishers(projectId: string, topicId: string): Promise<NodeMemory[]> {
    const relations = await this.repo.getRelationshipsByTarget(projectId, topicId);
    const publishers: NodeMemory[] = [];
    for (const rel of relations) {
      if (rel.relationType === 'publishes') {
        const node = await this.repo.getNode(projectId, rel.sourceId);
        if (node) publishers.push(node);
      }
    }
    return publishers;
  }

  async findConsumers(projectId: string, topicId: string): Promise<NodeMemory[]> {
    const relations = await this.repo.getRelationshipsBySource(projectId, topicId);
    const consumers: NodeMemory[] = [];
    for (const rel of relations) {
      if (rel.relationType === 'consumes') {
        const node = await this.repo.getNode(projectId, rel.targetId);
        if (node) consumers.push(node);
      }
    }
    return consumers;
  }
}

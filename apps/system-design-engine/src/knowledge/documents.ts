export type NodeType =
  | 'Client'
  | 'Gateway'
  | 'Service'
  | 'Database'
  | 'ExternalService'
  | 'unknown';

export type ResourceType =
  | 'kafka-topic'
  | 'sqs-queue'
  | 'redis-stream'
  | 'redis-channel';

export interface NodeMemory {
  projectId: string;
  nodeId: string;
  type: NodeType;
  name: string;
  facts: string[];
  version: number;
}

export interface ResourceMemory {
  projectId: string;
  resourceId: string;
  type: ResourceType;
  name: string;
  version: number;
}

export interface RelationshipMemory {
  projectId: string;
  edgeId: string;
  sourceId: string; // Could be a node or resource
  targetId: string;
  relationType: 'calls' | 'publishes' | 'consumes' | 'reads' | 'writes' | 'connects';
  version: number;
}

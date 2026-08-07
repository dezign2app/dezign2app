import type {
  ServiceTechStack,
  ServiceTechVersion,
  WebClientTechStack,
  WebClientTechVersion,
  DatabaseEngine,
  DatabaseEngineVersion,
  DatabaseORM,
  DatabaseOrmVersion,
} from "../techStack";
import type { Endpoint, WorkerTask, SearchSource } from "../schemas";
import type { InterServiceProtocol } from "../constants";

import type { UIEventItem } from "./simulation";
import type { MessagingNodeData } from "./messaging";
import type { GatewayRoute, AuthRule, AuthFramework, BetterAuthVersion } from "./auth";
import type {
  CanvasLangGraphNodeData,
  CanvasLangGraphStepNodeData,
  CanvasAINodeData,
} from "./langgraph";

export type BackendNodeType =
  | "service"
  | "database"
  | "queue"
  | "pubsub"
  | "eventstream"
  | "kafka"
  | "redis-streams"
  | "sqs"
  | "redis-pubsub"
  | "redis-cache"
  | "entity"
  | "webClient"
  | "external"
  | "group"
  | "db_ref"
  | "storage"
  // New node types
  | "worker"
  | "serverless"
  | "search_index"
  | "api_gateway"
  | "load_balancer"
  | "webhook"
  | "llm"
  | "mcp_server"
  | "vector_db_ref"
  | "identity_provider"
  | "auth"
  | "webApp"
  | "webAppGroup"
  | "langgraph"
  | "langgraph_step";

/** Core fields present on every canvas node. */
export interface BaseNodeData {
  label: string;
  description?: string;
  isWebClient?: boolean;
  parentId?: string;
  /** Nested position inside a group node. */
  position?: { x: number; y: number };
  /** Position override used in the graph-view layout. */
  graphPosition?: { x: number; y: number };
  // Tech stack & DB engine selection (shared by Service and Database nodes)
  techStack?: ServiceTechStack | WebClientTechStack;
  techVersion?: ServiceTechVersion | WebClientTechVersion;
  dbEngine?: DatabaseEngine;
  dbEngineVersion?: DatabaseEngineVersion;
  orm?: DatabaseORM;
  ormVersion?: DatabaseOrmVersion;
  // Client & connection properties
  targetServerId?: string;
  targetRouteId?: string;
  pageSlug?: string;
  // Shared visual / misc
  authentication?: string;
  tags?: string[];
}

/** Database entity / table schema fields (canvas type). */
export interface CanvasEntityNodeData {
  isSchemaGroup?: boolean;
  variant?: string;
  dbType?: "relational" | "document" | "vector";
  /** Column definitions stored as part of the node. */
  columns?: {
    name: string;
    type: string;
    isPrimaryKey?: boolean;
    isForeignKey?: boolean;
    isNotNull?: boolean;
    isUnique?: boolean;
    references?: { table: string; column: string };
  }[];
  indexes?: {
    name: string;
    columns: string;
    isUnique?: boolean;
  }[];
  /** For vector DB entities. */
  embeddingModel?: string;
  dimensions?: number;
  metric?: "Cosine" | "Dot Product" | "Euclidean";
  /** Reference to entity node ID (used by DB Ref nodes). */
  tableRef?: string;
  /** Reference to vector collection (used by Vector DB Ref nodes). */
  collectionRef?: string;
  /** Reference to DB node (used by Vector DB Ref nodes). */
  dbRef?: string;
  /** Seed data rows for the entity. */
  seedRows?: Record<string, string | number | boolean | null>[];
}

/** Service / web-client node fields — endpoints, routing, CORS, etc. (canvas type). */
export interface CanvasServiceNodeData {
  baseUrl?: string;
  cors?: boolean;
  corsOrigins?: string;
  rateLimit?: string;
  timeout?: string;
  port?: string;
  grpcPort?: string;
  interServiceProtocol?: InterServiceProtocol;
  endpoints?: Endpoint[];


  routeGroups?: {
    id: string;
    name: string;
    basePath: string;
    endpoints: Endpoint[];
  }[];
  // Graph-view event/logic lists (for web clients and services)
  events?: UIEventItem[] | { id: string; name: string }[];
  inputs?: { id: string; name: string }[];
  logic?: { id: string; name: string }[];
  outputs?: { id: string; name: string }[];
  actions?: { id: string; name: string }[];
  publishedEvents?: {
    id: string;
    name: string;
    description?: string;
    schema?: string;
    version?: string;
    targetNodeId?: string;
  }[];
  consumedEvents?: {
    id: string;
    name: string;
    description?: string;
    schema?: string;
    retryPolicy?: string;
    version?: string;
    handlerLogic?: string;
    targetNodeId?: string;
  }[];
}

/** Background worker node fields (canvas type). */
export interface CanvasWorkerNodeData {
  tasks?: WorkerTask[];
  queueSources?: string[];
  concurrency?: number;
  retryPolicy?: string;
  maxRetries?: number;
}

/** Serverless function node fields (canvas type). */
export interface CanvasServerlessNodeData {
  triggerType?: "HTTP" | "Event" | "CRON" | "Queue";
  runtime?: string;
  memoryMb?: number;
  timeoutSec?: number;
}

/** Infrastructure node fields — API Gateway, Load Balancer, Search Index (canvas type). */
export interface CanvasInfrastructureNodeData {
  // API Gateway
  routes?: GatewayRoute[];
  authRules?: AuthRule[];
  authType?: string;
  // Load Balancer
  targetGroups?: { id: string; name: string }[];
  algorithm?: string;
  healthCheckPath?: string;
  // Search Index
  searchSources?: SearchSource[];
  analyzer?: string;
  shards?: number;
  replicas?: number;
  refreshInterval?: string;
  reindexStrategy?: string;
}

/** Identity Provider node fields (canvas type). */
export interface CanvasIdentityProviderNodeData {
  provider?: string;
  issuerUrl?: string;
  discoveryUrl?: string;
  jwksUrl?: string;
  audiences?: string[];
  supportedAlgorithms?: string[];
  customCapabilities?: {
    authentication?: boolean;
    userManagement?: boolean;
    identity?: boolean;
    authorization?: boolean;
  };
  customOutputs?: {
    user?: boolean;
    tokens?: boolean;
    claims?: boolean;
  };
}

/** Auth Framework node fields (canvas type). */
export interface CanvasAuthNodeData {
  framework?: AuthFramework;
  authMode?: "embedded" | "standalone" | "gateway";
  plugins?: string[];
  secretKey?: string;
  baseUrl?: string;
  version?: BetterAuthVersion | string;
}

/** WebApp node fields (canvas type). */
export interface CanvasWebAppNodeData {
  appSlug?: string;
  framework?: string;
  port?: string;
  routes?: Array<{
    id: string;
    name: string;
    path: string;
    accessType?: "public" | "private" | "role-gated" | "payment-gated" | "org-gated";
    allowedRoles?: string[];
    requiredPlans?: string[];
    allowedOrgRoles?: string[];
    redirectTo?: string;
    isAuthPage?: boolean;
    events?: UIEventItem[];
  }>;
  authMode?: "none" | "connected_auth_node" | "custom_jwt" | "better_auth";
  authNodeId?: string;
  defaultLoginRoute?: string;
  corsOrigins?: string;
}

/** Web Client node fields (canvas type). */
export interface CanvasWebClientNodeData {
  appName?: string;
  appSlug?: string;
  accessType?: "public" | "private" | "role-gated" | "payment-gated" | "org-gated";
  allowedRoles?: string[];
  requiredPlans?: string[];
  allowedOrgRoles?: string[];
  redirectTo?: string;
  isAuthPage?: boolean;
  authNodeId?: string;
  events?: UIEventItem[];
}

/**
 * Composite data payload for every BackendNode.
 * All domain-specific fields are optional; only `BaseNodeData.label` is required.
 * Sub-type interfaces are prefixed with `Canvas` to avoid naming conflicts
 * with the Zod-inferred schema types in `@workspace/canvas/schemas`.
 */
export type BackendNodeData = BaseNodeData &
  Partial<
    CanvasEntityNodeData &
      CanvasServiceNodeData &
      CanvasWebAppNodeData &
      CanvasWebClientNodeData &
      MessagingNodeData &
      CanvasWorkerNodeData &
      CanvasServerlessNodeData &
      CanvasInfrastructureNodeData &
      CanvasAINodeData &
      CanvasIdentityProviderNodeData &
      CanvasAuthNodeData &
      CanvasLangGraphNodeData &
      CanvasLangGraphStepNodeData
  >;

export type BackendNode = {
  id: string;
  type: BackendNodeType;
  position: { x: number; y: number };
  data: BackendNodeData;
  fractionalIndex: string; // For Z-order
  parentId?: string;
  style?: Record<string, string | number | boolean | null | undefined>;
  width?: number;
  height?: number;
  selected?: boolean;
};

// BackendNodeData is defined above (composite of all node domain sub-types).
// BackendNodeItem is kept for AI tool / store compatibility.
export interface BackendNodeItem {
  nodeId: string;
  type?: string;
  data?: BackendNodeData;
}

/**
 * Describes a reusable function exported by a shared package (db, kafka, redis, etc.)
 * so service nodes can auto-import and call them in generated route handlers.
 */
export interface ReusableFunction {
  /** Human-readable function name, e.g. "findAllUsers" */
  name: string;
  /** Full import path, e.g. "@workspace/db/helpers/users" */
  importPath: string;
  /** TypeScript signature for documentation, e.g. "findAllUsers(): User[]" */
  signature: string;
  /** The entity/table/topic this function targets, e.g. "users" */
  targetName: string;
  /** CRUD operation kind or category */
  kind: "findAll" | "findById" | "create" | "update" | "delete" | "publish" | "consume" | "custom";
}

/**
 * Represents a database operation target resolved for a generated route endpoint.
 */
export interface TargetDbOperation {
  fn: ReusableFunction;
  callExpr: string;
  operationKind: "read" | "create" | "update" | "delete";
  tableNodeId?: string;
}


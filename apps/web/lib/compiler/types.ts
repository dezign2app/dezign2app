export interface CompiledFile {
  filename: string;
  language: string;
  content: string;
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

export interface CompiledServiceResult {
  serviceId: string;
  serviceName: string;
  files: CompiledFile[];
}

export interface CompiledDatabaseResult {
  files: CompiledFile[];
  /** Reusable raw SQL CRUD functions generated for each table */
  reusableFunctions: ReusableFunction[];
}

export interface CompiledKafkaResult {
  files: CompiledFile[];
  /** Reusable publish/consume functions generated for each topic */
  reusableFunctions: ReusableFunction[];
  /** The folder name used under packages/ e.g. "order-events" → packages/order-events */
  packageFolder: string;
  /** The npm package name e.g. "@workspace/order-events" */
  packageName: string;
}

export interface CompiledRedisResult {
  files: CompiledFile[];
}

export interface CompiledWebClientResult {
  webClientId: string;
  webClientName: string;
  files: CompiledFile[];
}

export interface CompiledMonorepoResult {
  projectName: string;
  files: CompiledFile[];
  services: { id: string; name: string; folderName: string }[];
  webClients?: { id: string; name: string; folderName: string }[];
}

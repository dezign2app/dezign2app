import type { ReusableFunction } from "./nodes";

export interface CompiledFile {
  filename: string;
  language: string;
  content: string;
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

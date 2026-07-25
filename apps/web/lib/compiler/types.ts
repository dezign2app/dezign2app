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
}

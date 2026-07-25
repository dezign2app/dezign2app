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

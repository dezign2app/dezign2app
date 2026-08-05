export type LogicMode = "natural_language" | "code";

export type CrudOperation = "create" | "read" | "update" | "delete";

export interface TableCrudConfig {
  tableNodeId: string;
  operations: CrudOperation[];
  explanations?: Record<CrudOperation, string>;
}

export interface PublishedEventInfo {
  id?: string;
  name?: string;
  topic?: string;
}

export interface BusinessLogicBlockProps {
  mode?: LogicMode;
  onModeChange?: (mode: LogicMode) => void;
  prompt?: string;
  onPromptChange?: (val: string) => void;
  code?: string;
  onCodeChange?: (val: string) => void;
  onGenerateCode?: () => Promise<void> | void;
  isGenerating?: boolean;
  title?: string;
  description?: string;
  promptPlaceholder?: string;
  codePlaceholder?: string;
  codeLanguageLabel?: string;
  className?: string;

  // CRUD Operations Props
  crudConfig?: TableCrudConfig[];
  onCrudConfigChange?: (config: TableCrudConfig[]) => void;
  availableTableNodes?: { id: string; label: string }[];

  // Messaging & Endpoint Context Props
  publishedEvents?: PublishedEventInfo[];
  endpointMethod?: string;
  endpointPath?: string;
}

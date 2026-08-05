import type { LogicMode } from "@/app/(canvas)/project/[projectId]/_components/shared/BusinessLogicBlock";

export interface LangGraphRouteConfigProps {
  id: string;
  nodeId: string;
}

export interface CustomField {
  key: string;
  value: string;
}

export type ResponseExecutionMode = "sync" | "stream" | "async_ack";
export type ResponseOutputMode = "full" | "selected";
export type RouteKind = "endpoint" | "event" | "task";

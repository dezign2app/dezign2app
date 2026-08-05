import React from "react";
import { Handle, Position, Connection } from "@xyflow/react";
import {
  HANDLE_LLM_IN,
  HANDLE_LLM_OUT,
  HANDLE_TOOL_IN,
  HANDLE_TOOL_OUT,
  HANDLE_MIDDLEWARE_IN,
  HANDLE_MIDDLEWARE_OUT,
  HANDLE_MEMORY_IN,
  HANDLE_MEMORY_OUT,
} from "../../constants";

export const NodeHandles: React.FC = () => {
  return (
    <>
      {/* Target Handles for LLM, Tools, Middleware, Memory */}
      <Handle
        type="target"
        position={Position.Top}
        id={HANDLE_LLM_IN}
        style={{ left: "12.5%" }}
        isValidConnection={(connection: Connection) =>
          connection.sourceHandle === HANDLE_LLM_OUT ||
          Boolean(connection.source?.startsWith("llm_"))
        }
        className="!bg-sky-400 !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-top-[7px]"
        title="Connect LLM (llm_out)"
      />
      <Handle
        type="target"
        position={Position.Top}
        id={HANDLE_TOOL_IN}
        style={{ left: "37.5%" }}
        isValidConnection={(connection: Connection) =>
          connection.sourceHandle === HANDLE_TOOL_OUT ||
          Boolean(connection.source?.startsWith("tool_"))
        }
        className="!bg-emerald-500 !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-top-[7px]"
        title="Connect Tool Node (tool_out)"
      />
      <Handle
        type="target"
        position={Position.Top}
        id={HANDLE_MIDDLEWARE_IN}
        style={{ left: "62.5%" }}
        isValidConnection={(connection: Connection) =>
          connection.sourceHandle === HANDLE_MIDDLEWARE_OUT ||
          Boolean(connection.source?.startsWith("mw_"))
        }
        className="!bg-purple-500 !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-top-[7px]"
        title="Connect Middleware (middleware_out)"
      />
      <Handle
        type="target"
        position={Position.Top}
        id={HANDLE_MEMORY_IN}
        style={{ left: "87.5%" }}
        isValidConnection={(connection: Connection) =>
          connection.sourceHandle === HANDLE_MEMORY_OUT ||
          Boolean(
            connection.source?.startsWith("mem_") ||
              connection.source?.startsWith("db_"),
          )
        }
        className="!bg-amber-500 !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-top-[7px]"
        title="Connect Memory / DB Ref Node (memory_out)"
      />

      {/* Execution Flow Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!bg-foreground !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-left-[7px]"
        title="Input Flow"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="!bg-foreground !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-right-[7px]"
        title="Output Flow"
      />
    </>
  );
};

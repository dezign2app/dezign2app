import { BackendNode, BackendEdge } from "@/types/canvas";
import { AnyMessagingResource } from "@workspace/canvas/types";
import { CompiledFile } from "../../../../types";
import {
  resolveConsumerTrace,
  resolveProducerTrace,
} from "../../../../traceResolver";

interface EventGeneratorsOptions {
  node: BackendNode;
  serviceName: string;
  nodeConsumedEvents: (AnyMessagingResource & {
    nodeId: string;
    variant: "publish" | "consume";
  })[];
  nodePublishedEvents: (AnyMessagingResource & {
    nodeId: string;
    variant: "publish" | "consume";
  })[];
  allNodes: BackendNode[];
  allEdges: BackendEdge[];
}

export function generateEventConsumersAndProducers({
  node,
  serviceName,
  nodeConsumedEvents,
  nodePublishedEvents,
  allNodes,
  allEdges,
}: EventGeneratorsOptions): CompiledFile[] {
  const files: CompiledFile[] = [];

  // CONSUMERS
  const consumerImports: string[] = [];
  const consumerInits: string[] = [];

  if (nodeConsumedEvents.length === 0) {
    files.push({
      filename: "consumers/__init__.py",
      language: "python",
      content: `from core.logger import get_logger

logger = get_logger("${serviceName}:consumers")

def init_consumers() -> None:
    logger.debug("No consumed events configured for this service")
`,
    });
  } else {
    nodeConsumedEvents.forEach((ev) => {
      const consumerFileName =
        ev.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "_")
          .replace(/_+/g, "_")
          .replace(/^_+|_+$/g, "") || "event_consumer";
      const handlerName = `handle_${consumerFileName}`;
      const trace = resolveConsumerTrace(node, ev, allNodes, allEdges);

      let consumerCode = `from typing import Dict, Any
from core.logger import get_logger

logger = get_logger("${serviceName}:consumer:${ev.name}")

async def ${handlerName}(raw_payload: Dict[str, Any]) -> None:
    """
    Event Consumer for: "${ev.name}"
    Description: ${ev.description || "Processes incoming event payload"}

    🤖 AI CODING AGENT DIRECTIVE:
    Action: Process Event "${ev.name}"
    Purpose: ${ev.description || "Processes incoming event payload"}
`;
      if (trace.incoming.length > 0) {
        consumerCode += `\n    📥 EVENT SOURCE:\n`;
        trace.incoming.forEach((inc) => {
          consumerCode += `    - ${inc.nodeType}: "${inc.nodeName}" (${inc.detail})\n`;
        });
      }

      if (trace.outgoing.length > 0) {
        consumerCode += `\n    🔗 RESOURCE DEPENDENCIES / SIDE EFFECTS:\n`;
        trace.outgoing.forEach((out) => {
          consumerCode += `    - ${out.nodeType}: "${out.nodeName}" (${out.detail})\n`;
        });
      }
      consumerCode += `    """
    try:
        logger.info(f"Consuming event [${ev.name}]: {raw_payload}")
        # STEP 1: Parse and validate event payload
        # STEP 2: Execute side effects / domain logic
    except Exception as e:
        logger.error(f"Error consuming event [${ev.name}]: {e}")
`;

      files.push({
        filename: `consumers/${consumerFileName}.py`,
        language: "python",
        content: consumerCode,
      });

      consumerImports.push(`from .${consumerFileName} import ${handlerName}`);
      consumerInits.push(
        `    logger.info("Registered listener for event: ${ev.name}")`,
      );
    });

    files.push({
      filename: "consumers/__init__.py",
      language: "python",
      content: `from core.logger import get_logger
${consumerImports.join("\n")}

logger = get_logger("${serviceName}:consumers")

def init_consumers() -> None:
    logger.info("Initializing event consumers...")
${consumerInits.join("\n")}

__all__ = ["init_consumers"]
`,
    });
  }

  // PRODUCERS
  const producerImports: string[] = [];

  if (nodePublishedEvents.length === 0) {
    files.push({
      filename: "producers/__init__.py",
      language: "python",
      content: `from core.logger import get_logger

logger = get_logger("${serviceName}:producers")
`,
    });
  } else {
    nodePublishedEvents.forEach((ev) => {
      const producerFileName =
        ev.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "_")
          .replace(/_+/g, "_")
          .replace(/^_+|_+$/g, "") || "event_producer";
      const publishName = `publish_${producerFileName}`;
      const trace = resolveProducerTrace(node, ev, allNodes, allEdges);

      let producerCode = `from typing import Dict, Any
from core.logger import get_logger

logger = get_logger("${serviceName}:producer:${ev.name}")

async def ${publishName}(payload: Dict[str, Any]) -> None:
    """
    Event Producer for: "${ev.name}"
    Description: ${ev.description || "Publishes event to message broker"}

    🤖 AI CODING AGENT DIRECTIVE:
    Action: Publish Event "${ev.name}"
`;
      if (trace.outgoing.length > 0) {
        producerCode += `\n    📤 TARGET DESTINATIONS:\n`;
        trace.outgoing.forEach((out) => {
          producerCode += `    - ${out.nodeType}: "${out.nodeName}" (${out.detail})\n`;
        });
      }
      producerCode += `    """
    try:
        logger.info(f"Publishing event [${ev.name}]: {payload}")
    except Exception as e:
        logger.error(f"Error publishing event [${ev.name}]: {e}")
`;

      files.push({
        filename: `producers/${producerFileName}.py`,
        language: "python",
        content: producerCode,
      });

      producerImports.push(`from .${producerFileName} import ${publishName}`);
    });

    files.push({
      filename: "producers/__init__.py",
      language: "python",
      content: `${producerImports.join("\n")}\n`,
    });
  }

  return files;
}

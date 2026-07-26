import { BackendNode, BackendEdge, SimulationTestCase } from "@/types/canvas";
import { Endpoint, AnyMessagingResource } from "@workspace/canvas/types";
import { CompiledFile, CompiledServiceResult } from "../../../types";
import { parseSchemaJson, toVarName, toPascalCase } from "../../../utils";
import { resolveEndpointTrace, resolveConsumerTrace, resolveProducerTrace } from "../../../traceResolver";

/**
 * Converts Express/URL path params (:id) to FastAPI/Python format ({id})
 */
function convertPathParams(path: string): string {
  return path.replace(/:([a-zA-Z0-9_]+)/g, "{$1}");
}

/**
 * Generates a clean Pythonic snake_case route file name without double underscores (__)
 */
function toPythonRouteFileName(method: string, pathOrName: string, index: number): string {
  const methodStr = (method || "get").toLowerCase();
  const cleanPath = (pathOrName || "")
    .replace(/^https?:\/\/[^\/]+/, "")
    .replace(/^[\/]+|[\/]+$/g, "")
    .replace(/:([a-zA-Z0-9_]+)|\{([a-zA-Z0-9_]+)\}/g, "by_$1$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .toLowerCase();

  const base = cleanPath ? `${methodStr}_${cleanPath}` : `${methodStr}_root`;
  const sanitized = base.replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  return sanitized || `${methodStr}_route_${index + 1}`;
}

/**
 * Compiles a Service Node into a modular FastAPI (Python) microservice application,
 * mirroring the exact modular file/folder architecture as Express.js services.
 */
export function compileFastAPIService(
  node: BackendNode,
  endpoints: (Endpoint & { nodeId: string })[] = [],
  events: (AnyMessagingResource & { nodeId: string; variant: "publish" | "consume" })[] = [],
  allNodes: BackendNode[] = [],
  allEdges: BackendEdge[] = [],
  testCases: SimulationTestCase[] = []
): CompiledServiceResult {
  const serviceName = node.data.label || "Service";
  const sanitizedName = serviceName.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "") || "service";
  const port = node.data.port || "8080";
  const cors = node.data.cors ?? true;
  const corsOrigins = node.data.corsOrigins || "*";

  let nodeEndpoints = endpoints.filter((e) => e.nodeId === node.id);
  if (nodeEndpoints.length === 0 && node.data?.endpoints) {
    nodeEndpoints = node.data.endpoints as (Endpoint & { nodeId: string })[];
  }
  if (node.data?.routeGroups) {
    for (const group of node.data.routeGroups as any[]) {
      if (group.endpoints) {
        nodeEndpoints = [...nodeEndpoints, ...group.endpoints];
      }
    }
  }

  let nodeConsumedEvents = events.filter((e) => e.nodeId === node.id && e.variant === "consume");
  if (nodeConsumedEvents.length === 0 && node.data?.consumedEvents) {
    nodeConsumedEvents = (node.data.consumedEvents as any[]).map((e) => ({ ...e, nodeId: node.id, variant: "consume" }));
  }

  let nodePublishedEvents = events.filter((e) => e.nodeId === node.id && e.variant === "publish");
  if (nodePublishedEvents.length === 0 && node.data?.publishedEvents) {
    nodePublishedEvents = (node.data.publishedEvents as any[]).map((e) => ({ ...e, nodeId: node.id, variant: "publish" }));
  }

  const files: CompiledFile[] = [];

  // =========================================================================
  // 1. CORE FILES (core/config.py, core/logger.py, core/response.py, core/__init__.py)
  // =========================================================================

  files.push({
    filename: "core/__init__.py",
    language: "python",
    content: `from .config import settings\nfrom .logger import get_logger\nfrom .response import format_response\n\n__all__ = ["settings", "get_logger", "format_response"]\n`,
  });

  files.push({
    filename: "core/config.py",
    language: "python",
    content: `import os

class Settings:
    SERVICE_NAME: str = "${serviceName}"
    PORT: int = int(os.getenv("PORT", "${port}"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")
    CORS_ORIGINS: str = "${corsOrigins}"

settings = Settings()
`,
  });

  files.push({
    filename: "core/logger.py",
    language: "python",
    content: `import logging
import sys

def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            "%(asctime)s - [%(name)s] - %(levelname)s - %(message)s"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger
`,
  });

  files.push({
    filename: "core/response.py",
    language: "python",
    content: `from typing import Any, Dict
from datetime import datetime, timezone

def format_response(data: Any, message: str = "Success") -> Dict[str, Any]:
    return {
        "success": True,
        "message": message,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
`,
  });

  // =========================================================================
  // 2. ROUTE GENERATION (routes/<route_name>.py + routes/__init__.py)
  // =========================================================================

  const routeImports: string[] = [];
  const routeInclusions: string[] = [];
  const usedFileNames = new Set<string>();

  if (nodeEndpoints.length === 0) {
    files.push({
      filename: "routes/default_route.py",
      language: "python",
      content: `from fastapi import APIRouter
from core.logger import get_logger
from core.response import format_response

logger = get_logger("${serviceName}:default_route")
router = APIRouter()

@router.get("/example", tags=["Default"])
async def default_handler():
    logger.info("Executing default route handler")
    return format_response(
        {"service": "${serviceName}"},
        "Default FastAPI service route operational."
    )
`,
    });
    routeImports.push(`from .default_route import router as default_router`);
    routeInclusions.push(`router.include_router(default_router)`);
  } else {
    nodeEndpoints.forEach((ep, index) => {
      const method = (ep.type || "GET").toLowerCase();
      const rawName = ep.name || ep.id || "route";
      let routeFileName = toPythonRouteFileName(method, rawName, index);

      if (usedFileNames.has(routeFileName)) {
        routeFileName = `${routeFileName}_${index + 1}`;
      }
      usedFileNames.add(routeFileName);

      const handlerName = `${routeFileName}_handler`;
      const pascalName = toPascalCase(rawName);
      const rawPath = ep.name?.startsWith("/") ? ep.name : `/${ep.name || ""}`;
      const path = convertPathParams(rawPath);
      const summary = ep.summary || `Handler for ${ep.type || "GET"} ${path}`;

      const parsedResSchema = parseSchemaJson(ep.responseBody?.rawJson);
      let responseDataJson: string;
      if (parsedResSchema) {
        responseDataJson = JSON.stringify(parsedResSchema, null, 8)
          .replace(/true/g, "True")
          .replace(/false/g, "False")
          .replace(/null/g, "None");
      } else {
        responseDataJson = `{\n        "success": True,\n        "message": f"Successfully executed ${ep.type || "GET"} ${path}"\n    }`;
      }

      const trace = resolveEndpointTrace(node, ep, allNodes, allEdges, endpoints);
      const isBodyMethod = ["post", "put", "patch"].includes(method);

      // Build Pydantic model if request body schema is provided
      let requestModelName: string | null = null;
      let pydanticModelCode = "";
      if (isBodyMethod && ep.requestBody?.rawJson) {
        const parsedReqBody = parseSchemaJson(ep.requestBody.rawJson);
        if (parsedReqBody && typeof parsedReqBody === "object") {
          requestModelName = `${pascalName}Request`;
          pydanticModelCode += `class ${requestModelName}(BaseModel):\n`;
          Object.keys(parsedReqBody).forEach((key) => {
            const val = (parsedReqBody as any)[key];
            let pyType = "Any";
            if (typeof val === "string") pyType = "str";
            else if (typeof val === "number") pyType = "float";
            else if (typeof val === "boolean") pyType = "bool";
            else if (Array.isArray(val)) pyType = "List[Any]";
            else if (typeof val === "object" && val !== null) pyType = "Dict[str, Any]";
            pydanticModelCode += `    ${key}: Optional[${pyType}] = None\n`;
          });
          pydanticModelCode += `\n`;
        }
      }

      const statusCode = method === "post" ? "status.HTTP_201_CREATED" : "status.HTTP_200_OK";
      const bodyParamStr = requestModelName ? `body: ${requestModelName}` : "";

      let routeCode = `from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from core.logger import get_logger
from core.response import format_response

logger = get_logger("${serviceName}:${routeFileName}")
router = APIRouter()

${pydanticModelCode}@router.${method}("${path}", status_code=${statusCode}, tags=["${serviceName}"])\n`;
      routeCode += `async def ${handlerName}(${bodyParamStr}):\n`;
      routeCode += `    """\n`;
      routeCode += `    ${ep.type || "GET"} ${path}\n`;
      routeCode += `    ${summary}\n`;
      routeCode += `    \n`;
      routeCode += `    🤖 AI CODING AGENT DIRECTIVE:\n`;
      routeCode += `    Implement domain logic for: ${ep.type || "GET"} ${path}\n`;
      routeCode += `    Description: ${summary}\n`;
      routeCode += `    \n`;
      routeCode += `    📥 CONNECTED INCOMING NODE(S):\n`;
      if (trace.incoming.length > 0) {
        trace.incoming.forEach((inc) => {
          routeCode += `    - Node: ${inc.nodeName} [${inc.nodeType}] (${inc.detail})\n`;
        });
      } else {
        routeCode += `    - Direct HTTP Client\n`;
      }
      routeCode += `    \n`;
      routeCode += `    📤 CONNECTED OUTGOING NODE(S):\n`;
      if (trace.outgoing.length > 0) {
        trace.outgoing.forEach((out) => {
          routeCode += `    - Node: ${out.nodeName} [${out.nodeType}] (${out.detail})\n`;
        });
      } else {
        routeCode += `    - Returns HTTP response\n`;
      }
      routeCode += `    """\n`;
      routeCode += `    try:\n`;
      routeCode += `        logger.info(f"Handling ${ep.type || "GET"} ${path}")\n`;

      if (ep.businessLogic && ep.businessLogic.trim()) {
        ep.businessLogic.split("\n").forEach((line, idx) => {
          if (line.trim()) routeCode += `        # STEP ${idx + 1}: ${line.trim()}\n`;
        });
      } else {
        routeCode += `        # STEP 1: Validate payload and path params\n`;
        routeCode += `        # STEP 2: Execute database query/mutation\n`;
        routeCode += `        # STEP 3: Return response\n`;
      }

      routeCode += `        return format_response(${responseDataJson}, "${summary}")\n`;
      routeCode += `    except Exception as e:\n`;
      routeCode += `        logger.error(f"Error handling ${ep.type || "GET"} ${path}: {e}")\n`;
      routeCode += `        raise HTTPException(status_code=500, detail=str(e))\n`;

      files.push({
        filename: `routes/${routeFileName}.py`,
        language: "python",
        content: routeCode,
      });

      routeImports.push(`from .${routeFileName} import router as ${routeFileName}_router`);
      routeInclusions.push(`router.include_router(${routeFileName}_router)`);
    });
  }

  files.push({
    filename: "routes/__init__.py",
    language: "python",
    content: `from fastapi import APIRouter
${routeImports.join("\n")}

router = APIRouter()
${routeInclusions.join("\n")}

__all__ = ["router"]
`,
  });

  // =========================================================================
  // 3. CONSUMER GENERATION (consumers/<event_name>.py + consumers/__init__.py)
  // =========================================================================

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
      const consumerFileName = ev.name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "") || "event_consumer";
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
    Process consumed event: "${ev.name}"
    Handler Logic: ${ev.handlerLogic || "Process event payload"}

    📥 CONNECTED INCOMING EVENT NODE(S):
`;
      if (trace.incoming.length > 0) {
        trace.incoming.forEach((inc) => {
          consumerCode += `    - Node: ${inc.nodeName} [${inc.nodeType}] (${inc.detail})\n`;
        });
      } else {
        consumerCode += `    - Topic/Channel: ${ev.name}\n`;
      }
      consumerCode += `
    📤 CONNECTED OUTGOING IMPACT NODE(S):
`;
      if (trace.outgoing.length > 0) {
        trace.outgoing.forEach((out) => {
          consumerCode += `    - Node: ${out.nodeName} [${out.nodeType}] (${out.detail})\n`;
        });
      } else {
        consumerCode += `    - Domain side-effects for ${ev.name}\n`;
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
      consumerInits.push(`    logger.info("Registered listener for event: ${ev.name}")`);
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

  // =========================================================================
  // 4. PRODUCER GENERATION (producers/<event_name>.py + producers/__init__.py)
  // =========================================================================

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
      const producerFileName = ev.name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "") || "event_producer";
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
    Publish event: "${ev.name}"

    📤 DESTINATION BROKER/CONSUMERS:
`;
      if (trace.outgoing.length > 0) {
        trace.outgoing.forEach((out) => {
          producerCode += `    - Node: ${out.nodeName} [${out.nodeType}] (${out.detail})\n`;
        });
      } else {
        producerCode += `    - Message Broker Channel: ${ev.name}\n`;
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

  // =========================================================================
  // 5. MAIN APP SERVER (main.py)
  // =========================================================================

  const originsList = corsOrigins === "*" ? '["*"]' : JSON.stringify(corsOrigins.split(",").map((s) => s.trim()));

  const mainPyCode = `import os
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from core.config import settings
from core.logger import get_logger
from routes import router as api_router
from consumers import init_consumers

load_dotenv()
logger = get_logger("${sanitizedName}")

app = FastAPI(
    title="${serviceName} API",
    description="${node.data?.description || `FastAPI microservice for ${serviceName}`}",
    version="0.1.0"
)

${
  cors
    ? `app.add_middleware(
    CORSMiddleware,
    allow_origins=${originsList},
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
`
    : ""
}
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    logger.info(f"{request.method} {request.url.path}")
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    logger.info(f"Completed {request.method} {request.url.path} with status {response.status_code} in {process_time:.2f}ms")
    return response

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "UP",
        "service": "${serviceName}",
        "port": settings.PORT,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

# Mount Routes
app.include_router(api_router)

# Initialize Event Consumers
init_consumers()

if __name__ == "__main__":
    import uvicorn
    logger.info(f"🚀 Starting ${serviceName} on http://0.0.0.0:{settings.PORT}")
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
`;

  files.push({
    filename: "main.py",
    language: "python",
    content: mainPyCode,
  });

  // =========================================================================
  // 6. UNIT TEST GENERATION (tests/unit/test_<route_name>.py + tests/__init__.py)
  // =========================================================================

  files.push({
    filename: "tests/__init__.py",
    language: "python",
    content: ``,
  });

  files.push({
    filename: "tests/unit/__init__.py",
    language: "python",
    content: ``,
  });

  if (nodeEndpoints.length === 0) {
    files.push({
      filename: "tests/unit/test_default_route.py",
      language: "python",
      content: `from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_default_route():
    response = client.get("/example")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "Default FastAPI service route operational" in data["message"]
`,
    });
  } else {
    nodeEndpoints.forEach((ep, index) => {
      const method = (ep.type || "GET").toLowerCase();
      const rawName = ep.name || ep.id || "route";
      let routeFileName = toPythonRouteFileName(method, rawName, index);

      const testFilename = `tests/unit/test_${routeFileName}.py`;
      const rawPath = ep.name?.startsWith("/") ? ep.name : `/${ep.name || ""}`;
      const path = convertPathParams(rawPath).replace(/\{([a-zA-Z0-9_]+)\}/g, "1");
      const expectedStatus = method === "post" ? 201 : 200;

      let testContent = `from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_${routeFileName}():
    response = client.${method}("${path}"${["post", "put", "patch"].includes(method) ? ", json={}" : ""})
    assert response.status_code == ${expectedStatus}
    data = response.json()
    assert data["success"] is True
`;

      files.push({
        filename: testFilename,
        language: "python",
        content: testContent,
      });
    });
  }

  // =========================================================================
  // 7. CONFIGURATION & MANIFEST FILES (requirements.txt, pyproject.toml, .env, .gitignore, README.md)
  // =========================================================================

  files.push({
    filename: "requirements.txt",
    language: "plaintext",
    content: `fastapi>=0.110.0
uvicorn[standard]>=0.28.0
pydantic>=2.6.0
httpx>=0.27.0
pytest>=8.0.0
pytest-asyncio>=0.23.5
python-dotenv>=1.0.1
`,
  });

  files.push({
    filename: "pyproject.toml",
    language: "toml",
    content: `[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[project]
name = "${sanitizedName}"
version = "0.1.0"
description = "${node.data?.description || `FastAPI microservice for ${serviceName}`}"
readme = "README.md"
requires-python = ">=3.10"
dependencies = [
    "fastapi>=0.110.0",
    "uvicorn[standard]>=0.28.0",
    "pydantic>=2.6.0",
    "python-dotenv>=1.0.1"
]

[tool.pytest.ini_options]
minversion = "8.0"
addopts = "-ra -q"
testpaths = [
    "tests",
]
`,
  });
  files.push({
    filename: ".env",
    language: "dotenv",
    content: `PORT=${port}\nENVIRONMENT=development\nLOG_LEVEL=info\n`,
  });

  files.push({
    filename: ".gitignore",
    language: "gitignore",
    content: `__pycache__/\n*.py[cod]\n*$py.class\n.pytest_cache/\n.env\nvenv/\n.venv/\n`,
  });

  let readmeLines = [
    `# ${serviceName} Microservice (FastAPI)`,
    ``,
    `Port: \`${port}\``,
    `Framework: **FastAPI (Python)**`,
    `Description: ${node.data?.description || "Modular FastAPI microservice compiled from Blueprint architecture canvas."}`,
    ``,
    `## Project Structure`,
    ``,
    `\`\`\``,
    `apps/${sanitizedName}/`,
    `├── main.py                     # Entry point server file`,
    `├── core/                       # Config, logger, and format response helpers`,
    `├── routes/                     # Modular route handlers (1 file per route)`,
    `├── consumers/                  # Event consumer handlers`,
    `├── producers/                  # Event producer helper functions`,
    `└── tests/unit/                 # Unit test suite (1 file per route test)`,
    `\`\`\``,
    ``,
    `## Getting Started`,
    ``,
    `1. **Create virtual environment & install dependencies**:`,
    `   \`\`\`bash`,
    `   python -m venv venv`,
    `   source venv/bin/activate  # On Windows: venv\\Scripts\\activate`,
    `   pip install -r requirements.txt`,
    `   \`\`\``,
    ``,
    `2. **Run server**:`,
    `   \`\`\`bash`,
    `   python main.py`,
    `   # or: uvicorn main:app --reload --port ${port}`,
    `   \`\`\``,
    ``,
    `3. **Interactive API Documentation**:`,
    `   - Swagger UI: http://localhost:${port}/docs`,
    `   - ReDoc: http://localhost:${port}/redoc`,
    ``,
    `4. **Run Unit Tests**:`,
    `   \`\`\`bash`,
    `   pytest`,
    `   \`\`\``,
    ``,
    `## Connected Routes & Endpoint Data Flow`,
    ``,
  ];

  if (nodeEndpoints.length === 0) {
    readmeLines.push(`- Default route: \`GET /example\``);
  } else {
    nodeEndpoints.forEach((ep) => {
      const trace = resolveEndpointTrace(node, ep, allNodes, allEdges, endpoints);
      readmeLines.push(`### \`${(ep.type || "GET").toUpperCase()} ${ep.name || "/"}\``);
      readmeLines.push(`- **Summary**: ${ep.summary || "Endpoint handler"}`);
      readmeLines.push(`- **Incoming Callers**:`);
      if (trace.incoming.length > 0) {
        trace.incoming.forEach((inc) => {
          readmeLines.push(`  - ${inc.nodeName} (${inc.nodeType}): ${inc.detail}`);
        });
      } else {
        readmeLines.push(`  - Direct HTTP Clients`);
      }
      readmeLines.push(`- **Outgoing Destinations**:`);
      if (trace.outgoing.length > 0) {
        trace.outgoing.forEach((out) => {
          readmeLines.push(`  - ${out.nodeName} (${out.nodeType}): ${out.detail}`);
        });
      } else {
        readmeLines.push(`  - HTTP Response`);
      }
      readmeLines.push(``);
    });
  }

  files.push({
    filename: "README.md",
    language: "markdown",
    content: readmeLines.join("\n"),
  });

  return {
    serviceId: node.id,
    serviceName,
    files,
  };
}

import { BackendNode } from "@/types/canvas";
import { Endpoint, CompiledFile } from "@workspace/canvas/types";
import { convertPathParams, toPythonRouteFileName } from "./utils";

interface ServerAndTestGeneratorsOptions {
  node: BackendNode;
  serviceName: string;
  sanitizedName: string;
  cors: boolean;
  corsOrigins: string;
  nodeEndpoints: (Endpoint & { nodeId: string })[];
}

export function generateServerAndTestFiles({
  node,
  serviceName,
  sanitizedName,
  cors,
  corsOrigins,
  nodeEndpoints,
}: ServerAndTestGeneratorsOptions): CompiledFile[] {
  const files: CompiledFile[] = [];

  const originsList =
    corsOrigins === "*"
      ? '["*"]'
      : JSON.stringify(corsOrigins.split(",").map((s) => s.trim()));

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

  // UNIT TESTS
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
      const path = convertPathParams(rawPath).replace(
        /\{([a-zA-Z0-9_]+)\}/g,
        "1",
      );
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

  return files;
}

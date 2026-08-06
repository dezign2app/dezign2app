import { BackendNode, BackendEdge, SimulationTestCase } from "@/types/canvas";
import { Endpoint, AnyMessagingResource } from "@workspace/canvas/types";
import { CompiledFile } from "@workspace/canvas/types";
import { toVarName, toPascalCase } from "../utils";
import { resolveLinkedEndpoint } from "../compileWebClientNode";

/**
 * Generates isolated Unit Tests for a Microservice's route handlers.
 * Creates a unique test file for each route / test case.
 */
export function generateServiceUnitTests(
  serviceName: string,
  nodeEndpoints: (Endpoint & { nodeId: string })[],
  testCases: SimulationTestCase[] = [],
): CompiledFile[] {
  const files: CompiledFile[] = [];

  if (nodeEndpoints.length === 0) {
    files.push({
      filename: "tests/unit/healthRoute.unit.test.ts",
      language: "typescript",
      content: `import { describe, it, expect, vi } from "vitest";
import { healthHandler } from "../../src/routes/healthRoute";

describe("${serviceName} Unit Test: healthRoute", () => {
  it("should return health status 200", async () => {
    const req: any = {};
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await healthHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "ok",
        service: "${serviceName}",
      })
    );
  });
});
`,
    });
    return files;
  }

  const usedFileNames = new Set<string>();

  nodeEndpoints.forEach((ep, index) => {
    const method = (ep.type || "GET").toLowerCase();
    const rawName = ep.name || ep.id || "route";
    let routeFileName =
      toVarName(`${method}_${rawName}`) || `route_${index + 1}`;

    if (usedFileNames.has(routeFileName)) {
      routeFileName = `${routeFileName}_${index + 1}`;
    }
    usedFileNames.add(routeFileName);

    const handlerName = `${routeFileName}Handler`;
    const path = ep.name?.startsWith("/") ? ep.name : `/${ep.name || ""}`;
    const expectedStatus = method === "post" ? 201 : 200;

    // Match any simulation test cases defined for this endpoint
    const matchingCases = testCases.filter(
      (tc) => tc.targetNodeId === ep.nodeId || tc.targetEventId === ep.id,
    );

    if (matchingCases.length > 0) {
      // Create a unique test file for each test case of this route
      matchingCases.forEach((tc, caseIdx) => {
        const caseSlug = toVarName(tc.name || `case_${caseIdx + 1}`);
        const testFilename = `tests/unit/${routeFileName}_${caseSlug}.unit.test.ts`;

        const reqHeaders = JSON.stringify(tc.request?.headers || {});
        const reqParams = JSON.stringify(tc.request?.params || {});
        const reqBody = tc.request?.body
          ? JSON.stringify(tc.request.body, null, 6)
          : "{}";
        const statusToAssert = tc.expectedStatus || expectedStatus;

        const content = `import { describe, it, expect, vi } from "vitest";
import { ${handlerName} } from "../../src/routes/${routeFileName}";

describe("Unit Test: ${serviceName} -> ${method.toUpperCase()} ${path} [${tc.name || "Test Case"}]", () => {
  it("should execute ${tc.name || "handler test"} and return status ${statusToAssert}", async () => {
    const req: any = {
      headers: ${reqHeaders},
      params: ${reqParams},
      query: ${reqParams},
      body: ${reqBody},
    };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await ${handlerName}(req, res);

    expect(res.status).toHaveBeenCalledWith(${statusToAssert});
    expect(res.json).toHaveBeenCalled();
  });
});
`;

        files.push({
          filename: testFilename,
          language: "typescript",
          content,
        });
      });
    } else {
      // Create a unique standalone route unit test file
      const testFilename = `tests/unit/${routeFileName}.unit.test.ts`;

      const content = `import { describe, it, expect, vi } from "vitest";
import { ${handlerName} } from "../../src/routes/${routeFileName}";

describe("Unit Test: ${serviceName} -> ${method.toUpperCase()} ${path}", () => {
  it("should handle ${method.toUpperCase()} ${path} correctly", async () => {
    const req: any = {
      headers: { "content-type": "application/json" },
      params: {},
      query: {},
      body: {},
    };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await ${handlerName}(req, res);

    expect(res.status).toHaveBeenCalledWith(${expectedStatus});
    expect(res.json).toHaveBeenCalled();
  });
});
`;

      files.push({
        filename: testFilename,
        language: "typescript",
        content,
      });
    }
  });

  return files;
}

/**
 * Generates End-to-End (E2E) Test Suites in the Frontend (web-client).
 * Creates a unique standalone test file for each E2E test case flow.
 */
export function generateWebClientE2ETests(
  webClientNodes: BackendNode[],
  endpoints: (Endpoint & { nodeId: string })[] = [],
  events: (AnyMessagingResource & {
    nodeId: string;
    variant: "publish" | "consume";
  })[] = [],
  nodes: BackendNode[] = [],
  edges: BackendEdge[] = [],
  testCases: SimulationTestCase[] = [],
): CompiledFile[] {
  const files: CompiledFile[] = [];
  const usedFileNames = new Set<string>();

  if (testCases.length > 0) {
    testCases.forEach((tc, idx) => {
      const tcName = tc.name || `e2e_flow_${idx + 1}`;
      let tcSlug = toVarName(tcName) || `e2e_flow_${idx + 1}`;

      if (usedFileNames.has(tcSlug)) {
        tcSlug = `${tcSlug}_${idx + 1}`;
      }
      usedFileNames.add(tcSlug);

      const targetEventId = tc.targetEventId || "";
      const targetNodeId = tc.targetNodeId || "";

      let targetUrl = "http://localhost:8080";
      let method = "POST";

      if (targetNodeId && targetEventId) {
        const resolved = resolveLinkedEndpoint(
          targetNodeId,
          targetEventId,
          nodes,
          edges,
          endpoints,
        );
        if (resolved) {
          targetUrl = resolved.fullUrl;
          method = resolved.method || "POST";
        }
      }

      const reqHeaders = JSON.stringify(
        tc.request?.headers || { "Content-Type": "application/json" },
      );
      const reqBody = tc.request?.body
        ? JSON.stringify(tc.request.body, null, 6)
        : "{}";
      const expectedStatus = tc.expectedStatus || 200;

      let fileContent = `import { describe, it, expect } from "vitest";

describe("E2E Flow: ${tcName}", () => {
  it("should send ${method} request to ${targetUrl} and verify response", async () => {
    const targetUrl = "${targetUrl}";
    const headers = ${reqHeaders};
    const body = ${reqBody};

    const response = await fetch(targetUrl, {
      method: "${method}",
      headers,
`;
      if (["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
        fileContent += `      body: JSON.stringify(body),\n`;
      }
      fileContent += `    });\n\n`;
      fileContent += `    expect(response.status).toBe(${expectedStatus});\n`;
      fileContent += `    const data = await response.json();\n`;
      fileContent += `    expect(data).toBeDefined();\n`;
      fileContent += `  });\n`;
      fileContent += `});\n`;

      files.push({
        filename: `tests/e2e/${tcSlug}.e2e.test.ts`,
        language: "typescript",
        content: fileContent,
      });
    });
  } else {
    // Generate individual E2E test files for each web client UI event if no custom cases exist
    webClientNodes.forEach((webNode) => {
      const webEvents = webNode.data?.events || [];
      webEvents.forEach((ev: any, idx: number) => {
        const resolved = resolveLinkedEndpoint(
          webNode.id,
          ev.id,
          nodes,
          edges,
          endpoints,
        );
        if (resolved) {
          const rawName = `${webNode.data?.label || "Page"}_${ev.name || ev.event || "event"}`;
          let tcSlug = toVarName(rawName) || `e2e_flow_${idx + 1}`;
          if (usedFileNames.has(tcSlug)) {
            tcSlug = `${tcSlug}_${idx + 1}`;
          }
          usedFileNames.add(tcSlug);

          let fileContent = `import { describe, it, expect } from "vitest";

describe("E2E Flow: ${webNode.data?.label || "Page"} / ${ev.name || ev.event || "Trigger"} -> ${resolved.targetNodeName}", () => {
  it("should perform E2E data flow execution to ${resolved.fullUrl}", async () => {
    const targetUrl = "${resolved.fullUrl}";
    const response = await fetch(targetUrl, {
      method: "${resolved.method}",
      headers: { "Content-Type": "application/json" },
`;
          if (["POST", "PUT", "PATCH"].includes(resolved.method)) {
            fileContent += `      body: JSON.stringify({ trigger: "${ev.name || ev.event || "ui_event"}" }),\n`;
          }
          fileContent += `    });\n\n`;
          fileContent += `    expect(response.status).toBeLessThan(500);\n`;
          fileContent += `    const data = await response.json();\n`;
          fileContent += `    expect(data).toBeDefined();\n`;
          fileContent += `  });\n`;
          fileContent += `});\n`;

          files.push({
            filename: `tests/e2e/${tcSlug}.e2e.test.ts`,
            language: "typescript",
            content: fileContent,
          });
        }
      });
    });
  }

  if (files.length === 0) {
    files.push({
      filename: "tests/e2e/health.e2e.test.ts",
      language: "typescript",
      content: `import { describe, it, expect } from "vitest";

describe("Web Client E2E Health Check", () => {
  it("should verify test setup operational", async () => {
    expect(true).toBe(true);
  });
});
`,
    });
  }

  return files;
}

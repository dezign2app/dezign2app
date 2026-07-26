import { z } from "zod";

export const simulationTestCaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  targetNodeId: z.string(),
  targetEventId: z.string().optional(),
  request: z.object({
    headers: z.record(z.string()).optional(),
    params: z.record(z.string()).optional(),
    body: z.unknown().optional(),
  }).optional(),
  expectedStatus: z.number().optional(),
  expectedBody: z.unknown().optional(),
  enabled: z.boolean().optional(),
  mocks: z.record(z.object({
    status: z.number().optional(),
    returnData: z.unknown().optional()
  })).optional(),
});

export const simulationTestCaseInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().describe("Name or description of the test case / scenario"),
  targetNodeId: z.string().describe("ID of the target service or endpoint node being tested"),
  targetEventId: z.string().optional().describe("Optional target event ID for event handler test cases"),
  request: z.object({
    headers: z.record(z.string()).optional().describe("Request headers for test execution"),
    params: z.record(z.string()).optional().describe("Path or query parameters for test execution"),
    body: z.unknown().optional().describe("Request payload / body data for the test case"),
  }).optional().describe("Request configuration for the test case"),
  expectedStatus: z.number().optional().describe("Expected HTTP status code (e.g., 200, 201, 400, 404, 500). Non-2xx status codes (outside 200-299) mark node execution as failed and stop canvas animation."),
  expectedBody: z.unknown().optional().describe("Expected response body or output data structure"),
  enabled: z.boolean().optional().describe("Whether this test case is active"),
  mocks: z.record(z.object({
    status: z.number().optional(),
    returnData: z.unknown().optional()
  })).optional().describe("Mock definitions for downstream dependencies during test execution. Setting a non-2xx mock status halts execution at that node."),
}).describe("Test case schema for defining unit, integration, and simulation test cases.");



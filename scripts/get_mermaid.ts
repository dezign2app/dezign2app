import { createGraph } from "../apps/system-design-engine/src/ai/agent";

// Mock the environment variables so createGraph doesn't throw
process.env.GROQ_API_KEY = "dummy";
process.env.GROQ_LLM_MODEL = "dummy";

async function run() {
  const workflow = createGraph();
  const mermaid = await workflow.getGraphAsync().then((g) => g.drawMermaid());
  console.log(mermaid);
}
run();

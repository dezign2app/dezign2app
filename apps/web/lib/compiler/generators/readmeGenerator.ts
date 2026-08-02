import { CompiledFile } from "../types";

export function generateRootReadme(
  projectName: string,
  serviceNodesCount: number,
  webClientNodesCount: number,
  entityNodesCount: number,
  services: { id: string; name: string; folderName: string }[],
  webClients: { id: string; name: string; folderName: string }[],
  hasKafka: boolean = false,
): CompiledFile {
  const kafkaSection = hasKafka
    ? `- **Kafka Broker Package**: \`packages/kafka\` (\`@workspace/kafka\`)\n`
    : "";

  const kafkaUsage = hasKafka
    ? `\n### Kafka Event Broker\n\nThe workspace includes \`@workspace/kafka\` for messaging and event streaming.\nTo launch local Kafka & Zookeeper / KRaft services:\n\`\`\`bash
cd packages/kafka
docker compose up -d
\`\`\`\n`
    : "";

  const readmeContent = `# ${projectName} Workspace

Generated Turborepo + pnpm monorepo architecture containing ${serviceNodesCount} backend service(s), ${webClientNodesCount} web client page(s), and ${entityNodesCount} database entity table(s).

## Workspace Structure

- **Shared TS Config**: \`packages/typescript-config\` (\`@workspace/typescript-config\`)
- **Shared Types & Schemas**: \`packages/types\` (\`@workspace/types\`)
- **Shared UI Package (Shadcn UI)**: \`packages/ui\` (\`@workspace/ui\`)
- **Database Package**: \`packages/db\` (\`@workspace/db\`)
- **Logger Package**: \`packages/logger\` (\`@workspace/logger\`)
${kafkaSection}${services.map((s) => `- **${s.name}**: \`apps/${s.folderName}\``).join("\n")}
${webClients.map((w) => `- **${w.name} (Next.js App)**: \`apps/${w.folderName}\``).join("\n")}

## Shared Types & API Contracts

All API request/response contracts, route params, and event schemas are stored in \`packages/types\` (\`@workspace/types\`).
Microservices and frontend applications import shared types directly:

\`\`\`typescript
import { GetUsersResponse, PostCreateUserBody, postCreateUserBodySchema } from "@workspace/types";
\`\`\`
${kafkaUsage}
## Getting Started

1. **Install dependencies**:
   \`\`\`bash
   pnpm install
   \`\`\`

2. **Run all microservices and web client in parallel**:
   \`\`\`bash
   pnpm dev
   \`\`\`

3. **Build all apps and packages**:
   \`\`\`bash
   pnpm build
   \`\`\`

4. **Database Schema Management**:
   \`\`\`bash
   cd packages/db
   pnpm push
   \`\`\`
`;

  return {
    filename: "README.md",
    language: "markdown",
    content: readmeContent,
  };
}

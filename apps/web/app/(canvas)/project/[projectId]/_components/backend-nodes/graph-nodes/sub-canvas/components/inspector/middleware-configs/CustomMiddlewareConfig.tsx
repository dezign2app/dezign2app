import React from "react";
import type { MiddlewareConfigProps } from "./types";
import { BusinessLogicBlock } from "@/app/(canvas)/project/[projectId]/_components/shared/BusinessLogicBlock";

export function CustomMiddlewareConfig({ data, onUpdate }: MiddlewareConfigProps) {
  return (
    <BusinessLogicBlock
      mode={data.implementationMode || "natural_language"}
      onModeChange={(implementationMode) => onUpdate({ implementationMode })}
      prompt={data.prompt || ""}
      onPromptChange={(prompt) => onUpdate({ prompt })}
      code={data.customBody || ""}
      onCodeChange={(customBody) => onUpdate({ customBody })}
      title="Custom Middleware Logic"
      description="Define interceptor rules in natural language or write a custom middleware function"
      codePlaceholder={'// Write function body ONLY (available vars: request, state, next)\nconsole.log("Before request:", request);\nconst response = await next();\nconsole.log("After response:", response);\nreturn response;'}
      onGenerateCode={() => {
        const spec = data.prompt;
        if (spec && !data.customBody) {
          const generatedCode = `async ({ request, state }, next) => {\n  // Middleware Spec: ${spec.split('\n').join('\n  // ')}\n  const response = await next();\n  return response;\n}`;
          onUpdate({
            customBody: generatedCode,
            implementationMode: "code",
          });
        }
      }}
    />
  );
}

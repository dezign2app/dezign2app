// This file is now a placeholder after Tiptap/SmartBlocks removal.

export const handleAIResponse = async (
  response: Response
) => {
  if (!response.body) {
      console.warn("handleAIResponse: No response body");
      return;
  }

  console.log("🤖 handleAIResponse: Starting to read stream...");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  
  let currentIntent = null;
  let hasStartedStreaming = false;

  while (true) {
    const { done, value } = await reader.read();
    
    if (done) {
      console.log("🤖 handleAIResponse: Stream complete. Final buffer length:", buffer.length);

      if (buffer.trim()) {
        console.log("🤖 handleAIResponse: Processing final buffer:", JSON.stringify(buffer).substring(0, 100), "...");
        try {
          const json = JSON.parse(buffer);
          processResponse(json, currentIntent, hasStartedStreaming);
        } catch (e) {
          console.error("❌ handleAIResponse: Error parsing final JSON", e);
          console.error("Buffer content was:", buffer);
        }
      }
      break;
    }

    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;
    
    const lines = buffer.split("\n");
    // Process complete lines
    for (let i = 0; i < lines.length - 1; i++) {
       const line = lines[i]?.trim() ?? "";
       if (line && (line.startsWith('{') && line.endsWith('}'))) {
         try {
             const json = JSON.parse(line);
             
             if (json.type === "intent") {
                 currentIntent = json.intent;
                 console.log("🤖 Intent detected:", currentIntent);
             }
             else if (json.type === "doc_token" || json.type === "token") {
                  console.log("Token:", json.content);
                  hasStartedStreaming = true;
             }
             else {
                 processResponse(json, currentIntent, hasStartedStreaming);
             }
         } catch(e) {
             // ignore partials
             console.log("🤖 handleAIResponse: Ignoring Partial JSON", line);
         }
       }
    }
    buffer = lines[lines.length - 1] ?? "";
  }
};

const processResponse = (
  response: any, 
  currentIntent: string | null,
  hasStartedStreaming: boolean
) => {
  if (response.type === "response" && response.response?.operations) {
      console.log(`🤖 processResponse: Processing operations. Streaming active: ${hasStartedStreaming}`);
      response.response.operations.forEach((op: any) => {
          console.log(`🤖 Operation: ${op.type} (Skipped due to removal)`);
      });
      return;
  }
}

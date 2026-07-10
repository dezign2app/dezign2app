import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export const ReceivedMessage = ({
  message,
  thinking,
  defaultReasoningOpen = false,
}: {
  message: string;
  thinking?: string;
  defaultReasoningOpen?: boolean;
}) => {
  const [isReasoningOpen, setIsReasoningOpen] = useState(defaultReasoningOpen);

  const parseMsg = (msg: string) => {
    try {
      // Parse custom typed messages or stages
      return JSON.parse(msg.trim()) as {
        stage?: string;
        message?: string;
        type?: string;
        [key: string]: any;
      };
    } catch {
      // If it's a raw string that happens to have \\n literally instead of real newlines
      return msg.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
    }
  };

  const parsedMsg = parseMsg(message);

  return (
    <div className="max-w-[90%] w-fit flex flex-col gap-1.5">
      {thinking && (
        <div className="group rounded-xl overflow-hidden text-xs">
          <div
            onClick={() => setIsReasoningOpen(!isReasoningOpen)}
            className="flex items-center px-2 cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Reasoning</span>
          </div>
          <div
            className={`grid transition-all duration-300 ease-in-out ${isReasoningOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
          >
            <div className="overflow-hidden">
              <div className="px-2 py-0.5 text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto text-xs">
                {thinking}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-fit bg-accent px-3 py-1.5 rounded-2xl rounded-tl-sm flex flex-col gap-2">
        {typeof parsedMsg === "string" ? (
          <div
            className="prose prose-sm max-w-none break-words text-xs
            text-foreground
            dark:prose-invert 
            prose-strong:text-foreground
            prose-p:leading-relaxed prose-pre:p-0
            prose-ul:list-disc prose-ul:ml-4 prose-ul:my-2
            prose-ol:list-decimal prose-ol:ml-4 prose-ol:my-2
            prose-li:my-0.5
            prose-table:border-collapse prose-table:w-full prose-table:my-4 prose-table:border prose-table:border-border
            prose-th:border prose-th:border-border prose-th:bg-accent-foreground/5 prose-th:p-2 prose-th:text-left
            prose-td:border prose-td:border-border prose-td:p-2
            prose-a:text-primary prose-a:underline-offset-4 hover:prose-a:underline
            prose-code:px-1.5 prose-code:py-0.5 prose-code:bg-muted prose-code:rounded-md prose-code:text-foreground prose-code:font-mono prose-code:text-[0.85em]
            prose-code:before:content-none prose-code:after:content-none
          "
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
            >
              {parsedMsg}
            </ReactMarkdown>
          </div>
        ) : (
          <>
            {parsedMsg.message !== "Analyzed user intent generic" && (
              <span className="text-xs text-muted-foreground font-medium italic">
                {parsedMsg.message}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

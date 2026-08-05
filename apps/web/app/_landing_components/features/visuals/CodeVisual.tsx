import React from "react";

export const CodeVisual: React.FC = () => {
  return (
    <div className="w-full h-full bg-[#0d1117] rounded-2xl shadow-sm border border-gray-800 p-5 flex flex-col animate-in fade-in zoom-in duration-500 relative overflow-hidden">
      {/* Editor Header */}
      <div className="flex gap-2 mb-4 border-b border-gray-800 pb-4">
        <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
        <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
      </div>

      {/* Code Editor Body */}
      <div className="flex flex-col gap-1.5 font-mono text-[10px] sm:text-[11px] mt-2 relative z-10 text-gray-300">
        {/* Line 1 */}
        <div className="relative h-5 w-fit">
          <div className="invisible whitespace-nowrap opacity-0">
            <span className="text-pink-400">export const</span>{" "}
            <span className="text-yellow-200">Server</span> = () =&gt; {"{"}
          </div>
          <div
            className="absolute top-0 left-0 h-full flex items-center"
            style={{ animation: "typeLine1 10s infinite" }}
          >
            <div className="overflow-hidden whitespace-nowrap h-full w-full flex items-center">
              <div>
                <span className="text-pink-400">export const</span>{" "}
                <span className="text-yellow-200">Server</span> = () =&gt; {"{"}
              </div>
            </div>
            <div
              className="absolute right-0 translate-x-[30%] text-base z-10 drop-shadow-md"
              style={{ animation: "bot1 10s infinite" }}
            >
              🤖
            </div>
          </div>
        </div>

        {/* Line 2 */}
        <div className="relative h-5 w-fit ml-4">
          <div className="invisible whitespace-nowrap opacity-0">
            <span className="text-pink-400">const</span> db ={" "}
            <span className="text-blue-300">useDatabase</span>();
          </div>
          <div
            className="absolute top-0 left-0 h-full flex items-center"
            style={{ animation: "typeLine2 10s infinite" }}
          >
            <div className="overflow-hidden whitespace-nowrap h-full w-full flex items-center">
              <div>
                <span className="text-pink-400">const</span> db ={" "}
                <span className="text-blue-300">useDatabase</span>();
              </div>
            </div>
            <div
              className="absolute right-0 translate-x-[30%] text-base z-10 drop-shadow-md"
              style={{ animation: "bot2 10s infinite" }}
            >
              🤖
            </div>
          </div>
        </div>

        {/* Line 3 */}
        <div className="relative h-5 w-fit ml-4">
          <div className="invisible whitespace-nowrap opacity-0">
            <span className="text-pink-400">const</span> auth ={" "}
            <span className="text-blue-300">useAuth</span>();
          </div>
          <div
            className="absolute top-0 left-0 h-full flex items-center"
            style={{ animation: "typeLine3 10s infinite" }}
          >
            <div className="overflow-hidden whitespace-nowrap h-full w-full flex items-center">
              <div>
                <span className="text-pink-400">const</span> auth ={" "}
                <span className="text-blue-300">useAuth</span>();
              </div>
            </div>
            <div
              className="absolute right-0 translate-x-[30%] text-base z-10 drop-shadow-md"
              style={{ animation: "bot3 10s infinite" }}
            >
              🤖
            </div>
          </div>
        </div>

        {/* Line 4 */}
        <div className="relative h-5 w-fit ml-4">
          <div className="invisible whitespace-nowrap opacity-0">
            <span className="text-pink-400">if</span> (!auth.
            <span className="text-blue-300">user</span>) {"{"}
          </div>
          <div
            className="absolute top-0 left-0 h-full flex items-center"
            style={{ animation: "typeLine4 10s infinite" }}
          >
            <div className="overflow-hidden whitespace-nowrap h-full w-full flex items-center">
              <div>
                <span className="text-pink-400">if</span> (!auth.
                <span className="text-blue-300">user</span>) {"{"}
              </div>
            </div>
            <div
              className="absolute right-0 translate-x-[30%] text-base z-10 drop-shadow-md"
              style={{ animation: "bot4 10s infinite" }}
            >
              🤖
            </div>
          </div>
        </div>

        {/* Line 5 */}
        <div className="relative h-5 w-fit ml-8">
          <div className="invisible whitespace-nowrap opacity-0">
            <span className="text-pink-400">throw new</span>{" "}
            <span className="text-yellow-200">Error</span>(
            <span className="text-green-300">"401"</span>);
          </div>
          <div
            className="absolute top-0 left-0 h-full flex items-center"
            style={{ animation: "typeLine5 10s infinite" }}
          >
            <div className="overflow-hidden whitespace-nowrap h-full w-full flex items-center">
              <div>
                <span className="text-pink-400">throw new</span>{" "}
                <span className="text-yellow-200">Error</span>(
                <span className="text-green-300">"401"</span>);
              </div>
            </div>
            <div
              className="absolute right-0 translate-x-[30%] text-base z-10 drop-shadow-md"
              style={{ animation: "bot5 10s infinite" }}
            >
              🤖
            </div>
          </div>
        </div>

        {/* Line 6 */}
        <div className="relative h-5 w-fit ml-4">
          <div className="invisible whitespace-nowrap opacity-0">{"}"}</div>
          <div
            className="absolute top-0 left-0 h-full flex items-center"
            style={{ animation: "typeLine6 10s infinite" }}
          >
            <div className="overflow-hidden whitespace-nowrap h-full w-full flex items-center">
              <div>{"}"}</div>
            </div>
            <div
              className="absolute right-0 translate-x-[30%] text-base z-10 drop-shadow-md"
              style={{ animation: "bot6 10s infinite" }}
            >
              🤖
            </div>
          </div>
        </div>

        {/* Line 7 */}
        <div className="relative h-5 w-fit ml-4">
          <div className="invisible whitespace-nowrap opacity-0">
            <span className="text-pink-400">return</span> db.
            <span className="text-blue-300">query</span>(
            <span className="text-green-300">"SELECT *"</span>);
          </div>
          <div
            className="absolute top-0 left-0 h-full flex items-center"
            style={{ animation: "typeLine7 10s infinite" }}
          >
            <div className="overflow-hidden whitespace-nowrap h-full w-full flex items-center">
              <div>
                <span className="text-pink-400">return</span> db.
                <span className="text-blue-300">query</span>(
                <span className="text-green-300">"SELECT *"</span>);
              </div>
            </div>
            <div
              className="absolute right-0 translate-x-[30%] text-base z-10 drop-shadow-md"
              style={{ animation: "bot7 10s infinite" }}
            >
              🤖
            </div>
          </div>
        </div>

        {/* Line 8 */}
        <div className="relative h-5 w-fit">
          <div className="invisible whitespace-nowrap opacity-0">{"}"}</div>
          <div
            className="absolute top-0 left-0 h-full flex items-center"
            style={{ animation: "typeLine8 10s infinite" }}
          >
            <div className="overflow-hidden whitespace-nowrap h-full w-full flex items-center">
              <div>{"}"}</div>
            </div>
            <div
              className="absolute right-0 translate-x-[30%] text-base z-10 drop-shadow-md"
              style={{ animation: "bot8 10s infinite" }}
            >
              🤖
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-[#161b22] border-t border-gray-800 text-[#8b949e] flex items-center gap-2 text-[10px] font-mono z-0">
        <span className="animate-spin text-xs">⚙️</span>
        <span>Agent is writing code...</span>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
         @keyframes typeLine1 { 0% { width: 0; } 8% { width: 100%; } 85% { width: 100%; } 85.1% { width: 0; } 100% { width: 0; } }
         @keyframes typeLine2 { 0%, 8% { width: 0; } 16% { width: 100%; } 85% { width: 100%; } 85.1% { width: 0; } 100% { width: 0; } }
         @keyframes typeLine3 { 0%, 16% { width: 0; } 24% { width: 100%; } 85% { width: 100%; } 85.1% { width: 0; } 100% { width: 0; } }
         @keyframes typeLine4 { 0%, 24% { width: 0; } 32% { width: 100%; } 85% { width: 100%; } 85.1% { width: 0; } 100% { width: 0; } }
         @keyframes typeLine5 { 0%, 32% { width: 0; } 42% { width: 100%; } 85% { width: 100%; } 85.1% { width: 0; } 100% { width: 0; } }
         @keyframes typeLine6 { 0%, 42% { width: 0; } 48% { width: 100%; } 85% { width: 100%; } 85.1% { width: 0; } 100% { width: 0; } }
         @keyframes typeLine7 { 0%, 48% { width: 0; } 58% { width: 100%; } 85% { width: 100%; } 85.1% { width: 0; } 100% { width: 0; } }
         @keyframes typeLine8 { 0%, 58% { width: 0; } 64% { width: 100%; } 85% { width: 100%; } 85.1% { width: 0; } 100% { width: 0; } }
         
         @keyframes bot1 { 0%, 7.9% { opacity: 1; } 8%, 100% { opacity: 0; } }
         @keyframes bot2 { 0%, 7.9% { opacity: 0; } 8%, 15.9% { opacity: 1; } 16%, 100% { opacity: 0; } }
         @keyframes bot3 { 0%, 15.9% { opacity: 0; } 16%, 23.9% { opacity: 1; } 24%, 100% { opacity: 0; } }
         @keyframes bot4 { 0%, 23.9% { opacity: 0; } 24%, 31.9% { opacity: 1; } 32%, 100% { opacity: 0; } }
         @keyframes bot5 { 0%, 31.9% { opacity: 0; } 32%, 41.9% { opacity: 1; } 42%, 100% { opacity: 0; } }
         @keyframes bot6 { 0%, 41.9% { opacity: 0; } 42%, 47.9% { opacity: 1; } 48%, 100% { opacity: 0; } }
         @keyframes bot7 { 0%, 47.9% { opacity: 0; } 48%, 57.9% { opacity: 1; } 58%, 100% { opacity: 0; } }
         @keyframes bot8 { 0%, 57.9% { opacity: 0; } 58%, 85% { opacity: 1; } 85.1%, 100% { opacity: 0; } }
       `,
        }}
      />
    </div>
  );
};

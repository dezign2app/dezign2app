import React from "react";

export const SimulateVisual: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-slate-50 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center animate-in fade-in zoom-in duration-500 overflow-hidden">
      {/* Connection Lines (SVG) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 400 400"
        preserveAspectRatio="none"
        style={{ zIndex: 0 }}
      >
        {/* Triangle paths */}
        <path
          d="M 200,80 L 108,292"
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="2"
          strokeDasharray="6 6"
          className="animate-[dash_1s_linear_infinite]"
        />
        <path
          d="M 108,292 L 292,292"
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="2"
          strokeDasharray="6 6"
          className="animate-[dash_1s_linear_infinite]"
        />
        <path
          d="M 292,292 L 200,80"
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="2"
          strokeDasharray="6 6"
          className="animate-[dash_1s_linear_infinite]"
        />

        {/* Data Particles traveling on paths */}
        <circle r="6" fill="#3b82f6" className="drop-shadow-md">
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path="M 200,80 L 108,292"
          />
        </circle>
        <circle r="6" fill="#f59e0b" className="drop-shadow-md">
          <animateMotion
            dur="2.5s"
            repeatCount="indefinite"
            path="M 108,292 L 292,292"
          />
        </circle>
        <circle r="6" fill="#10b981" className="drop-shadow-md">
          <animateMotion
            dur="1.5s"
            repeatCount="indefinite"
            path="M 292,292 L 200,80"
          />
        </circle>
        <circle r="5" fill="#8b5cf6" className="drop-shadow-md">
          <animateMotion
            dur="1.8s"
            repeatCount="indefinite"
            path="M 108,292 L 200,80"
          />
        </circle>
        <circle r="5" fill="#ef4444" className="drop-shadow-md">
          <animateMotion
            dur="2.2s"
            repeatCount="indefinite"
            path="M 292,292 L 108,292"
          />
        </circle>
      </svg>

      {/* Top Node */}
      <div className="absolute top-[12%] left-1/2 -translate-x-1/2 w-24 h-14 bg-blue-50 border-2 border-blue-400 rounded-xl shadow-md flex flex-col items-center justify-center z-10">
        <span className="text-xs font-bold text-blue-800">
          API Gateway
        </span>
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-75"></div>
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
      </div>

      {/* Bottom Left Node */}
      <div className="absolute bottom-[20%] left-[15%] w-24 h-14 bg-orange-50 border-2 border-orange-400 rounded-xl shadow-md flex flex-col items-center justify-center z-10">
        <span className="text-xs font-bold text-orange-800">
          Auth Node
        </span>
        <div
          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 rounded-full animate-ping opacity-75"
          style={{ animationDelay: "300ms" }}
        ></div>
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 rounded-full border-2 border-white"></div>
      </div>

      {/* Bottom Right Node */}
      <div className="absolute bottom-[20%] right-[15%] w-24 h-14 bg-green-50 border-2 border-green-400 rounded-xl shadow-md flex flex-col items-center justify-center z-10">
        <span className="text-xs font-bold text-green-800">
          DB Replica
        </span>
        <div
          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-75"
          style={{ animationDelay: "600ms" }}
        ></div>
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
      </div>

      {/* Metrics Overlay */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 border border-gray-200 shadow-sm text-[10px] font-mono text-gray-600 z-20">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-semibold">Live Traffic</span>
        </div>
        <div>
          Req/s:{" "}
          <span className="text-green-600 font-bold">14.2k</span>
        </div>
        <div>
          Latency:{" "}
          <span className="text-orange-500 font-bold">32ms</span>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
         @keyframes dash {
           to {
             stroke-dashoffset: -12;
           }
         }
       `,
        }}
      />
    </div>
  );
};

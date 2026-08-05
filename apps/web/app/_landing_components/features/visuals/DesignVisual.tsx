import React from "react";

export const DesignVisual: React.FC = () => {
  return (
    <div className="w-full h-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col animate-in fade-in zoom-in duration-500 relative overflow-hidden">
      <div className="flex flex-col gap-1.5 mb-6">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          Input: Natural Language
        </span>
        <div className="w-3/4 h-2 bg-gray-200 rounded animate-pulse"></div>
        <div
          className="w-1/2 h-2 bg-gray-200 rounded animate-pulse"
          style={{ animationDelay: "200ms" }}
        ></div>
      </div>

      <div className="flex-1 border border-dashed border-gray-200 rounded-xl relative flex items-center justify-between p-4 bg-gray-50/50 overflow-hidden">
        {/* Input Node */}
        <div className="w-10 h-10 bg-white border border-gray-200 shadow-sm rounded-lg flex items-center justify-center text-lg z-10 shrink-0">
          📝
        </div>

        {/* Arrow Stream */}
        <div className="flex-1 h-px bg-gray-300 relative mx-2">
          {/* Moving particle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0 w-1.5 h-1.5 bg-black rounded-full"
            style={{
              animation: "moveRight 1.5s infinite ease-in-out",
            }}
          ></div>
        </div>

        {/* Transformer Engine */}
        <div className="w-12 h-12 bg-black rounded-2xl shadow-xl flex items-center justify-center text-xl z-10 relative shrink-0">
          ✨{/* Pulsing ring */}
          <div className="absolute inset-0 border-2 border-black rounded-2xl animate-ping opacity-30"></div>
        </div>

        {/* Branching Arrows */}
        <div className="w-16 h-24 relative ml-2 shrink-0">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 64 96"
          >
            <path
              d="M0,48 C24,48 32,14 64,14"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="2"
              strokeDasharray="4 4"
              style={{ animation: "dash 1s linear infinite" }}
            />
            <path
              d="M0,48 L64,48"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="2"
              strokeDasharray="4 4"
              style={{ animation: "dash 1s linear infinite" }}
            />
            <path
              d="M0,48 C24,48 32,82 64,82"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="2"
              strokeDasharray="4 4"
              style={{ animation: "dash 1s linear infinite" }}
            />
          </svg>
        </div>

        {/* Output Shapes */}
        <div className="flex flex-col justify-between h-24 z-10 shrink-0 py-0.5 ml-1">
          <div
            className="w-7 h-7 bg-blue-100 border border-blue-300 rounded-full shadow-sm animate-bounce"
            style={{ animationDuration: "2s" }}
          ></div>
          <div
            className="w-7 h-7 bg-orange-100 border border-orange-300 rounded-lg shadow-sm animate-bounce"
            style={{ animationDuration: "2.5s" }}
          ></div>
          <div
            className="w-7 h-7 bg-green-100 border border-green-300 rounded-sm shadow-sm animate-bounce"
            style={{ animationDuration: "3s" }}
          ></div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
         @keyframes moveRight {
           0% { left: 0; opacity: 0; transform: translateY(-50%) scale(0.5); }
           20% { opacity: 1; transform: translateY(-50%) scale(1); }
           80% { opacity: 1; transform: translateY(-50%) scale(1); }
           100% { left: 100%; opacity: 0; transform: translateY(-50%) scale(0.5); }
         }
         @keyframes dash {
           to {
             stroke-dashoffset: -16;
           }
         }
       `,
        }}
      />
    </div>
  );
};

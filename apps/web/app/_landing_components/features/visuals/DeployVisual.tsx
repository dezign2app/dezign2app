import React from "react";

export const DeployVisual: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-[#fafcff] rounded-xl shadow-sm border border-blue-100/50 p-4 flex flex-col items-center justify-center overflow-hidden animate-in fade-in zoom-in duration-500">
      <style
        dangerouslySetInnerHTML={{
          __html: `
         @keyframes float-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
         @keyframes float-medium { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
         @keyframes float-fast { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
         @keyframes dash-move { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }
         @keyframes dash-move-rev { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 24; } }
         .animate-dash { animation: dash-move 1.5s linear infinite; }
         .animate-dash-rev { animation: dash-move-rev 1.5s linear infinite; }
         .bg-grid-pattern {
           background-image: radial-gradient(#3b82f620 1px, transparent 1px);
           background-size: 20px 20px;
         }
       `,
        }}
      />

      {/* Background Grid & Decorative Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50"></div>

      {/* Connection Lines (SVG) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <line
          x1="20%"
          y1="50%"
          x2="50%"
          y2="50%"
          stroke="#93c5fd"
          strokeWidth="2"
          strokeDasharray="6 6"
          className="animate-dash"
        />
        <line
          x1="80%"
          y1="50%"
          x2="50%"
          y2="50%"
          stroke="#86efac"
          strokeWidth="2"
          strokeDasharray="6 6"
          className="animate-dash-rev"
        />
        <line
          x1="75%"
          y1="20%"
          x2="50%"
          y2="50%"
          stroke="#d8b4fe"
          strokeWidth="2"
          strokeDasharray="6 6"
          className="animate-dash-rev"
        />
        <line
          x1="25%"
          y1="80%"
          x2="50%"
          y2="50%"
          stroke="#fca5a5"
          strokeWidth="2"
          strokeDasharray="6 6"
          className="animate-dash"
        />

        {/* Decorative curved paths */}
        <path
          d="M 0 10 Q 30 50 100 20"
          stroke="#e2e8f0"
          strokeWidth="1"
          fill="none"
          strokeDasharray="3 3"
        />
        <path
          d="M 100 280 Q 200 220 300 290"
          stroke="#e2e8f0"
          strokeWidth="1"
          fill="none"
          strokeDasharray="3 3"
        />
      </svg>

      {/* Left Stack (Load Balancer) */}
      <div
        className="absolute top-1/2 left-[20%] -translate-y-1/2 -translate-x-1/2 z-10"
        style={{
          animation: "float-medium 4s ease-in-out infinite",
        }}
      >
        <div className="relative group cursor-pointer">
          <div className="absolute inset-0 bg-blue-100/60 rounded-xl transform -translate-x-2 md:-translate-x-3 scale-95 blur-[1px] transition-transform group-hover:-translate-x-4"></div>
          <div className="absolute inset-0 bg-blue-200/60 rounded-xl transform -translate-x-1 md:-translate-x-1.5 scale-[0.97] transition-transform group-hover:-translate-x-2"></div>
          <div className="relative w-14 sm:w-16 md:w-20 lg:w-24 aspect-[4/5] bg-white border border-blue-100 rounded-xl shadow-lg flex flex-col items-center justify-center p-2 transform transition-transform group-hover:scale-105">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-50 flex items-center justify-center mb-1 md:mb-2">
              <svg
                className="w-3 h-3 md:w-4 md:h-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 7v10c0 2 1.5 3 3 3h10c1.5 0 3-1 3-3V7c0-2-1.5-3-3-3H7C5.5 4 4 5 4 7zM4 12h16M12 4v16"
                />
              </svg>
            </div>
            <div className="w-6 sm:w-8 md:w-10 h-1 md:h-1.5 bg-gray-200 rounded-full mb-1"></div>
            <div className="w-4 sm:w-6 md:w-8 h-1 md:h-1.5 bg-gray-200 rounded-full"></div>
          </div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[9px] md:text-[10px] font-semibold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full shadow-sm border border-blue-100">
              Load Balancer
            </span>
          </div>
        </div>
      </div>

      {/* Right Stack (Containers) */}
      <div
        className="absolute top-1/2 left-[80%] -translate-y-1/2 -translate-x-1/2 z-10"
        style={{ animation: "float-slow 5s ease-in-out infinite" }}
      >
        <div className="relative group cursor-pointer">
          <div className="absolute inset-0 bg-green-100/60 rounded-xl transform translate-x-2 md:translate-x-3 scale-95 blur-[1px] transition-transform group-hover:translate-x-4"></div>
          <div className="absolute inset-0 bg-green-200/60 rounded-xl transform translate-x-1 md:translate-x-1.5 scale-[0.97] transition-transform group-hover:translate-x-2"></div>
          <div className="relative w-14 sm:w-16 md:w-20 lg:w-24 aspect-[4/5] bg-white border border-green-100 rounded-xl shadow-lg flex flex-col items-center justify-center p-2 transform transition-transform group-hover:scale-105">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-green-50 flex items-center justify-center mb-1 md:mb-2">
              <svg
                className="w-3 h-3 md:w-4 md:h-4 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <div className="w-6 sm:w-8 md:w-10 h-1 md:h-1.5 bg-gray-200 rounded-full mb-1"></div>
            <div className="w-4 sm:w-6 md:w-8 h-1 md:h-1.5 bg-gray-200 rounded-full"></div>
          </div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[9px] md:text-[10px] font-semibold text-green-600 uppercase tracking-wider bg-green-50 px-2 py-0.5 rounded-full shadow-sm border border-green-100">
              Containers
            </span>
          </div>
        </div>
      </div>

      {/* Top Right (Postgres) */}
      <div
        className="absolute top-[20%] left-[75%] -translate-y-1/2 -translate-x-1/2 z-10"
        style={{
          animation: "float-fast 3.5s ease-in-out infinite",
        }}
      >
        <div className="relative group cursor-pointer">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white border border-purple-100 rounded-full shadow-md flex items-center justify-center relative transform transition-transform group-hover:scale-110">
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            <svg
              className="w-4 h-4 md:w-5 md:h-5 text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 7c0-1.657 3.582-3 8-3s8 1.343 8 3-3.582 3-8 3-8-1.343-8-3z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 7v10c0 1.657 3.582 3 8 3s8-1.343 8-3V7"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 12c0 1.657 3.582 3 8 3s8-1.343 8-3"
              />
            </svg>
          </div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[9px] md:text-[10px] font-semibold text-purple-600 uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded-full shadow-sm border border-purple-100">
              Postgres DB
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Left (Auth Service) */}
      <div
        className="absolute top-[80%] left-[25%] -translate-y-1/2 -translate-x-1/2 z-10"
        style={{
          animation:
            "float-medium 4.5s ease-in-out infinite reverse",
        }}
      >
        <div className="relative group cursor-pointer">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white border border-red-100 rounded-full shadow-md flex items-center justify-center relative transform transition-transform group-hover:scale-110">
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            <svg
              className="w-4 h-4 md:w-5 md:h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
              />
            </svg>
          </div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[9px] md:text-[10px] font-semibold text-red-600 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded-full shadow-sm border border-red-100">
              Auth Service
            </span>
          </div>
        </div>
      </div>

      {/* Center Hub (Kubernetes) */}
      <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 z-20">
        <div className="relative group cursor-default">
          {/* Glowing effect */}
          <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-150 animate-pulse"></div>

          <div className="relative w-24 sm:w-28 md:w-32 h-28 sm:h-32 md:h-36 bg-blue-600 rounded-xl md:rounded-2xl shadow-2xl shadow-blue-500/30 border border-blue-400/50 p-2 md:p-3 flex flex-col items-center justify-center transform transition-all group-hover:scale-105 overflow-hidden">
            {/* Inner decorative elements matching the visual */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-black/5 rounded-tr-full pointer-events-none"></div>

            <div className="w-10 md:w-14 h-1 bg-blue-400/50 rounded-full mb-1.5 self-start"></div>
            <div className="w-14 md:w-20 h-1 bg-blue-400/50 rounded-full mb-3 md:mb-5 self-start"></div>

            {/* K8s Polygon */}
            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#0a1947] rounded-lg md:rounded-xl rotate-45 flex items-center justify-center mb-2 md:mb-3 shadow-inner">
              <div className="-rotate-45 text-white">
                {/* K8s wheel icon */}
                <svg
                  className="w-6 h-6 md:w-8 md:h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M12 2v20m10-10H2m17.07-7.07l-14.14 14.14M19.07 19.07L4.93 4.93"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="#0a1947"
                  />
                </svg>
              </div>
            </div>

            <div className="w-12 md:w-16 h-1 bg-blue-400/50 rounded-full mt-2 md:mt-3 self-start"></div>
            <div className="w-6 md:w-8 h-1 bg-blue-400/50 rounded-full mt-1 self-start"></div>
          </div>

          {/* Floating badge */}
          <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 bg-green-500 text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border-2 border-white animate-bounce">
            Healthy
          </div>
        </div>
      </div>
    </div>
  );
};

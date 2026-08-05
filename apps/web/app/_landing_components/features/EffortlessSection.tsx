import React, { useState } from "react";
import Pricing from "../pricing";

export const EffortlessSection: React.FC = () => {
  const [billing, setBilling] = useState<"monthly" | "annually">("monthly");

  return (
    <section className="w-full relative overflow-hidden py-32 bg-[#f4f4f5] flex justify-center font-sans">
      <div className="relative z-10 max-w-6xl w-full px-6 flex flex-col items-center justify-center min-h-[600px]">
        {/* Billing toggle at the top */}
        <div className="flex flex-col items-center mb-12">
          <div className="z-50 flex items-center bg-gray-200/70 backdrop-blur-md rounded-full p-1 gap-1 shadow-inner border border-gray-300 pointer-events-auto">
            {(["monthly", "annually"] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBilling(cycle)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 capitalize ${
                  billing === cycle
                    ? "bg-[#1a1a1a] text-white shadow-md"
                    : "text-gray-600 hover:text-black"
                }`}
              >
                {cycle === "annually" ? "Annually" : "Monthly"}
              </button>
            ))}
          </div>
        </div>

        {/* Floating Elements & Backgrounds */}
        <div className="absolute inset-0 pointer-events-none flex justify-center items-center z-10">
          {/* --- LEFT SIDE: Wallet Slot & Cards --- */}
          {/* Black Wallet Slot */}
          <div className="absolute top-[42%] left-[25%] w-64 h-16 bg-[#1a1a1a] rounded-full shadow-inner border-[6px] border-[#e4e4e7] z-10"></div>

          {/* Yellow Card (React) */}
          <div className="absolute top-[18%] left-[12%] w-32 h-44 bg-[#ffca28] rounded-2xl shadow-xl -rotate-[20deg] flex flex-col p-4 z-0 border border-yellow-300">
            <span className="font-bold text-yellow-900 text-xs">React</span>
            <div className="mt-auto text-yellow-700 font-black text-4xl opacity-50">
              ⚛️
            </div>
          </div>

          {/* White Card (Next.js) */}
          <div className="absolute top-[28%] left-[18%] w-32 h-44 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl -rotate-[10deg] flex flex-col p-4 z-10 border border-gray-100">
            <span className="font-bold text-gray-800 text-xs">Next.js</span>
            <div className="mt-auto text-gray-200 font-black text-4xl">▲</div>
          </div>

          {/* Black Card (Node) */}
          <div className="absolute top-[34%] left-[23%] w-32 h-44 bg-[#1a1a1a] rounded-2xl shadow-2xl -rotate-[2deg] flex flex-col p-4 z-20 border border-gray-700">
            <span className="font-bold text-white text-xs opacity-80">
              Node.js
            </span>
            <div className="mt-auto text-gray-800 font-black text-4xl">⬢</div>
          </div>

          {/* Green Card (Postgres) */}
          <div className="absolute top-[37%] left-[28%] w-40 h-28 bg-[#10b981] rounded-2xl shadow-2xl rotate-[8deg] flex flex-col p-4 z-30 border border-green-400">
            <span className="font-bold text-white text-xs opacity-90 italic">
              PostgreSQL
            </span>
            <div className="mt-auto text-green-700 font-black text-3xl">🐘</div>
          </div>

          {/* Blue Card (Docker) */}
          <div className="absolute top-[40%] left-[33%] w-40 h-28 bg-[#3b82f6] rounded-2xl shadow-2xl rotate-[15deg] flex flex-col p-4 z-40 border border-blue-400">
            <span className="font-bold text-white text-xs opacity-90">
              Docker
            </span>
            <div className="mt-auto text-blue-700 font-black text-3xl italic">
              🐳
            </div>
          </div>

          {/* White Card Overlap (K8s) */}
          <div className="absolute top-[44%] left-[42%] w-24 h-24 bg-white rounded-2xl shadow-xl rotate-[25deg] flex flex-col p-3 z-30 border border-gray-100">
            <span className="font-bold text-blue-600 text-[10px] tracking-widest uppercase">
              K8s
            </span>
            <div className="mt-auto text-blue-100 font-black text-2xl">☸</div>
          </div>

          {/* Cursor Pointer pointing at 'effortless' */}
          <div className="absolute top-[58%] left-[28%] z-50 drop-shadow-2xl">
            <svg
              width="72"
              height="72"
              viewBox="0 0 24 24"
              fill="white"
              stroke="#1a1a1a"
              strokeWidth="1.5"
              xmlns="http://www.w3.org/2000/svg"
              className="-rotate-12"
            >
              <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.42c.45 0 .67-.54.35-.85L6.35 2.85a.5.5 0 0 0-.85.35Z" />
            </svg>
          </div>

          {/* --- RIGHT SIDE: Toggle & Icons --- */}

          {/* Toggle switch */}
          <div className="absolute top-[32%] right-[22%] w-28 h-14 bg-[#22c55e] rounded-full border-[6px] border-white shadow-2xl rotate-12 flex items-center p-1 z-30">
            <div className="w-9 h-9 bg-white rounded-full ml-auto shadow-md"></div>
          </div>

          {/* Lightning (Black Square) */}
          <div className="absolute bottom-[28%] right-[26%] bg-[#1a1a1a] w-24 h-24 rounded-[1.5rem] shadow-2xl -rotate-12 flex items-center justify-center z-10 border border-gray-800">
            <span className="text-[#fbbf24] text-5xl drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
              ⚡
            </span>
          </div>

          {/* Fingerprint (Glass) */}
          <div className="absolute bottom-[22%] right-[18%] bg-white/30 backdrop-blur-xl w-24 h-24 rounded-[1.5rem] shadow-xl rotate-6 flex items-center justify-center z-20 border border-white/60">
            <span className="text-[#ff6b00] text-5xl opacity-80">👆</span>
          </div>

          {/* Blue Lock */}
          <div className="absolute bottom-[10%] right-[14%] flex flex-col items-center justify-center -rotate-[15deg] z-30 drop-shadow-2xl">
            <div className="w-12 h-12 border-[8px] border-[#cbd5e1] rounded-t-full border-b-0 mb-[-8px]"></div>
            <div className="w-20 h-16 bg-[#3b82f6] rounded-[1.25rem] shadow-inner flex items-center justify-center border-t border-blue-400">
              <div className="w-3 h-5 bg-[#1e3a8a] rounded-full shadow-inner"></div>
            </div>
          </div>
        </div>

        {/* Main Text Content */}
        <div className="relative z-20 flex flex-col items-center text-center w-full pointer-events-none">
          <h2 className="font-black text-[#1a1a1a] flex flex-col items-center drop-shadow-sm w-full">
            {/* Building apps */}
            <div className="flex justify-center text-[50px] lg:text-[50px] leading-[0.9] tracking-[-0.04em] z-20">
              <span>Embrace Architecture Automation</span>
            </div>
            <div className="text-[#ff6b00] text-[70px] lg:text-[70px] leading-[0.8] tracking-[-0.05em] mt-4 z-40 drop-shadow-md">
              Save Tokens.
            </div>
          </h2>

          <div className="pointer-events-auto w-full">
            <Pricing
              hideHeader={true}
              hideToggle={true}
              externalBilling={billing}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

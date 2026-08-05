import React, { useState } from "react";
import { features } from "./types";
import { DesignVisual } from "./visuals/DesignVisual";
import { SimulateVisual } from "./visuals/SimulateVisual";
import { CodeVisual } from "./visuals/CodeVisual";
import { DeployVisual } from "./visuals/DeployVisual";

export const FeatureSwitcher: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(features[1]?.id);

  return (
    <section className="w-full py-24 bg-white scroll-mt-14" id="features">
      <div className="max-w-6xl mx-auto px-6 flex flex-col items-center">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4 mb-16">
          <div className="bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
            Abstraction Layer
          </div>
          <h2 className="text-4xl lg:text-5xl font-semibold text-gray-900 tracking-tight">
            Lead your full-stack transformation
          </h2>
        </div>

        {/* Content */}
        <div className="w-full flex flex-col lg:flex-row gap-12 items-center">
          {/* Left: Tab List */}
          <div className="flex-1 flex flex-col gap-2 w-full">
            {features.map((feature) => {
              const isActive = activeFeature === feature.id;
              return (
                <div
                  key={feature.id}
                  onClick={() => setActiveFeature(feature.id)}
                  className={`cursor-pointer transition-all duration-500 ease-in-out flex gap-4 items-start transform ${
                    isActive
                      ? "bg-yellow-50 shadow-md border border-yellow-300 p-6 rounded-2xl scale-[1.02]"
                      : "hover:bg-gray-100 border border-transparent py-4 px-6 rounded-xl hover:scale-[1.01]"
                  }`}
                >
                  <div
                    className={`text-xl mt-0.5 transition-transform duration-500 ${
                      isActive ? "scale-110" : ""
                    }`}
                  >
                    {feature.icon}
                  </div>
                  <div>
                    <h3
                      className={`text-base font-bold transition-colors duration-300 ${
                        isActive
                          ? "text-gray-900"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {feature.title}
                    </h3>
                    <div
                      className={`overflow-hidden transition-all duration-500 ease-in-out ${
                        isActive
                          ? "max-h-40 opacity-100 mt-2"
                          : "max-h-0 opacity-0 mt-0"
                      }`}
                    >
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Dynamic Visual */}
          <div className="flex-1 w-full flex items-center justify-center lg:pl-10">
            <div className="w-full max-w-[440px] aspect-square bg-[#f8fafc] rounded-[2.5rem] border-[10px] border-gray-50 shadow-sm relative flex items-center justify-center p-6">
              {activeFeature === "design" && <DesignVisual />}
              {activeFeature === "simulate" && <SimulateVisual />}
              {activeFeature === "code" && <CodeVisual />}
              {activeFeature === "deploy" && <DeployVisual />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

// ─── Adaptive Reasoning Engine Cards ─────────────────────────────────────────

const reasoningCards = [
  {
    icon: "🧠",
    title: "LLM Reasoning",
    description: "Multi-step chain-of-thought reasoning with stateful memory across workflow nodes.",
    tag: "Core",
  },
  {
    icon: "⚡",
    title: "Your Tools Work",
    description: "Integrate any MCP-compatible tool — Postgres, APIs, filesystem — out of the box.",
    tag: "MCP",
  },
  {
    icon: "🔁",
    title: "Resilient Queues",
    description: "Inngest-powered background workers that retry, scale, and survive failures.",
    tag: "Infra",
  },
  {
    icon: "📡",
    title: "Live Execution",
    description: "Real-time SSE streams surface every decision, tool call, and branch live.",
    tag: "Observability",
  },
];

const AdaptiveSection = () => (
  <section className="w-full py-20 bg-white">
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-12">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-2">
          Under the hood
        </p>
        <h2 className="text-3xl font-bold text-black">Adaptive Reasoning Engine</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
          A runtime built for production — not just demos.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reasoningCards.map((card) => (
          <div
            key={card.title}
            className="group p-5 rounded-2xl border border-gray-100 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-default"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-4 text-xl group-hover:bg-gray-100 transition-colors">
              {card.icon}
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1 block">
              {card.tag}
            </span>
            <h3 className="text-sm font-bold text-black mb-1.5">{card.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Automate Stack Section ───────────────────────────────────────────────────

const stackItems = [
  { icon: "🔗", label: "LangGraph" },
  { icon: "⚡", label: "Inngest" },
  { icon: "▲", label: "Convex" },
  { icon: "✦", label: "Gemini" },
  { icon: "◎", label: "OpenAI" },
  { icon: "🐘", label: "Postgres" },
];

const AutomateSection = () => (
  <section className="w-full py-20 bg-gray-50 border-t border-gray-100">
    <div className="max-w-6xl mx-auto px-6 flex flex-col items-center text-center gap-10">
      <div>
        <h2 className="text-3xl lg:text-4xl font-bold text-black leading-tight">
          We automate intelligent workflows<br />
          <span className="text-gray-400">across your entire stack.</span>
        </h2>
        <p className="text-sm text-gray-500 mt-3 max-w-lg mx-auto">
          Connect any data source, model, or API into a single coherent agent pipeline — without glue code.
        </p>
      </div>

      {/* Connected graph visual */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Center node */}
        <div className="absolute z-10 w-14 h-14 rounded-full bg-black flex items-center justify-center shadow-xl">
          <span className="text-white text-2xl">⚡</span>
        </div>
        {/* Orbit nodes */}
        {stackItems.map((item, i) => {
          const angle = (i / stackItems.length) * 2 * Math.PI - Math.PI / 2;
          const r = 90;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          return (
            <div
              key={item.label}
              className="absolute flex flex-col items-center gap-0.5"
              style={{
                left: `calc(50% + ${x}px - 18px)`,
                top: `calc(50% + ${y}px - 18px)`,
              }}
            >
              <div className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-base">
                {item.icon}
              </div>
              <span className="text-[8px] text-gray-500 font-medium">{item.label}</span>
            </div>
          );
        })}
        {/* SVG lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 256 256">
          {stackItems.map((_, i) => {
            const angle = (i / stackItems.length) * 2 * Math.PI - Math.PI / 2;
            const r = 90;
            const x = 128 + Math.cos(angle) * r;
            const y = 128 + Math.sin(angle) * r;
            return (
              <line
                key={i}
                x1="128"
                y1="128"
                x2={x}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            );
          })}
        </svg>
      </div>
    </div>
  </section>
);

// ─── Feature Bento Cards ──────────────────────────────────────────────────────

const TypingText = ({ text, onTyping, onComplete }: { text: string; onTyping?: () => void; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState("");
  const onCompleteRef = React.useRef(onComplete);
  const onTypingRef = React.useRef(onTyping);
  useEffect(() => { onCompleteRef.current = onComplete; onTypingRef.current = onTyping; }, [onComplete, onTyping]);
  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      onTypingRef.current?.();
      if (i >= text.length) { clearInterval(interval); onCompleteRef.current?.(); }
    }, 15);
    return () => clearInterval(interval);
  }, [text]);
  return <>{displayedText}</>;
};

const ContextualReasoningCard = () => (
  <div className="w-full lg:w-1/2 rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden p-6 flex flex-col gap-4">
    <div>
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Feature 01</span>
      <h3 className="text-xl font-bold text-black mt-1">Contextual Reasoning</h3>
      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
        LangGraph-powered agents remember prior state, branch conditionally, and produce
        coherent multi-step reasoning — even across retries.
      </p>
    </div>
    {/* Mini graph visual */}
    <div className="relative h-40 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100">
      <div className="flex items-center gap-3">
        {["Trigger", "Reason", "Tool", "Output"].map((label, i, arr) => (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-sm border ${i === 1 ? "bg-black text-white border-black" : "bg-white border-gray-200 text-gray-700"}`}>
                {["⚡", "🧠", "🔧", "✓"][i]}
              </div>
              <span className="text-[9px] text-gray-500">{label}</span>
            </div>
            {i < arr.length - 1 && <div className="w-6 h-px bg-gray-300 -mt-4" />}
          </React.Fragment>
        ))}
      </div>
    </div>
    <Link href="/docs" className="text-xs text-gray-500 hover:text-black transition-colors flex items-center gap-1">
      Read docs <span>↗</span>
    </Link>
  </div>
);

const ToolApiCard = () => {
  const configText = `mcpServers: {
  postgres: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-postgres"],
    env: { DB_URI: "postgresql://..." }
  },
  filesystem: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-fs"]
  }
}`;
  return (
    <div className="w-full lg:w-1/2 rounded-2xl bg-gray-900 border border-gray-800 shadow-sm overflow-hidden p-6 flex flex-col gap-4">
      <div>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Feature 02</span>
        <h3 className="text-xl font-bold text-white mt-1">Tool & API Routing</h3>
        <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
          Connect any MCP-compatible tool. Agents route calls intelligently — database writes,
          file system access, or custom REST APIs.
        </p>
      </div>
      <div className="bg-black rounded-xl p-4 flex-1 overflow-hidden border border-gray-800">
        <pre className="text-[10px] font-mono leading-relaxed text-green-400 whitespace-pre-wrap">{configText}</pre>
      </div>
      <Link href="/docs" className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
        Read docs <span>↗</span>
      </Link>
    </div>
  );
};

const RealtimeCard = () => {
  type Message = { id: string; role: "user" | "assistant"; content: string };
  const assistantResponses = [
    "⚡ Initializing Lead Enrichment Workflow...\n📥 Trigger received: user@example.com",
    "🧠 LLM Reasoning: Analyzing profile...\n  → Senior Engineer at Google",
    "🔌 Postgres MCP: Writing to DB...\n  ✓ Saved user ID pg_9821",
    "✅ Workflow complete!\n  All states persisted in Convex DB.",
  ];
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "user", content: "Run Lead Enrichment for user@example.com" },
  ]);
  const [aiResponseIndex, setAiResponseIndex] = useState(0);
  const [hasHovered, setHasHovered] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const triggerAIResponse = () => {
    setTimeout(() => {
      if (aiResponseIndex >= assistantResponses.length) return;
      const nextMsg: Message = { id: Date.now().toString(), role: "assistant", content: assistantResponses[aiResponseIndex] ?? "" };
      setMessages((prev) => [...prev, nextMsg].slice(-6));
      setAiResponseIndex((prev) => prev + 1);
    }, 600);
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  return (
    <div
      className="w-full rounded-2xl bg-gray-900 border border-gray-800 shadow-sm overflow-hidden p-6 flex flex-col gap-4"
      onMouseEnter={() => { if (!hasHovered) { setHasHovered(true); triggerAIResponse(); } }}
    >
      <div>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Feature 03</span>
        <h3 className="text-xl font-bold text-white mt-1">Real-Time Execution</h3>
        <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
          Every step, branch, and tool call is streamed live via SSE. Hover to see it in action.
        </p>
      </div>
      <div className="bg-black rounded-xl border border-gray-800 p-3 flex-1 min-h-[160px]">
        <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Live console</p>
        <div ref={scrollRef} className="flex flex-col gap-1.5 overflow-y-auto max-h-40 hide-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "user" ? (
                <span className="text-[10px] bg-gray-800 text-white px-2.5 py-1 rounded-full">{msg.content}</span>
              ) : (
                <div className="text-[10px] font-mono text-green-400 px-2 py-1.5 rounded-lg bg-gray-900 border border-gray-800 whitespace-pre-wrap w-full">
                  <TypingText text={msg.content} onComplete={() => { if (aiResponseIndex < assistantResponses.length) triggerAIResponse(); }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <Link href="/docs" className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
        Read docs <span>↗</span>
      </Link>
    </div>
  );
};

const BentoSection = () => (
  <section className="w-full py-20 bg-white border-t border-gray-100" id="features">
    <div className="max-w-6xl mx-auto px-6 flex flex-col gap-6">
      <div className="text-center mb-4">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-2">What you get</p>
        <h2 className="text-3xl font-bold text-black">Built for production. Made for developers.</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-lg mx-auto">
          Three core capabilities that make Flowify more than a demo — a real production runtime.
        </p>
      </div>
      <div className="flex flex-col lg:flex-row gap-5">
        <ContextualReasoningCard />
        <ToolApiCard />
      </div>
      <RealtimeCard />
    </div>
  </section>
);

// ─── Stats Section ────────────────────────────────────────────────────────────

const stats = [
  { value: "10x", label: "Faster deployment" },
  { value: "3,500+", label: "Workflows created" },
  { value: "700%", label: "ROI improvement" },
];

const StatsSection = () => (
  <section className="w-full py-20 bg-gray-50 border-t border-gray-100">
    <div className="max-w-6xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12">
      <div className="flex-1">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-3">By the numbers</p>
        <h2 className="text-3xl lg:text-4xl font-bold text-black leading-tight">
          AI Agents Built<br />For Modern Workflows
        </h2>
        <p className="text-sm text-gray-500 mt-3 max-w-sm leading-relaxed">
          Teams using Flowify ship AI automations in hours, not weeks. Real results from real workflows.
        </p>
        <div className="flex gap-2 mt-5">
          <Link href="/sign-up" className="bg-black text-white text-xs px-5 py-2.5 rounded-full font-medium hover:bg-gray-800 transition-colors">
            Get started free
          </Link>
          <Link href="/workflows" className="text-xs px-5 py-2.5 rounded-full border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors font-medium">
            Browse templates
          </Link>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1 items-center lg:items-start">
            <span className="text-4xl font-black text-black tracking-tight">{stat.value}</span>
            <span className="text-xs text-gray-500">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── How It Works ─────────────────────────────────────────────────────────────

const steps = [
  {
    step: "01",
    title: "Design Your Canvas",
    description:
      "Drag-and-drop workflow nodes — triggers, reasoning steps, tool calls, and branches — into a stateful agent graph.",
    accent: "bg-green-400",
  },
  {
    step: "02",
    title: "Connect Tools & Models",
    description:
      "Attach any LLM (Gemini, OpenAI, Anthropic) and equip it with MCP tools like Postgres, filesystem access, or your own APIs.",
    accent: "bg-blue-400",
  },
  {
    step: "03",
    title: "Deploy & Monitor Live",
    description:
      "One-click deploy to Inngest-backed queues. Watch real-time SSE logs as your agents execute, retry, and branch.",
    accent: "bg-yellow-400",
  },
];

const HowItWorksSection = () => (
  <section className="w-full py-20 bg-white border-t border-gray-100">
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-14">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-2">Simple process</p>
        <h2 className="text-3xl font-bold text-black">How Our Platform Works</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
          From idea to deployed AI agent in three clear steps.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Steps */}
        <div className="flex-1 flex flex-col gap-8">
          {steps.map((step, i) => (
            <div key={step.step} className="flex gap-5 items-start group">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full ${step.accent} flex items-center justify-center text-xs font-bold text-black shadow-md flex-shrink-0`}>
                  {step.step}
                </div>
                {i < steps.length - 1 && <div className="w-px h-16 bg-gray-200" />}
              </div>
              <div className="pt-1">
                <h3 className="text-sm font-bold text-black mb-1.5">{step.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Chart placeholder */}
        <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-black">Execution timeline</span>
            <span className="text-[10px] text-gray-400">Live</span>
          </div>
          {/* Fake chart bars */}
          <div className="flex items-end gap-2 h-32">
            {[40, 65, 50, 80, 60, 90, 70, 85, 55, 95, 75, 88].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm transition-all duration-500"
                style={{
                  height: `${h}%`,
                  background: `hsl(${80 + i * 5}, 70%, ${50 + i * 2}%)`,
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-gray-400">
            <span>0s</span><span>1s</span><span>2s</span><span>3s</span>
          </div>
          <div className="flex gap-3 mt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-[9px] text-gray-500">Success</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-[9px] text-gray-500">Reasoning</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-[9px] text-gray-500">Tool calls</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── CTA Section ─────────────────────────────────────────────────────────────

const CTASection = () => (
  <section className="w-full py-24 bg-gray-50 border-t border-gray-100 relative overflow-hidden">
    {/* Colorful dots */}
    <div className="absolute inset-0 pointer-events-none">
      {[
        { color: "bg-green-400", top: "15%", left: "8%" },
        { color: "bg-blue-400", top: "25%", left: "90%" },
        { color: "bg-yellow-400", top: "70%", left: "85%" },
        { color: "bg-red-400", top: "80%", left: "10%" },
        { color: "bg-purple-400", top: "50%", left: "5%" },
        { color: "bg-pink-400", top: "60%", left: "92%" },
      ].map((dot, i) => (
        <div
          key={i}
          className={`absolute w-3 h-3 rounded-full ${dot.color} opacity-70 animate-pulse`}
          style={{ top: dot.top, left: dot.left, animationDelay: `${i * 0.4}s` }}
        />
      ))}
    </div>

    <div className="max-w-2xl mx-auto px-6 flex flex-col items-center text-center gap-6 relative z-10">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xl">🤝</span>
      </div>
      <h2 className="text-3xl lg:text-5xl font-bold text-black leading-tight">
        Build AI agents that get<br />real work done
      </h2>
      <p className="text-sm text-gray-500 max-w-md leading-relaxed">
        Join hundreds of developers shipping production AI workflows with Flowify.
        Start free — no credit card required.
      </p>

      <div className="flex flex-wrap gap-3 justify-center mt-2">
        <Link href="/sign-up" className="bg-black text-white text-sm px-7 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 group shadow-lg">
          Get started free
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>
        <Link href="/workflows" className="text-sm px-7 py-3 rounded-full border border-gray-300 text-gray-700 hover:border-black transition-colors font-medium">
          View templates
        </Link>
      </div>

      <p className="text-xs text-gray-400 mt-1">
        Free tier · No CC required · Deploy in minutes
      </p>
    </div>
  </section>
);

// ─── Features (main export) ───────────────────────────────────────────────────

const Features = () => {
  return (
    <>
      <AdaptiveSection />
      <AutomateSection />
      <BentoSection />
      <StatsSection />
      <HowItWorksSection />
      <CTASection />
    </>
  );
};

export default Features;

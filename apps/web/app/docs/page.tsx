import React from "react";
import Link from "next/link";
import { Header } from "../_landing_components/header";
import { Footer } from "../_landing_components/footer";
import { Metadata } from "next";
import {
  BookOpen,
  Code2,
  Cpu,
  Zap,
  Layers,
  Workflow,
  Sparkles,
  Terminal,
  ShieldCheck,
  FileText,
  ExternalLink,
  Search,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Documentation & API Reference | dezign2app",
  description:
    "Comprehensive guides, API documentation, and architecture references for building with dezign2app.",
};

const docSections = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Zap,
    items: [
      { id: "overview", name: "Platform Overview" },
      { id: "quickstart", name: "5-Minute Quickstart" },
      { id: "core-concepts", name: "Core Concepts" },
      { id: "workspace-setup", name: "Workspace Setup" },
    ],
  },
  {
    id: "design-engine",
    title: "AI Design & Architecture Engine",
    icon: Sparkles,
    items: [
      { id: "prompt-to-app", name: "Prompt to Application" },
      { id: "system-design", name: "System Design Generation" },
      { id: "canvas-primitives", name: "Canvas Primitives & Nodes" },
      { id: "export-code", name: "Exporting Code & Diagrams" },
    ],
  },
  {
    id: "workflows",
    title: "Workflows & Automation",
    icon: Workflow,
    items: [
      { id: "workflow-triggers", name: "Triggers & Webhooks" },
      { id: "canvas-actions", name: "Canvas Automation Nodes" },
      { id: "inngest-pipeline", name: "Async Processing Pipeline" },
      { id: "custom-functions", name: "Custom Code Executions" },
    ],
  },
  {
    id: "api-reference",
    title: "API & SDK Reference",
    icon: Code2,
    items: [
      { id: "rest-api", name: "REST API Endpoints" },
      { id: "authentication", name: "API Key Authentication" },
      { id: "webhooks", name: "Event Webhooks" },
      { id: "rate-limits", name: "Rate Limits & Quotas" },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="max-w-screen min-h-screen w-full bg-white text-black flex flex-col items-center overflow-x-hidden">
      <Header />

      {/* Docs Sub-Header / Hero */}
      <section className="w-full bg-[#f4f5f7] border-b border-gray-200 py-12 px-6 md:px-12 flex flex-col items-center text-center">
        <div className="max-w-3xl flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 border border-black/10 text-xs font-semibold text-gray-700">
            <BookOpen className="size-3.5 text-black" />
            <span>dezign2app Developer Portal</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900">
            Documentation & Developer Guides
          </h1>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-2xl">
            Everything you need to turn system architecture diagrams, AI
            wireframes, and workflow graphs into production-ready web
            applications.
          </p>

          {/* Quick Support Badge */}
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1.5 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
            <span>Need personalized setup assistance? Contact support:</span>
            <a
              href="mailto:founder@dezign2app.com"
              className="text-black font-semibold hover:underline"
            >
              founder@dezign2app.com
            </a>
          </div>
        </div>
      </section>

      {/* Main Docs Content Layout */}
      <main className="w-full max-w-7xl px-6 md:px-12 py-12 grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Left Navigation Sidebar */}
        <aside className="lg:col-span-1 flex flex-col gap-8 pr-4 lg:border-r lg:border-gray-100">
          {docSections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.id} className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900 tracking-tight">
                  <Icon className="size-4 text-black" />
                  <span>{section.title}</span>
                </div>
                <ul className="flex flex-col gap-1.5 border-l-2 border-gray-100 pl-3">
                  {section.items.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="text-xs text-gray-600 hover:text-black hover:font-medium transition-colors block py-0.5"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col gap-2">
            <h4 className="text-xs font-bold text-gray-900">
              Developer Support
            </h4>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Have questions about integrating dezign2app into your enterprise
              stack?
            </p>
            <a
              href="mailto:founder@dezign2app.com"
              className="text-xs font-semibold text-black hover:underline inline-flex items-center gap-1"
            >
              Email founder@dezign2app.com →
            </a>
          </div>
        </aside>

        {/* Main Guide Content */}
        <section className="lg:col-span-3 flex flex-col gap-12 text-gray-800">
          {/* Section 1: Quickstart */}
          <article
            id="getting-started"
            className="flex flex-col gap-6 border-b border-gray-100 pb-10"
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              <Zap className="size-4 text-black" />
              <span>Getting Started</span>
            </div>
            <h2
              id="overview"
              className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight"
            >
              Platform Overview
            </h2>
            <p className="text-sm md:text-base leading-relaxed text-gray-600">
              dezign2app is an AI-native visual design and system architecture
              platform. It seamlessly connects visual node-based diagrams,
              component wireframes, and asynchronous automation workflows into
              real React/Next.js code bases.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col gap-2">
                <div className="size-7 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h3 className="text-xs font-bold text-gray-900">
                  Visual Canvas
                </h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Drag and drop UI blocks, system design components, and data
                  connectors on an infinite canvas.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col gap-2">
                <div className="size-7 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h3 className="text-xs font-bold text-gray-900">
                  AI Code Generation
                </h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Leverage LLM design pipelines to turn sketches into
                  accessible, production ready TSX code.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col gap-2">
                <div className="size-7 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h3 className="text-xs font-bold text-gray-900">
                  Automation Engine
                </h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Connect visual trigger nodes to real backend events, webhooks,
                  and third-party integrations.
                </p>
              </div>
            </div>

            <h3
              id="quickstart"
              className="text-lg font-bold text-gray-900 mt-4"
            >
              5-Minute Quickstart
            </h3>
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
              Follow these simple steps to start creating your first project on
              dezign2app:
            </p>
            <ol className="flex flex-col gap-3 pl-4 list-decimal text-xs md:text-sm text-gray-700 font-medium">
              <li>Sign in to your dezign2app workspace account.</li>
              <li>
                Click <strong>&quot;New Project&quot;</strong> in the dashboard
                navigation bar.
              </li>
              <li>
                Choose between starting with a blank canvas, importing a prompt,
                or choosing a system architecture template.
              </li>
              <li>
                Drag components from the sidebar palette onto your workspace
                canvas.
              </li>
              <li>
                Click <strong>&quot;Export Code&quot;</strong> to copy optimized
                Tailwind/React code to your local repository.
              </li>
            </ol>
          </article>

          {/* Section 2: AI Design Engine */}
          <article
            id="design-engine"
            className="flex flex-col gap-6 border-b border-gray-100 pb-10"
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              <Sparkles className="size-4 text-black" />
              <span>AI & Design Engine</span>
            </div>
            <h2
              id="prompt-to-app"
              className="text-2xl font-extrabold text-gray-900 tracking-tight"
            >
              Prompt-to-Application Architecture
            </h2>
            <p className="text-xs md:text-sm leading-relaxed text-gray-600">
              When you type a prompt (e.g. &quot;Build a multi-tenant Kanban
              dashboard with dark mode support&quot;), dezign2app breaks the
              prompt down into layout specifications, component component props,
              and color tokens.
            </p>

            {/* Code Example Box */}
            <div className="rounded-xl bg-gray-900 text-gray-100 p-5 overflow-x-auto font-mono text-xs shadow-md">
              <div className="flex justify-between items-center pb-3 border-b border-gray-800 text-gray-400 text-[11px] mb-3">
                <span>example-request.json</span>
                <span>POST /api/public/v1/generate</span>
              </div>
              <pre className="leading-relaxed">
                {`{
  "prompt": "Create an e-commerce product detail canvas with checkout triggers",
  "framework": "nextjs-16",
  "styling": "tailwind-v4",
  "options": {
    "responsive": true,
    "typescript": true
  }
}`}
              </pre>
            </div>
          </article>

          {/* Section 3: Workflows & Automations */}
          <article
            id="workflows"
            className="flex flex-col gap-6 border-b border-gray-100 pb-10"
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              <Workflow className="size-4 text-black" />
              <span>Automations</span>
            </div>
            <h2
              id="workflow-triggers"
              className="text-2xl font-extrabold text-gray-900 tracking-tight"
            >
              Workflow Triggers & Event Pipelines
            </h2>
            <p className="text-xs md:text-sm leading-relaxed text-gray-600">
              dezign2app workflows run on high-performance serverless event
              buses. You can trigger execution graphs based on canvas events,
              HTTP webhooks, scheduled crons, or manual triggers.
            </p>
            <ul className="flex flex-col gap-2 text-xs md:text-sm text-gray-600 pl-4 list-disc">
              <li>
                <strong>Manual Triggers:</strong> Launch pipeline runs on demand
                directly from the canvas interface.
              </li>
              <li>
                <strong>Webhook Triggers:</strong> Listen to Stripe, GitHub, or
                custom HTTP POST requests.
              </li>
              <li>
                <strong>Scheduled Crons:</strong> Set recurring cron schedules
                (e.g., every hour, daily backups).
              </li>
            </ul>
          </article>

          {/* Section 4: API & Support Contact */}
          <article id="api-reference" className="flex flex-col gap-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              <Code2 className="size-4 text-black" />
              <span>API Reference & Help</span>
            </div>
            <h2
              id="authentication"
              className="text-2xl font-extrabold text-gray-900 tracking-tight"
            >
              API Authentication & Developer Contact
            </h2>
            <p className="text-xs md:text-sm leading-relaxed text-gray-600">
              All API requests must contain a valid bearer token in the
              authorization header. Obtain your key from the Dashboard API Keys
              settings panel.
            </p>

            <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-2">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-gray-900">
                  Need Custom API Limits or Enterprise Dedicated Support?
                </h3>
                <p className="text-xs text-gray-500">
                  Reach out directly to our engineering leadership for dedicated
                  solutions.
                </p>
              </div>
              <a
                href="mailto:founder@dezign2app.com"
                className="px-5 py-2.5 bg-black text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-all shrink-0"
              >
                Contact founder@dezign2app.com
              </a>
            </div>
          </article>
        </section>
      </main>

      <Footer />
    </div>
  );
}

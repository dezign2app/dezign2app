import { Header } from "../_landing_components/header";
import { Footer } from "../_landing_components/footer";
import { Metadata } from "next";
import { Briefcase } from "lucide-react";

export const metadata: Metadata = {
  title: "Careers | dezign2app",
  description:
    "Join the team at dezign2app building the future of AI-powered visual application design.",
};

const openPositions = [
  {
    title: "Senior Full Stack Engineer (Next.js / Convex)",
    location: "Remote / Hybrid",
    type: "Full-Time",
  },
  {
    title: "AI / Compiler Engineer (Canvas & Code Gen)",
    location: "Remote",
    type: "Full-Time",
  },
  {
    title: "Product Designer (Design Systems & Canvas UI)",
    location: "Remote",
    type: "Full-Time",
  },
];

export default function CareersPage() {
  return (
    <div className="max-w-screen min-h-screen w-full bg-white text-black flex flex-col items-center overflow-x-hidden">
      <Header />

      <main className="w-full max-w-4xl px-6 py-12 md:py-20 flex flex-col gap-12">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black text-white text-xs font-semibold">
            <Briefcase className="size-3.5" />
            <span>Join Our Team</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900">
            Build the Future of Application Architecture
          </h1>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-xl">
            We are looking for passionate engineers, designers, and innovators
            to redefine how developers build software.
          </p>
        </div>

        {/* Positions List */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-gray-900">Open Roles</h2>
          <div className="flex flex-col gap-3">
            {openPositions.map((pos, idx) => (
              <div
                key={idx}
                className="p-6 border border-gray-200 rounded-2xl bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-gray-300 transition-all"
              >
                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-bold text-gray-900">
                    {pos.title}
                  </h3>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>{pos.location}</span>
                    <span>•</span>
                    <span>{pos.type}</span>
                  </div>
                </div>
                <a
                  href={`mailto:founder@dezign2app.com?subject=Application for ${encodeURIComponent(pos.title)}`}
                  className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-all shrink-0"
                >
                  Apply Now →
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* General Application */}
        <div className="p-8 bg-gray-50 border border-gray-200 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-bold text-gray-900">
              Don&apos;t see your role?
            </h3>
            <p className="text-xs text-gray-600">
              Send your CV and portfolio directly to our founder.
            </p>
          </div>
          <a
            href="mailto:founder@dezign2app.com"
            className="px-5 py-2.5 bg-black text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-all shrink-0"
          >
            Email founder@dezign2app.com
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}

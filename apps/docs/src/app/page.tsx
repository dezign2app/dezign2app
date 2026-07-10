import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-6 px-6 py-24">
      <div className="inline-flex w-fit rounded-full border border-fd-border bg-fd-card px-3 py-1 text-sm text-fd-muted-foreground">
        Docs App
      </div>
      <div className="max-w-2xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Workflow Template documentation, isolated from the main app config.
        </h1>
        <p className="text-lg text-fd-muted-foreground">
          This Fumadocs app lives in <code>apps/docs</code> with its own Next,
          TypeScript, and PostCSS setup so it does not interfere with
          <code> apps/web</code>.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/docs"
          className="inline-flex w-fit items-center justify-center rounded-lg bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
        >
          Open Docs
        </Link>
      </div>
    </main>
  );
}

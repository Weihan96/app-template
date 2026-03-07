import { ArrowRight, Bot, Database, LayoutDashboard, ShieldCheck } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const pillars = [
  {
    title: "AI-ready workflow",
    description: "Enforce linting, testing criteria, and repeatable browser verification from the first commit.",
    icon: Bot
  },
  {
    title: "Typed product stack",
    description: "Next.js App Router, TypeScript, Zod, and React Query keep data flow explicit and observable.",
    icon: ShieldCheck
  },
  {
    title: "Scalable data layer",
    description: "Prisma is wired for Neon Postgres so auth, billing, and messaging integrations can grow cleanly.",
    icon: Database
  }
];

const checklist = [
  "Landing page and dashboard shell with responsive sidebar",
  "shadcn/ui-style primitives ready for extension",
  "Playwright criteria for visual and structural smoke checks",
  "Project skills for icon finding, WeCom, and Telegram integrations"
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,var(--accent),transparent_28%),linear-gradient(180deg,var(--background)_0%,var(--muted)_55%,var(--background)_100%)] text-[var(--foreground)]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-4 lg:grid-cols-[280px_1fr] lg:px-6">
        <AppSidebar />
        <div className="space-y-6">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 lg:hidden">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted-foreground)]">App Template</p>
                <h2 className="mt-2 text-lg font-semibold text-[var(--foreground)]">Landing + sidebar shell</h2>
              </div>
              <Badge>Mobile ready</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-[var(--muted-foreground)]">
              <span className="rounded-full bg-[var(--secondary)] px-3 py-2">Overview</span>
              <span className="rounded-full bg-[var(--secondary)] px-3 py-2">Launchpad</span>
              <span className="rounded-full bg-[var(--secondary)] px-3 py-2">AI Actions</span>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-5">
                <Badge>AI-first SaaS template</Badge>
                <div className="space-y-3">
                  <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-[var(--foreground)] md:text-6xl">
                    Launch products on a stack that already matches your workflow.
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-[var(--muted-foreground)] md:text-lg">
                    Built for Next.js App Router, Tailwind, shadcn/ui patterns, React Query, Zod, Prisma-first data access, and Neon Postgres with testing and AI guardrails included.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button size="lg">
                    Start building
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button size="lg" variant="secondary">
                    Review criteria
                  </Button>
                </div>
              </div>
              <Card className="w-full max-w-md border-[var(--border)] bg-[var(--card)]">
                <CardHeader>
                  <CardDescription>Project baseline</CardDescription>
                  <CardTitle>What ships in this template</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-[var(--muted-foreground)]">
                    {checklist.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-1 size-2 rounded-full bg-[var(--foreground)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {pillars.map(({ title, description, icon: Icon }) => (
              <Card key={title} className="border-[var(--border)] bg-[var(--card)]">
                <CardHeader>
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--foreground)]">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="pt-4">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader>
                <CardDescription>Default app shell</CardDescription>
                <CardTitle>Sidebar-driven workspace</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-5">
                  <LayoutDashboard className="mb-4 size-5 text-[var(--foreground)]" />
                  <h3 className="text-lg font-medium">Landing to product flow</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    Keep marketing, onboarding, and internal tools in one codebase without mixing presentation and product concerns.
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-5">
                  <Database className="mb-4 size-5 text-[var(--foreground)]" />
                  <h3 className="text-lg font-medium">Schema-first backend</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    Start from a Prisma schema and validate inputs with Zod before queries hit your Neon database. If your team prefers Drizzle later, the boundary stays isolated.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader>
                <CardDescription>AI execution contract</CardDescription>
                <CardTitle>Required output checks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-[var(--muted-foreground)]">
                <p>Every generated change should preserve eslint pass status and keep criteria executable.</p>
                <p>Browser checks are defined with Playwright and intended to be replayed via Chrome MCP where available.</p>
                <p>When criteria fail, iterate until they pass or the code stops changing.</p>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}

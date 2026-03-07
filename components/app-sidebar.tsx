import { BookCopy, Bot, DatabaseZap, Home, Rocket, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const primaryNav = [
  { label: "Overview", icon: Home, active: true },
  { label: "Launchpad", icon: Rocket, active: false },
  { label: "Knowledge", icon: BookCopy, active: false },
  { label: "AI Actions", icon: Bot, active: false }
];

const integrations = [
  { label: "Neon + Prisma", icon: DatabaseZap },
  { label: "WeCom", icon: Send },
  { label: "Telegram", icon: Send }
];

export function AppSidebar() {
  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] flex-col rounded-3xl border border-[var(--sidebar-border)] bg-[var(--sidebar)] p-5 lg:flex">
      <div className="rounded-2xl border border-[var(--sidebar-border)] bg-[var(--sidebar-accent)] p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted-foreground)]">App Template</p>
        <h2 className="mt-3 text-xl font-semibold text-[var(--sidebar-foreground)]">Web product starter</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
          Opinionated baseline for shipping landing pages and internal product surfaces in one repo.
        </p>
      </div>

      <nav className="mt-6 space-y-2">
        {primaryNav.map(({ label, icon: Icon, active }) => (
          <button
            key={label}
            type="button"
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition",
              active
                ? "bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)]"
                : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
            )}
          >
            <Icon className="size-4" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-8 rounded-2xl border border-[var(--sidebar-border)] bg-[var(--sidebar-accent)] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Integrations</p>
        <div className="mt-4 space-y-3">
          {integrations.map(({ label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 text-sm text-[var(--sidebar-foreground)]">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--sidebar)]">
                <Icon className="size-4 text-[var(--sidebar-foreground)]" />
              </div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto rounded-2xl border border-[var(--sidebar-border)] bg-[var(--sidebar-accent)] p-4 text-sm text-[var(--muted-foreground)]">
        <p className="font-medium text-[var(--sidebar-foreground)]">Execution rule</p>
        <p className="mt-2 leading-6">
          AI changes must preserve linting and close the criteria loop before they are considered done.
        </p>
      </div>
    </aside>
  );
}

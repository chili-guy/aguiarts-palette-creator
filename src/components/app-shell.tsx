import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Home, LayoutGrid } from "lucide-react";
import { Logo } from "@/components/logo";
import { TOOLS } from "@/lib/tools";
import { cn } from "@/lib/utils";

/**
 * The application chrome: fixed topbar + fixed tool sidebar, with the tool itself
 * filling the remaining area. Modelled on `/app/tool.html` of the production app
 * (see MODELAGEM-UI.md) — same 76px / 220px geometry, same three information
 * slots in the topbar, same pinned plan card at the foot of the sidebar.
 */
export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <AppTopbar title={title} subtitle={subtitle} />
      <AppSidebar />
      <main className="min-h-[calc(100vh-var(--topbar-h))] pt-(--topbar-h) md:pl-(--sidebar-w)">
        {children}
      </main>
    </div>
  );
}

function AppTopbar({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-(--topbar-h) items-center border-b border-border bg-card">
      <Link
        to="/"
        className="hidden h-full shrink-0 items-center border-r border-border px-5 md:flex md:w-(--sidebar-w)"
      >
        <Logo />
      </Link>

      <div className="min-w-0 flex-1 px-5">
        <h1 className="truncate text-lg font-bold tracking-tight">{title}</h1>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3 px-5">
        <button
          type="button"
          className="hidden items-center gap-1 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-semibold sm:flex"
        >
          PT <ChevronDown className="h-3 w-3" />
        </button>
        {/* No accounts and no plans yet: every tool is open and exports are
            unmetered, so the topbar carries no quota or subscription state. */}
        <span className="hidden rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-semibold lg:inline">
          <span className="text-accent">Exports ilimitados</span>
        </span>
      </div>
    </header>
  );
}

function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-(--sidebar-w) flex-col border-r border-border bg-card pt-(--topbar-h) md:flex">
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarLink to="/" icon={Home} label="Início" active={pathname === "/"} />

        <p className="px-3 pt-5 pb-2 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
          Ferramentas
        </p>

        <SidebarLink
          to="/app"
          icon={LayoutGrid}
          label="Todas as ferramentas"
          active={pathname === "/app"}
        />

        {TOOLS.map((tool) =>
          tool.built && tool.to ? (
            <SidebarLink
              key={tool.slug}
              to={tool.to}
              icon={tool.icon}
              label={tool.label}
              active={pathname === tool.to}
            />
          ) : (
            <span
              key={tool.slug}
              title="Ainda não construída"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground/45"
            >
              <tool.icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1">{tool.label}</span>
              <span className="font-mono text-[9px] tracking-wider">EM BREVE</span>
            </span>
          ),
        )}
      </nav>

      <div className="border-t border-border p-3">
        <div className="rounded-xl border border-border bg-secondary p-3">
          <p className="text-sm font-bold">Tudo liberado</p>
          <p className="text-xs text-muted-foreground">
            Todas as ferramentas, sem login e sem limite de exports.
          </p>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({
  to,
  icon: Icon,
  label,
  active,
}: {
  to: string;
  icon: typeof Home;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
        active
          ? "border border-border-strong bg-accent/12 text-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active && "text-accent")} />
      <span className="min-w-0 flex-1">{label}</span>
    </Link>
  );
}

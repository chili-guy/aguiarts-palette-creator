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
        <span className="hidden rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-semibold lg:inline">
          <span className="text-muted-foreground">Exports:</span>{" "}
          <span className="text-accent">0/5</span>{" "}
          <span className="text-muted-foreground">• restam 5</span>
        </span>
        <span className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-2 py-1.5 text-xs font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-primary text-primary-foreground">
            R
          </span>
          <span className="hidden sm:inline">Gratuito</span>
          <ChevronDown className="hidden h-3 w-3 sm:block" />
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
          <p className="text-sm font-bold">Plano atual: Gratuito</p>
          <p className="text-xs text-muted-foreground">Exports: 0/5</p>
          <Link
            to="/"
            hash="planos"
            className="mt-3 block rounded-lg border border-border bg-popover px-3 py-2 text-center text-xs font-semibold transition-colors hover:border-border-strong"
          >
            Gerenciar assinatura
          </Link>
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
          ? "border border-border-strong bg-primary/15 text-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary-glow")} />
      <span className="min-w-0 flex-1">{label}</span>
    </Link>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { TOOLS } from "@/lib/tools";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "Todas as ferramentas | Printzy" }] }),
  component: ToolsDashboard,
});

const BADGE_STYLE: Record<string, string> = {
  NOVO: "bg-accent/15 text-accent border-accent/30",
};

function ToolsDashboard() {
  return (
    <AppShell
      title="Todas as ferramentas"
      subtitle="Acesse direto as ferramentas que fazem parte da sua produção."
    >
      <div className="p-4 md:p-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {TOOLS.map((tool) => {
            const card = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border-strong bg-accent/12">
                    <tool.icon className="h-5 w-5 text-accent" />
                  </span>
                  {tool.badge && (
                    <span
                      className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider ${BADGE_STYLE[tool.badge]}`}
                    >
                      {tool.badge}
                    </span>
                  )}
                </div>
                <h2 className="mt-4 font-bold tracking-tight">{tool.label}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{tool.subtitle}</p>
              </>
            );

            return tool.built && tool.to ? (
              <Link
                key={tool.slug}
                to={tool.to}
                className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-border-strong"
              >
                {card}
              </Link>
            ) : (
              <div
                key={tool.slug}
                className="rounded-2xl border border-dashed border-border bg-card/50 p-5 opacity-60"
              >
                {card}
                <p className="mt-3 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  Em breve
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

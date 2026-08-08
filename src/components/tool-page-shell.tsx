import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

/**
 * Thin wrapper kept so each tool route can stay declarative about its own title.
 * The heading itself lives in the topbar, as it does in the real app — the tool
 * body starts straight at the controls.
 */
export function ToolPageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <AppShell title={title} subtitle={subtitle}>
      <div className="p-4 md:p-5">{children}</div>
    </AppShell>
  );
}

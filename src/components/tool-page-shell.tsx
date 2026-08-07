import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/logo";
import { BackLink } from "@/components/back-link";

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
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/">
            <Logo />
          </Link>
          <Link
            to="/"
            className="rounded-full bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:scale-[1.03]"
          >
            Ver todas as ferramentas
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-5 py-10">
        <BackLink />
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
        </div>
        {children}
      </main>
    </div>
  );
}

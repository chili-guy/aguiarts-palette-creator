import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { ToolPageShell } from "@/components/tool-page-shell";

export const Route = createFileRoute("/ferramentas/mockup")({
  head: () => ({ meta: [{ title: "Mockup Studio | Printzy" }] }),
  component: MockupStudioPage,
});

// Konva touches `window`/canvas at import time, which breaks TanStack Start's
// server render. The dynamic import only ever runs client-side, gated behind
// a post-hydration `mounted` flag so it's never evaluated during SSR.
const MockupEditor = lazy(() => import("@/components/mockup-editor"));

function MockupStudioPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <ToolPageShell
      title="Mockup Studio"
      subtitle="Aprove a arte com o cliente antes de rodar e evite reimpressão por engano."
    >
      {mounted ? (
        <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando editor…</p>}>
          <MockupEditor />
        </Suspense>
      ) : (
        <p className="text-sm text-muted-foreground">Carregando editor…</p>
      )}
    </ToolPageShell>
  );
}

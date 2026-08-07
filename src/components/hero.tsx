import { motion, useReducedMotion } from "framer-motion";
import {
  Wand2,
  Eraser,
  PenTool,
  Shirt,
  Frame,
  FileDown,
  Plus,
  ArrowRight,
} from "lucide-react";
import heroBg from "@/assets/hero-bg-final.jpg.asset.json";


const tools = [
  { icon: Wand2, label: "Halftone" },
  { icon: Eraser, label: "Remover Fundo" },
  { icon: PenTool, label: "Vetorizador" },
  { icon: Shirt, label: "Mockups" },
  { icon: Frame, label: "Molduras" },
  { icon: FileDown, label: "Arquivo DTF" },
];

export function Hero() {
  const reduceMotion = useReducedMotion();

  const transition = {
    duration: reduceMotion ? 0 : 0.7,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: reduceMotion ? 0 : 0.08, delayChildren: 0.05 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition },
  };

  return (
    <section
      className="relative isolate flex w-full items-center justify-center overflow-hidden bg-background px-6 py-20 sm:py-24"
      style={{ backgroundImage: `url(${heroBg.url})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 bg-background/75" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-12 text-center">
        {/* Headline */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={container}
          className="flex max-w-4xl flex-col items-center gap-6"
        >
          <motion.h1
            variants={item}
            className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground md:text-6xl lg:text-7xl"
          >
            O pré-impressão da sua gráfica{" "}
            <span className="text-accent">resolvido em minutos</span>
          </motion.h1>

          <motion.p variants={item} className="max-w-2xl text-lg text-muted-foreground md:text-xl">
            Serviços digitais para gráficas e estamparias: tratamento de arte,
            halftone, vetorização e montagem de folha DTF prontos para a máquina —
            sem fila no setor de arte.
          </motion.p>

          <motion.div variants={item} className="flex flex-col gap-4 pt-2 sm:flex-row">
            <a
              href="#planos"
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-8 py-4 font-display font-bold text-accent-foreground transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Começar grátis
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#ferramentas"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-card/40 px-8 py-4 font-display font-bold text-foreground backdrop-blur-sm transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Ver ferramentas
            </a>
          </motion.div>
        </motion.div>

        {/* Workbench */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition, duration: reduceMotion ? 0 : 0.9, delay: 0.2 }}
          className="group relative w-full max-w-5xl"
        >
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/25 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-accent/15 blur-[120px]" />

          <div className="relative rounded-2xl border border-border bg-card p-4 shadow-elegant md:p-8">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
              {tools.map((t) => (
                <div
                  key={t.label}
                  className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-secondary/40 p-4 transition-colors hover:border-accent/50"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/20 text-primary-glow">
                    <t.icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {t.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Canvas */}
            <div className="relative mt-8 flex h-48 w-full items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-background md:h-64">
              <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_2px_2px,var(--foreground)_1px,transparent_0)] [background-size:24px_24px]" />
              <div className="z-10 flex flex-col items-center gap-4">
                <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-dashed border-accent/40 text-accent transition-colors group-hover:border-accent">
                  <Plus className="h-8 w-8" />
                </span>
                <p className="text-sm text-muted-foreground">
                  Arraste sua estampa aqui para começar
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

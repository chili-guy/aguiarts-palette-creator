import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, ArrowRight, Check, Wand2, Layers, Scissors } from "lucide-react";
import heroSpaceBg from "@/assets/hero-space-bg.jpg";
import heroFilm from "@/assets/hero-film.png";

const proofs = [
  "Sem instalar nada",
  "Arquivos em 300 DPI",
  "Exportação ilimitada no PRO",
];

const chips = [
  { icon: Wand2, label: "Halftone automático" },
  { icon: Scissors, label: "Remove fundo em 1 clique" },
  { icon: Layers, label: "Vetoriza e separa cores" },
];

export function Hero() {
  const reduceMotion = useReducedMotion();

  const baseTransition = {
    duration: reduceMotion ? 0 : 0.7,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: reduceMotion ? 0 : 0.09, delayChildren: 0.05 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 22 },
    visible: { opacity: 1, y: 0, transition: baseTransition },
  };

  return (
    <section className="relative isolate overflow-hidden bg-background">
      {/* Space background */}
      <img
        src={heroSpaceBg}
        alt=""
        aria-hidden="true"
        width={1920}
        height={1080}
        className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover object-right opacity-95"
      />
      {/* Readability scrims */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(100deg,var(--background)_12%,color-mix(in_oklab,var(--background)_72%,transparent)_48%,transparent_85%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-background to-transparent" />
      <div className="pointer-events-none absolute -left-24 top-10 -z-10 h-[30rem] w-[30rem] rounded-full bg-primary/20 blur-[120px] animate-float-slow" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-16 md:grid-cols-[1.05fr_0.95fr] md:pb-28 md:pt-24">
        {/* Copy column */}
        <motion.div initial="hidden" animate="visible" variants={container} className="max-w-xl">
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-glow opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-glow" />
            </span>
            Estúdio online para DTF e DTG
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-6 font-display text-[2.6rem] font-bold leading-[1.03] tracking-tight md:text-[4rem]"
          >
            Prepare estampas{" "}
            <span className="bg-gradient-to-r from-primary-glow via-accent to-primary-glow bg-clip-text text-transparent">
              prontas para imprimir
            </span>{" "}
            em minutos
          </motion.h1>

          <motion.p variants={item} className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Halftone, remoção de fundo, vetorização, mockups e separação de cores
            no navegador. Menos retrabalho na prensa, mais pedidos entregues.
          </motion.p>

          <motion.div variants={item} className="mt-7 flex flex-wrap gap-2">
            {chips.map((c) => (
              <span
                key={c.label}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm"
              >
                <c.icon className="h-3.5 w-3.5 text-primary-glow" />
                {c.label}
              </span>
            ))}
          </motion.div>

          <motion.div variants={item} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#planos"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-8 py-4 font-semibold text-primary-foreground shadow-elegant transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-glow"
            >
              <Sparkles className="h-4 w-4" />
              Começar grátis
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#ferramentas"
              className="inline-flex items-center justify-center rounded-full border border-border bg-card/40 px-8 py-4 font-semibold text-foreground backdrop-blur-sm transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-glow"
            >
              Ver ferramentas
            </a>
          </motion.div>

          <motion.ul
            variants={item}
            className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground"
          >
            {proofs.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-accent" />
                {p}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Visual column — mockup do sistema */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...baseTransition, duration: reduceMotion ? 0 : 0.9, delay: 0.15 }}
          className="relative mx-auto w-full max-w-xl"
        >
          <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-primary/25 blur-[90px]" />

          <motion.div
            {...(reduceMotion ? {} : { animate: { y: [0, -10, 0] } })}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="relative overflow-hidden rounded-2xl border border-border bg-card/90 shadow-elegant backdrop-blur-xl"
          >
            {/* Title bar */}
            <div className="flex items-center gap-3 border-b border-border/70 bg-secondary/40 px-4 py-2.5">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
              </div>
              <span className="truncate text-xs font-medium text-muted-foreground">
                printzy.studio — estampa-astronauta.png
              </span>
              <span className="ml-auto hidden items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-glow sm:inline-flex">
                <Sparkles className="h-3 w-3" /> PRO
              </span>
            </div>

            <div className="flex">
              {/* Toolbar */}
              <div className="hidden flex-col gap-1.5 border-r border-border/70 bg-secondary/20 p-2 sm:flex">
                {[Wand2, Scissors, Layers, Sparkles].map((Icon, i) => (
                  <span
                    key={i}
                    className={`grid h-9 w-9 place-items-center rounded-xl ${
                      i === 0
                        ? "bg-gradient-primary text-primary-foreground shadow-card"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                ))}
              </div>

              {/* Canvas */}
              <div className="relative min-w-0 flex-1 p-4">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border/70 bg-[repeating-conic-gradient(color-mix(in_oklab,var(--foreground)_8%,transparent)_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
                  <img
                    src={heroFilm}
                    alt="Prévia do editor Printzy aplicando halftone em uma estampa de astronauta geométrico"
                    width={1024}
                    height={1024}
                    className="absolute inset-0 h-full w-full object-contain p-3"
                  />
                  {/* Halftone processing overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,color-mix(in_oklab,var(--primary-glow)_55%,transparent)_1px,transparent_1.6px)] bg-[length:7px_7px] opacity-40 mix-blend-screen" />
                  {/* Scan line */}
                  <motion.div
                    {...(reduceMotion ? {} : { animate: { y: ["-10%", "110%"] } })}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-x-0 top-0 h-16 bg-[linear-gradient(to_bottom,transparent,color-mix(in_oklab,var(--primary-glow)_35%,transparent),transparent)]"
                  />
                  {/* Selection frame */}
                  <div className="pointer-events-none absolute inset-4 rounded-lg border border-dashed border-primary-glow/45" />
                  <span className="absolute left-4 top-4 rounded-md bg-background/75 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-glow backdrop-blur">
                    Halftone • 45 LPI
                  </span>
                </div>

                {/* Sliders / controls */}
                <div className="mt-3 grid gap-2.5">
                  {[
                    { label: "Frequência", value: 72 },
                    { label: "Ângulo", value: 45 },
                    { label: "Contraste", value: 88 },
                  ].map((s, i) => (
                    <div key={s.label} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {s.label}
                      </span>
                      <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                        <motion.span
                          initial={{ width: 0 }}
                          animate={{ width: `${s.value}%` }}
                          transition={{ duration: reduceMotion ? 0 : 1.1, delay: 0.5 + i * 0.12, ease: "easeOut" }}
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-primary"
                        />
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Layers panel */}
              <div className="hidden w-32 flex-col gap-2 border-l border-border/70 bg-secondary/20 p-3 lg:flex">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Camadas
                </span>
                {["Halftone", "Traço", "Fundo removido"].map((l, i) => (
                  <span
                    key={l}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] ${
                      i === 0 ? "bg-primary/15 text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <span className="h-2 w-2 shrink-0 rounded-sm bg-primary-glow/70" />
                    <span className="truncate">{l}</span>
                  </span>
                ))}
                <div className="mt-auto rounded-lg bg-gradient-primary px-2 py-2 text-center text-[10px] font-bold text-primary-foreground">
                  Exportar
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating status cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...baseTransition, delay: 0.55 }}
            className="absolute -left-3 top-24 z-20 rounded-2xl border border-border bg-card/90 px-4 py-3 shadow-card backdrop-blur-md md:-left-8"
          >
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Processado em
            </div>
            <div className="mt-0.5 font-display text-lg font-bold">2,4s</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...baseTransition, delay: 0.7 }}
            className="absolute -right-3 -bottom-5 z-20 rounded-2xl border border-border bg-card/90 px-4 py-3 shadow-card backdrop-blur-md md:-right-6"
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium">Arquivo pronto</span>
            </div>
            <div className="mt-1.5 flex gap-1.5">
              {["PNG", "SVG", "PDF"].map((f) => (
                <span
                  key={f}
                  className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-foreground"
                >
                  {f}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, ArrowRight, Check, Wand2, Layers, Scissors } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import heroShirt from "@/assets/hero-shirt.png";

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
      {/* Background image */}
      <img
        src={heroBg}
        alt=""
        aria-hidden="true"
        width={1920}
        height={1088}
        className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover object-right opacity-90"
      />
      {/* Readability scrims */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(100deg,var(--background)_10%,color-mix(in_oklab,var(--background)_70%,transparent)_45%,transparent_80%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-background to-transparent" />
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

        {/* Visual column */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...baseTransition, duration: reduceMotion ? 0 : 0.9, delay: 0.15 }}
          className="relative mx-auto w-full max-w-md"
        >
          <motion.div
            {...(reduceMotion ? {} : { animate: { y: [0, -12, 0] } })}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <div className="absolute inset-6 -z-10 rounded-full bg-primary/30 blur-[90px]" />
            <img
              src={heroShirt}
              alt="Camiseta preta com estampa DTF de astronauta geométrico em tons de roxo e dourado"
              width={1024}
              height={1024}
              className="w-full drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
            />
          </motion.div>

          {/* Floating stat cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...baseTransition, delay: 0.5 }}
            className="absolute -left-2 top-6 rounded-2xl border border-border bg-card/85 px-4 py-3 shadow-card backdrop-blur-md md:-left-8"
          >
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Halftone
            </div>
            <div className="mt-0.5 font-display text-lg font-bold">45 LPI • 22°</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...baseTransition, delay: 0.65 }}
            className="absolute -right-2 bottom-8 rounded-2xl border border-border bg-card/85 px-4 py-3 shadow-card backdrop-blur-md md:-right-6"
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

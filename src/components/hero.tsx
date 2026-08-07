import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, Zap, Clock, MousePointer2 } from "lucide-react";

const tools = [
  { icon: "⠿", name: "Halftone", color: "bg-primary/20 text-primary-glow" },
  { icon: "◒", name: "Fundo", color: "bg-accent/20 text-accent" },
  { icon: "◇", name: "Vetor", color: "bg-primary/20 text-primary-glow" },
  { icon: "▣", name: "Mockup", color: "bg-accent/20 text-accent" },
  { icon: "⌗", name: "Molduras", color: "bg-primary/20 text-primary-glow" },
  { icon: "◎", name: "Spot", color: "bg-accent/20 text-accent" },
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
      transition: { staggerChildren: reduceMotion ? 0 : 0.1, delayChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: baseTransition },
  };

  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      {/* Animated ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-0 h-[32rem] w-[32rem] rounded-full bg-primary/20 blur-[100px] animate-float-slow" />
        <div className="absolute right-10 top-20 h-[24rem] w-[24rem] rounded-full bg-primary-glow/15 blur-[80px] animate-float-medium" />
        <div className="absolute bottom-0 left-1/3 h-[20rem] w-[20rem] rounded-full bg-accent/10 blur-[80px] animate-float-slow" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2 md:items-center md:py-28">
        {/* Copy column */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={container}
          className="max-w-xl"
        >
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs font-semibold tracking-widest text-muted-foreground backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-glow opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-glow" />
            </span>
            PLATAFORMA ONLINE PARA DTF E DTG
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl"
          >
            Produza mais{" "}
            <span className="bg-gradient-to-r from-primary-glow to-accent bg-clip-text text-transparent">
              estampas
            </span>{" "}
            em menos tempo
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 text-lg text-muted-foreground"
          >
            Halftone, vetorização, remoção de fundo, mockups e preparação de
            arquivos — tudo em um só lugar, sem instalar nada.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-8 flex flex-wrap gap-3"
          >
            <a
              href="#planos"
              className="group relative overflow-hidden rounded-full bg-gradient-primary px-7 py-3 font-semibold text-primary-foreground shadow-elegant transition-transform hover:scale-[1.03]"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Criar conta grátis
              </span>
              <span className="absolute inset-0 -z-0 translate-y-full bg-gradient-to-t from-white/20 to-transparent transition-transform duration-500 group-hover:translate-y-0" />
            </a>
            <a
              href="#ferramentas"
              className="rounded-full border border-border px-7 py-3 font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              Conhecer as ferramentas
            </a>
          </motion.div>

          <motion.div
            variants={item}
            className="mt-8 flex flex-wrap items-center gap-5 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-accent">★★★★★</span>
              <span className="font-semibold text-foreground">4,9/5</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary-glow" />
              <span>5.000+ artes processadas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary-glow" />
              <span>Pronto em minutos</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, x: 40, rotateY: 8 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{
            ...baseTransition,
            duration: reduceMotion ? 0 : 0.9,
            delay: 0.2,
          }}
          className="perspective-1000"
        >
          <motion.div
            {...(reduceMotion ? {} : { whileHover: { y: -6, rotateX: 2, rotateY: -2 } })}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
            className="relative rounded-3xl border border-border bg-card/80 p-6 shadow-card backdrop-blur-md"
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary font-display text-sm font-bold text-primary-foreground">
                  P
                </div>
                <span className="font-display text-sm font-semibold">Printzy Studio</span>
              </div>
              <span className="text-xs text-muted-foreground">Painel • Ferramentas • Projetos</span>
            </div>

            {/* Tool grid */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              {tools.map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    ...baseTransition,
                    delay: 0.4 + i * 0.06,
                  }}
                  {...(reduceMotion ? {} : { whileHover: { scale: 1.03, y: -2 } })}
                  className={`group flex cursor-default items-center gap-3 rounded-xl ${t.color} p-3 transition-colors`}
                >
                  <span className="text-xl">{t.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{t.name}</div>
                    <div className="text-[10px] text-muted-foreground">Clique para usar</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Preview card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...baseTransition, delay: 0.8 }}
              className="mt-5 rounded-xl border border-dashed border-border bg-secondary/50 p-4"
            >
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <MousePointer2 className="h-4 w-4 text-primary-glow" />
                  Projeto pronto para exportar
                </span>
                <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-medium">300 DPI</span>
              </div>
              <div className="mt-3 flex gap-2">
                {["PNG", "SVG", "PDF"].map((fmt) => (
                  <span
                    key={fmt}
                    className="rounded-md bg-card px-2 py-1 text-xs font-medium text-foreground"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Floating status badge */}
            <motion.div
              {...(reduceMotion ? {} : { animate: { y: [0, -6, 0] } })}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-3 -top-3 rounded-2xl border border-border bg-card px-3 py-2 shadow-card"
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium">Online</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

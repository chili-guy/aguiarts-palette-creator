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

        {/* Visual column */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...baseTransition, duration: reduceMotion ? 0 : 0.9, delay: 0.15 }}
          className="relative mx-auto w-full max-w-md"
        >
          {/* Solar system decoration */}
          <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center" aria-hidden="true">
            <svg viewBox="0 0 400 400" className="h-[140%] w-[140%] opacity-80">
              <defs>
                <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="hsl(var(--primary-glow))" stopOpacity="0.9" />
                  <stop offset="45%" stopColor="hsl(var(--accent))" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="planet1" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#581c87" />
                </radialGradient>
                <radialGradient id="planet2" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#3730a3" />
                </radialGradient>
                <radialGradient id="planet3" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#f0abfc" />
                  <stop offset="100%" stopColor="#7e22ce" />
                </radialGradient>
              </defs>

              {/* Orbits */}
              <circle cx="200" cy="200" r="90" fill="none" stroke="hsl(var(--primary-glow))" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="200" cy="200" r="140" fill="none" stroke="hsl(var(--accent))" strokeOpacity="0.12" strokeWidth="1" />
              <ellipse cx="200" cy="200" rx="170" ry="120" fill="none" stroke="hsl(var(--primary-glow))" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="8 6" />

              {/* Sun behind film */}
              <circle cx="200" cy="200" r="55" fill="url(#sunGlow)" className="animate-pulse" />
              <circle cx="200" cy="200" r="18" fill="hsl(var(--primary-glow))" opacity="0.9" />

              {/* Planet 1 */}
              <motion.g
                {...(reduceMotion ? {} : { animate: { rotate: 360 } })}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "200px 200px" }}
              >
                <circle cx="290" cy="200" r="10" fill="url(#planet1)" />
                <circle cx="290" cy="200" r="14" fill="none" stroke="#c084fc" strokeOpacity="0.25" strokeWidth="1" />
              </motion.g>

              {/* Planet 2 */}
              <motion.g
                {...(reduceMotion ? {} : { animate: { rotate: -360 } })}
                transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "200px 200px" }}
              >
                <circle cx="200" cy="340" r="14" fill="url(#planet2)" />
                <ellipse cx="200" cy="340" rx="22" ry="6" fill="none" stroke="#a78bfa" strokeOpacity="0.3" strokeWidth="1.5" />
              </motion.g>

              {/* Planet 3 */}
              <motion.g
                {...(reduceMotion ? {} : { animate: { rotate: 360 } })}
                transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "200px 200px" }}
              >
                <circle cx="65" cy="200" r="8" fill="url(#planet3)" />
              </motion.g>

              {/* Stars */}
              {[...Array(12)].map((_, i) => (
                <circle
                  key={i}
                  cx={40 + (i * 31) % 320}
                  cy={30 + (i * 47) % 340}
                  r={1.2 + (i % 2) * 0.8}
                  fill="white"
                  opacity={0.4 + (i % 3) * 0.2}
                  className="animate-pulse"
                  style={{ animationDelay: `${i * 0.3}s`, animationDuration: `${2 + (i % 3)}s` }}
                />
              ))}
            </svg>
          </div>

          <motion.div
            {...(reduceMotion ? {} : { animate: { y: [0, -12, 0] } })}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <div className="absolute inset-6 -z-10 rounded-full bg-primary/30 blur-[90px]" />
            <img
              src={heroFilm}
              alt="Filme de transfer DTF transparente com estampa geométrica de astronauta em roxo e dourado"
              width={1024}
              height={1024}
              className="relative z-10 w-full drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
            />
          </motion.div>

          {/* Floating stat cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...baseTransition, delay: 0.5 }}
            className="absolute -left-2 top-6 z-20 rounded-2xl border border-border bg-card/85 px-4 py-3 shadow-card backdrop-blur-md md:-left-8"
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
            className="absolute -right-2 bottom-8 z-20 rounded-2xl border border-border bg-card/85 px-4 py-3 shadow-card backdrop-blur-md md:-right-6"
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

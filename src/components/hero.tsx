import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Eraser, Grid3x3, PenTool } from "lucide-react";
import { Link } from "@tanstack/react-router";

const quickTools = [
  { icon: Grid3x3, label: "Halftone", href: "/ferramentas/halftone" },
  { icon: Eraser, label: "Remover fundo", href: "/ferramentas/remover-fundo" },
  { icon: PenTool, label: "Vetorizar", href: "/ferramentas/vetorizar" },
] as const;

const heroSlides = [
  { n: "01", lines: ["Do arquivo bruto", "ao papel pronto", "pra prensa"] },
  { n: "02", lines: ["Ajuste fino em", "cada ferramenta", "do seu fluxo"] },
  { n: "03", lines: ["Exporte pronto", "pra prensa, sem", "retrabalho"] },
] as const;

function HeroSlideColumn() {
  const [index, setIndex] = useState(0);
  const slide = heroSlides[index]!;

  function go(next: number) {
    setIndex(((next % heroSlides.length) + heroSlides.length) % heroSlides.length);
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.35}
        onDragEnd={(_, info) => {
          if (info.offset.x < -40) go(index + 1);
          else if (info.offset.x > 40) go(index - 1);
        }}
        className="cursor-grab overflow-hidden active:cursor-grabbing"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={slide.n}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-base leading-snug text-primary-foreground/70"
          >
            {slide.lines[0]}
            <br /> {slide.lines[1]}
            <br /> {slide.lines[2]}
          </motion.p>
        </AnimatePresence>
      </motion.div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          {heroSlides.map((s, i) => (
            <button
              key={s.n}
              type="button"
              aria-label={`Ver etapa ${s.n}`}
              onClick={() => go(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index
                  ? "w-4 bg-accent"
                  : "w-1.5 bg-primary-foreground/25 hover:bg-primary-foreground/40"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between font-mono text-[11px] tracking-wide text-primary-foreground/45">
          <span>FLUXO COMPLETO</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Etapa anterior"
              onClick={() => go(index - 1)}
              className="transition-colors hover:text-primary-foreground/80"
            >
              <ChevronLeft className="size-3" />
            </button>
            <span>{slide.n}</span>
            <button
              type="button"
              aria-label="Próxima etapa"
              onClick={() => go(index + 1)}
              className="transition-colors hover:text-primary-foreground/80"
            >
              <ChevronRight className="size-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mux-hosted HLS stream, not a plain mp4 — Safari can play .m3u8 natively,
// every other browser needs hls.js to demux it into something <video> understands.
const HERO_VIDEO_URL = "https://stream.mux.com/kimF2ha9zLrX64H00UgLGPflCzNtl1T0215MlAmeOztv8.m3u8";

function HeroBackgroundVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    // Prefer hls.js wherever MediaSource is actually usable — some Chromium
    // builds report canPlayType('application/vnd.apple.mpegurl') as playable
    // even though native playback silently fails. Native src is the fallback
    // for browsers (real Safari) that lack MediaSource HLS support entirely.
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => hls.destroy();
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    }

    return undefined;
  }, [src]);

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
    />
  );
}

export function Hero() {
  const reduceMotion = useReducedMotion();

  const fadeUp = (delay: number): Variants => ({
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0 : 0.8,
        delay: reduceMotion ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  });

  return (
    <section className="px-3 pt-3 md:px-4 md:pt-4">
      <div className="relative isolate flex min-h-[560px] w-full flex-col overflow-hidden rounded-2xl bg-primary md:min-h-[80vh]">
        {/* Immersive backdrop: looping video, tinted back to the brand purple
            so it reads as Printzy, not as raw stock footage. Skipped for
            reduced-motion users. */}
        {!reduceMotion && <HeroBackgroundVideo src={HERO_VIDEO_URL} />}
        <div className="absolute inset-0 bg-primary/60" />
        <div className="animate-pulse-glow pointer-events-none absolute -top-32 -right-32 size-[32rem] rounded-full bg-accent/30 blur-[110px]" />
        <div className="animate-float-slow pointer-events-none absolute -bottom-40 -left-24 size-[26rem] rounded-full bg-primary-glow/60 blur-[110px]" />

        {/* Center */}
        <div className="relative z-10 flex flex-1 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp(0.35)}
            className="absolute top-1/2 left-10 hidden w-48 -translate-y-1/2 lg:block"
          >
            <HeroSlideColumn />
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp(0.45)}
            className="relative mx-auto px-6 text-center font-display text-4xl leading-[1.05] font-bold tracking-tight text-primary-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          >
            O pré-impressão
            <br /> da sua gráfica
            <br />
            <span className="text-accent">resolvido em minutos</span>
          </motion.h1>
        </div>

        {/* Bottom row */}
        <div className="relative z-10 grid grid-cols-1 items-end gap-8 px-6 pb-10 md:grid-cols-3 md:gap-6 md:px-10 md:pb-12">
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp(0.6)}
            className="max-w-[280px] text-center text-sm leading-relaxed text-primary-foreground/60 md:mr-auto md:text-left"
          >
            Serviços digitais para gráficas e estamparias: tratamento de arte, halftone, vetorização
            e montagem de folha DTF prontos pra máquina.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp(0.7)}
            className="flex flex-col items-center gap-4"
          >
            <span className="font-display text-lg font-medium text-primary-foreground">
              Comece agora
            </span>
            <a
              href="#planos"
              className="clip-cut group inline-flex w-full max-w-[280px] items-center justify-center gap-2 bg-accent py-3.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Criar conta grátis
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </a>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp(0.8)}
            className="flex items-center justify-center gap-3 md:justify-end"
          >
            {quickTools.map((t) => (
              <Link
                key={t.label}
                to={t.href}
                title={t.label}
                aria-label={t.label}
                className="clip-cut-sm grid size-11 place-items-center bg-primary-foreground/10 text-primary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <t.icon className="size-4" />
              </Link>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

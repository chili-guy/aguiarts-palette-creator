import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

/**
 * The building blocks every tool screen in the real app is assembled from
 * (see MODELAGEM-UI.md § "Padrões visuais recorrentes"): a scrolling column of
 * numbered control groups beside a preview stage that carries its own header,
 * checkerboard body and status bar.
 *
 * The production app ships three arrangements — controls left (most tools),
 * controls right (Vetorizador), and three columns (Mockup Studio) — so
 * `ToolLayout` takes the side as a prop rather than hardcoding one.
 */
export function ToolLayout({
  controls,
  children,
  controlsSide = "left",
}: {
  controls: ReactNode;
  children: ReactNode;
  controlsSide?: "left" | "right";
}) {
  const panel = (
    <div className="max-h-[calc(100vh-var(--topbar-h)-2.5rem)] space-y-5 overflow-y-auto rounded-2xl border border-border bg-card p-4">
      {controls}
    </div>
  );

  return (
    <div
      className={cn(
        "grid gap-4",
        controlsSide === "left"
          ? "lg:grid-cols-[300px_minmax(0,1fr)]"
          : "lg:grid-cols-[minmax(0,1fr)_320px]",
      )}
    >
      {controlsSide === "left" && panel}
      {children}
      {controlsSide === "right" && panel}
    </div>
  );
}

/** A labelled block of controls, optionally carrying the step badge. */
export function ControlGroup({
  step,
  label,
  children,
}: {
  step?: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <h2 className="flex items-center gap-2">
        {step && (
          <span className="grid h-5 w-5 place-items-center rounded-md bg-primary/25 font-mono text-[10px] font-bold text-primary-glow">
            {step}
          </span>
        )}
        <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-primary-glow uppercase">
          {label}
        </span>
      </h2>
      {children}
    </section>
  );
}

/** Helper copy under a control group. Always opens with a bolded "Dica:". */
export function Hint({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">
      <span className="font-semibold text-primary-glow">Dica:</span> {children}
    </p>
  );
}

/**
 * The pill row the real app uses instead of free sliders wherever the useful
 * values are a known set (paper sizes, DPI, dot size).
 */
export function OptionPills<T extends string | number>({
  options,
  value,
  onChange,
  columns = 3,
}: {
  options: { value: T; label: string; note?: string }[];
  value: T;
  onChange: (value: T) => void;
  columns?: 1 | 2 | 3;
}) {
  return (
    <div
      className={cn(
        "grid gap-2",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3",
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors",
              active
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border bg-secondary text-foreground hover:border-border-strong",
            )}
          >
            <span className={cn(columns === 1 && option.note && "flex items-baseline gap-2")}>
              {option.label}
              {option.note && (
                <span
                  className={cn(
                    "text-[11px] font-normal",
                    active ? "text-primary-foreground/75" : "text-muted-foreground",
                  )}
                >
                  {option.note}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Slider with its value shown to the right of the label, in the accent colour. */
export function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="font-mono text-xs font-bold text-primary-glow tabular-nums">
          {value}
          {suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(Array.isArray(v) ? (v[0] ?? min) : v)}
      />
    </div>
  );
}

/**
 * The preview stage: header row with title and actions, a checkerboard body the
 * artwork floats in, and a status bar pinned to the bottom.
 */
export function PreviewStage({
  title,
  caption,
  actions,
  status,
  hint,
  children,
}: {
  title: string;
  caption: string;
  actions?: ReactNode;
  status: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col overflow-hidden rounded-2xl border border-border bg-card lg:max-h-[calc(100vh-var(--topbar-h)-2.5rem)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="font-bold tracking-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">{caption}</p>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      <div className="flex flex-1 items-center justify-center overflow-auto bg-background-2 p-6">
        {children}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-xs">
        <span className="text-muted-foreground">{status}</span>
        {hint && <span className="text-muted-foreground/70">{hint}</span>}
      </div>
    </div>
  );
}

/** Empty state inside the stage — a checkerboard card, as in the real preview. */
export function PreviewPlaceholder({ label = "Carregue uma imagem" }: { label?: string }) {
  return (
    <div className="relative grid min-h-56 w-full max-w-sm place-items-center rounded-xl bg-checkerboard">
      <span className="absolute top-3 left-3 rounded-md bg-background/85 px-2 py-1 font-mono text-[10px] font-bold tracking-wider">
        Depois / resultado
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="absolute right-3 bottom-3 rounded-md bg-primary/25 px-2 py-1 font-mono text-[10px] font-bold text-primary-glow">
        100%
      </span>
    </div>
  );
}

/** The lime primary action — upload, export, download. One per screen. */
export function PrimaryAction({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}

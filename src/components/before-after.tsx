import { useCallback, useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";

type Props = {
  before: string;
  after: string;
  beforeAlt: string;
  afterAlt: string;
  checkered?: boolean;
};

export function BeforeAfter({ before, after, beforeAlt, afterAlt, checkered }: Props) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const move = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, next)));
  }, []);

  return (
    <div
      ref={ref}
      className="group relative aspect-square w-full select-none overflow-hidden rounded-xl border border-border bg-secondary"
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && move(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      {/* After (base) */}
      <div
        className={
          checkered
            ? "absolute inset-0 bg-[repeating-conic-gradient(color-mix(in_oklab,var(--foreground)_10%,transparent)_0%_25%,transparent_0%_50%)] bg-[length:20px_20px]"
            : "absolute inset-0"
        }
      >
        <img
          src={after}
          alt={afterAlt}
          loading="lazy"
          width={800}
          height={800}
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>

      {/* Before (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img
          src={before}
          alt={beforeAlt}
          loading="lazy"
          width={800}
          height={800}
          className="h-full w-full object-cover"
          style={{ width: ref.current?.clientWidth ?? "100%", maxWidth: "none" }}
          draggable={false}
        />
      </div>

      {/* Labels */}
      <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-background/80 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground backdrop-blur">
        Antes
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-md bg-primary/85 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground backdrop-blur">
        Depois
      </span>

      {/* Handle */}
      <div
        className="pointer-events-none absolute inset-y-0 w-px bg-primary-glow"
        style={{ left: `${pos}%` }}
      >
        <span className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-primary-glow/60 bg-card/90 text-primary-glow shadow-card backdrop-blur">
          <MoveHorizontal className="h-4 w-4" />
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Comparar antes e depois"
        className="absolute inset-x-0 bottom-0 z-10 w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}

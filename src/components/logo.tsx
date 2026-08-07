export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-md bg-accent font-display text-lg font-bold text-accent-foreground shadow-card">
        P
      </div>
      <span className="font-display text-xl tracking-tight">
        <span className="font-bold text-foreground">PRINT</span>
        <span className="font-medium text-muted-foreground">ZY</span>
      </span>
    </div>
  );
}

export const CollapsedLogo = ({ size = 40 }: { size?: number }) => (
  <div
    className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_4px_14px_-4px_rgba(204,0,0,0.40)] ring-2 ring-primary/30"
    style={{ width: size, height: size }}
  >
    <img
      src="/Heirs.png"
      alt="Heirs Holdings"
      className="object-contain"
      style={{ width: size * 0.8, height: size * 0.8 }}
      draggable={false}
    />
  </div>
);

export const Logo = ({ collapsed = false }: { collapsed?: boolean }) => {
  if (collapsed) {
    return (
      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_4px_14px_-4px_rgba(204,0,0,0.30)] ring-1 ring-primary/20">
        <img
          src="/Heirs.png"
          alt="Heirs Holdings"
          className="h-8 w-8 object-contain"
          draggable={false}
        />
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-3">
      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_6px_18px_-4px_rgba(204,0,0,0.35)] ring-2 ring-primary/30">
        <img
          src="/Heirs.png"
          alt="Heirs Holdings"
          className="h-9 w-9 object-contain"
          draggable={false}
        />
      </div>
      <div>
        <p className="text-sm font-bold tracking-tight text-primary">
          Heirs Quanta
        </p>
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-dark-gray/45">
          Analytics Platform
        </p>
      </div>
    </div>
  );
};

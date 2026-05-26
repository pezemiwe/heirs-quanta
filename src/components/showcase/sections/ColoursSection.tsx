import { S } from "../helpers";

const COLOURS: [string, string][] = [
  ["#CC0000", "Primary"],
  ["#B30000", "Mid Red"],
  ["#800000", "Deep Red"],
  ["#5C0000", "Dark Red"],
  ["#FFF5F5", "Pale Red"],
  ["#FFFFFF", "Surface"],
  ["#FAFAFA", "Surface Muted"],
  ["#E2E2E2", "Border"],
  ["#0f766e", "Success"],
  ["#b91c1c", "Danger"],
  ["#1A1A1A", "Dark Gray"],
];

export function ColoursSection() {
  return (
    <S label="Colours">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {COLOURS.map(([hex, name]) => (
          <div key={hex} className="flex flex-col gap-1.5">
            <div
              className="h-12 rounded-lg border border-border shadow-sm"
              style={{ backgroundColor: hex }}
            />
            <p className="text-[11px] font-semibold text-dark-gray/80">
              {name}
            </p>
            <p className="font-mono text-[10px] text-dark-gray/40">{hex}</p>
          </div>
        ))}
      </div>
    </S>
  );
}

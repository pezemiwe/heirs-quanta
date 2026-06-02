export function initials(name: string) {
  return name
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

export function fmtSize(size: number, currency: "NGN" | "USD") {
  const sym = currency === "NGN" ? "₦" : "$";
  return `${sym}${size.toFixed(1)}B`;
}

/**
 * Generates Heirs Quanta Solution Overview PDF from the HTML brochure.
 * Run: npm run brochure:pdf
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const htmlPath = join(root, "public", "brochure", "Heirs-Quanta-Solution-Overview.html");
const pdfPath = join(root, "public", "brochure", "Heirs-Quanta-Solution-Overview.pdf");

if (!existsSync(htmlPath)) {
  console.error("Brochure HTML not found:", htmlPath);
  process.exit(1);
}

const fileUrl = `file:///${htmlPath.replace(/\\/g, "/")}`;

const chromePaths = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

const chrome = chromePaths.find((p) => existsSync(p));

if (!chrome) {
  console.error(
    "Chrome or Edge not found. Open the HTML brochure and use Print → Save as PDF:\n",
    htmlPath,
  );
  process.exit(1);
}

console.log("Generating PDF via", chrome);
console.log("Source:", htmlPath);
console.log("Output:", pdfPath);

const args = [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  `--print-to-pdf=${pdfPath}`,
  "--no-pdf-header-footer",
  fileUrl,
];

const proc = spawn(chrome, args, { stdio: "inherit" });

proc.on("close", (code) => {
  if (code === 0 && existsSync(pdfPath)) {
    console.log("\nPDF created successfully:");
    console.log(pdfPath);
  } else {
    console.error("\nPDF generation failed (exit code", code, ")");
    console.error("Fallback: open the HTML file and use Print → Save as PDF");
    process.exit(code ?? 1);
  }
});

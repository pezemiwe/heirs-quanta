const fs = require('fs');
let code = fs.readFileSync('src/features/accounting/pages/monthly-schedule.tsx', 'utf8');

if (!code.includes('import { Modal }')) {
  code = code.replace(
    'import { PageHeader } from "../../../components/shared/page-header";',
    'import { PageHeader } from "../../../components/shared/page-header";\nimport { Modal } from "../../../components/shared/modal";'
  );
}

if (!code.includes('const columnFormulas')) {
  const formulasStr = `
const columnFormulas: Record<string, string> = {
  "Interest Amount": "Calculated based on Face Value, Coupon Rate, and Tenor",
  "Maturity value": "Purchase Price / Principal + Total Expected Interest",
  "This month Interest": "Opening Amortised Cost × (Effective Interest Rate / 12)",
  "WHT (10%)": "This month Interest × 10%",
  "This month Interest (Net)": "This month Interest - WHT",
  "Opening Amortised Cost": "Prior month's Closing Amortised Cost",
  "Opening Accrued Income": "Prior month's Closing Accrued Interest",
  "Closing Amortised Cost": "Opening Amortised Cost + This month Interest (Net) - Coupons Received",
  "Accrued Days": "Days elapsed since the last coupon payment date",
  "Interest Accrued to Valuation Date": "Total interest accrued up to the reporting date",
  "Net/Gross": "Indicates whether the yield/coupon is computed on a net or gross basis",
  "INTEREST RECEIVABLE": "Face Value - Purchase Price (for discount instruments) or accrued coupon",
  "EFFECTIVE INTEREST RATE": "Internal rate of return equating initial outflow to future cash flows",
  "INTEREST INCOME FOR THE MONTH": "Opening Amortised Cost × (Effective Interest Rate / 12)",
  "CLOSING ACCRUED INTEREST": "Opening Accrued Interest + Interest Income - Coupons Received",
  "CURRENT MARKET YIELD": "Market-provided yield rate for the valuation date",
  "CURRENT MARKET PRICE": "Derived from the current market yield and remaining tenor",
  "CURRENT MARKET VALUE": "Closing Amortised Cost × Current Market Price / 100",
  "CURRENT MTM GAIN/(LOSS)": "Current Market Value - Closing Amortised Cost",
  "MONTHLY MTM TO POST": "Current MTM Gain/(Loss) - Prior Month MTM Gain/(Loss)",
  "INTEREST RECEIVABLE ($)": "Total accrued interest in FCY",
  "THIS MONTH INTEREST INCOME ($)": "Opening Amortised Cost (FCY) × (EIR / 12)",
  "ACCRUED INTEREST ($)": "Opening Accrued Interest (FCY) + This month Interest (FCY) - Coupons Received (FCY)",
  "ACCRUED INTEREST (NGN)": "Accrued Interest ($) × Current Exchange Rate",
  "CLOSING AMORTISED COST ($)": "Opening Amortised Cost (FCY) + This month Interest (FCY) - Coupons Received (FCY)",
  "THIS MONTH EXCHANGE GAIN/(LOSS) - NGN": "Change in NGN value due to FX rate movement on the accrued interest",
  "TO POST EXCHANGE GAIN (NAIRA)": "Total Unrealised Exchange Gain/Loss - This Month Exchange Gain/Loss",
  "TOTAL UNREALISED EXCHANGE GAIN/(LOSS) - NGN": "(Current FX - Purchase FX) × Closing Amortised Cost ($)",
  "TOTAL CURRENT MARKET VALUE INCLUSIVE OF FX (NGN)": "Closing Amortised Cost ($) × Current Exchange Rate",
  "PRICE ON PURCHASE": "(Purchase Price / Face Value) × 100"
};
`;
  code = code.replace(
    'const placementsNgnCols: ColDef[] = [',
    formulasStr + '\nconst placementsNgnCols: ColDef[] = ['
  );
}

if (!code.includes('selectedFormula')) {
  code = code.replace(
    'export function MonthlySchedule() {\n  const v = useValuation();',
    'export function MonthlySchedule() {\n  const v = useValuation();\n  const [selectedFormula, setSelectedFormula] = useState<{header: string, formula: string} | null>(null);'
  );
}

const newTd = `                      <td 
                        key={cIdx} 
                        className={\`px-4 py-3 text-sm align-top whitespace-nowrap \${c.isGrey ? 'bg-gray-50/50 border-l border-gray-200' : 'text-gray-900'} \${c.isGrey && columnFormulas[c.header] ? 'cursor-pointer hover:bg-gray-200 transition-colors' : ''}\`}
                        onClick={() => {
                          if (c.isGrey && columnFormulas[c.header]) {
                            setSelectedFormula({ header: c.header, formula: columnFormulas[c.header] });
                          }
                        }}
                      >
                        {c.render(val.instrument, val, rIdx)}
                      </td>`;

code = code.replace(/<td\s*key={cIdx}\s*className={`px-4 py-3 text-sm align-top whitespace-nowrap \${c\.isGrey \? 'bg-gray-50\/50 border-l border-gray-200' : 'text-gray-900'}`}\s*>\s*{c\.render\(val\.instrument, val, rIdx\)}\s*<\/td>/g, newTd);

const modalStr = `
      <Modal isOpen={!!selectedFormula} onClose={() => setSelectedFormula(null)} title={\`Formula: \${selectedFormula?.header}\`}>
        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-800 font-mono text-center">
          {selectedFormula?.formula}
        </div>
      </Modal>
`;

if (!code.includes('<Modal isOpen={!!selectedFormula}')) {
  code = code.replace(
    /<\/div>\s*<\/div>\s*<\/div>\s*\);\s*}\s*$/g,
    modalStr + '      </div>\n    </div>\n    </div>\n  );\n}\n'
  );
}

fs.writeFileSync('src/features/accounting/pages/monthly-schedule.tsx', code);

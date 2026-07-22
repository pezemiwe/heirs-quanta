const fs = require('fs');
let code = fs.readFileSync('src/features/deals/engine/workbook-parser.ts', 'utf8');

// --- Placements USD ---
code = code.replace(
  /const c_accruedInterestClosing = optCol\(\["closingaccruedinterest", "closingamortisedcost", "accruedinterestclosing", "closingaccruedinterestassetleg", "accruedinterest"\]\);/,
  `const c_accruedInterestClosing = optCol(["closingaccruedinterest", "closingamortisedcost", "accruedinterestclosing", "closingaccruedinterestassetleg", "accruedinterest"]);
  const c_accruedDays = optCol(["accrueddays"]);
  const c_interestAccruedToValuationDate = optCol(["interestaccruedtovaluationdate"]);
  const c_netGross = optCol(["netgross", "interestbasis", "whtbasis"]);`
);

// Inject into USD placement variables:
code = code.replace(
  /const openingFxRate = parseNum\(r\[cOpeningFxRate\]\);/,
  `const openingFxRate = parseNum(r[cOpeningFxRate]);
    const placementInterestBasis = str(c_netGross >= 0 ? r[c_netGross] : "").toLowerCase() === "gross" ? "Gross" : "Net";`
);

// Inject into USD placement manual values:
code = code.replace(
  /if \(c_interestReceivable >= 0\) {/,
  `if (c_accruedDays >= 0) {
      const raw = String(r[c_accruedDays] ?? "").trim();
      if (raw !== "" && raw !== "-") uploadedManualValues["accruedDays"] = parseNum(raw);
    }
    if (c_interestAccruedToValuationDate >= 0) {
      const raw = String(r[c_interestAccruedToValuationDate] ?? "").trim();
      if (raw !== "" && raw !== "-") uploadedManualValues["interestAccruedToValuationDate"] = parseNum(raw);
    }
    if (c_interestReceivable >= 0) {`
);

// Inject into USD placement instruments.push:
code = code.replace(
  /couponFrequency: "Zero",\s*status: "Active",/,
  `couponFrequency: "Zero",\n        status: "Active",\n        netGrossFlag: placementInterestBasis,`
);


// --- Placements NGN ---
code = code.replace(
  /const c_netGross = optCol\(\\["netgross", "interestbasis", "whtbasis"\\]\);/,
  `const c_netGross = optCol(["netgross", "interestbasis", "whtbasis"]);
    const c_accruedDays = optCol(["accrueddays"]);
    const c_interestAccruedToValuationDate = optCol(["interestaccruedtovaluationdate"]);`
);

code = code.replace(
  /const uploadedManualValues: Partial<Record<import\('\.\.\/\.\.\/valuation\/engine\/types'\)\.ManualValueKey, number>> = \{\};/,
  `const uploadedManualValues: Partial<Record<import('../../valuation/engine/types').ManualValueKey, number>> = {};
    if (c_accruedDays >= 0) {
      const raw = String(r[c_accruedDays] ?? "").trim();
      if (raw !== "" && raw !== "-") uploadedManualValues["accruedDays"] = parseNum(raw);
    }
    if (c_interestAccruedToValuationDate >= 0) {
      const raw = String(r[c_interestAccruedToValuationDate] ?? "").trim();
      if (raw !== "" && raw !== "-") uploadedManualValues["interestAccruedToValuationDate"] = parseNum(raw);
    }`
);

// NGN placement already has placementInterestBasis, inject netGrossFlag:
code = code.replace(
  /couponFrequency: "Zero",\s*status: "Active",/,
  `couponFrequency: "Zero",\n        status: "Active",\n        netGrossFlag: placementInterestBasis,`
);

// --- Bonds (FGN, Corp, State) ---
// Note: We need a global replace for these since they might be similar in structure. Or target them individually.
const bondParsers = ["parseFgnBonds", "parseCorporateBonds", "parseStateBonds"];

for (const parser of bondParsers) {
  // Add column parsing
  const colRegex = new RegExp(\`const c_accruedInterestClosing = optCol\\\\(\\\\["closingaccruedinterest", "closingamortisedcost", "accruedinterestclosing", "closingaccruedinterestassetleg", "accruedinterest"\\\\]\\\\);\`, "g");
  code = code.replace(colRegex, \`const c_accruedInterestClosing = optCol(["closingaccruedinterest", "closingamortisedcost", "accruedinterestclosing", "closingaccruedinterestassetleg", "accruedinterest"]);
    const c_numberOfCouponsReceived = optCol(["numberofcouponsreceived", "couponsreceived"]);\`);
    
  // Add to uploadedManualValues
  const valRegex = new RegExp(\`if \\\\(c_interestReceivable >= 0\\\\) \\{\`, "g");
  code = code.replace(valRegex, \`if (c_numberOfCouponsReceived >= 0) {
      const raw = String(r[c_numberOfCouponsReceived] ?? "").trim();
      if (raw !== "" && raw !== "-") uploadedManualValues["numberOfCouponsReceived"] = parseNum(raw);
    }
    if (c_interestReceivable >= 0) {\`);
    
  // Add to instrument push
  const pushRegex = new RegExp(\`couponFrequency: .*\n\\s*status: "Active",\`, "g");
  code = code.replace(pushRegex, (match) => \`\${match}\n        numberOfCouponsReceived: uploadedManualValues["numberOfCouponsReceived"],\`);
}

fs.writeFileSync('src/features/deals/engine/workbook-parser.ts', code);

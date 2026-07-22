const fs = require('fs');
let code = fs.readFileSync('src/features/deals/engine/workbook-parser.ts', 'utf8');

// Patch parsePlacementsNGN
const target1 = `const c_netGross = optCol(["netgross", "interestbasis", "whtbasis"]);`;
const repl1 = `const c_netGross = optCol(["netgross", "interestbasis", "whtbasis"]);
    const c_accruedDays = optCol(["accrueddays"]);
    const c_interestAccruedToValuationDate = optCol(["interestaccruedtovaluationdate"]);`;
code = code.replace(target1, repl1);

const target2 = `const uploadedManualValues: Partial<Record<import('../../valuation/engine/types').ManualValueKey, number>> = {};
      if (c_interestReceivable >= 0) {`;
const repl2 = `const uploadedManualValues: Partial<Record<import('../../valuation/engine/types').ManualValueKey, number>> = {};
      if (c_accruedDays >= 0) {
        const raw = String(r[c_accruedDays] ?? "").trim();
        if (raw !== "" && raw !== "-") uploadedManualValues["accruedDays"] = parseNum(raw);
      }
      if (c_interestAccruedToValuationDate >= 0) {
        const raw = String(r[c_interestAccruedToValuationDate] ?? "").trim();
        if (raw !== "" && raw !== "-") uploadedManualValues["interestAccruedToValuationDate"] = parseNum(raw);
      }
      if (c_interestReceivable >= 0) {`;
code = code.replace(target2, repl2); // Note: replace() only replaces the first instance, which is what we want because parsePlacementsNGN comes first in the file or we can be specific

// Wait, target2 exists in multiple places. Let's make sure it hits the right ones.
// I will just use string replace repeatedly. Since it replaces the first occurrence, I'll need to be careful.

// Actually, writing a custom function to inject code is safer:
function inject(str, search, injection, after = true) {
  const index = str.indexOf(search);
  if (index === -1) return str;
  const pos = after ? index + search.length : index;
  return str.slice(0, pos) + injection + str.slice(pos);
}

// Just to be safe, I'll re-read and use standard JS replacement for all occurrences that need it.
let codeParts = code.split('function parse');
for (let i = 1; i < codeParts.length; i++) {
  if (codeParts[i].startsWith('PlacementsNGN')) {
    codeParts[i] = codeParts[i].replace(target2, repl2);
    codeParts[i] = codeParts[i].replace(
      `couponFrequency: "Zero",\n        status: "Active",`,
      `couponFrequency: "Zero",\n        status: "Active",\n        netGrossFlag: placementInterestBasis,`
    );
  } else if (codeParts[i].startsWith('FgnBonds') || codeParts[i].startsWith('CorporateBonds') || codeParts[i].startsWith('StateBonds')) {
    codeParts[i] = codeParts[i].replace(
      `const c_accruedInterestClosing = optCol(["closingaccruedinterest", "closingamortisedcost", "accruedinterestclosing", "closingaccruedinterestassetleg", "accruedinterest"]);`,
      `const c_accruedInterestClosing = optCol(["closingaccruedinterest", "closingamortisedcost", "accruedinterestclosing", "closingaccruedinterestassetleg", "accruedinterest"]);\n    const c_numberOfCouponsReceived = optCol(["numberofcouponsreceived", "couponsreceived"]);`
    );
    codeParts[i] = codeParts[i].replace(
      `const uploadedManualValues: Partial<Record<import('../../valuation/engine/types').ManualValueKey, number>> = {};\n      if (c_interestReceivable >= 0) {`,
      `const uploadedManualValues: Partial<Record<import('../../valuation/engine/types').ManualValueKey, number>> = {};\n      if (c_numberOfCouponsReceived >= 0) {\n        const raw = String(r[c_numberOfCouponsReceived] ?? "").trim();\n        if (raw !== "" && raw !== "-") uploadedManualValues["numberOfCouponsReceived"] = parseNum(raw);\n      }\n      if (c_interestReceivable >= 0) {`
    );
    codeParts[i] = codeParts[i].replace(
      `couponFrequency,\n        status: "Active",`,
      `couponFrequency,\n        status: "Active",\n        numberOfCouponsReceived: uploadedManualValues["numberOfCouponsReceived"],`
    );
  }
}

code = codeParts[0] + 'function parse' + codeParts.slice(1).join('function parse');
fs.writeFileSync('src/features/deals/engine/workbook-parser.ts', code);
console.log("Patched parser successfully.");

const fs = require('fs');
let code = fs.readFileSync('src/features/deals/engine/workbook-parser.ts', 'utf8');

let codeParts = code.split('function parse');

for (let i = 1; i < codeParts.length; i++) {
  if (codeParts[i].startsWith('PlacementsUSD')) {
    if (!codeParts[i].includes('accruedDays')) {
      codeParts[i] = codeParts[i].replace(
        /const c_interestReceivable = optCol\(\["interestreceivableusd"\]\);/,
        `const c_netGross = optCol(["netgross", "interestbasis", "whtbasis"]);
  const c_accruedDays = optCol(["accrueddays"]);
  const c_interestAccruedToValuationDate = optCol(["interestaccruedtovaluationdate"]);
  const c_interestReceivable = optCol(["interestreceivableusd"]);`
      );
      codeParts[i] = codeParts[i].replace(
        /const portfolioBook = str\(r\[cPortfolio\]\) \|\| "USD Placement Book";/,
        `const portfolioBook = str(r[cPortfolio]) || "USD Placement Book";
    const placementInterestBasis = str(c_netGross >= 0 ? r[c_netGross] : "").toLowerCase() === "gross" ? "Gross" : "Net";`
      );
      codeParts[i] = codeParts[i].replace(
        /if \(c_interestReceivable >= 0\) \{/,
        `if (c_accruedDays >= 0) {
      const raw = String(r[c_accruedDays] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["accruedDays"] = parseNum(raw);
      }
    }
    if (c_interestAccruedToValuationDate >= 0) {
      const raw = String(r[c_interestAccruedToValuationDate] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["interestAccruedToValuationDate"] = parseNum(raw);
      }
    }
    if (c_interestReceivable >= 0) {`
      );
    }
    if (!codeParts[i].includes('netGrossFlag: placementInterestBasis')) {
      codeParts[i] = codeParts[i].replace(
        /couponFrequency: "Zero",\n\s*status: "Active",/,
        `couponFrequency: "Zero",\n      status: "Active",\n      netGrossFlag: placementInterestBasis,`
      );
    }
  } else if (codeParts[i].startsWith('PlacementsNGN')) {
    if (!codeParts[i].includes('accruedDays')) {
      codeParts[i] = codeParts[i].replace(
        /const c_netGross = optCol\(\["netgross", "interestbasis", "whtbasis"\]\);/,
        `const c_netGross = optCol(["netgross", "interestbasis", "whtbasis"]);
    const c_accruedDays = optCol(["accrueddays"]);
    const c_interestAccruedToValuationDate = optCol(["interestaccruedtovaluationdate"]);`
      );
      codeParts[i] = codeParts[i].replace(
        /if \(c_interestReceivable >= 0\) \{/,
        `if (c_accruedDays >= 0) {
        const raw = String(r[c_accruedDays] ?? "").trim();
        if (raw !== "" && raw !== "-") {
          uploadedManualValues["accruedDays"] = parseNum(raw);
        }
      }
      if (c_interestAccruedToValuationDate >= 0) {
        const raw = String(r[c_interestAccruedToValuationDate] ?? "").trim();
        if (raw !== "" && raw !== "-") {
          uploadedManualValues["interestAccruedToValuationDate"] = parseNum(raw);
        }
      }
      if (c_interestReceivable >= 0) {`
      );
    }
    if (!codeParts[i].includes('netGrossFlag: placementInterestBasis')) {
      codeParts[i] = codeParts[i].replace(
        /couponFrequency: "Zero",\n\s*status: "Active",/,
        `couponFrequency: "Zero",\n        status: "Active",\n        netGrossFlag: placementInterestBasis,`
      );
    }
  } else if (codeParts[i].startsWith('FgnBonds') || codeParts[i].startsWith('CorporateBonds') || codeParts[i].startsWith('StateBonds')) {
    if (!codeParts[i].includes('c_numberOfCouponsReceived')) {
      codeParts[i] = codeParts[i].replace(
        /const c_accruedInterestClosing = optCol\(\["closingaccruedinterest", "closingamortisedcost", "accruedinterestclosing", "closingaccruedinterestassetleg", "accruedinterest"\]\);/,
        `const c_accruedInterestClosing = optCol(["closingaccruedinterest", "closingamortisedcost", "accruedinterestclosing", "closingaccruedinterestassetleg", "accruedinterest"]);
    const c_numberOfCouponsReceived = optCol(["numberofcouponsreceived", "couponsreceived"]);`
      );
    }
    if (!codeParts[i].includes('numberOfCouponsReceived"] =')) {
      codeParts[i] = codeParts[i].replace(
        /if \(c_interestReceivable >= 0\) \{/,
        `if (c_numberOfCouponsReceived >= 0) {
        const raw = String(r[c_numberOfCouponsReceived] ?? "").trim();
        if (raw !== "" && raw !== "-") {
          uploadedManualValues["numberOfCouponsReceived"] = parseNum(raw);
        }
      }
      if (c_interestReceivable >= 0) {`
      );
    }
    if (!codeParts[i].includes('numberOfCouponsReceived: uploadedManualValues')) {
      codeParts[i] = codeParts[i].replace(
        /couponFrequency(,|: ".*",)\n\s*status: "Active",/,
        (match) => `${match}\n        numberOfCouponsReceived: uploadedManualValues["numberOfCouponsReceived"],`
      );
    }
  }
}

code = codeParts[0] + 'function parse' + codeParts.slice(1).join('function parse');
fs.writeFileSync('src/features/deals/engine/workbook-parser.ts', code);
console.log("update.js applied successfully.");

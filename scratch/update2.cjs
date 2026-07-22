const fs = require('fs');
let code = fs.readFileSync('src/features/deals/engine/workbook-parser.ts', 'utf8');
let codeParts = code.split('function parse');

for (let i = 1; i < codeParts.length; i++) {
  if (codeParts[i].startsWith('PlacementsUSD')) {
    codeParts[i] = codeParts[i].replace(
      /const c_interestReceivable = optCol\(\["interestreceivableusd"\]\);/,
      `const c_netGross = optCol(["netgross", "interestbasis", "whtbasis"]);\n  const c_accruedDays = optCol(["accrueddays"]);\n  const c_interestAccruedToValuationDate = optCol(["interestaccruedtovaluationdate"]);\n  const c_interestReceivable = optCol(["interestreceivableusd"]);`
    );
    codeParts[i] = codeParts[i].replace(
      /const portfolioBook = str\(r\[cPortfolio\]\) \|\| "USD Placement Book";/,
      `const portfolioBook = str(r[cPortfolio]) || "USD Placement Book";\n    const placementInterestBasis = str(c_netGross >= 0 ? r[c_netGross] : "").toLowerCase() === "gross" ? "Gross" : "Net";`
    );
    codeParts[i] = codeParts[i].replace(
      /if \(c_interestReceivable >= 0\) \{/,
      `if (c_accruedDays >= 0) {\n      const raw = String(r[c_accruedDays] ?? "").trim();\n      if (raw !== "" && raw !== "-") uploadedManualValues["accruedDays"] = parseNum(raw);\n    }\n    if (c_interestAccruedToValuationDate >= 0) {\n      const raw = String(r[c_interestAccruedToValuationDate] ?? "").trim();\n      if (raw !== "" && raw !== "-") uploadedManualValues["interestAccruedToValuationDate"] = parseNum(raw);\n    }\n    if (c_interestReceivable >= 0) {`
    );
    codeParts[i] = codeParts[i].replace(
      /couponFrequency: "Zero",\n\s*status: "Active",/,
      `couponFrequency: "Zero",\n      status: "Active",\n      netGrossFlag: placementInterestBasis,`
    );
  } else if (codeParts[i].startsWith('PlacementsNGN')) {
    codeParts[i] = codeParts[i].replace(
      /const c_accruedInterestClosing = optCol\(\["closingaccruedinterest", "closingamortisedcost", "accruedinterestclosing", "closingaccruedinterestassetleg", "accruedinterest"\]\);/,
      `const c_accruedInterestClosing = optCol(["closingaccruedinterest", "closingamortisedcost", "accruedinterestclosing", "closingaccruedinterestassetleg", "accruedinterest"]);\n    const c_netGross = optCol(["netgross", "interestbasis", "whtbasis"]);\n    const c_accruedDays = optCol(["accrueddays"]);\n    const c_interestAccruedToValuationDate = optCol(["interestaccruedtovaluationdate"]);`
    );
    codeParts[i] = codeParts[i].replace(
      /const portfolioBook = "Placements <90 Days";/,
      `const portfolioBook = "Placements <90 Days";\n      const placementInterestBasis = str(c_netGross >= 0 ? r[c_netGross] : "").toLowerCase() === "gross" ? "Gross" : "Net";`
    );
    codeParts[i] = codeParts[i].replace(
      /if \(c_interestReceivable >= 0\) \{/,
      `if (c_accruedDays >= 0) {\n        const raw = String(r[c_accruedDays] ?? "").trim();\n        if (raw !== "" && raw !== "-") uploadedManualValues["accruedDays"] = parseNum(raw);\n      }\n      if (c_interestAccruedToValuationDate >= 0) {\n        const raw = String(r[c_interestAccruedToValuationDate] ?? "").trim();\n        if (raw !== "" && raw !== "-") uploadedManualValues["interestAccruedToValuationDate"] = parseNum(raw);\n      }\n      if (c_interestReceivable >= 0) {`
    );
    codeParts[i] = codeParts[i].replace(
      /const grossInterest = principal \* couponRate \* \(tenorDays \/ 365\);\n\s*const netInterest = grossInterest \* 0.9; \/\/ 10% WHT deducted/,
      `const grossInterest = principal * couponRate * (tenorDays / 365);\n      const netInterest = placementInterestBasis === "Gross" ? grossInterest : grossInterest * 0.9;`
    );
    codeParts[i] = codeParts[i].replace(
      /couponFrequency: "Zero",\n\s*status: "Active",/,
      `couponFrequency: "Zero",\n        status: "Active",\n        netGrossFlag: placementInterestBasis,`
    );
  } else if (codeParts[i].startsWith('FgnBonds') || codeParts[i].startsWith('CorporateBonds') || codeParts[i].startsWith('StateBonds')) {
    codeParts[i] = codeParts[i].replace(
      /const c_accruedInterestClosing = optCol\(\["closingaccruedinterest", "closingamortisedcost", "accruedinterestclosing", "closingaccruedinterestassetleg", "accruedinterest"\]\);/,
      `const c_accruedInterestClosing = optCol(["closingaccruedinterest", "closingamortisedcost", "accruedinterestclosing", "closingaccruedinterestassetleg", "accruedinterest"]);\n    const c_numberOfCouponsReceived = optCol(["numberofcouponsreceived", "couponsreceived"]);`
    );
    codeParts[i] = codeParts[i].replace(
      /if \(c_interestReceivable >= 0\) \{/,
      `if (c_numberOfCouponsReceived >= 0) {\n        const raw = String(r[c_numberOfCouponsReceived] ?? "").trim();\n        if (raw !== "" && raw !== "-") uploadedManualValues["numberOfCouponsReceived"] = parseNum(raw);\n      }\n      if (c_interestReceivable >= 0) {`
    );
    // Replace the return object instantiation (where status: "Active" usually is)
    codeParts[i] = codeParts[i].replace(
      /couponFrequency(,|: ".*",)\n\s*status: "Active",/,
      (match) => `${match}\n      numberOfCouponsReceived: uploadedManualValues["numberOfCouponsReceived"],`
    );
  }
}

code = codeParts[0] + 'function parse' + codeParts.slice(1).join('function parse');
fs.writeFileSync('src/features/deals/engine/workbook-parser.ts', code);
console.log("update2.js applied");

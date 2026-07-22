const fs = require('fs');
let code = fs.readFileSync('src/features/deals/engine/workbook-parser.ts', 'utf8');

let codeParts = code.split('function parse');

for (let i = 1; i < codeParts.length; i++) {
  if (codeParts[i].startsWith('QuotedEquity')) {
    codeParts[i] = codeParts[i].replace(
      /purchasePrice: costPriceUnit \* quantity,/,
      `purchasePrice: costPriceUnit * quantity,\n        quantity,\n        costPriceUnit,`
    );
  } else if (codeParts[i].startsWith('FgnBonds')) {
    codeParts[i] = codeParts[i].replace(
      /const cCostPriceClean = col\("COST PRICE\/CLEAN", \["costpriceclean"\], 15\);/,
      `const cCostPriceClean = col("COST PRICE/CLEAN", ["costpriceclean"], 15);\n  const cCost = col("COST", ["cost"], 16);\n  const cDirtyPriceAtPurchase = col("DIRTY PRICE", ["dirtyprice", "dirtypriceatpurchase"], 14);\n  const cUnits = col("UNITS", ["units", "unitsholding"], 11);\n  const cYieldAtPurchase = col("YIELD AT PURCHASE", ["yieldatpurchase"], 10);\n  const cCostAtPar = col("COST AT PAR", ["costatpar", "facevalue"], 12);`
    );
    codeParts[i] = codeParts[i].replace(
      /const purchasePrice = parseNum\(r\[cConsiderationFmdq\]\) \|\| parseNum\(r\[cConsideration\]\) \|\| parseNum\(r\[cCostPriceClean\]\);/,
      `const purchasePrice = parseNum(r[cConsiderationFmdq]) || parseNum(r[cConsideration]) || parseNum(r[cCostPriceClean]);\n    const cost = parseNum(r[cCost]);\n    const dirtyPriceAtPurchase = parseNum(r[cDirtyPriceAtPurchase]);\n    const quantity = parseNum(r[cUnits]);\n    const yieldAtPurchase = parseRate(r[cYieldAtPurchase]);\n    const costAtPar = parseNum(r[cCostAtPar]);`
    );
    codeParts[i] = codeParts[i].replace(
      /purchasePrice: purchasePrice \|\| faceValue,/,
      `purchasePrice: purchasePrice || faceValue,\n      quantity,\n      dirtyPriceAtPurchase,`
    );
    codeParts[i] = codeParts[i].replace(
      /const uploadedManualValues: Partial<Record<import\('\.\.\/\.\.\/valuation\/engine\/types'\)\.ManualValueKey, number>> = \{\};/,
      `const uploadedManualValues: Partial<Record<import('../../valuation/engine/types').ManualValueKey, number>> = {};\n    uploadedManualValues["cost"] = cost;\n    uploadedManualValues["yieldAtPurchase"] = yieldAtPurchase;\n    uploadedManualValues["costAtPar"] = costAtPar;\n    uploadedManualValues["considerationAtPurchase"] = parseNum(r[cConsideration]);\n    uploadedManualValues["costPriceClean"] = parseNum(r[cCostPriceClean]);`
    );
  } else if (codeParts[i].startsWith('StateBonds')) {
    codeParts[i] = codeParts[i].replace(
      /const cCost = col\("COST", \["cost"\], 14\);/,
      `const cCost = col("COST", ["cost"], 14);\n  const cCostPriceClean = col("COST PRICE/CLEAN PRICE", ["costpricecleanprice", "costpriceclean"], 13);\n  const cDirtyPriceAtPurchase = col("DIRTY PRICE", ["dirtyprice"], 12);\n  const cUnits = col("UNITS HOLDING", ["unitsholding", "units"], 9);\n  const cYieldAtPurchase = col("YIELD AT PURCHASE", ["yieldatpurchase"], 8);\n  const cCostAtPar = col("COST AT PAR", ["costatpar"], 10);`
    );
    codeParts[i] = codeParts[i].replace(
      /const purchasePrice = parseNum\(r\[cConsideration\]\) \|\| parseNum\(r\[cCost\]\);/,
      `const purchasePrice = parseNum(r[cConsideration]) || parseNum(r[cCost]);\n    const cost = parseNum(r[cCost]);\n    const dirtyPriceAtPurchase = parseNum(r[cDirtyPriceAtPurchase]);\n    const quantity = parseNum(r[cUnits]);\n    const yieldAtPurchase = parseRate(r[cYieldAtPurchase]);\n    const costAtPar = parseNum(r[cCostAtPar]);`
    );
    codeParts[i] = codeParts[i].replace(
      /purchasePrice: purchasePrice \|\| faceValue,/,
      `purchasePrice: purchasePrice || faceValue,\n      quantity,\n      dirtyPriceAtPurchase,`
    );
    codeParts[i] = codeParts[i].replace(
      /const uploadedManualValues: Partial<Record<import\('\.\.\/\.\.\/valuation\/engine\/types'\)\.ManualValueKey, number>> = \{\};/,
      `const uploadedManualValues: Partial<Record<import('../../valuation/engine/types').ManualValueKey, number>> = {};\n    uploadedManualValues["cost"] = cost;\n    uploadedManualValues["yieldAtPurchase"] = yieldAtPurchase;\n    uploadedManualValues["costAtPar"] = costAtPar;\n    uploadedManualValues["considerationAtPurchase"] = parseNum(r[cConsideration]);\n    uploadedManualValues["costPriceClean"] = parseNum(r[cCostPriceClean]);`
    );
  } else if (codeParts[i].startsWith('CorporateBonds')) {
    codeParts[i] = codeParts[i].replace(
      /const cCost = col\("COST", \["cost"\], 14\);/,
      `const cCost = col("COST", ["cost"], 14);\n  const cCostPriceClean = col("COST PRICE/CLEAN PRICE", ["costpricecleanprice", "costpriceclean"], 13);\n  const cDirtyPriceAtPurchase = col("DIRTY PRICE", ["dirtyprice"], 12);\n  const cUnits = col("UNITS HOLDING", ["unitsholding", "units"], 9);\n  const cYieldAtPurchase = col("YIELD AT PURCHASE", ["yieldatpurchase"], 8);\n  const cCostAtPar = col("COST AT PAR", ["costatpar"], 10);`
    );
    codeParts[i] = codeParts[i].replace(
      /const purchasePrice = parseNum\(r\[cConsideration\]\) \|\| parseNum\(r\[cCost\]\);/,
      `const purchasePrice = parseNum(r[cConsideration]) || parseNum(r[cCost]);\n    const cost = parseNum(r[cCost]);\n    const dirtyPriceAtPurchase = parseNum(r[cDirtyPriceAtPurchase]);\n    const quantity = parseNum(r[cUnits]);\n    const yieldAtPurchase = parseRate(r[cYieldAtPurchase]);\n    const costAtPar = parseNum(r[cCostAtPar]);`
    );
    codeParts[i] = codeParts[i].replace(
      /purchasePrice: purchasePrice \|\| faceValue,/,
      `purchasePrice: purchasePrice || faceValue,\n      quantity,\n      dirtyPriceAtPurchase,`
    );
    codeParts[i] = codeParts[i].replace(
      /const uploadedManualValues: Partial<Record<import\('\.\.\/\.\.\/valuation\/engine\/types'\)\.ManualValueKey, number>> = \{\};/,
      `const uploadedManualValues: Partial<Record<import('../../valuation/engine/types').ManualValueKey, number>> = {};\n    uploadedManualValues["cost"] = cost;\n    uploadedManualValues["yieldAtPurchase"] = yieldAtPurchase;\n    uploadedManualValues["costAtPar"] = costAtPar;\n    uploadedManualValues["considerationAtPurchase"] = parseNum(r[cConsideration]);\n    uploadedManualValues["costPriceClean"] = parseNum(r[cCostPriceClean]);`
    );
  }
}
code = codeParts[0] + 'function parse' + codeParts.slice(1).join('function parse');
fs.writeFileSync('src/features/deals/engine/workbook-parser.ts', code);
console.log("patch-parser.js applied");

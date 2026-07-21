const fs = require('fs');

const path = 'src/features/deals/engine/workbook-parser.ts';
let code = fs.readFileSync(path, 'utf8');

// Placements NGN
code = code.replace(/col\("RATE", \["rate"\], 4\)/g, 'col("RATE", ["rate", "interestrate", "yield", "coupon", "couponrate", "effectiveinterestrate"], 4)');
// Placements USD
code = code.replace(/col\("RATE", \["rate"\], 9\)/g, 'col("RATE", ["rate", "interestrate", "yield", "coupon", "couponrate", "effectiveinterestrate"], 9)');

// T-Bills
code = code.replace(/col\("RATE", \["rate", "discountrate"\], 5\)/g, 'col("RATE", ["rate", "discountrate", "interestrate", "yield", "discount"], 5)');

// Grey columns general aliases
const replacements = [
  [/\["interestreceivable"\]/g, '["interestreceivable", "interestreceivableusd", "interestreceivablengn", "accruedinterest"]'],
  [/\["effectiveinterestrate"\]/g, '["effectiveinterestrate", "eir", "yield", "interestrate"]'],
  [/\["thismonthinterest"\]/g, '["thismonthinterest", "thismonthinterestincome", "interestincomeforthemonth", "interestincomeforthemonthincomeleg"]'],
  [/\["wht10", "wht"\]/g, '["wht10", "wht", "chargeswht", "whttax", "tax"]'],
  [/\["netincome"\]/g, '["netincome", "netinterestincome"]'],
  [/\["closingaccruedinterest", "closingamortisedcost"\]/g, '["closingaccruedinterest", "closingamortisedcost", "accruedinterestclosing", "closingaccruedinterestassetleg", "accruedinterest"]'],
  [/\["couponreceivedtodategross"\]/g, '["couponreceivedtodategross", "totalcouponreceivedtodategross", "totalcoupongross"]'],
  [/\["couponreceivedtodatenet"\]/g, '["couponreceivedtodatenet", "totalcouponreceivedtodatenet", "totalcouponnet"]'],
  [/\["lastmonthaccruedinterest"\]/g, '["lastmonthaccruedinterest", "accruedinterestlastmonth"]'],
  [/\["daysearnedinthemonth"\]/g, '["daysearnedinthemonth", "daysearnedinmonth", "daysinmonth"]'],
  [/\["totalaccruedinterest"\]/g, '["totalaccruedinterest", "accruedinterest", "closingaccruedinterest"]'],
  [/\["lastmonthmarketvalueclean"\]/g, '["lastmonthmarketvalueclean", "lastmonthmarketvalue"]'],
  [/\["lastmonthmarketyield"\]/g, '["lastmonthmarketyield", "lastmonthyield"]'],
  [/\["lastmonthmarketprice"\]/g, '["lastmonthmarketprice", "lastmonthprice"]'],
  [/\["currentmarketyield"\]/g, '["currentmarketyield", "currentyield"]'],
  [/\["currentmarketprice"\]/g, '["currentmarketprice", "currentprice"]'],
  [/\["actualcurrentmarketvalueclean"\]/g, '["actualcurrentmarketvalueclean", "currentmarketvalueclean", "actualmarketvalueclean"]'],
  [/\["totalcurrentmarketvalue"\]/g, '["totalcurrentmarketvalue", "currentmarketvalue", "totalmarketvalue"]'],
  [/\["currentmarktomarketgainloss"\]/g, '["currentmarktomarketgainloss", "mtmgainloss", "currentmtmgainloss"]'],
  [/\["marktomarkettopostthismonth"\]/g, '["marktomarkettopostthismonth", "mtmtopost", "monthlymtmtopost"]'],
];

replacements.forEach(([pattern, repl]) => {
  code = code.replace(pattern, repl);
});

fs.writeFileSync(path, code);

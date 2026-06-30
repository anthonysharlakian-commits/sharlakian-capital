/**
 * Standalone underwriter preview for mock qualified deals (no Supabase / no TS).
 */
const CRITERIA = {
  maxPrice: 530_000,
  maxCashNeeded: 40_000,
  fhaDownPct: 0.035,
  closingCostPct: 0.025,
  reserves: 8_000,
  fhaRateAnnual: 0.068,
  loanTermYears: 30,
  insuranceMonthly: 150,
};
const VACANCY = 0.05;
const MAINT_PCT = 0.01;

function monthlyPayment(principal, annualRate, years) {
  if (principal <= 0) return 0;
  const r = annualRate / 12;
  const n = years * 12;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function taxRate(market) {
  return market === "SCV" ? 0.0125 : 0.011;
}

function analyze(deal) {
  const price = deal.price;
  const baseRent = deal.monthlyRent;
  const down = price * CRITERIA.fhaDownPct;
  const loan = price - down;
  const tax = (price * taxRate(deal.market)) / 12;
  const ins = CRITERIA.insuranceMonthly;
  const hoa = deal.hoa ?? 0;
  const pitiBase =
    monthlyPayment(loan, CRITERIA.fhaRateAnnual, CRITERIA.loanTermYears) +
    tax +
    ins +
    hoa;
  const pitiPlus50 =
    monthlyPayment(loan, CRITERIA.fhaRateAnnual + 0.005, CRITERIA.loanTermYears) +
    tax +
    ins +
    hoa;

  function cf(rent, piti) {
    const eff = rent * (1 - VACANCY);
    const maint = (price * MAINT_PCT) / 12;
    return eff - maint - piti;
  }

  const rent10Pass = cf(baseRent * 0.9, pitiBase) >= 0;
  const rate50Pass = cf(baseRent, pitiPlus50) >= 0;
  const combinedPass = cf(baseRent * 0.9, pitiPlus50) >= 0;

  let rec = "NO-GO";
  if (combinedPass) rec = "GO";
  else if (rent10Pass || rate50Pass) rec = "CAUTION";

  const cashNeeded =
    down + price * CRITERIA.closingCostPct + CRITERIA.reserves;
  const coverage = pitiBase > 0 ? baseRent / pitiBase : 0;
  const flags = [];
  flags.push("Low confidence in rent estimates");
  if (hoa > 0) flags.push("HOA fees present");
  if (coverage < 0.9) flags.push(`Coverage ${(coverage * 100).toFixed(0)}%`);
  if (cashNeeded >= 38_000) flags.push("Cash near $40K limit");
  if (price >= 520_000) flags.push("Price near $530K max");

  const reason =
    rec === "GO"
      ? "Passes combined rent -10% and rate +0.5% stress"
      : rec === "CAUTION"
        ? `Passes ${rent10Pass ? "rent -10%" : ""}${rent10Pass && rate50Pass ? " and " : ""}${rate50Pass ? "rate +0.5%" : ""} individually`
        : "Fails both rent -10% and rate +0.5% stress tests";

  return { rec, flags, combined: cf(baseRent * 0.9, pitiPlus50), reason, rent10Pass, rate50Pass };
}

/** Rent totals from mock pipeline research (adu + room). */
const MOCK_QUALIFIED = [
  { address: "24512 Main St, Newhall", price: 520_000, monthlyRent: 3800, hoa: 0, market: "SCV" },
  { address: "27101 Sand Canyon Rd, Canyon Country", price: 510_000, monthlyRent: 3763, hoa: 150, market: "SCV" },
  { address: "15420 Sierra Lakes Pkwy, Fontana", price: 420_000, monthlyRent: 3413, hoa: 0, market: "IE" },
  { address: "1847 N Linden Ave, Rialto", price: 395_000, monthlyRent: 3000, hoa: 0, market: "IE" },
  { address: "15222 Summit Ave, Fontana", price: 380_000, monthlyRent: 3075, hoa: 0, market: "IE" },
];

console.log("=== Underwriter Preview (mock qualified deals) ===\n");
for (const d of MOCK_QUALIFIED) {
  const r = analyze(d);
  console.log(`${r.rec} | ${d.address} ($${d.price.toLocaleString()})`);
  console.log(`  → ${r.reason}`);
  console.log(`  Flags: ${r.flags.join("; ")}`);
  console.log("");
}

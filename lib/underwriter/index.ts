export { analyzeDeal } from "./analyze";
export { runStressTests, deriveDealFinancials } from "./calculations";
export {
  resolveHouseHackInputs,
  buildDeterministicSummary,
} from "./house-hack-inputs";
export { enrichUnderwritingWithAi } from "./ai-enrichment";
export type {
  DealForUnderwriting,
  UnderwriterRecommendation,
  UnderwriterResult,
  UnderwritingReport,
  StressTestResults,
  StressScenario,
  HouseHackPhase1,
  HouseHackScoreBreakdown,
} from "./types";

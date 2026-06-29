import type { AcquisitionCriteria } from "@/lib/types/database";

export const DEFAULT_ACQUISITION_CRITERIA: AcquisitionCriteria = {
  id: "default",
  property_types: ["sfr", "duplex", "triplex", "fourplex"],
  markets: [
    {
      name: "Inland Empire",
      cities: ["Riverside", "San Bernardino", "Moreno Valley", "Corona", "Rialto"],
    },
    {
      name: "High Desert",
      cities: ["Victorville", "Apple Valley", "Hesperia", "Adelanto"],
    },
    {
      name: "Santa Clarita Valley",
      cities: ["Santa Clarita", "Valencia", "Newhall", "Canyon Country"],
    },
  ],
  min_price: 250000,
  max_price: 550000,
  min_cap_rate: 0.05,
  min_coc_return: 0.06,
  max_vacancy_rate: 0.08,
  min_deal_score: 65,
  updated_at: new Date().toISOString(),
};

import { getLiquidCapital, getAcquisitionCriteriaFromStore } from "@/lib/data/queries";
import SettingsPageClient from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const [liquidCapital, criteria] = await Promise.all([
    getLiquidCapital(),
    getAcquisitionCriteriaFromStore(),
  ]);
  return (
    <SettingsPageClient
      initialLiquidCapital={liquidCapital}
      initialCriteria={criteria}
    />
  );
}

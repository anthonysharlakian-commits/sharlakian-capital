"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { updateAcquisitionCriteria, updateLiquidCapital } from "@/app/actions/deals";
import { Bot, Save } from "lucide-react";
import { DEFAULT_ACQUISITION_CRITERIA } from "@/lib/constants/acquisition-defaults";
import type { AcquisitionCriteria } from "@/lib/types/database";

interface SettingsPageClientProps {
  initialLiquidCapital: number;
  initialCriteria: AcquisitionCriteria | null;
}

export default function SettingsPageClient({
  initialLiquidCapital,
  initialCriteria,
}: SettingsPageClientProps) {
  const [criteria, setCriteria] = useState({
    min_price: initialCriteria?.min_price ?? 0,
    max_price: initialCriteria?.max_price ?? 0,
    min_cap_rate: (initialCriteria?.min_cap_rate ?? 0) * 100,
    min_coc_return: (initialCriteria?.min_coc_return ?? 0) * 100,
    max_vacancy_rate: (initialCriteria?.max_vacancy_rate ?? 0) * 100,
    min_deal_score: initialCriteria?.min_deal_score ?? 0,
  });
  const [liquidCapital, setLiquidCapital] = useState(initialLiquidCapital);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await Promise.all([
        updateAcquisitionCriteria({
          min_price: criteria.min_price,
          max_price: criteria.max_price,
          min_cap_rate: criteria.min_cap_rate / 100,
          min_coc_return: criteria.min_coc_return / 100,
          max_vacancy_rate: criteria.max_vacancy_rate / 100,
          min_deal_score: criteria.min_deal_score,
        }),
        updateLiquidCapital(liquidCapital),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle mt-1">Acquisition criteria and system configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-3 w-3 text-[var(--gold)]" />
            Portfolio Capital
          </CardTitle>
        </CardHeader>
        <CardContent>
          <label className="form-label">Liquid Capital</label>
          <Input
            type="number"
            value={liquidCapital}
            onChange={(e) => setLiquidCapital(+e.target.value)}
            className="mt-1"
          />
          <p className="kpi-hint mt-2">Used for CoC return calculation on dashboard</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-3 w-3 text-[var(--gold)]" />
            Acquisition Criteria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Min Price", "min_price", 1],
              ["Max Price", "max_price", 1],
              ["Min Cap Rate (%)", "min_cap_rate", 0.1],
              ["Min CoC Return (%)", "min_coc_return", 0.1],
              ["Max Vacancy Rate (%)", "max_vacancy_rate", 0.1],
              ["Min Deal Score", "min_deal_score", 1],
            ].map(([label, key, step]) => (
              <div key={key}>
                <label className="form-label">{label}</label>
                <Input
                  type="number"
                  step={step}
                  value={criteria[key as keyof typeof criteria]}
                  onChange={(e) =>
                    setCriteria({ ...criteria, [key]: +e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            ))}
          </div>

          <div className="pt-2">
            <p className="form-label mb-2">Target Markets</p>
            <div className="space-y-1">
              {DEFAULT_ACQUISITION_CRITERIA.markets.map((m) => (
                <p key={m.name} className="body-text">
                  <span className="text-[var(--text-muted)]">{m.name}:</span>{" "}
                  {m.cities.join(", ")}
                </p>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={pending} className="gap-2">
            <Save className="h-3 w-3" />
            {saved ? "Saved!" : pending ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Target Property Types</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_ACQUISITION_CRITERIA.property_types.map((t) => (
              <Badge key={t} variant="secondary" className="uppercase">{t}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

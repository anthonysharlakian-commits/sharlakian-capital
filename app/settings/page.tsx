"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_ACQUISITION_CRITERIA } from "@/lib/constants/acquisition-defaults";
import { updateAcquisitionCriteria } from "@/app/actions/deals";
import { Bot, Save } from "lucide-react";

export default function SettingsPage() {
  const [criteria, setCriteria] = useState({
    min_price: DEFAULT_ACQUISITION_CRITERIA.min_price,
    max_price: DEFAULT_ACQUISITION_CRITERIA.max_price,
    min_cap_rate: DEFAULT_ACQUISITION_CRITERIA.min_cap_rate * 100,
    min_coc_return: DEFAULT_ACQUISITION_CRITERIA.min_coc_return * 100,
    max_vacancy_rate: DEFAULT_ACQUISITION_CRITERIA.max_vacancy_rate * 100,
    min_deal_score: DEFAULT_ACQUISITION_CRITERIA.min_deal_score,
  });
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateAcquisitionCriteria({
        min_price: criteria.min_price,
        max_price: criteria.max_price,
        min_cap_rate: criteria.min_cap_rate / 100,
        min_coc_return: criteria.min_coc_return / 100,
        max_vacancy_rate: criteria.max_vacancy_rate / 100,
        min_deal_score: criteria.min_deal_score,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Acquisition criteria and system configuration</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            Acquisition Criteria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Min Price</label>
              <Input type="number" value={criteria.min_price} onChange={(e) => setCriteria({ ...criteria, min_price: +e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Max Price</label>
              <Input type="number" value={criteria.max_price} onChange={(e) => setCriteria({ ...criteria, max_price: +e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Min Cap Rate (%)</label>
              <Input type="number" step="0.1" value={criteria.min_cap_rate} onChange={(e) => setCriteria({ ...criteria, min_cap_rate: +e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Min CoC Return (%)</label>
              <Input type="number" step="0.1" value={criteria.min_coc_return} onChange={(e) => setCriteria({ ...criteria, min_coc_return: +e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Max Vacancy Rate (%)</label>
              <Input type="number" step="0.1" value={criteria.max_vacancy_rate} onChange={(e) => setCriteria({ ...criteria, max_vacancy_rate: +e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Min Deal Score</label>
              <Input type="number" value={criteria.min_deal_score} onChange={(e) => setCriteria({ ...criteria, min_deal_score: +e.target.value })} />
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-2">Target Markets</p>
            <div className="space-y-1">
              {DEFAULT_ACQUISITION_CRITERIA.markets.map((m) => (
                <p key={m.name} className="text-sm">
                  <span className="font-medium">{m.name}:</span>{" "}
                  <span className="text-muted-foreground">{m.cities.join(", ")}</span>
                </p>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={pending} className="gap-2">
            <Save className="h-4 w-4" />
            {saved ? "Saved!" : pending ? "Saving..." : "Save Criteria"}
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Target Property Types</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_ACQUISITION_CRITERIA.property_types.map((t) => (
              <span key={t} className="px-3 py-1 rounded-full bg-secondary text-sm uppercase">{t}</span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

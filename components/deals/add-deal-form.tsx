"use client";

import { useMemo, useState, useTransition } from "react";
import { createDeal } from "@/app/actions/deals";
import {
  calculateDealMetrics,
  type DealFormInput,
} from "@/lib/deals/calculations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const PROPERTY_TYPES = ["sfr", "duplex", "triplex", "fourplex", "multifamily"];
const CONDITIONS = ["cosmetic", "moderate", "heavy", "gut"];

const EMPTY_FORM: DealFormInput = {
  address: "",
  city: "",
  market: "",
  list_price: 0,
  property_type: "sfr",
  adu_rent_estimate: 0,
  mortgage_estimate: 0,
  condition: "cosmetic",
  commute_min: 0,
  fha_eligible: true,
  notes: "",
};

export function AddDealForm() {
  const [form, setForm] = useState<DealFormInput>(EMPTY_FORM);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const metrics = useMemo(() => {
    if (!form.address || !form.list_price) return null;
    return calculateDealMetrics({
      ...form,
      list_price: Number(form.list_price) || 0,
      adu_rent_estimate: Number(form.adu_rent_estimate) || 0,
      mortgage_estimate: Number(form.mortgage_estimate) || 0,
      commute_min: Number(form.commute_min) || 0,
    });
  }, [form]);

  function updateField<K extends keyof DealFormInput>(
    key: K,
    value: DealFormInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setShowPreview(false);
    setError(null);
  }

  function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    if (!form.address.trim()) {
      setError("Address is required");
      return;
    }
    if (!form.list_price) {
      setError("List price is required");
      return;
    }
    setShowPreview(true);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await createDeal({
          ...form,
          list_price: Number(form.list_price),
          adu_rent_estimate: Number(form.adu_rent_estimate) || 0,
          mortgage_estimate: Number(form.mortgage_estimate) || 0,
          commute_min: Number(form.commute_min) || 0,
        });
        setForm(EMPTY_FORM);
        setShowPreview(false);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save deal");
      }
    });
  }

  return (
    <div className="panel p-5 space-y-4">
      <p className="panel-heading">Add Deal</p>

      <form onSubmit={handlePreview} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="form-label block mb-1">Address</label>
            <Input
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="123 Main St"
              required
            />
          </div>
          <div>
            <label className="form-label block mb-1">City</label>
            <Input
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              placeholder="Los Angeles"
            />
          </div>
          <div>
            <label className="form-label block mb-1">Market</label>
            <Input
              value={form.market}
              onChange={(e) => updateField("market", e.target.value)}
              placeholder="High Desert"
            />
          </div>
          <div>
            <label className="form-label block mb-1">List Price</label>
            <Input
              type="number"
              min={0}
              value={form.list_price || ""}
              onChange={(e) =>
                updateField("list_price", Number(e.target.value) || 0)
              }
              placeholder="500000"
              required
            />
          </div>
          <div>
            <label className="form-label block mb-1">Property Type</label>
            <select
              className="select-ds w-full h-9 px-3"
              value={form.property_type}
              onChange={(e) => updateField("property_type", e.target.value)}
            >
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label block mb-1">ADU Rent Estimate / mo</label>
            <Input
              type="number"
              min={0}
              value={form.adu_rent_estimate || ""}
              onChange={(e) =>
                updateField("adu_rent_estimate", Number(e.target.value) || 0)
              }
              placeholder="2500"
            />
          </div>
          <div>
            <label className="form-label block mb-1">Mortgage Estimate / mo</label>
            <Input
              type="number"
              min={0}
              value={form.mortgage_estimate || ""}
              onChange={(e) =>
                updateField("mortgage_estimate", Number(e.target.value) || 0)
              }
              placeholder="3200"
            />
          </div>
          <div>
            <label className="form-label block mb-1">Condition</label>
            <select
              className="select-ds w-full h-9 px-3"
              value={form.condition}
              onChange={(e) => updateField("condition", e.target.value)}
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label block mb-1">Commute Minutes</label>
            <Input
              type="number"
              min={0}
              value={form.commute_min || ""}
              onChange={(e) =>
                updateField("commute_min", Number(e.target.value) || 0)
              }
              placeholder="45"
            />
          </div>
          <div>
            <label className="form-label block mb-1">FHA Eligible</label>
            <select
              className="select-ds w-full h-9 px-3"
              value={form.fha_eligible ? "yes" : "no"}
              onChange={(e) =>
                updateField("fha_eligible", e.target.value === "yes")
              }
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        <div>
          <label className="form-label block mb-1">Notes</label>
          <Textarea
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Deal notes..."
            rows={3}
          />
        </div>

        {error && <p className="body-text text-[var(--red)]">{error}</p>}

        {!showPreview ? (
          <Button type="submit" variant="default" size="sm">
            Preview Score
          </Button>
        ) : (
          metrics && (
            <div className="space-y-3 border border-[var(--border)] rounded-[3px] p-4 bg-[rgba(3,6,14,0.4)]">
              <p className="panel-heading">Calculated Metrics</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="kpi-label">AI Score</p>
                  <p className="kpi-value mt-1 kpi-value-gold">{metrics.ai_score}</p>
                </div>
                <div>
                  <p className="kpi-label">ADU Coverage</p>
                  <p className="kpi-value mt-1">{metrics.adu_coverage_pct}%</p>
                </div>
                <div>
                  <p className="kpi-label">Phase 2 CoC</p>
                  <p className="kpi-value mt-1">{metrics.phase2_coc}%</p>
                </div>
                <div>
                  <p className="kpi-label">CoC Return</p>
                  <p className="kpi-value mt-1">{metrics.coc_return}%</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={pending}
                >
                  {pending ? "Saving..." : "Confirm & Save Deal"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                  disabled={pending}
                >
                  Edit
                </Button>
              </div>
            </div>
          )
        )}
      </form>
    </div>
  );
}

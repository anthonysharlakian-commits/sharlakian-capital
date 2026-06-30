"use client";

import { useState, useTransition } from "react";
import { submitMaintenanceRequest } from "@/app/actions/deals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MaintenanceFormProps {
  properties: { id: string; address: string }[];
}

export function MaintenanceForm({ properties }: MaintenanceFormProps) {
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  function handleSubmit(formData: FormData) {
    setSuccess(false);
    startTransition(async () => {
      await submitMaintenanceRequest({
        property_id: formData.get("property_id") as string,
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        unit: (formData.get("unit") as string) || undefined,
      });
      setSuccess(true);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Maintenance Request</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-3">
          <div>
            <label className="form-label">Property</label>
            <select
              name="property_id"
              required
              className="select-ds flex h-9 w-full px-3 py-2 mt-1"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.address}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Unit (optional)</label>
            <Input name="unit" placeholder="Main, Unit A..." className="mt-1" />
          </div>
          <div>
            <label className="form-label">Title</label>
            <Input name="title" placeholder="Brief issue title" required className="mt-1" />
          </div>
          <div>
            <label className="form-label">Description</label>
            <Textarea
              name="description"
              placeholder="Describe the issue in detail..."
              required
              className="mt-1 min-h-[100px]"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Submitting..." : "Submit Request"}
          </Button>
          {success && (
            <p className="caption-sm text-[var(--green)]">
              Request submitted — AI router is diagnosing.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

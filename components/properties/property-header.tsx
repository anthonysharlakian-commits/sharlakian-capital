import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { Property } from "@/lib/types/database";
import { Building2 } from "lucide-react";

interface PropertyHeaderProps {
  property: Property;
}

export function PropertyHeader({ property }: PropertyHeaderProps) {
  const equity =
    (property.current_value ?? 0) - (property.mortgage_balance ?? 0);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-[2px] bg-[rgba(201,168,76,0.06)] border border-[var(--border)] flex items-center justify-center shrink-0">
          <Building2 className="h-6 w-6 text-[var(--text-hint)]" />
        </div>
        <div>
          <h1 className="page-title">{property.address}</h1>
          <p className="page-subtitle mt-1">
            {property.city}, {property.state} {property.zip}
          </p>
          <Badge variant="secondary" className="mt-2 capitalize">
            {property.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Current Value", formatCurrency(property.current_value)],
          ["Mortgage", formatCurrency(property.mortgage_balance)],
          ["Monthly Rent", formatCurrency(property.monthly_rent)],
          ["Equity", formatCurrency(equity)],
        ].map(([label, value]) => (
          <div key={label} className="panel p-4">
            <p className="kpi-label">{label}</p>
            <p className="kpi-value mt-2">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

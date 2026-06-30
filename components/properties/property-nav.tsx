"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { suffix: "", label: "Overview" },
  { suffix: "/tenants", label: "Tenants" },
  { suffix: "/maintenance", label: "Maintenance" },
  { suffix: "/financials", label: "Financials" },
] as const;

export function PropertyNav({ propertyId }: { propertyId: string }) {
  const pathname = usePathname();
  const base = `/properties/${propertyId}`;

  return (
    <nav className="flex gap-1 border-b border-[var(--border)]">
      {TABS.map(({ suffix, label }) => {
        const href = `${base}${suffix}`;
        const active =
          suffix === ""
            ? pathname === base
            : pathname.startsWith(`${base}${suffix}`);
        return (
          <Link
            key={suffix}
            href={href}
            className={`px-3 py-2 caption-sm tracking-wide border-b-2 -mb-px transition-colors ${
              active
                ? "border-[var(--gold)] text-[var(--gold)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

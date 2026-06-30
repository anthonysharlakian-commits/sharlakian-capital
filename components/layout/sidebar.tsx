"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
const NAV_ITEMS = [
  { href: "/dashboard", label: "Portfolio" },
  { href: "/deals", label: "Deals" },
  { href: "/properties", label: "Properties" },
  { href: "/tenants", label: "Tenants" },
  { href: "/maintenance", label: "Maintenance" },
  { href: "/finances", label: "Finances" },
  { href: "/agents", label: "Agents" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname() ?? "";

  return (
    <aside className="sidebar">
      <div className="px-5 pt-6 pb-5">
        <Link href="/dashboard" className="block">
          <span className="sidebar-logo-mark">SH</span>
          <span className="sidebar-logo-sub block mt-0.5">HOLDINGS OS</span>
        </Link>
      </div>

      <nav className="flex-1">
        {NAV_ITEMS.map(({ href, label }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard" || pathname === "/"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`nav-item ${active ? "nav-item-active" : ""}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-2">
        <SignOutButton />
      </div>

      <div className="px-5 py-4 flex items-center gap-2 border-t border-[var(--border)]">
        <span
          className="rounded-full shrink-0"
          style={{ width: 5, height: 5, backgroundColor: "#00C97A" }}
        />
        <span className="sidebar-status">ALL AGENTS ONLINE</span>
      </div>
    </aside>
  );
}

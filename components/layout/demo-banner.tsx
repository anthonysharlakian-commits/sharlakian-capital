import { isDemoMode } from "@/lib/auth/cron";

export function DemoBanner() {
  if (!isDemoMode()) return null;

  return (
    <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
      <span className="font-medium text-primary">Demo Mode</span>
      <span className="text-muted-foreground">
        {" "}— Running with mock data. Add Supabase keys to <code className="text-xs bg-secondary px-1 rounded">.env.local</code> for live data. Approve/reject and maintenance requests persist locally in <code className="text-xs bg-secondary px-1 rounded">.data/mock-store.json</code>.
      </span>
    </div>
  );
}

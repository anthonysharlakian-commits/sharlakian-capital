import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";

const dealScanner = inngest.createFunction(
  { id: "deal-scanner", retries: 3 },
  { cron: "0 */6 * * *" },
  async ({ step }) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return step.run("run-deal-scanner", async () => {
      const res = await fetch(`${baseUrl}/api/agents/deal-scanner`, { method: "POST" });
      return res.json();
    });
  }
);

const refiMonitor = inngest.createFunction(
  { id: "refi-monitor", retries: 3 },
  { cron: "0 9 1 * *" },
  async ({ step }) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return step.run("run-refi-monitor", async () => {
      const res = await fetch(`${baseUrl}/api/agents/refi-monitor`, { method: "POST" });
      return res.json();
    });
  }
);

const financialReporter = inngest.createFunction(
  { id: "financial-reporter", retries: 3 },
  { cron: "0 8 1 * *" },
  async ({ step }) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return step.run("run-financial-reporter", async () => {
      const res = await fetch(`${baseUrl}/api/agents/financial-reporter`, { method: "POST" });
      return res.json();
    });
  }
);

const underwriterTrigger = inngest.createFunction(
  { id: "underwriter-trigger", retries: 3 },
  { event: "deal/qualified" },
  async ({ event, step }) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return step.run("run-underwriter", async () => {
      const res = await fetch(`${baseUrl}/api/agents/underwriter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: event.data.propertyId }),
      });
      return res.json();
    });
  }
);

const maintenanceTrigger = inngest.createFunction(
  { id: "maintenance-trigger", retries: 3 },
  { event: "maintenance/submitted" },
  async ({ event, step }) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return step.run("route-maintenance", async () => {
      const res = await fetch(`${baseUrl}/api/agents/maintenance-router`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: event.data.requestId }),
      });
      return res.json();
    });
  }
);

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [dealScanner, refiMonitor, financialReporter, underwriterTrigger, maintenanceTrigger],
});

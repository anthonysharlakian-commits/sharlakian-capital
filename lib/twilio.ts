import twilio from "twilio";

function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
}

export async function sendSMS(to: string, body: string): Promise<boolean> {
  const client = getTwilioClient();
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!client || !from) {
    console.log(`[SMS Mock] To: ${to}\n${body}`);
    return true;
  }

  try {
    await client.messages.create({ to, from, body });
    return true;
  } catch (err) {
    console.error("Twilio SMS error:", err);
    return false;
  }
}

export async function notifyOwner(body: string): Promise<boolean> {
  const ownerPhone = process.env.OWNER_PHONE_NUMBER;
  if (!ownerPhone) {
    console.log(`[Owner SMS Mock]\n${body}`);
    return true;
  }
  return sendSMS(ownerPhone, body);
}

export function formatDealNotification(opts: {
  address: string;
  city: string;
  score: number;
  coc: number;
  cashFlow: number;
  dealId: string;
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "holdingsos.com";
  return (
    `🏠 NEW DEAL: ${opts.address}, ${opts.city}\n` +
    `Score: ${opts.score}/100 | CoC: ${(opts.coc * 100).toFixed(1)}% | CF: $${opts.cashFlow.toLocaleString()}/mo\n` +
    `Review at: ${baseUrl}/deals/${opts.dealId}`
  );
}

export function formatApprovalReadyNotification(opts: {
  address: string;
  score: number;
  recommendation: string;
  dealId: string;
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "holdingsos.com";
  return (
    `📋 DEAL READY FOR REVIEW: ${opts.address}\n` +
    `Score: ${opts.score}/100 | AI: ${opts.recommendation.replace("_", " ").toUpperCase()}\n` +
    `Approve/Reject: ${baseUrl}/deals/${opts.dealId}`
  );
}

export function formatEmergencyMaintenance(opts: {
  address: string;
  title: string;
  description: string;
}): string {
  return (
    `🚨 EMERGENCY MAINTENANCE: ${opts.address}\n` +
    `${opts.title}\n${opts.description}\n` +
    `Action required immediately.`
  );
}

export function formatRefiOpportunity(opts: {
  address: string;
  equityPct: number;
  cashAvailable: number;
}): string {
  return (
    `🔁 REFI OPPORTUNITY: ${opts.address}\n` +
    `Equity: ${(opts.equityPct * 100).toFixed(0)}%\n` +
    `Cash available: $${opts.cashAvailable.toLocaleString()}`
  );
}

const EMERGENCY_KEYWORDS = [
  "flood",
  "no heat",
  "gas smell",
  "no power",
  "roof collapse",
  "fire",
  "gas leak",
  "carbon monoxide",
  "sewage",
  "burst pipe",
];

export function isEmergencyIssue(description: string): boolean {
  const lower = description.toLowerCase();
  return EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw));
}

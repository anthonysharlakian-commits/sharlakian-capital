import { NextResponse } from "next/server";
import { submitMaintenanceRequest } from "@/app/actions/deals";

export async function POST(request: Request) {
  const formData = await request.formData();
  const body = formData.get("Body")?.toString() ?? "";

  // Parse SMS maintenance request: "MAINT [property_id] description"
  const match = body.match(/^MAINT\s+(\S+)\s+(.+)/i);

  if (match) {
    await submitMaintenanceRequest({
      property_id: match[1],
      title: "SMS Maintenance Request",
      description: match[2],
    });
  }

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Request received. Our maintenance team will respond shortly.</Message></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}

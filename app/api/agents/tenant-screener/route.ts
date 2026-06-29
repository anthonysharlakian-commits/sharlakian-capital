import { NextResponse } from "next/server";
import { callClaude, logAgentAction } from "@/lib/claude";
import { createAdminClient } from "@/lib/supabase/admin";

interface ScreeningResult {
  score: number;
  recommendation: "approve" | "conditional" | "deny";
  summary: string;
  risk_factors: string[];
  strengths: string[];
}

export async function POST(request: Request) {
  const data = await request.json();
  const supabase = createAdminClient();

  try {
    const { data: result, tokensUsed, error } = await callClaude<ScreeningResult>(
      `Analyze this tenant application for a rental property.
      
Applicant: ${data.first_name} ${data.last_name}
Monthly Rent: $${data.monthly_rent}
Application Data: ${JSON.stringify(data.application)}

Return JSON: {
  "score": number (0-100),
  "recommendation": "approve"|"conditional"|"deny",
  "summary": string,
  "risk_factors": string[],
  "strengths": string[]
}`,
      { maxTokens: 800 }
    );

    if (error || !result) throw new Error(error ?? "Screening failed");

    const { data: tenant } = await supabase
      .from("tenants")
      .insert({
        property_id: data.property_id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        monthly_rent: data.monthly_rent,
        status: result.recommendation === "approve" ? "active" : "former",
        screening_score: result.score,
        screening_report: result,
      })
      .select()
      .single();

    await logAgentAction("tenant_screener", "screening_complete", {
      propertyId: data.property_id,
      output: { score: result.score, recommendation: result.recommendation },
      tokensUsed,
      status: "success",
    });

    return NextResponse.json({ success: true, result, tenant });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logAgentAction("tenant_screener", "screening_failed", {
      output: { error: message },
      status: "error",
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { approveDeal, rejectDeal } from "@/app/actions/deals";
import { CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

interface DealApprovalActionsProps {
  propertyId: string;
}

export function DealApprovalActions({ propertyId }: DealApprovalActionsProps) {
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleApprove() {
    startTransition(async () => {
      await approveDeal(propertyId, notes);
      router.push("/deals");
      router.refresh();
    });
  }

  function handleReject() {
    startTransition(async () => {
      await rejectDeal(propertyId, notes);
      router.push("/deals");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Optional notes..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="min-h-[80px]"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          variant="approve"
          size="xl"
          onClick={handleApprove}
          disabled={pending}
          className="w-full gap-2"
        >
          <CheckCircle className="h-5 w-5" />
          APPROVE
        </Button>
        <Button
          variant="reject"
          size="xl"
          onClick={handleReject}
          disabled={pending}
          className="w-full gap-2"
        >
          <XCircle className="h-5 w-5" />
          REJECT
        </Button>
      </div>
    </div>
  );
}

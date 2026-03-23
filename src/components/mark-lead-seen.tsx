"use client";

import { useEffect } from "react";

export function MarkLeadSeen({ leadId }: { leadId: string }) {
  useEffect(() => {
    void fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seenAt: new Date().toISOString() }),
    });
  }, [leadId]);
  return null;
}

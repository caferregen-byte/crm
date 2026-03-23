import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ManualLeadForm } from "@/components/manual-lead-form";

export const dynamic = "force-dynamic";

export default function NewManualLeadPage() {
  return (
    <div className="mx-auto max-w-md space-y-8">
      <Link
        href="/leads"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Leadler
      </Link>
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Lead ekle
        </h1>
      </header>
      <ManualLeadForm />
    </div>
  );
}

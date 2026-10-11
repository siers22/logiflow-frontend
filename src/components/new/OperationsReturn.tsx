import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function OperationsReturn() {
  return <div className="border-b border-[#eeeaf5] bg-[#f8f7fc] px-5 py-2.5">
    <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-xs font-semibold text-[#7868d9] hover:underline">
      <ArrowLeft size={15} aria-hidden="true" /> К новому обзору
    </Link>
  </div>;
}

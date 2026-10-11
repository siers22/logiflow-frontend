import { Boxes } from "lucide-react";

interface BrandMarkProps {
  compact?: boolean;
  className?: string;
}

export function BrandMark({ compact = false, className = "" }: BrandMarkProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-[#8272e6] text-white shadow-[0_8px_20px_rgba(104,86,207,0.2)]">
        <Boxes className="size-5" strokeWidth={2.2} aria-hidden="true" />
      </span>
      {!compact && <span className="text-[21px] font-semibold tracking-[-0.055em] text-[#242331] dark:text-[#f4efff]">LogiFlow</span>}
    </span>
  );
}

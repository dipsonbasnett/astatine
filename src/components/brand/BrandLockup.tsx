import { Link } from "react-router-dom";

import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/lib/cn";

export function BrandLockup({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-control text-ink",
        className,
      )}
    >
      <BrandMark />
      <span className="flex min-w-0 flex-col leading-none">
        <span className="text-[0.95rem] font-semibold tracking-[0.1em]">ASTATINE</span>
        <span className="mt-1.5 text-xs leading-4 text-ink-subtle">
          Human Monitoring &amp; Analytics Center
        </span>
      </span>
      <span className="sr-only">— go to dashboard</span>
    </Link>
  );
}

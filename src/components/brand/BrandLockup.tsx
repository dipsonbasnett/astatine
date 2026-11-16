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
      <span className="flex flex-col leading-none">
        <span className="text-[0.95rem] font-semibold tracking-[0.1em]">ASTATINE</span>
        <span className="mt-1.5 font-mono text-label tracking-[0.18em] text-ink-subtle uppercase">
          Mission health
        </span>
      </span>
      <span className="sr-only">— go to overview</span>
    </Link>
  );
}

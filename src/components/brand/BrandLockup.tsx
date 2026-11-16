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
      <span className="text-[0.95rem] font-semibold tracking-[0.1em]">ASTATINE</span>
    </Link>
  );
}

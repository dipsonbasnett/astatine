import { Skeleton } from "@/components/ui/Skeleton";

export function RouteFallback() {
  return (
    <div role="status" aria-live="polite" className="space-y-5">
      <span className="sr-only">Loading page</span>
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-12 w-3/4 max-w-md" />
      <Skeleton className="h-5 w-full max-w-2xl" />
      <Skeleton className="h-5 w-5/6 max-w-xl" />
      <div className="grid gap-6 pt-8 md:grid-cols-2">
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
      </div>
    </div>
  );
}

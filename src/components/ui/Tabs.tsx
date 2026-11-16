import { useRef, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/cn";

const NAVIGATION_KEYS = ["ArrowRight", "ArrowLeft", "Home", "End"] as const;

export interface TabListProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function TabList({ label, children, className }: TabListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!NAVIGATION_KEYS.includes(event.key as (typeof NAVIGATION_KEYS)[number])) {
      return;
    }

    const tabs = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
    );
    if (tabs.length === 0) return;

    event.preventDefault();
    const currentIndex = tabs.findIndex((tab) => tab === document.activeElement);
    let nextIndex = currentIndex;

    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else if (event.key === "ArrowRight") {
      nextIndex = currentIndex >= tabs.length - 1 ? 0 : currentIndex + 1;
    } else if (event.key === "ArrowLeft") {
      nextIndex = currentIndex <= 0 ? tabs.length - 1 : currentIndex - 1;
    }

    const nextTab = tabs[nextIndex];
    if (nextTab) {
      nextTab.focus();
      nextTab.click();
    }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      aria-orientation="horizontal"
      className={cn("flex flex-wrap gap-2", className)}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}

export interface TabProps {
  id: string;
  panelId: string;
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
  className?: string;
}

export function Tab({ id, panelId, selected, onSelect, children, className }: TabProps) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={selected}
      aria-controls={panelId}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      className={cn(
        "inline-flex min-h-11 items-center rounded-control border px-3 py-1.5 text-sm font-medium transition-colors",
        selected
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-line bg-surface text-ink-muted hover:border-line-control hover:bg-raised hover:text-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}

export interface TabPanelProps {
  id: string;
  labelledBy: string;
  active: boolean;
  children: ReactNode;
  className?: string;
}

export function TabPanel({ id, labelledBy, active, children, className }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      id={id}
      aria-labelledby={labelledBy}
      hidden={!active}
      className={className}
    >
      {children}
    </div>
  );
}

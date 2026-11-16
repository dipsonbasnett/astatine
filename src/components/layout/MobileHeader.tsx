import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { BrandLockup } from "@/components/brand/BrandLockup";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { RouteNav } from "@/components/layout/RouteNav";
import { Button } from "@/components/ui/Button";

export function MobileHeader() {
  const { pathname } = useLocation();
  const [menu, setMenu] = useState({ open: false, path: pathname });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isOpen = menu.open && menu.path === pathname;

  const closeMenu = () => {
    setMenu({ open: false, path: pathname });
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      setMenu({ open: false, path: pathname });
      buttonRef.current?.focus();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas lg:hidden">
      <div className="flex min-h-16 items-center justify-between gap-4 px-5">
        <BrandLockup />
        <Button
          ref={buttonRef}
          variant="secondary"
          size="sm"
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          onClick={() => {
            setMenu({ open: !isOpen, path: pathname });
          }}
          className="shrink-0"
        >
          {isOpen ? "Close" : "Menu"}
          {isOpen ? <CloseIcon className="size-4" /> : <MenuIcon className="size-4" />}
        </Button>
      </div>
      <div
        id="mobile-navigation"
        hidden={!isOpen}
        className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line px-5 pt-5 pb-6"
      >
        <RouteNav ariaLabel="Primary navigation" onNavigate={closeMenu} />
        <p className="mt-6 border-t border-line pt-5 text-xs leading-5 text-ink-subtle">
          Astatine stores preferences and any records you choose to create in this browser
          only. No accounts, sensors, or automatic uploads.
        </p>
      </div>
    </header>
  );
}

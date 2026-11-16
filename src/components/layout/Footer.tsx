import { PrivacyNotice } from "@/components/layout/PrivacyNotice";
import { APP_VERSION } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-line px-page-x py-8">
      <div className="mx-auto flex w-full max-w-shell flex-col gap-8">
        <PrivacyNotice />
        <div className="flex flex-col gap-2 border-t border-line pt-6 text-xs leading-5 text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Astatine contributors · MIT licensed</p>
          <p className="font-mono tracking-[0.12em] uppercase">
            v{APP_VERSION} · Foundation
          </p>
        </div>
      </div>
    </footer>
  );
}

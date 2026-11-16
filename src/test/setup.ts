import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";

import { cleanup, configure } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import { db } from "@/lib/db";

// Full-router renders exceed the 1s default async timeout under parallel workers.
configure({ asyncUtilTimeout: 5000 });

if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };

  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}

Object.defineProperty(window, "scrollTo", {
  configurable: true,
  writable: true,
  value: vi.fn(),
});

afterEach(async () => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-motion");
  vi.mocked(window.scrollTo).mockClear();

  if (db.isOpen()) {
    await Promise.all(db.tables.map((table) => table.clear()));
  }
});

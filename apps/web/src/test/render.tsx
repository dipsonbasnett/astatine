import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";

import { PreferencesProvider } from "@/preferences/PreferencesProvider";

interface ExtendedRenderOptions extends Omit<RenderOptions, "wrapper"> {
  route?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  { route = "/", ...options }: ExtendedRenderOptions = {},
) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <PreferencesProvider>{ui}</PreferencesProvider>
    </MemoryRouter>,
    options,
  );
}

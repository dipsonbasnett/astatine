import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Modal } from "@/components/ui/Modal";

describe("Modal", () => {
  it("opens as a named dialog with a description", () => {
    render(
      <Modal
        open
        onClose={() => {}}
        title="Data policy"
        description="Three classes are kept separate."
      >
        <p>Dialog body</p>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog", { name: "Data policy" });
    expect(dialog).toHaveAccessibleDescription("Three classes are kept separate.");
    expect(screen.getByText("Dialog body")).toBeVisible();
  });

  it("remains closed when open is false", () => {
    render(
      <Modal open={false} onClose={() => {}} title="Data policy">
        <p>Dialog body</p>
      </Modal>,
    );

    expect(document.querySelector("dialog")).not.toHaveAttribute("open");
  });

  it("requests closure from the close button and Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal open onClose={onClose} title="Data policy">
        <p>Dialog body</p>
      </Modal>,
    );

    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    const dialog = screen.getByRole("dialog", { name: "Data policy" });
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    replace: replaceMock,
    refresh: refreshMock,
  }),
}));

import { LanguageToggle } from "./language-toggle";

describe("LanguageToggle", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    refreshMock.mockReset();
  });

  it("renders ko and en buttons with the active locale pressed", () => {
    render(<LanguageToggle locale="ko" />);

    const koButton = screen.getByRole("button", { name: "ko" });
    const enButton = screen.getByRole("button", { name: "en" });

    expect(koButton.getAttribute("aria-pressed")).toBe("true");
    expect(enButton.getAttribute("aria-pressed")).toBe("false");
  });

  it("replaces the current pathname when switching locale", () => {
    render(<LanguageToggle locale="ko" />);

    fireEvent.click(screen.getByRole("button", { name: "en" }));

    expect(document.cookie).toContain("NEXT_LOCALE=en");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("does not navigate when the active locale is clicked", () => {
    render(<LanguageToggle locale="ko" />);

    fireEvent.click(screen.getByRole("button", { name: "ko" }));

    expect(replaceMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});

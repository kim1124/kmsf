import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FullPageLoader } from "./full-page-loader";

describe("FullPageLoader", () => {
  it("renders a dialog-style loading box over a 50 percent backdrop", () => {
    const { container } = render(<FullPageLoader text="페이지를 불러오는 중입니다..." />);
    const overlay = container.firstElementChild as HTMLElement | null;

    expect(overlay).not.toBeNull();
    expect(overlay?.className).toContain("bg-black/50");
    expect(overlay?.className).not.toContain("backdrop-blur");

    const dialog = screen.getByRole("alertdialog", { name: "로딩 중" });

    expect(dialog.className).toContain("rounded-2xl");
    expect(dialog.className).toContain("bg-surface");
    expect(screen.getByText("페이지를 불러오는 중입니다...")).toBeTruthy();
  });
});

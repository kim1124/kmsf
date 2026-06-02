import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FieldWithTooltip } from "./field-with-tooltip";

describe("FieldWithTooltip", () => {
  it("keeps the tooltip closed when the input receives focus by default", () => {
    render(
      <FieldWithTooltip
        id="username"
        label="Username"
        name="username"
        tooltip="Use 3 or more characters."
      />,
    );

    fireEvent.focus(screen.getByLabelText("Username"));

    expect(screen.queryByText("Use 3 or more characters.")).toBeNull();
  });

  it("shows the tooltip from the help icon hover by default", async () => {
    render(
      <FieldWithTooltip
        id="username"
        label="Username"
        name="username"
        tooltip="Use 3 or more characters."
      />,
    );

    fireEvent.pointerMove(screen.getByRole("button", { name: "Username 도움말" }));

    await waitFor(() => {
      expect(screen.getByRole("tooltip").textContent).toBe("Use 3 or more characters.");
    });
  });

  it("keeps the tooltip closed when the help icon receives focus", async () => {
    render(
      <FieldWithTooltip
        id="username"
        label="Username"
        name="username"
        tooltip="Use 3 or more characters."
      />,
    );

    fireEvent.focus(screen.getByRole("button", { name: "Username 도움말" }));

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});

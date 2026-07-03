import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { AppShell } from "../src/layout/AppShell";

describe("AppShell", () => {
  it("renders navigation and content", () => {
    render(
      <MemoryRouter>
        <AppShell>
          <main>Starter content</main>
        </AppShell>
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Home").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Settings").length).toBeGreaterThan(0);
    expect(screen.getByText("Starter content")).toBeTruthy();
  });
});

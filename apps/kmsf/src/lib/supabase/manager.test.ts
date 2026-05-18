import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  const rpc = vi.fn();

  return {
    client: { from, rpc },
    eq,
    from,
    maybeSingle,
    rpc,
    select,
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/env", () => ({
  hasSupabaseServiceRoleKey: () => false,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => supabaseMocks.client),
}));

import { findManagerLoginEmail, isManagerUsernameTaken } from "./manager";

describe("manager Supabase helpers", () => {
  beforeEach(() => {
    supabaseMocks.from.mockClear();
    supabaseMocks.select.mockClear();
    supabaseMocks.eq.mockClear();
    supabaseMocks.maybeSingle.mockReset();
    supabaseMocks.rpc.mockReset();
  });

  it("falls back to manager table lookup when username RPC is missing", async () => {
    supabaseMocks.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "PGRST202",
        message: "Could not find the function public.get_manager_login_email(login_username)",
      },
    });
    supabaseMocks.maybeSingle.mockResolvedValue({
      data: { email: "member01@example.com" },
      error: null,
    });

    await expect(findManagerLoginEmail("member01")).resolves.toBe("member01@example.com");
    expect(supabaseMocks.rpc).toHaveBeenCalledWith("get_manager_login_email", {
      login_username: "member01",
    });
    expect(supabaseMocks.from).toHaveBeenCalledWith("manager");
    expect(supabaseMocks.select).toHaveBeenCalledWith("email");
    expect(supabaseMocks.eq).toHaveBeenCalledWith("username", "member01");
  });

  it("checks manager table when username RPC is missing during duplicate checks", async () => {
    supabaseMocks.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "PGRST202",
        message: "Could not find the function public.get_manager_login_email(login_username)",
      },
    });
    supabaseMocks.maybeSingle.mockResolvedValue({
      data: { id: "manager-1" },
      error: null,
    });

    await expect(isManagerUsernameTaken("member01")).resolves.toBe(true);
    expect(supabaseMocks.from).toHaveBeenCalledWith("manager");
    expect(supabaseMocks.select).toHaveBeenCalledWith("id");
    expect(supabaseMocks.eq).toHaveBeenCalledWith("username", "member01");
  });
});

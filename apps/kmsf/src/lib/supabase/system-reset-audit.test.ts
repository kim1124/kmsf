import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const rpcSingle = vi.fn();
  const rpc = vi.fn(() => ({ single: rpcSingle }));

  return {
    admin: { rpc },
    rpc,
    rpcSingle,
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => mocks.admin,
}));

describe("Supabase system reset audit schema", () => {
  const migrationPath = resolve(
    process.cwd(),
    "../../supabase/migrations/202606050001_system_reset_audit_backup.sql",
  );

  it("keeps reset audit and backup tables in the private schema", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("create schema if not exists private");
    expect(sql).toContain("create table if not exists private.system_reset_backups");
    expect(sql).toContain("create table if not exists private.system_reset_audit_events");
    expect(sql).toMatch(/alter table private\.system_reset_backups enable row level security/i);
    expect(sql).toMatch(/alter table private\.system_reset_audit_events enable row level security/i);
    expect(sql).toMatch(/revoke all on schema private from public/i);
    expect(sql).toMatch(/revoke all on all tables in schema private from anon, authenticated/i);
    expect(sql).not.toMatch(/pgrst\.db_schemas\s*=.*private/i);
  });

  it("exposes service-role-only public RPC wrappers", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("create or replace function public.insert_system_reset_backup");
    expect(sql).toContain("create or replace function public.insert_system_reset_audit_event");
    expect(sql).toMatch(/security invoker/i);
    expect(sql).toMatch(/grant execute on function public\.insert_system_reset_backup/i);
    expect(sql).toMatch(/grant execute on function public\.insert_system_reset_audit_event/i);
    expect(sql).toMatch(/to service_role/i);
    expect(sql).toMatch(/revoke all on function public\.insert_system_reset_backup/i);
    expect(sql).toMatch(/from public, anon, authenticated/i);
  });
});

describe("Supabase system reset audit helpers", () => {
  beforeEach(() => {
    mocks.rpc.mockClear();
    mocks.rpcSingle.mockReset();
  });

  it("inserts Supabase reset backup snapshots through the public RPC", async () => {
    const { insertSupabaseSystemResetBackup } = await import("./system-reset-audit");
    mocks.rpcSingle.mockResolvedValueOnce({
      data: { id: "00000000-0000-0000-0000-000000000001" },
      error: null,
    });

    await expect(
      insertSupabaseSystemResetBackup({
        actor: {
          email: "admin@test.local",
          id: "manager-1",
          username: "admin",
        },
        mode: "factory",
        provider: "supabase",
        snapshot: { manager: [] },
      }),
    ).resolves.toEqual({
      id: "00000000-0000-0000-0000-000000000001",
      ref: "supabase:system_reset_backups:00000000-0000-0000-0000-000000000001",
    });

    expect(mocks.rpc).toHaveBeenCalledWith("insert_system_reset_backup", {
      p_actor_email: "admin@test.local",
      p_actor_id: "manager-1",
      p_actor_username: "admin",
      p_mode: "factory",
      p_provider: "supabase",
      p_snapshot: { manager: [] },
    });
  });

  it("appends Supabase reset audit events through the public RPC", async () => {
    const { appendSupabaseSystemResetAuditEvent } = await import("./system-reset-audit");
    mocks.rpcSingle.mockResolvedValueOnce({
      data: { id: "00000000-0000-0000-0000-000000000002" },
      error: null,
    });

    await expect(
      appendSupabaseSystemResetAuditEvent({
        actorEmail: "admin@test.local",
        actorId: "manager-1",
        actorUsername: "admin",
        backupRef: "supabase:system_reset_backups:00000000-0000-0000-0000-000000000001",
        errorMessage: null,
        mode: "factory",
        provider: "supabase",
        status: "success",
      }),
    ).resolves.toMatchObject({
      id: "00000000-0000-0000-0000-000000000002",
    });

    expect(mocks.rpc).toHaveBeenCalledWith("insert_system_reset_audit_event", {
      p_actor_email: "admin@test.local",
      p_actor_id: "manager-1",
      p_actor_username: "admin",
      p_backup_ref: "supabase:system_reset_backups:00000000-0000-0000-0000-000000000001",
      p_error_message: null,
      p_mode: "factory",
      p_provider: "supabase",
      p_status: "success",
    });
  });
});

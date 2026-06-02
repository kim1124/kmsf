import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const deleteEqIdentifierHash = vi.fn();
  const deleteEqProvider = vi.fn(() => ({ eq: deleteEqIdentifierHash }));
  const deleteFrom = vi.fn(() => ({ eq: deleteEqProvider }));
  const insert = vi.fn();
  const maybeSingle = vi.fn();
  const rpcDirect = vi.fn(() => Promise.resolve({ error: null }));
  const rpcMaybeSingle = vi.fn();
  const rpcSingle = vi.fn();
  const rpc = vi.fn((fn: string) => {
    if (fn === "check_login_guard") {
      return { maybeSingle: rpcMaybeSingle };
    }

    if (fn === "record_login_failure") {
      return { single: rpcSingle };
    }

    return rpcDirect();
  });
  const selectEqIdentifierHash = vi.fn(() => ({ maybeSingle }));
  const selectEqProvider = vi.fn(() => ({ eq: selectEqIdentifierHash }));
  const select = vi.fn(() => ({ eq: selectEqProvider }));
  const schema = vi.fn(() => ({
    rpc,
    from: vi.fn((table: string) => {
      if (table === "login_attempt_state") {
        return {
          delete: deleteFrom,
          select,
          upsert,
        };
      }

      return {
        insert,
      };
    }),
  }));
  const upsert = vi.fn();

  return {
    admin: { rpc, schema },
    deleteEqIdentifierHash,
    deleteEqProvider,
    deleteFrom,
    insert,
    maybeSingle,
    rpc,
    rpcDirect,
    rpcMaybeSingle,
    rpcSingle,
    schema,
    select,
    selectEqIdentifierHash,
    selectEqProvider,
    upsert,
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => mocks.admin,
}));

describe("Supabase login guard schema", () => {
  const migrationPath = resolve(
    process.cwd(),
    "../../supabase/migrations/20260529053728_login_guard.sql",
  );
  const publicRpcMigrationPath = resolve(
    process.cwd(),
    "../../supabase/migrations/20260529054440_public_login_guard_service_role_rpcs.sql",
  );
  const eventTypesMigrationPath = resolve(
    process.cwd(),
    "../../supabase/migrations/20260602083408_login_guard_event_types.sql",
  );

  it("keeps login guard state and audit tables in the private schema only", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("create schema if not exists private");
    expect(sql).toContain("create table if not exists private.login_attempt_state");
    expect(sql).toContain("create table if not exists private.login_audit_events");
    expect(sql).toContain("identifier_hash text not null");
    expect(sql).not.toMatch(/\bidentifier\s+text\b/i);
    expect(sql).toMatch(/revoke all on schema private from anon, authenticated/i);
    expect(sql).toMatch(/revoke all on all tables in schema private from anon, authenticated/i);
    expect(sql).toMatch(/revoke all on schema private from public/i);
    expect(sql).toMatch(/revoke all on all tables in schema private from public/i);
    expect(sql).toMatch(/alter table private\.login_attempt_state enable row level security/i);
    expect(sql).toMatch(/alter table private\.login_audit_events enable row level security/i);
    expect(sql).toMatch(/create or replace function private\.record_login_failure/i);
    expect(sql).toContain("as $$");
    expect(sql).toMatch(/revoke all on function private\.record_login_failure\(text, text, timestamptz\) from public, anon, authenticated/i);
    expect(sql).toMatch(/grant select, insert, update, delete on private\.login_attempt_state to service_role/i);
    expect(sql).toMatch(/grant insert on private\.login_audit_events to service_role/i);
    expect(sql).not.toMatch(/grant select, insert on private\.login_audit_events to service_role/i);
  });

  it("normalizes login guard audit event types across providers", () => {
    const sql = readFileSync(eventTypesMigrationPath, "utf8");

    expect(sql).toContain("set event_type = 'failed'");
    expect(sql).toMatch(/drop constraint if exists login_audit_events_event_type_check/i);
    expect(sql).toContain("event_type in ('failed', 'locked', 'blocked', 'success')");
  });

  it("keeps private tables behind service_role-only public RPC wrappers", () => {
    const sql = readFileSync(publicRpcMigrationPath, "utf8");

    expect(sql).toContain("create or replace function public.check_login_guard");
    expect(sql).toContain("create or replace function public.record_login_failure");
    expect(sql).toContain("create or replace function public.clear_login_attempt_state");
    expect(sql).toContain("create or replace function public.insert_login_audit_event");
    expect(sql).toMatch(/security invoker/i);
    expect(sql).toMatch(/revoke all on function public\.check_login_guard\(text, text\) from public, anon, authenticated/i);
    expect(sql).toMatch(/grant execute on function public\.insert_login_audit_event\(text, text, text, uuid, text\) to service_role/i);
    expect(sql).not.toMatch(/pgrst\.db_schemas\s*=.*private/i);
  });
});

describe("Supabase login guard helpers", () => {
  beforeEach(() => {
    mocks.deleteEqIdentifierHash.mockReset();
    mocks.deleteEqProvider.mockClear();
    mocks.deleteFrom.mockClear();
    mocks.insert.mockReset();
    mocks.maybeSingle.mockReset();
    mocks.rpc.mockClear();
    mocks.rpcDirect.mockClear();
    mocks.rpcMaybeSingle.mockReset();
    mocks.rpcSingle.mockReset();
    mocks.schema.mockClear();
    mocks.select.mockClear();
    mocks.selectEqIdentifierHash.mockClear();
    mocks.selectEqProvider.mockClear();
    mocks.upsert.mockReset();
  });

  it("reports a lockout when the stored locked_until is still in the future", async () => {
    const { checkLoginGuard } = await import("./login-guard");
    mocks.rpcMaybeSingle.mockResolvedValueOnce({
      data: {
        failed_count: 3,
        locked_until: "2026-05-29T00:05:00.000Z",
      },
      error: null,
    });

    await expect(
      checkLoginGuard({
        identifierHash: "sha256:abc",
        now: new Date("2026-05-29T00:00:00.000Z"),
        provider: "supabase",
      }),
    ).resolves.toEqual({
      failedCount: 3,
      locked: true,
      lockedUntil: new Date("2026-05-29T00:05:00.000Z"),
    });

    expect(mocks.schema).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledWith("check_login_guard", {
      p_identifier_hash: "sha256:abc",
      p_provider: "supabase",
    });
  });

  it("locks the identifier for 300 seconds on the third failed login", async () => {
    const { recordLoginFailure } = await import("./login-guard");
    mocks.rpcSingle.mockResolvedValueOnce({
      data: {
        failed_count: 3,
        locked_until: "2026-05-29T00:05:00.000Z",
      },
      error: null,
    });
    mocks.rpcDirect.mockResolvedValueOnce({ error: null });

    await expect(
      recordLoginFailure({
        identifierHash: "sha256:abc",
        now: new Date("2026-05-29T00:00:00.000Z"),
        provider: "supabase",
        reason: "invalid_credentials",
      }),
    ).resolves.toEqual({
      failedCount: 3,
      locked: true,
      lockedUntil: new Date("2026-05-29T00:05:00.000Z"),
    });

    expect(mocks.rpc).toHaveBeenCalledWith("record_login_failure", {
      p_identifier_hash: "sha256:abc",
      p_now: "2026-05-29T00:00:00.000Z",
      p_provider: "supabase",
    });
    expect(mocks.rpc).toHaveBeenCalledWith("insert_login_audit_event", {
      p_account_id: null,
      p_event_type: "locked",
      p_identifier_hash: "sha256:abc",
      p_provider: "supabase",
      p_reason: "invalid_credentials",
    });
  });

  it("audits blocked attempts without storing the raw identifier", async () => {
    const { recordLoginBlocked } = await import("./login-guard");
    mocks.rpcDirect.mockResolvedValueOnce({ error: null });

    await recordLoginBlocked({
      identifierHash: "sha256:abc",
      provider: "supabase",
      reason: "lockout",
    });

    expect(mocks.rpc).toHaveBeenCalledWith("insert_login_audit_event", {
      p_account_id: null,
      p_event_type: "blocked",
      p_identifier_hash: "sha256:abc",
      p_provider: "supabase",
      p_reason: "lockout",
    });
  });

  it("clears attempt state and audits success without storing the raw identifier", async () => {
    const { recordLoginSuccess } = await import("./login-guard");
    mocks.rpcDirect.mockResolvedValue({ error: null });

    await recordLoginSuccess({
      accountId: "00000000-0000-0000-0000-000000000001",
      identifierHash: "sha256:abc",
      provider: "supabase",
    });

    expect(mocks.rpc).toHaveBeenCalledWith("clear_login_attempt_state", {
      p_identifier_hash: "sha256:abc",
      p_provider: "supabase",
    });
    expect(mocks.rpc).toHaveBeenCalledWith("insert_login_audit_event", {
      p_account_id: "00000000-0000-0000-0000-000000000001",
      p_event_type: "success",
      p_identifier_hash: "sha256:abc",
      p_provider: "supabase",
      p_reason: null,
    });
  });
});

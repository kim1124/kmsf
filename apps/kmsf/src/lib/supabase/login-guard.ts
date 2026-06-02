import type { LoginGuardEventType } from "@/lib/auth/login-guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type LoginGuardInput = {
  identifierHash: string;
  provider: string;
};

export type LoginGuardCheckInput = LoginGuardInput & {
  now?: Date;
};

export type LoginGuardFailureInput = LoginGuardInput & {
  now?: Date;
  reason?: string;
};

export type LoginGuardSuccessInput = LoginGuardInput & {
  accountId?: string | null;
  now?: Date;
  reason?: string;
};

export type LoginGuardBlockedInput = LoginGuardInput & {
  accountId?: string | null;
  now?: Date;
  reason?: string;
};

export type LoginGuardResult =
  | {
      failedCount: number;
      locked: false;
      lockedUntil: null;
    }
  | {
      failedCount: number;
      locked: true;
      lockedUntil: Date;
    };

type LoginAttemptStateRow = {
  failed_count: number | null;
  locked_until: string | null;
};

type SupabaseErrorLike = {
  message?: string;
};

export class LoginGuardError extends Error {
  constructor(
    public readonly operation: "audit" | "check" | "clear" | "record_failure",
    message: string,
  ) {
    super(message);
    this.name = "LoginGuardError";
  }
}

export async function checkLoginGuard(input: LoginGuardCheckInput): Promise<LoginGuardResult> {
  const now = input.now ?? new Date();
  const state = await readAttemptState(input);

  return toGuardResult(state, now);
}

export async function recordLoginFailure(
  input: LoginGuardFailureInput,
): Promise<LoginGuardResult> {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const { data, error } = await supabaseAdmin()
    .rpc("record_login_failure", {
      p_identifier_hash: input.identifierHash,
      p_now: timestamp,
      p_provider: input.provider,
    })
    .single<LoginAttemptStateRow>();

  if (error || !data) {
    throw new LoginGuardError(
      "record_failure",
      error ? formatSupabaseError(error) : "Supabase login guard returned no state.",
    );
  }

  const result = toGuardResult(data, now);

  await insertAuditEvent({
    eventType: result.locked ? "locked" : "failed",
    identifierHash: input.identifierHash,
    provider: input.provider,
    reason: input.reason ?? null,
  });

  return result;
}

export async function recordLoginSuccess(input: LoginGuardSuccessInput) {
  await callVoidRpc("clear", "clear_login_attempt_state", {
    p_identifier_hash: input.identifierHash,
    p_provider: input.provider,
  });

  await insertAuditEvent({
    accountId: input.accountId ?? null,
    eventType: "success",
    identifierHash: input.identifierHash,
    provider: input.provider,
    reason: input.reason ?? null,
  });
}

export async function recordLoginBlocked(input: LoginGuardBlockedInput) {
  await insertAuditEvent({
    accountId: input.accountId ?? null,
    eventType: "blocked",
    identifierHash: input.identifierHash,
    provider: input.provider,
    reason: input.reason ?? "lockout",
  });
}

async function readAttemptState(input: LoginGuardInput) {
  const { data, error } = await supabaseAdmin()
    .rpc("check_login_guard", {
      p_identifier_hash: input.identifierHash,
      p_provider: input.provider,
    })
    .maybeSingle<LoginAttemptStateRow>();

  if (error) {
    throw new LoginGuardError("check", formatSupabaseError(error));
  }

  return data;
}

function supabaseAdmin() {
  return createSupabaseAdminClient();
}

function toGuardResult(
  state: LoginAttemptStateRow | null,
  now: Date,
): LoginGuardResult {
  const failedCount = state?.failed_count ?? 0;
  const lockedUntil = state?.locked_until ? new Date(state.locked_until) : null;

  if (lockedUntil && lockedUntil.getTime() > now.getTime()) {
    return {
      failedCount,
      locked: true,
      lockedUntil,
    };
  }

  return {
    failedCount,
    locked: false,
    lockedUntil: null,
  };
}

async function insertAuditEvent(input: {
  accountId?: string | null;
  eventType: LoginGuardEventType;
  identifierHash: string;
  provider: string;
  reason?: string | null;
}) {
  await callVoidRpc("audit", "insert_login_audit_event", {
    p_account_id: input.accountId ?? null,
    p_event_type: input.eventType,
    p_identifier_hash: input.identifierHash,
    p_provider: input.provider,
    p_reason: input.reason ?? null,
  });
}

async function callVoidRpc(
  operation: "audit" | "clear",
  fn: string,
  args: Record<string, unknown>,
) {
  const { error } = await supabaseAdmin().rpc(fn, args);

  if (error) {
    throw new LoginGuardError(operation, formatSupabaseError(error));
  }
}

function formatSupabaseError(error: SupabaseErrorLike) {
  return error.message ?? "Supabase login guard operation failed.";
}

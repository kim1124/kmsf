export type SystemResetErrorCode =
  | "auth"
  | "confirmation"
  | "reset"
  | "risk"
  | "security"
  | "service-role"
  | "unauthorized";

export type SystemResetMode = "factory" | "settings";

export const SYSTEM_RESET_CONFIRMATIONS = {
  factory: "공장초기화",
  settings: "설정초기화",
} satisfies Record<SystemResetMode, string>;

export const SYSTEM_RESET_CONFIRMATION = SYSTEM_RESET_CONFIRMATIONS.factory;

export const SYSTEM_RESET_MODES = {
  factory: { enabled: true, label: "공장 초기화" },
  settings: { enabled: true, label: "설정만 초기화" },
} satisfies Record<SystemResetMode, { enabled: boolean; label: string }>;

export function normalizeSystemResetMode(value: FormDataEntryValue | null): SystemResetMode {
  return value === "settings" ? "settings" : "factory";
}

export function getSystemResetConfirmation(mode: SystemResetMode) {
  return SYSTEM_RESET_CONFIRMATIONS[mode];
}

export function isSystemResetConfirmationValid(mode: SystemResetMode, value: string): boolean;
export function isSystemResetConfirmationValid(value: string): boolean;
export function isSystemResetConfirmationValid(
  modeOrValue: SystemResetMode | string,
  value?: string,
) {
  const mode = value === undefined ? "factory" : (modeOrValue as SystemResetMode);
  const confirmation = value === undefined ? modeOrValue : value;

  return confirmation.trim() === getSystemResetConfirmation(mode);
}

export function formatSystemResetErrorRoute(error: SystemResetErrorCode) {
  return `/settings?section=reset&systemResetError=${error}`;
}

export function formatSystemResetSuccessRoute(mode: SystemResetMode = "factory") {
  if (mode === "settings") {
    return "/sign-in?success=settings-reset";
  }

  return "/setup/initial-admin?reset=success";
}

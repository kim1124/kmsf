export const SYSTEM_RESET_CONFIRMATION = "초기화";

export type SystemResetErrorCode =
  | "auth"
  | "confirmation"
  | "reset"
  | "security"
  | "service-role"
  | "unauthorized";

export type SystemResetMode = "factory" | "settings";

export const SYSTEM_RESET_MODES = {
  factory: { enabled: true, label: "공장 초기화" },
  settings: { enabled: false, label: "설정만 초기화" },
} satisfies Record<SystemResetMode, { enabled: boolean; label: string }>;

export function isSystemResetConfirmationValid(value: string) {
  return value.trim() === SYSTEM_RESET_CONFIRMATION;
}

export function formatSystemResetErrorRoute(error: SystemResetErrorCode) {
  return `/settings?section=reset&systemResetError=${error}`;
}

export function formatSystemResetSuccessRoute() {
  return "/setup/initial-admin?reset=success";
}

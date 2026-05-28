import Link from "next/link";

import {
  linkGoogleIdentityAction,
  unlinkGoogleIdentityAction,
} from "@/app/[locale]/(protected)/actions";
import { SystemResetPanel } from "@/components/settings/system-reset-panel";
import { Button } from "@/components/ui/button";
import type { AccountDirectoryResult } from "@/lib/auth/account-directory";
import type { SettingsSection } from "@/lib/auth/access-policy";
import type { RuntimeAuthProviderResult } from "@/lib/auth/providers/runtime-auth-provider";
import type { AppSessionUser } from "@/lib/auth/session";
import type { ProjectSetupConfig } from "@/lib/setup/project-setup-config";
import { cn } from "@/lib/utils";

type SettingsPageContentProps = {
  accountDirectory: AccountDirectoryResult | null;
  activeSection: SettingsSection;
  canManageAccounts: boolean;
  csrfToken: string;
  googleAvailable: boolean;
  googleIdentity: {
    canUnlink: boolean;
    identity: unknown;
    isLinked: boolean;
  };
  locale: string;
  runtimeProvider: RuntimeAuthProviderResult;
  setupConfig: ProjectSetupConfig | null;
  systemResetError: string | null;
  user: AppSessionUser | null;
};

const copy = {
  en: {
    accountMenu: "Account management",
    accountTitle: "Account management",
    accountDescription: "Level 3 accounts can review users registered in the active auth store.",
    columns: {
      createdAt: "Joined",
      email: "E-mail",
      id: "ID",
      lastSignedInAt: "Last sign-in",
      name: "Name",
      note: "Note",
    },
    empty: "No registered accounts were found.",
    fallback: (attempts: number) =>
      `Supabase checks failed ${attempts} times. The app is running with Local DB.`,
    fields: {
      auth: "Session auth mode",
      email: "E-mail",
      level: "Account level",
      name: "ID",
      provider: "Active auth provider",
      role: "Role",
      setupProvider: "Initial setup environment",
      setupUpdatedAt: "Setup updated",
    },
    google: {
      link: "Link Google account",
      linked: "Google sign-in is linked to this account.",
      notLinked: "Google sign-in is not linked to this account.",
      title: "Google account linking",
      unavailable: "Google linking is unavailable in Local DB mode or without Supabase setup.",
      unlink: "Unlink Google",
    },
    notConfigured: "Not configured",
    reset: {
      button: "Reset system",
      confirm: "Proceed reset",
      confirmation: "Confirmation text",
      confirmationPlaceholder: "Type 초기화",
      description:
        "Factory reset removes all accounts and setup state for the active auth provider. The initial admin setup page opens again after completion.",
      dialogDescription: "Enter the current administrator password and type 초기화 to continue.",
      dialogTitle: "Confirm system reset",
      password: "Administrator password",
      settingsOnlyComingSoon: "Settings-only reset is reserved as a later mode and is not active yet.",
      title: "System reset",
    },
    resetErrors: {
      auth: "The administrator password is incorrect.",
      confirmation: "The confirmation text does not match.",
      reset: "System reset could not be completed.",
      security: "The security token is invalid. Refresh the page and try again.",
      "service-role": "A server-side Supabase key is required to reset Supabase data.",
      unauthorized: "Only level 3 administrators can reset the system.",
    },
    resetMenu: "System reset",
    role: {
      admin: "Admin",
      member: "Member",
    },
    runtimeTitle: "Current runtime",
    securityDescription: "Google sign-in becomes available after Supabase is connected.",
    securityTitle: "Security and integrations",
    setupProviders: {
      "local-json": "Local DB",
      supabase: "Supabase",
    },
    systemDescription: "Review the initial KMSF setup environment and active auth runtime.",
    systemMenu: "System information",
    systemTitle: "System information",
    unavailable: {
      "service-role-required":
        "A server-side Supabase key is required to load account management data.",
      "supabase-query-failed": "Supabase account data could not be loaded.",
      "supabase-unconfigured": "Supabase is not configured.",
    },
  },
  ko: {
    accountMenu: "계정 관리",
    accountTitle: "계정 관리",
    accountDescription: "레벨 3 계정에서 현재 인증 저장소에 가입된 계정을 확인합니다.",
    columns: {
      createdAt: "가입일자",
      email: "E-mail",
      id: "ID",
      lastSignedInAt: "최근 접속 시간",
      name: "이름",
      note: "비고",
    },
    empty: "가입된 계정이 없습니다.",
    fallback: (attempts: number) =>
      `Supabase 확인 ${attempts}회 실패 후 Local DB 인증으로 동작 중입니다.`,
    fields: {
      auth: "세션 인증 방식",
      email: "E-mail",
      level: "현재 계정 레벨",
      name: "ID",
      provider: "현재 동작 인증",
      role: "권한",
      setupProvider: "초기 설정 환경",
      setupUpdatedAt: "설정 변경 일시",
    },
    google: {
      link: "Google 계정 연결",
      linked: "현재 계정에 Google 로그인이 연결되어 있습니다.",
      notLinked: "현재 계정에 Google 로그인이 연결되어 있지 않습니다.",
      title: "Google 계정 연결",
      unavailable: "Local DB 또는 Supabase 미설정 환경에서는 Google 계정 연결을 사용할 수 없습니다.",
      unlink: "Google 연결 해제",
    },
    notConfigured: "미설정",
    reset: {
      button: "시스템 초기화",
      confirm: "초기화 진행",
      confirmation: "확인 문구",
      confirmationPlaceholder: "초기화",
      description:
        "공장 초기화는 현재 인증 저장소의 모든 계정과 설정 상태를 삭제합니다. 완료 후 초기 관리자 추가 화면이 다시 열립니다.",
      dialogDescription: "현재 관리자 비밀번호를 입력하고 확인 문구로 초기화를 입력해야 진행됩니다.",
      dialogTitle: "시스템 초기화 확인",
      password: "관리자 비밀번호",
      settingsOnlyComingSoon: "계정을 유지하고 설정만 초기화하는 기능은 후속 모드로 준비 중입니다.",
      title: "시스템 초기화",
    },
    resetErrors: {
      auth: "관리자 비밀번호가 올바르지 않습니다.",
      confirmation: "확인 문구가 일치하지 않습니다.",
      reset: "시스템 초기화를 완료할 수 없습니다.",
      security: "보안 토큰이 유효하지 않습니다. 페이지를 새로고침 후 다시 시도해 주세요.",
      "service-role": "Supabase 데이터를 초기화하려면 서버 전용 Supabase 키가 필요합니다.",
      unauthorized: "레벨 3 관리자만 시스템을 초기화할 수 있습니다.",
    },
    resetMenu: "시스템 초기화",
    role: {
      admin: "관리자",
      member: "일반",
    },
    runtimeTitle: "현재 실행 환경",
    securityDescription: "Google 로그인은 Supabase 연동 후 사용할 수 있습니다.",
    securityTitle: "보안 및 연동",
    setupProviders: {
      "local-json": "Local DB",
      supabase: "Supabase",
    },
    systemDescription: "KMSF 초기 설정 환경과 현재 인증 실행 상태를 확인합니다.",
    systemMenu: "시스템 정보",
    systemTitle: "시스템 정보",
    unavailable: {
      "service-role-required": "계정 관리 데이터를 불러오려면 서버 전용 Supabase 키가 필요합니다.",
      "supabase-query-failed": "Supabase 계정 데이터를 불러올 수 없습니다.",
      "supabase-unconfigured": "Supabase가 설정되어 있지 않습니다.",
    },
  },
} as const;

function getCopy(locale: string) {
  return locale === "en" ? copy.en : copy.ko;
}

function formatTimestamp(value: string | null, locale: string) {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "ko-KR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getAuthModeLabel(mode: AppSessionUser["authMode"] | RuntimeAuthProviderResult["provider"], locale: string) {
  const labels =
    locale === "en"
      ? {
          demo: "Demo",
          google: "Google",
          "local-json": "Local DB",
          password: "ID / Password",
          supabase: "Supabase",
        }
      : {
          demo: "데모",
          google: "Google",
          "local-json": "Local DB",
          password: "ID / 비밀번호",
          supabase: "Supabase",
        };

  return labels[mode] ?? mode;
}

function SettingsMenuLink({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 items-center rounded-md px-3 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-foreground/70 hover:bg-panel-hover hover:text-foreground",
      )}
      href={href}
    >
      {label}
    </Link>
  );
}

export function SettingsPageContent({
  accountDirectory,
  activeSection,
  canManageAccounts,
  csrfToken,
  googleAvailable,
  googleIdentity,
  locale,
  runtimeProvider,
  setupConfig,
  systemResetError,
  user,
}: SettingsPageContentProps) {
  const t = getCopy(locale);

  return (
    <section className="grid gap-4 lg:grid-cols-[16rem_1fr]">
      <aside className="content-panel h-fit p-3">
        <nav aria-label="설정 메뉴" className="flex flex-col gap-1">
          <SettingsMenuLink
            active={activeSection === "system"}
            href="/settings?section=system"
            label={t.systemMenu}
          />
          {canManageAccounts ? (
            <SettingsMenuLink
              active={activeSection === "accounts"}
              href="/settings?section=accounts"
              label={t.accountMenu}
            />
          ) : null}
          {canManageAccounts ? (
            <SettingsMenuLink
              active={activeSection === "reset"}
              href="/settings?section=reset"
              label={t.resetMenu}
            />
          ) : null}
        </nav>
      </aside>

      <div className="min-w-0">
        {activeSection === "reset" && canManageAccounts ? (
          <SystemResetPanel
            csrfToken={csrfToken}
            errorMessage={
              systemResetError && systemResetError in t.resetErrors
                ? t.resetErrors[systemResetError as keyof typeof t.resetErrors]
                : null
            }
            labels={t.reset}
          />
        ) : activeSection === "accounts" && canManageAccounts ? (
          <article className="content-panel p-6">
            <div>
              <h3 className="text-lg font-semibold">{t.accountTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-foreground/65">{t.accountDescription}</p>
            </div>

            {accountDirectory?.unavailableReason ? (
              <div className="mt-6 rounded-[var(--kmsf-radius-xl)] border border-border bg-surface p-4 text-sm text-foreground/70">
                {t.unavailable[accountDirectory.unavailableReason]}
              </div>
            ) : accountDirectory?.accounts.length ? (
              <div className="mt-6 max-h-[420px] overflow-x-auto overflow-y-auto rounded-[var(--kmsf-radius-xl)] border border-border">
                <table className="min-w-[56rem] divide-y divide-border text-sm">
                  <thead className="sticky top-0 bg-surface">
                    <tr className="text-left text-foreground/60">
                      <th className="px-4 py-3 font-medium" scope="col">
                        {t.columns.id}
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        {t.columns.name}
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        {t.columns.email}
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        {t.columns.createdAt}
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        {t.columns.lastSignedInAt}
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        {t.columns.note}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {accountDirectory.accounts.map((account) => (
                      <tr key={account.id}>
                        <td className="whitespace-nowrap px-4 py-3 font-medium">{account.username}</td>
                        <td className="whitespace-nowrap px-4 py-3">{account.displayName}</td>
                        <td className="whitespace-nowrap px-4 py-3">{account.email}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {formatTimestamp(account.createdAt, locale)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {formatTimestamp(account.lastSignedInAt, locale)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          Level {account.level} / {t.role[account.role]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-6 rounded-[var(--kmsf-radius-xl)] border border-border bg-surface p-4 text-sm text-foreground/70">
                {t.empty}
              </div>
            )}
          </article>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="content-panel p-6">
              <h3 className="text-lg font-semibold">{t.systemTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-foreground/65">{t.systemDescription}</p>
              <dl className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[var(--kmsf-radius-xl)] border border-border bg-surface p-4">
                  <dt className="text-sm text-foreground/60">{t.fields.setupProvider}</dt>
                  <dd className="mt-2 font-medium">
                    {setupConfig ? t.setupProviders[setupConfig.authProvider] : t.notConfigured}
                  </dd>
                </div>
                <div className="rounded-[var(--kmsf-radius-xl)] border border-border bg-surface p-4">
                  <dt className="text-sm text-foreground/60">{t.fields.provider}</dt>
                  <dd className="mt-2 font-medium">
                    {getAuthModeLabel(runtimeProvider.provider, locale)}
                  </dd>
                  {runtimeProvider.reason === "supabase-unavailable" ? (
                    <p className="mt-2 text-xs leading-5 text-foreground/60">
                      {t.fallback(runtimeProvider.attempts)}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-[var(--kmsf-radius-xl)] border border-border bg-surface p-4">
                  <dt className="text-sm text-foreground/60">{t.fields.setupUpdatedAt}</dt>
                  <dd className="mt-2 font-medium">
                    {formatTimestamp(setupConfig?.updatedAt ?? null, locale)}
                  </dd>
                </div>
                <div className="rounded-[var(--kmsf-radius-xl)] border border-border bg-surface p-4">
                  <dt className="text-sm text-foreground/60">{t.fields.auth}</dt>
                  <dd className="mt-2 font-medium">
                    {user?.authMode ? getAuthModeLabel(user.authMode, locale) : getAuthModeLabel("demo", locale)}
                  </dd>
                </div>
                <div className="rounded-[var(--kmsf-radius-xl)] border border-border bg-surface p-4">
                  <dt className="text-sm text-foreground/60">{t.fields.name}</dt>
                  <dd className="mt-2 font-medium">{user?.displayName ?? "-"}</dd>
                </div>
                <div className="rounded-[var(--kmsf-radius-xl)] border border-border bg-surface p-4">
                  <dt className="text-sm text-foreground/60">{t.fields.email}</dt>
                  <dd className="mt-2 font-medium">{user?.email ?? "-"}</dd>
                </div>
                <div className="rounded-[var(--kmsf-radius-xl)] border border-border bg-surface p-4">
                  <dt className="text-sm text-foreground/60">{t.fields.role}</dt>
                  <dd className="mt-2 font-medium">{user?.role ? t.role[user.role] : "-"}</dd>
                </div>
                <div className="rounded-[var(--kmsf-radius-xl)] border border-border bg-surface p-4">
                  <dt className="text-sm text-foreground/60">{t.fields.level}</dt>
                  <dd className="mt-2 font-medium">{user ? `Level ${user.level}` : "-"}</dd>
                </div>
              </dl>
            </article>

            <article className="content-panel p-6">
              <h3 className="text-lg font-semibold">{t.securityTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-foreground/65">{t.securityDescription}</p>
              <div className="mt-6 rounded-[var(--kmsf-radius-xl)] border border-border bg-surface p-4">
                <p className="text-sm font-medium text-foreground">{t.google.title}</p>
                <p className="mt-2 text-sm leading-6 text-foreground/65">
                  {googleAvailable
                    ? googleIdentity.isLinked
                      ? t.google.linked
                      : t.google.notLinked
                    : t.google.unavailable}
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  {googleIdentity.isLinked ? (
                    <form action={unlinkGoogleIdentityAction}>
                      <input type="hidden" name="csrfToken" value={csrfToken} />
                      <Button
                        className="w-full"
                        disabled={!googleIdentity.canUnlink}
                        type="submit"
                        variant="secondary"
                      >
                        {t.google.unlink}
                      </Button>
                    </form>
                  ) : (
                    <form action={linkGoogleIdentityAction}>
                      <input type="hidden" name="csrfToken" value={csrfToken} />
                      <Button className="w-full" disabled={!googleAvailable} type="submit">
                        {t.google.link}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </article>
          </div>
        )}
      </div>
    </section>
  );
}

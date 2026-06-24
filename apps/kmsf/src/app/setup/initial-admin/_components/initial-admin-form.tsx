"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileStack,
  HardDrive,
  KeyRound,
  Layers3,
  Lightbulb,
  Loader2,
  PanelBottom,
  PanelLeft,
  PanelRight,
  PanelTop,
  Server,
  Settings2,
} from "lucide-react";
import { startTransition, useActionState, useEffect, useMemo, useState } from "react";

import {
  createInitialAdminAction,
  type InitialAdminFormState,
} from "@/app/setup/initial-admin/actions";
import { FieldWithTooltip } from "@/components/auth/_components/field-with-tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { RuntimeAuthProviderResult } from "@/lib/auth/providers/runtime-auth-provider";
import {
  createEmptyAccountFieldErrors,
  getLiveAccountFieldErrors,
  INITIAL_ADMIN_USERNAME,
  sanitizeEmailInput,
  type AccountFieldErrors,
  type AccountFields,
} from "@/lib/auth/validation";
import {
  DEFAULT_GNB_REGIONS,
  GNB_REGIONS,
  type GnbRegion,
} from "@/lib/layout/gnb-layout-config";
import type {
  AppConfigStorageMode,
  AuthMode,
  DbMode,
  MenuSourceMode,
} from "@/lib/setup/project-setup-config";
import { cn } from "@/lib/utils";

type SetupStep =
  | "welcome"
  | "layout"
  | "database"
  | "auth"
  | "storage"
  | "menu"
  | "admin"
  | "processing"
  | "completed";

type InitialAdminFormValues = Pick<AccountFields, "email" | "password" | "passwordConfirm">;
type InitialAdminClientFieldErrors = Pick<
  AccountFieldErrors,
  "email" | "password" | "passwordConfirm"
>;

type InitialAdminFormProps = {
  csrfToken: string;
  runtimeProvider: RuntimeAuthProviderResult;
  labels: {
    title: string;
    description: string;
    providerTitle: string;
    providerDescription: string;
    supabaseTitle: string;
    supabaseDescription: string;
    supabaseUnavailable: string;
    localTitle: string;
    localDescription: string;
    layoutTitle: string;
    layoutDescription: string;
    layoutRegions: Record<GnbRegion, { description: string; title: string }>;
    serverDbTitle: string;
    serverDbDescription: string;
    serverDbBadge: string;
    fallbackNotice: string;
    adminTitle: string;
    adminDescription: string;
    adminLevel: string;
    email: string;
    password: string;
    passwordConfirm: string;
    previous: string;
    next: string;
    processingTitle: string;
    processingDescription: string;
  };
  tooltips: {
    email: string;
    password: string;
    passwordConfirm: string;
  };
  messages: {
    authFailed: string;
    duplicateUsername: string;
    securityFailed: string;
    setupWriteFailed: string;
    supabaseUnavailable: string;
    fieldErrors: {
      email: {
        invalid: string;
        duplicate: string;
      };
      password: {
        invalid: string;
      };
      passwordConfirm: {
        invalid: string;
        mismatch: string;
      };
    };
  };
};

const INITIAL_ADMIN_DISPLAY_NAME = "admin";

const emptyInitialAdminFormValues: InitialAdminFormValues = {
  email: "",
  password: "",
  passwordConfirm: "",
};

const emptyInitialAdminClientErrors: InitialAdminClientFieldErrors = {
  email: null,
  password: null,
  passwordConfirm: null,
};

const initialState: InitialAdminFormState = {
  authError: null,
  fields: {
    appConfigStorageMode: "local-storage",
    authMode: "manual",
    authProvider: "local-json",
    dbMode: "none",
    displayName: INITIAL_ADMIN_DISPLAY_NAME,
    email: "",
    gnbRegions: [...DEFAULT_GNB_REGIONS],
    menuSourceMode: "manual",
    password: "",
    passwordConfirm: "",
    username: INITIAL_ADMIN_USERNAME,
  },
  fieldErrors: {
    ...createEmptyAccountFieldErrors(),
    displayName: null,
  },
  setupComplete: false,
};

function getInitialAdminFieldErrors(
  fields: InitialAdminFormValues,
): InitialAdminClientFieldErrors {
  const fieldErrors = getLiveAccountFieldErrors({
    username: INITIAL_ADMIN_USERNAME,
    ...fields,
  });

  return {
    email: fieldErrors.email,
    password: fieldErrors.password,
    passwordConfirm: fieldErrors.passwordConfirm,
  };
}

function hasFieldError(fieldErrors: object) {
  return Object.values(fieldErrors).some(Boolean);
}

function getLayoutRegionIcon(region: GnbRegion) {
  if (region === "left") {
    return <PanelLeft className="h-5 w-5" />;
  }

  if (region === "right") {
    return <PanelRight className="h-5 w-5" />;
  }

  if (region === "footer") {
    return <PanelBottom className="h-5 w-5" />;
  }

  return <PanelTop className="h-5 w-5" />;
}

function getErrorMessage(
  field: keyof InitialAdminFormProps["messages"]["fieldErrors"],
  code: string | null,
  messages: InitialAdminFormProps["messages"]["fieldErrors"],
) {
  if (!code) {
    return null;
  }

  if (field === "email") {
    return code === "duplicate.email" ? messages.email.duplicate : messages.email.invalid;
  }

  if (field === "password") {
    return messages.password.invalid;
  }

  if (code === "passwordConfirm.mismatch") {
    return messages.passwordConfirm.mismatch;
  }

  return messages.passwordConfirm.invalid;
}

function getAuthErrorMessage(
  authError: InitialAdminFormState["authError"],
  messages: InitialAdminFormProps["messages"],
) {
  if (authError === "security.invalid") {
    return messages.securityFailed;
  }

  if (authError === "duplicate.username") {
    return messages.duplicateUsername;
  }

  if (authError === "setup.write-failed") {
    return messages.setupWriteFailed;
  }

  if (authError === "supabase.unavailable") {
    return messages.supabaseUnavailable;
  }

  return messages.authFailed;
}

function OptionCard<T extends string>({
  checked,
  children,
  disabled,
  icon,
  name,
  onChange,
  title,
  value,
}: {
  checked: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  icon: React.ReactNode;
  name: string;
  onChange: (value: T) => void;
  title: string;
  value: T;
}) {
  return (
    <label
      className={cn(
        "flex min-h-[5.5rem] cursor-pointer items-center gap-4 rounded-[var(--kmsf-radius-lg)] border border-border bg-surface p-4 transition-colors",
        checked && "border-accent bg-panel-hover",
        disabled && "cursor-not-allowed opacity-55",
      )}
    >
      <input
        checked={checked}
        className="mt-1 h-4 w-4 accent-[var(--kmsf-color-accent)]"
        disabled={disabled}
        name={name}
        onChange={() => onChange(value)}
        type="radio"
        value={value}
      />
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--kmsf-radius-md)] border border-border bg-panel text-accent">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="mt-2 block text-sm leading-6 text-foreground/65">{children}</span>
      </span>
    </label>
  );
}

export function InitialAdminForm({
  csrfToken,
  labels,
  runtimeProvider,
  tooltips,
  messages,
}: InitialAdminFormProps) {
  const [state, formAction, isPending] = useActionState(createInitialAdminAction, initialState);
  const [supabaseStatus, setSupabaseStatus] = useState<"checking" | "ready" | "unavailable">(
    runtimeProvider.provider === "supabase" ? "ready" : "checking",
  );
  const canUseSupabase = supabaseStatus === "ready";
  const hasSupabaseFallback = runtimeProvider.reason === "supabase-unavailable";
  const [step, setStep] = useState<SetupStep>("welcome");
  const [selectedDbMode, setSelectedDbMode] = useState<DbMode>("none");
  const [selectedAuthMode, setSelectedAuthMode] = useState<AuthMode>("manual");
  const [selectedStorageMode, setSelectedStorageMode] =
    useState<AppConfigStorageMode>("local-storage");
  const [selectedMenuSourceMode, setSelectedMenuSourceMode] =
    useState<MenuSourceMode>("manual");
  const [selectedGnbRegions, setSelectedGnbRegions] = useState<GnbRegion[]>([
    ...DEFAULT_GNB_REGIONS,
  ]);
  const [formValues, setFormValues] =
    useState<InitialAdminFormValues>(emptyInitialAdminFormValues);
  const [clientErrors, setClientErrors] =
    useState<InitialAdminClientFieldErrors>(emptyInitialAdminClientErrors);
  const [touchedFields, setTouchedFields] = useState<Record<keyof InitialAdminFormValues, boolean>>({
    email: false,
    password: false,
    passwordConfirm: false,
  });

  const shouldShowAuthStep = selectedDbMode !== "none";
  const shouldCreateAdmin = shouldShowAuthStep && selectedAuthMode !== "manual";
  const serverReturnedErrors = state.authError || hasFieldError(state.fieldErrors);
  const visibleStep =
    state.setupComplete
      ? "completed"
      : !isPending && step === "processing" && serverReturnedErrors
      ? shouldCreateAdmin
        ? "admin"
        : "menu"
      : step;
  const stepItems = useMemo(
    () =>
      [
        ["welcome", "환영"] as const,
        ["layout", labels.layoutTitle] as const,
        ["database", "DB 선택"] as const,
        ...(shouldShowAuthStep ? ([["auth", "인증 선택"]] as const) : []),
        ["storage", "설정 저장"] as const,
        ["menu", "메뉴 설정"] as const,
        ...(shouldCreateAdmin ? ([["admin", labels.adminTitle]] as const) : []),
        ["processing", labels.processingTitle] as const,
        ...(state.setupComplete ? ([["completed", "완료"]] as const) : []),
      ],
    [
      labels.adminTitle,
      labels.layoutTitle,
      labels.processingTitle,
      shouldCreateAdmin,
      shouldShowAuthStep,
      state.setupComplete,
    ],
  );

  useEffect(() => {
    let cancelled = false;

    if (runtimeProvider.provider === "supabase") {
      return () => {
        cancelled = true;
      };
    }

    fetch("/api/setup/supabase-status", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { available: false }))
      .then((result: { available?: boolean }) => {
        if (!cancelled) {
          setSupabaseStatus(result.available ? "ready" : "unavailable");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSupabaseStatus("unavailable");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [runtimeProvider.provider]);

  useEffect(() => {
    if (state.setupComplete && window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }
  }, [state.setupComplete]);

  function handleDbModeChange(value: DbMode) {
    setSelectedDbMode(value);

    if (value === "none") {
      setSelectedAuthMode("manual");
      setSelectedStorageMode((current) => (current === "connected-db" ? "local-storage" : current));
      return;
    }

    if (value === "supabase") {
      setSelectedAuthMode((current) => (current === "kmsf-managed" ? "supabase" : current));
      return;
    }

    setSelectedAuthMode((current) => (current === "supabase" ? "kmsf-managed" : current));
  }

  function toggleGnbRegion(region: GnbRegion) {
    setSelectedGnbRegions((regions) => {
      if (regions.includes(region)) {
        return regions.filter((value) => value !== region);
      }

      return GNB_REGIONS.filter((value) => value === region || regions.includes(value));
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const nextValue = name === "email" ? sanitizeEmailInput(value) : value;
    const newValues = { ...formValues, [name]: nextValue };
    setFormValues(newValues);
    setClientErrors(getInitialAdminFieldErrors(newValues));
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const field = e.target.name as keyof InitialAdminFormValues;
    setTouchedFields((current) => ({ ...current, [field]: true }));
  }

  function getVisibleError(field: keyof InitialAdminFormValues) {
    return (
      (touchedFields[field]
        ? getErrorMessage(field, clientErrors[field], messages.fieldErrors)
        : null) || getErrorMessage(field, state.fieldErrors[field], messages.fieldErrors)
    );
  }

  function submitInitialSetup(formData: FormData) {
    if (shouldCreateAdmin) {
      const nextErrors = getInitialAdminFieldErrors(formValues);
      setClientErrors(nextErrors);

      if (hasFieldError(nextErrors)) {
        setTouchedFields({
          email: true,
          password: true,
          passwordConfirm: true,
        });
        return;
      }
    }

    setStep("processing");
    window.setTimeout(() => {
      startTransition(() => {
        formAction(formData);
      });
    }, 250);
  }

  function goBackFromStorage() {
    setStep(shouldShowAuthStep ? "auth" : "database");
  }

  return (
    <form action={submitInitialSetup} noValidate>
      <Card className="w-full max-w-3xl p-0">
        <input type="hidden" name="csrfToken" value={csrfToken} />
        <input type="hidden" name="dbMode" value={selectedDbMode} />
        <input type="hidden" name="authMode" value={selectedAuthMode} />
        <input type="hidden" name="appConfigStorageMode" value={selectedStorageMode} />
        <input type="hidden" name="menuSourceMode" value={selectedMenuSourceMode} />
        {selectedGnbRegions.map((region) => (
          <input key={region} type="hidden" name="gnbRegions" value={region} />
        ))}

        <div className="border-b border-border px-6 py-5 md:px-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-foreground/55">
            {stepItems.map(([stepKey, label], index) => (
              <span className="contents" key={stepKey}>
                {index > 0 ? <span>/</span> : null}
                <span className={cn(visibleStep === stepKey && "text-accent")}>
                  {index + 1}. {label}
                </span>
              </span>
            ))}
          </div>
          <CardTitle className="mt-3 text-2xl md:text-3xl">{labels.title}</CardTitle>
          <CardDescription className="mt-2">{labels.description}</CardDescription>
        </div>

        {visibleStep === "welcome" ? (
          <section className="px-6 py-6 md:px-8">
            <CardTitle>환영합니다.</CardTitle>
            <CardDescription className="mt-2">
              레이아웃, 데이터 베이스, 인증, 메뉴 구성 등을 쉽게 설정할 수 있습니다.
              물론, 처음부터 끝까지 마음대로 구성해도 됩니다.
            </CardDescription>
            <div className="mt-6 flex gap-3 rounded-[var(--kmsf-radius-lg)] border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0" />
              <p>모든 설정은 선택 사항입니다. 개발자가 원하는 방식으로 결정할 수 있습니다.</p>
            </div>
            <div className="mt-8 flex justify-end">
              <Button onClick={() => setStep("layout")} type="button">
                {labels.next}
              </Button>
            </div>
          </section>
        ) : null}

        {visibleStep === "layout" ? (
          <section className="px-6 py-6 md:px-8">
            <CardTitle>{labels.layoutTitle}</CardTitle>
            <CardDescription className="mt-2">
              초기 프로젝트 프레임워크에서 사용할 GNB 영역을 선택합니다. 기본값은
              TOP, Left Side입니다.
            </CardDescription>

            {selectedGnbRegions.length === 0 ? (
              <div
                className="mt-5 flex gap-3 rounded-[var(--kmsf-radius-md)] border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100"
                role="alert"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <p>선택한 GNB 영역이 없습니다. 완료 후에는 KMSF App 페이지만 표시됩니다.</p>
              </div>
            ) : null}

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {GNB_REGIONS.map((region) => {
                const checked = selectedGnbRegions.includes(region);
                const regionLabels = labels.layoutRegions[region];

                return (
                  <label
                    key={region}
                    className={cn(
                      "flex min-h-[5.5rem] cursor-pointer items-center gap-4 rounded-[var(--kmsf-radius-lg)] border border-border bg-surface p-4 transition-colors",
                      checked && "border-accent bg-panel-hover",
                    )}
                  >
                    <input
                      checked={checked}
                      className="mt-1 h-4 w-4 accent-[var(--kmsf-color-accent)]"
                      name="setup-gnb-region"
                      onChange={() => toggleGnbRegion(region)}
                      type="checkbox"
                      value={region}
                    />
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--kmsf-radius-md)] border border-border bg-panel text-accent">
                      {getLayoutRegionIcon(region)}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-foreground">
                        {regionLabels.title}
                      </span>
                      <span className="mt-2 block text-sm leading-6 text-foreground/65">
                        {regionLabels.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="mt-8 flex justify-end gap-2">
              <Button onClick={() => setStep("welcome")} type="button" variant="secondary">
                {labels.previous}
              </Button>
              <Button onClick={() => setStep("database")} type="button">
                {labels.next}
              </Button>
            </div>
          </section>
        ) : null}

        {visibleStep === "database" ? (
          <section className="px-6 py-6 md:px-8">
            <CardTitle>DB 선택</CardTitle>
            <CardDescription className="mt-2">
              프로젝트에서 사용할 데이터 저장소를 선택합니다. None은 KMSF 인증과
              계정 저장소를 만들지 않습니다.
            </CardDescription>

            {hasSupabaseFallback ? (
              <div
                className="mt-5 flex gap-3 rounded-[var(--kmsf-radius-md)] border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100"
                role="alert"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <p>{labels.fallbackNotice}</p>
              </div>
            ) : null}

            <div className="mt-6 grid gap-3">
              <OptionCard<DbMode>
                checked={selectedDbMode === "none"}
                icon={<Layers3 className="h-5 w-5" />}
                name="setup-db-mode"
                onChange={handleDbModeChange}
                title="None"
                value="none"
              >
                DB와 KMSF 인증 저장소를 생성하지 않습니다. 개발자가 직접 구현합니다.
              </OptionCard>
              <OptionCard<DbMode>
                checked={selectedDbMode === "dev-local-db"}
                icon={<Database className="h-5 w-5" />}
                name="setup-db-mode"
                onChange={handleDbModeChange}
                title="Dev Local DB"
                value="dev-local-db"
              >
                lowdb 기반 개발 모드 전용 DB를 사용합니다.
              </OptionCard>
              <OptionCard<DbMode>
                checked={selectedDbMode === "sqlite"}
                icon={<HardDrive className="h-5 w-5" />}
                name="setup-db-mode"
                onChange={handleDbModeChange}
                title="Sqlite3"
                value="sqlite"
              >
                sqlite3 기반 개발/운영 겸용 로컬 DB를 사용합니다.
              </OptionCard>
              <OptionCard<DbMode>
                checked={selectedDbMode === "external-adapter"}
                icon={<Server className="h-5 w-5" />}
                name="setup-db-mode"
                onChange={handleDbModeChange}
                title="External Adapter"
                value="external-adapter"
              >
                외부 DB 연결 어댑터를 사용합니다. secret은 환경 설정 파일에서 관리합니다.
              </OptionCard>
              <OptionCard<DbMode>
                checked={selectedDbMode === "supabase"}
                disabled={!canUseSupabase}
                icon={<Server className="h-5 w-5" />}
                name="setup-db-mode"
                onChange={handleDbModeChange}
                title={labels.supabaseTitle}
                value="supabase"
              >
                {supabaseStatus === "checking"
                  ? "Supabase 연결 테스트 중..."
                  : canUseSupabase
                    ? labels.supabaseDescription
                    : labels.supabaseUnavailable}
              </OptionCard>
            </div>

            <div className="mt-8 flex justify-end gap-2">
              <Button onClick={() => setStep("layout")} type="button" variant="secondary">
                {labels.previous}
              </Button>
              <Button
                onClick={() => setStep(shouldShowAuthStep ? "auth" : "storage")}
                type="button"
              >
                {labels.next}
              </Button>
            </div>
          </section>
        ) : null}

        {visibleStep === "auth" ? (
          <section className="px-6 py-6 md:px-8">
            <CardTitle>인증 선택</CardTitle>
            <CardDescription className="mt-2">
              KMSF 인증 모듈을 사용할지, 개발자가 직접 구현할지 선택합니다.
            </CardDescription>

            <div className="mt-6 grid gap-3">
              <OptionCard<AuthMode>
                checked={selectedAuthMode === "manual"}
                icon={<KeyRound className="h-5 w-5" />}
                name="setup-auth-mode"
                onChange={setSelectedAuthMode}
                title="Manual"
                value="manual"
              >
                개발자가 모든 인증 방식을 수동으로 설정합니다. KMSF 인증 기능은 생략됩니다.
              </OptionCard>
              {selectedDbMode === "supabase" ? (
                <OptionCard<AuthMode>
                  checked={selectedAuthMode === "supabase"}
                  disabled={!canUseSupabase}
                  icon={<Server className="h-5 w-5" />}
                  name="setup-auth-mode"
                  onChange={setSelectedAuthMode}
                  title="Supabase Auth"
                  value="supabase"
                >
                  Supabase Auth와 manager 테이블을 사용합니다.
                </OptionCard>
              ) : (
                <OptionCard<AuthMode>
                  checked={selectedAuthMode === "kmsf-managed"}
                  icon={<Database className="h-5 w-5" />}
                  name="setup-auth-mode"
                  onChange={setSelectedAuthMode}
                  title="KMSF-managed auth"
                  value="kmsf-managed"
                >
                  선택한 DB 어댑터에 KMSF 계정 정보를 저장합니다.
                </OptionCard>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-2">
              <Button onClick={() => setStep("database")} type="button" variant="secondary">
                {labels.previous}
              </Button>
              <Button onClick={() => setStep("storage")} type="button">
                {labels.next}
              </Button>
            </div>
          </section>
        ) : null}

        {visibleStep === "storage" ? (
          <section className="px-6 py-6 md:px-8">
            <CardTitle>애플리케이션 설정 저장</CardTitle>
            <CardDescription className="mt-2">
              레이아웃, 메뉴 같은 애플리케이션 설정을 어디에 저장할지 선택합니다.
            </CardDescription>

            {selectedStorageMode === "local-storage" ? (
              <div
                className="mt-5 flex gap-3 rounded-[var(--kmsf-radius-md)] border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100"
                role="alert"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <p>
                  Local Storage는 브라우저 로컬 설정입니다. 서버 컴포넌트는 이 값을 읽을 수
                  없으므로 설정 의존 UI는 클라이언트에서 렌더링됩니다.
                </p>
              </div>
            ) : null}

            <div className="mt-6 grid gap-3">
              <OptionCard<AppConfigStorageMode>
                checked={selectedStorageMode === "manual"}
                icon={<Settings2 className="h-5 w-5" />}
                name="setup-storage-mode"
                onChange={setSelectedStorageMode}
                title="Manual"
                value="manual"
              >
                설정 저장 방식을 개발자가 직접 구현합니다.
              </OptionCard>
              <OptionCard<AppConfigStorageMode>
                checked={selectedStorageMode === "local-storage"}
                icon={<HardDrive className="h-5 w-5" />}
                name="setup-storage-mode"
                onChange={setSelectedStorageMode}
                title="Local Storage"
                value="local-storage"
              >
                브라우저별 클라이언트 설정으로 저장합니다.
              </OptionCard>
              <OptionCard<AppConfigStorageMode>
                checked={selectedStorageMode === "connected-db"}
                disabled={selectedDbMode === "none"}
                icon={<Database className="h-5 w-5" />}
                name="setup-storage-mode"
                onChange={setSelectedStorageMode}
                title="연결된 DB에 저장"
                value="connected-db"
              >
                앞에서 선택한 DB에 애플리케이션 설정을 저장합니다.
              </OptionCard>
            </div>

            <div className="mt-8 flex justify-end gap-2">
              <Button onClick={goBackFromStorage} type="button" variant="secondary">
                {labels.previous}
              </Button>
              <Button onClick={() => setStep("menu")} type="button">
                {labels.next}
              </Button>
            </div>
          </section>
        ) : null}

        {visibleStep === "menu" ? (
          <section className="px-6 py-6 md:px-8">
            <CardTitle>메뉴 설정</CardTitle>
            <CardDescription className="mt-2">
              GNB에 표시할 메뉴 생성 방식을 선택합니다.
            </CardDescription>

            <div className="mt-6 grid gap-3">
              <OptionCard<MenuSourceMode>
                checked={selectedMenuSourceMode === "manual"}
                icon={<Settings2 className="h-5 w-5" />}
                name="setup-menu-source"
                onChange={setSelectedMenuSourceMode}
                title="수동 설정"
                value="manual"
              >
                메뉴 목록을 개발자가 직접 구성합니다.
              </OptionCard>
              <OptionCard<MenuSourceMode>
                checked={selectedMenuSourceMode === "app-routes"}
                icon={<FileStack className="h-5 w-5" />}
                name="setup-menu-source"
                onChange={setSelectedMenuSourceMode}
                title="Page 디렉터리 기반"
                value="app-routes"
              >
                실제 page route를 스캔해 메뉴 후보를 만듭니다.
              </OptionCard>
              <OptionCard<MenuSourceMode>
                checked={selectedMenuSourceMode === "settings-ui"}
                disabled={selectedDbMode === "none" || selectedAuthMode === "manual"}
                icon={<Database className="h-5 w-5" />}
                name="setup-menu-source"
                onChange={setSelectedMenuSourceMode}
                title="설정 화면"
                value="settings-ui"
              >
                DB 연동 설정 화면에서 메뉴를 관리합니다.
              </OptionCard>
            </div>

            {state.authError ? (
              <div className="mt-5 rounded-[var(--kmsf-radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100">
                {getAuthErrorMessage(state.authError, messages)}
              </div>
            ) : null}

            <div className="mt-8 flex justify-end gap-2">
              <Button onClick={() => setStep("storage")} type="button" variant="secondary">
                {labels.previous}
              </Button>
              {shouldCreateAdmin ? (
                <Button onClick={() => setStep("admin")} type="button">
                  {labels.next}
                </Button>
              ) : (
                <Button disabled={isPending} type="submit">
                  {labels.next}
                </Button>
              )}
            </div>
          </section>
        ) : null}

        {visibleStep === "admin" ? (
          <section className="px-6 py-6 md:px-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{labels.adminTitle}</CardTitle>
                <CardDescription className="mt-2">{labels.adminDescription}</CardDescription>
              </div>
              <span className="inline-flex items-center gap-2 rounded-[var(--kmsf-radius-full)] border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-accent">
                <CheckCircle2 className="h-4 w-4" />
                {labels.adminLevel}
              </span>
            </div>

            <div className="mt-6 grid gap-4">
              <FieldWithTooltip
                errorText={getVisibleError("email")}
                id="initial-admin-email"
                label={labels.email}
                name="email"
                onBlur={handleBlur}
                onChange={handleChange}
                tooltip={tooltips.email}
                type="text"
                value={formValues.email}
              />
              <FieldWithTooltip
                errorText={getVisibleError("password")}
                id="initial-admin-password"
                label={labels.password}
                maxLength={32}
                name="password"
                onBlur={handleBlur}
                onChange={handleChange}
                placeholder="****"
                tooltip={tooltips.password}
                type="password"
                value={formValues.password}
              />
              <FieldWithTooltip
                errorText={getVisibleError("passwordConfirm")}
                id="initial-admin-password-confirm"
                label={labels.passwordConfirm}
                maxLength={32}
                name="passwordConfirm"
                onBlur={handleBlur}
                onChange={handleChange}
                placeholder="****"
                tooltip={tooltips.passwordConfirm}
                type="password"
                value={formValues.passwordConfirm}
              />
            </div>

            {state.authError ? (
              <div className="mt-5 rounded-[var(--kmsf-radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100">
                {getAuthErrorMessage(state.authError, messages)}
              </div>
            ) : null}

            <div className="mt-8 flex justify-end gap-2">
              <Button
                disabled={isPending}
                onClick={() => setStep("menu")}
                type="button"
                variant="secondary"
              >
                {labels.previous}
              </Button>
              <Button disabled={isPending} type="submit">
                {labels.next}
              </Button>
            </div>
          </section>
        ) : null}

        {visibleStep === "processing" ? (
          <section className="px-6 py-10 text-center md:px-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[var(--kmsf-radius-full)] bg-panel-hover text-accent">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <CardTitle className="mt-5">{labels.processingTitle}</CardTitle>
            <CardDescription className="mt-3">{labels.processingDescription}</CardDescription>
          </section>
        ) : null}

        {visibleStep === "completed" ? (
          <section className="px-6 py-10 text-center md:px-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[var(--kmsf-radius-full)] bg-panel-hover text-accent">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <CardTitle className="mt-5">설정이 완료되었습니다.</CardTitle>
            <CardDescription className="mt-3">
              브라우저를 새로고침하면 KMSF App으로 이동합니다.
            </CardDescription>
          </section>
        ) : null}
      </Card>
    </form>
  );
}

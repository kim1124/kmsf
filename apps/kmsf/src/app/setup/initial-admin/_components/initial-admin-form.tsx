"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Loader2,
  PanelBottom,
  PanelLeft,
  PanelRight,
  Server,
  PanelTop,
} from "lucide-react";
import { startTransition, useActionState, useState } from "react";

import {
  createInitialAdminAction,
  type InitialAdminFormState,
} from "@/app/setup/initial-admin/actions";
import { FieldWithTooltip } from "@/components/auth/_components/field-with-tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { AuthProviderKind } from "@/lib/auth/providers/auth-provider";
import type { RuntimeAuthProviderResult } from "@/lib/auth/providers/runtime-auth-provider";
import {
  DEFAULT_GNB_REGIONS,
  GNB_REGIONS,
  type GnbRegion,
} from "@/lib/layout/gnb-layout-config";
import {
  createEmptyAccountFieldErrors,
  getLiveAccountFieldErrors,
  INITIAL_ADMIN_USERNAME,
  sanitizeEmailInput,
  type AccountFieldErrors,
  type AccountFields,
} from "@/lib/auth/validation";
import { cn } from "@/lib/utils";

type SetupStep = "provider" | "layout" | "admin" | "processing";

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
    securityFailed: string;
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
    username: INITIAL_ADMIN_USERNAME,
    displayName: INITIAL_ADMIN_DISPLAY_NAME,
    ...emptyInitialAdminFormValues,
    authProvider: "local-json",
    gnbRegions: [...DEFAULT_GNB_REGIONS],
  },
  fieldErrors: {
    ...createEmptyAccountFieldErrors(),
    displayName: null,
  },
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

function ProviderRadioCard({
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
  onChange: (value: AuthProviderKind) => void;
  title: string;
  value: AuthProviderKind;
}) {
  return (
    <label
      className={cn(
        "flex min-h-[7.5rem] cursor-pointer gap-4 rounded-[var(--kmsf-radius-lg)] border border-border bg-surface p-4 transition-colors",
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
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--kmsf-radius-md)] border border-border bg-panel text-accent">
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
  const canUseSupabase = runtimeProvider.provider === "supabase";
  const hasSupabaseFallback = runtimeProvider.reason === "supabase-unavailable";
  const [step, setStep] = useState<SetupStep>("provider");
  const [selectedProvider, setSelectedProvider] = useState<AuthProviderKind>(
    canUseSupabase ? "supabase" : "local-json",
  );
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

  const serverReturnedErrors = state.authError || hasFieldError(state.fieldErrors);
  const visibleStep = !isPending && step === "processing" && serverReturnedErrors ? "admin" : step;

  function handleProviderNext() {
    if (selectedProvider === "supabase" && !canUseSupabase) {
      setSelectedProvider("local-json");
    }

    setStep("layout");
  }

  function toggleGnbRegion(region: GnbRegion) {
    setSelectedGnbRegions((regions) => {
      if (regions.includes(region)) {
        const nextRegions = regions.filter((value) => value !== region);
        return nextRegions.length > 0 ? nextRegions : regions;
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

    setStep("processing");
    window.setTimeout(() => {
      startTransition(() => {
        formAction(formData);
      });
    }, 250);
  }

  return (
    <Card className="w-full max-w-3xl p-0">
      <div className="border-b border-border px-6 py-5 md:px-8">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-foreground/55">
          <span className={cn(visibleStep === "provider" && "text-accent")}>
            1. {labels.providerTitle}
          </span>
          <span>/</span>
          <span className={cn(visibleStep === "layout" && "text-accent")}>
            2. {labels.layoutTitle}
          </span>
          <span>/</span>
          <span className={cn(visibleStep === "admin" && "text-accent")}>
            3. {labels.adminTitle}
          </span>
          <span>/</span>
          <span className={cn(visibleStep === "processing" && "text-accent")}>
            4. {labels.processingTitle}
          </span>
        </div>
        <CardTitle className="mt-3 text-2xl md:text-3xl">{labels.title}</CardTitle>
        <CardDescription className="mt-2">{labels.description}</CardDescription>
      </div>

      {visibleStep === "provider" ? (
        <section className="px-6 py-6 md:px-8">
          <CardTitle>{labels.providerTitle}</CardTitle>
          <CardDescription className="mt-2">{labels.providerDescription}</CardDescription>

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
            <ProviderRadioCard
              checked={selectedProvider === "supabase"}
              disabled={!canUseSupabase}
              icon={<Server className="h-5 w-5" />}
              name="setup-auth-provider"
              onChange={setSelectedProvider}
              title={labels.supabaseTitle}
              value="supabase"
            >
              {canUseSupabase ? labels.supabaseDescription : labels.supabaseUnavailable}
            </ProviderRadioCard>
            <ProviderRadioCard
              checked={selectedProvider === "local-json"}
              icon={<Database className="h-5 w-5" />}
              name="setup-auth-provider"
              onChange={setSelectedProvider}
              title={labels.localTitle}
              value="local-json"
            >
              {labels.localDescription}
            </ProviderRadioCard>
            <div className="rounded-[var(--kmsf-radius-lg)] border border-dashed border-border bg-surface-muted p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{labels.serverDbTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-foreground/60">
                    {labels.serverDbDescription}
                  </p>
                </div>
                <span className="rounded-[var(--kmsf-radius-full)] border border-border px-3 py-1 text-xs font-semibold text-foreground/60">
                  {labels.serverDbBadge}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button onClick={handleProviderNext} type="button">
              {labels.next}
            </Button>
          </div>
        </section>
      ) : null}

      {visibleStep === "layout" ? (
        <section className="px-6 py-6 md:px-8">
          <CardTitle>{labels.layoutTitle}</CardTitle>
          <CardDescription className="mt-2">{labels.layoutDescription}</CardDescription>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {GNB_REGIONS.map((region) => {
              const checked = selectedGnbRegions.includes(region);
              const regionLabels = labels.layoutRegions[region];

              return (
                <label
                  key={region}
                  className={cn(
                    "flex min-h-[7rem] cursor-pointer gap-4 rounded-[var(--kmsf-radius-lg)] border border-border bg-surface p-4 transition-colors",
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
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--kmsf-radius-md)] border border-border bg-panel text-accent">
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
            <Button onClick={() => setStep("provider")} type="button" variant="secondary">
              {labels.previous}
            </Button>
            <Button onClick={() => setStep("admin")} type="button">
              {labels.next}
            </Button>
          </div>
        </section>
      ) : null}

      {visibleStep === "admin" ? (
        <form action={submitInitialSetup} className="px-6 py-6 md:px-8" noValidate>
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <input type="hidden" name="authProvider" value={selectedProvider} />
          {selectedGnbRegions.map((region) => (
            <input key={region} type="hidden" name="gnbRegions" value={region} />
          ))}

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
              {state.authError === "security.invalid"
                ? messages.securityFailed
                : messages.authFailed}
            </div>
          ) : null}

          <div className="mt-8 flex justify-end gap-2">
            <Button
              disabled={isPending}
              onClick={() => setStep("layout")}
              type="button"
              variant="secondary"
            >
              {labels.previous}
            </Button>
            <Button disabled={isPending} type="submit">
              {labels.next}
            </Button>
          </div>
        </form>
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
    </Card>
  );
}

"use client";

import { AlertTriangle, CheckCircle2, Database, Loader2, Server } from "lucide-react";
import { startTransition, useActionState, useMemo, useState } from "react";

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
  createEmptyAccountFieldErrors,
  createEmptyAccountFields,
  getLiveAccountFieldErrors,
  sanitizeEmailInput,
  sanitizeUsernameInput,
  sanitizeVisibleInput,
  type AccountFieldErrors,
  type AccountFields,
} from "@/lib/auth/validation";
import { cn } from "@/lib/utils";

type SetupStep = "provider" | "admin" | "processing";

type InitialAdminFields = AccountFields & {
  displayName: string;
};

type InitialAdminFieldErrors = AccountFieldErrors & {
  displayName: string | null;
};

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
    serverDbTitle: string;
    serverDbDescription: string;
    serverDbBadge: string;
    fallbackNotice: string;
    adminTitle: string;
    adminDescription: string;
    adminLevel: string;
    username: string;
    displayName: string;
    email: string;
    password: string;
    passwordConfirm: string;
    previous: string;
    next: string;
    processingTitle: string;
    processingDescription: string;
  };
  tooltips: {
    username: string;
    displayName: string;
    email: string;
    password: string;
    passwordConfirm: string;
  };
  messages: {
    authFailed: string;
    securityFailed: string;
    fieldErrors: {
      username: {
        invalid: string;
        duplicate: string;
      };
      displayName: {
        invalid: string;
      };
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

const emptyInitialAdminFields: InitialAdminFields = {
  ...createEmptyAccountFields(),
  displayName: "",
};

const emptyInitialAdminFieldErrors: InitialAdminFieldErrors = {
  ...createEmptyAccountFieldErrors(),
  displayName: null,
};

const initialState: InitialAdminFormState = {
  authError: null,
  fields: {
    ...emptyInitialAdminFields,
    authProvider: "local-json",
  },
  fieldErrors: emptyInitialAdminFieldErrors,
};

function isDisplayNameInvalid(value: string) {
  return value.length < 2 || value.length > 40;
}

function getInitialAdminFieldErrors(fields: InitialAdminFields): InitialAdminFieldErrors {
  return {
    ...getLiveAccountFieldErrors(fields),
    displayName: isDisplayNameInvalid(fields.displayName) ? "displayName.invalid" : null,
  };
}

function hasFieldError(fieldErrors: InitialAdminFieldErrors) {
  return Object.values(fieldErrors).some(Boolean);
}

function getErrorMessage(
  field: keyof InitialAdminFormProps["messages"]["fieldErrors"],
  code: string | null,
  messages: InitialAdminFormProps["messages"]["fieldErrors"],
) {
  if (!code) {
    return null;
  }

  if (field === "username") {
    return code === "duplicate.username" ? messages.username.duplicate : messages.username.invalid;
  }

  if (field === "displayName") {
    return messages.displayName.invalid;
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
  const [formValues, setFormValues] = useState<InitialAdminFields>(emptyInitialAdminFields);
  const [clientErrors, setClientErrors] =
    useState<InitialAdminFieldErrors>(emptyInitialAdminFieldErrors);

  const accountHasErrors = useMemo(() => hasFieldError(clientErrors), [clientErrors]);
  const serverReturnedErrors = state.authError || hasFieldError(state.fieldErrors);
  const visibleStep = !isPending && step === "processing" && serverReturnedErrors ? "admin" : step;

  function handleProviderNext() {
    if (selectedProvider === "supabase" && !canUseSupabase) {
      setSelectedProvider("local-json");
    }

    setStep("admin");
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const nextValue =
      name === "username"
        ? sanitizeUsernameInput(value)
        : name === "displayName"
          ? sanitizeVisibleInput(value)
          : name === "email"
            ? sanitizeEmailInput(value)
            : value;
    const newValues = { ...formValues, [name]: nextValue };
    setFormValues(newValues);
    setClientErrors(getInitialAdminFieldErrors(newValues));
  }

  function submitInitialSetup(formData: FormData) {
    const nextErrors = getInitialAdminFieldErrors(formValues);
    setClientErrors(nextErrors);

    if (hasFieldError(nextErrors)) {
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
          <span className={cn(visibleStep === "admin" && "text-accent")}>
            2. {labels.adminTitle}
          </span>
          <span>/</span>
          <span className={cn(visibleStep === "processing" && "text-accent")}>
            3. {labels.processingTitle}
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

      {visibleStep === "admin" ? (
        <form action={submitInitialSetup} className="px-6 py-6 md:px-8" noValidate>
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <input type="hidden" name="authProvider" value={selectedProvider} />

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

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <FieldWithTooltip
              errorText={
                getErrorMessage("username", clientErrors.username, messages.fieldErrors) ||
                getErrorMessage("username", state.fieldErrors.username, messages.fieldErrors)
              }
              id="initial-admin-username"
              label={labels.username}
              maxLength={32}
              name="username"
              onChange={handleChange}
              tooltip={tooltips.username}
              value={formValues.username}
            />
            <FieldWithTooltip
              errorText={
                getErrorMessage("displayName", clientErrors.displayName, messages.fieldErrors) ||
                getErrorMessage("displayName", state.fieldErrors.displayName, messages.fieldErrors)
              }
              id="initial-admin-display-name"
              label={labels.displayName}
              maxLength={40}
              name="displayName"
              onChange={handleChange}
              tooltip={tooltips.displayName}
              value={formValues.displayName}
            />
            <FieldWithTooltip
              errorText={
                getErrorMessage("email", clientErrors.email, messages.fieldErrors) ||
                getErrorMessage("email", state.fieldErrors.email, messages.fieldErrors)
              }
              id="initial-admin-email"
              label={labels.email}
              name="email"
              onChange={handleChange}
              tooltip={tooltips.email}
              type="text"
              value={formValues.email}
            />
            <FieldWithTooltip
              errorText={
                getErrorMessage("password", clientErrors.password, messages.fieldErrors) ||
                getErrorMessage("password", state.fieldErrors.password, messages.fieldErrors)
              }
              id="initial-admin-password"
              label={labels.password}
              maxLength={32}
              name="password"
              onChange={handleChange}
              placeholder="****"
              tooltip={tooltips.password}
              type="password"
              value={formValues.password}
            />
            <div className="md:col-span-2">
              <FieldWithTooltip
                errorText={
                  getErrorMessage(
                    "passwordConfirm",
                    clientErrors.passwordConfirm,
                    messages.fieldErrors,
                  ) ||
                  getErrorMessage(
                    "passwordConfirm",
                    state.fieldErrors.passwordConfirm,
                    messages.fieldErrors,
                  )
                }
                id="initial-admin-password-confirm"
                label={labels.passwordConfirm}
                maxLength={32}
                name="passwordConfirm"
                onChange={handleChange}
                placeholder="****"
                tooltip={tooltips.passwordConfirm}
                type="password"
                value={formValues.passwordConfirm}
              />
            </div>
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
              onClick={() => setStep("provider")}
              type="button"
              variant="secondary"
            >
              {labels.previous}
            </Button>
            <Button disabled={isPending || accountHasErrors} type="submit">
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

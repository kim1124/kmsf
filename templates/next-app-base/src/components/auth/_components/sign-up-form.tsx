"use client";

import { useActionState, useState } from "react";

import {
  signUpAction,
  type SignUpFormState,
} from "@/app/[locale]/(public)/sign-in/actions";
import { FieldWithTooltip } from "@/components/auth/_components/field-with-tooltip";
import { FullPageLoader } from "@/components/ui/full-page-loader";
import { Button } from "@/components/ui/button";
import {
  createEmptyAccountFieldErrors,
  createEmptyAccountFields,
  getLiveAccountFieldErrors,
  sanitizeEmailInput,
  sanitizeUsernameInput,
} from "@/lib/auth/validation";

type SignUpFormProps = {
  locale: string;
  csrfToken: string;
  labels: {
    username: string;
    email: string;
    password: string;
    passwordConfirm: string;
    submit: string;
  };
  tooltips: {
    username: string;
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

const initialState: SignUpFormState = {
  authError: null,
  fields: createEmptyAccountFields(),
  fieldErrors: createEmptyAccountFieldErrors(),
};

function getErrorMessage(
  field: keyof SignUpFormProps["messages"]["fieldErrors"],
  code: string | null,
  messages: SignUpFormProps["messages"]["fieldErrors"],
) {
  if (!code) {
    return null;
  }

  if (field === "username") {
    return code === "duplicate.username" ? messages.username.duplicate : messages.username.invalid;
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

export function SignUpForm({ locale, csrfToken, labels, tooltips, messages }: SignUpFormProps) {
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);

  const [formValues, setFormValues] = useState(createEmptyAccountFields);
  const [clientErrors, setClientErrors] = useState(createEmptyAccountFieldErrors);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const nextValue =
      name === "username"
        ? sanitizeUsernameInput(value)
        : name === "email"
          ? sanitizeEmailInput(value)
          : value;
    const newValues = { ...formValues, [name]: nextValue };
    setFormValues(newValues);
    setClientErrors(getLiveAccountFieldErrors(newValues));
  }

  return (
    <>
    <form action={(formData) => {
      if (Object.values(clientErrors).some(Boolean)) return;
      formAction(formData);
    }} className="mt-6 space-y-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <FieldWithTooltip
        value={formValues.username}
        onChange={handleChange}
        errorText={
          getErrorMessage("username", clientErrors.username, messages.fieldErrors) ||
          getErrorMessage("username", state.fieldErrors.username, messages.fieldErrors)
        }
        id="sign-up-username"
        label={labels.username}
        maxLength={32}
        name="username"
        tooltip={tooltips.username}
      />
      <FieldWithTooltip
        value={formValues.email}
        onChange={handleChange}
        errorText={
          getErrorMessage("email", clientErrors.email, messages.fieldErrors) ||
          getErrorMessage("email", state.fieldErrors.email, messages.fieldErrors)
        }
        id="sign-up-email"
        label={labels.email}
        name="email"
        tooltip={tooltips.email}
        type="text"
      />
      <FieldWithTooltip
        value={formValues.password}
        onChange={handleChange}
        errorText={
          getErrorMessage("password", clientErrors.password, messages.fieldErrors) ||
          getErrorMessage("password", state.fieldErrors.password, messages.fieldErrors)
        }
        id="sign-up-password"
        label={labels.password}
        maxLength={32}
        name="password"
        placeholder="****"
        tooltip={tooltips.password}
        type="password"
      />
      <FieldWithTooltip
        value={formValues.passwordConfirm}
        onChange={handleChange}
        errorText={
          getErrorMessage("passwordConfirm", clientErrors.passwordConfirm, messages.fieldErrors) ||
          getErrorMessage("passwordConfirm", state.fieldErrors.passwordConfirm, messages.fieldErrors)
        }
        id="sign-up-password-confirm"
        label={labels.passwordConfirm}
        maxLength={32}
        name="passwordConfirm"
        placeholder="****"
        tooltip={tooltips.passwordConfirm}
        type="password"
      />
      {state.authError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
          {state.authError === "security" ? messages.securityFailed : messages.authFailed}
        </div>
      ) : null}
      <Button
        className="w-full"
        disabled={isPending || Object.values(clientErrors).some(Boolean)}
        type="submit"
      >
        {labels.submit}
      </Button>
    </form>
    {isPending && <FullPageLoader text="처리 중입니다..." />}
    </>
  );
}

"use client";

import { useActionState, useState } from "react";

import {
  signInAction,
  type SignInFormState,
} from "@/app/[locale]/(public)/sign-in/actions";
import { FieldWithTooltip } from "@/components/auth/_components/field-with-tooltip";
import { FullPageLoader } from "@/components/ui/full-page-loader";
import { Button } from "@/components/ui/button";
import {
  createEmptySignInFieldErrors,
  createEmptySignInFields,
} from "@/lib/auth/validation";

type SignInFormProps = {
  locale: string;
  csrfToken: string;
  labels: {
    username: string;
    password: string;
    submit: string;
  };
  tooltips: {
    username: string;
    password: string;
  };
  messages: {
    authFailed: string;
    securityFailed: string;
    fieldErrors: {
      username: {
        invalid: string;
      };
      password: {
        invalid: string;
      };
    };
  };
};

const initialState: SignInFormState = {
  authError: null,
  fields: createEmptySignInFields(),
  fieldErrors: createEmptySignInFieldErrors(),
};

export function SignInForm({ locale, csrfToken, labels, tooltips, messages }: SignInFormProps) {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  const [formValues, setFormValues] = useState({
    username: "",
    password: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const newValues = { ...formValues, [name]: value };
    setFormValues(newValues);
  }

  return (
    <>
      <form action={formAction} className="mt-6 space-y-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <FieldWithTooltip
        autoComplete="username"
        value={formValues.username}
        onChange={handleChange}
        errorText={state.fieldErrors.username ? messages.fieldErrors.username.invalid : null}
        id="login-username"
        label={labels.username}
        maxLength={32}
        name="username"
        tooltip={tooltips.username}
      />
      <FieldWithTooltip
        autoComplete="current-password"
        value={formValues.password}
        onChange={handleChange}
        errorText={state.fieldErrors.password ? messages.fieldErrors.password.invalid : null}
        id="login-password"
        label={labels.password}
        maxLength={32}
        name="password"
        placeholder="****"
        tooltip={tooltips.password}
        type="password"
      />
      {state.authError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
          {state.authError === "security" ? messages.securityFailed : messages.authFailed}
        </div>
      ) : null}
      <div className="grid gap-3 pt-2">
        <Button disabled={isPending} type="submit">
          {labels.submit}
        </Button>
      </div>
    </form>
    {isPending && <FullPageLoader text="로그인 중입니다..." />}
    </>
  );
}

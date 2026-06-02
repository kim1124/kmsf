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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createEmptySignInFieldErrors,
  createEmptySignInFields,
  getLiveSignInFieldErrors,
  sanitizeUsernameInput,
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
    locked: string;
    lockedTitle: string;
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
  lockedRemainingSeconds: null,
};

function getErrorMessage(
  field: keyof SignInFormProps["messages"]["fieldErrors"],
  code: string | null,
  messages: SignInFormProps["messages"]["fieldErrors"],
) {
  if (!code) {
    return null;
  }

  return field === "username" ? messages.username.invalid : messages.password.invalid;
}

export function SignInForm({ locale, csrfToken, labels, tooltips, messages }: SignInFormProps) {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  const [formValues, setFormValues] = useState(createEmptySignInFields);
  const [clientErrors, setClientErrors] = useState(createEmptySignInFieldErrors);
  const [dismissedLockMessage, setDismissedLockMessage] = useState<string | null>(null);
  const lockedMessage = messages.locked.replace(
    "{seconds}",
    String(state.lockedRemainingSeconds ?? 300),
  );
  const lockDialogOpen = state.authError === "locked" && dismissedLockMessage !== lockedMessage;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const nextValue = name === "username" ? sanitizeUsernameInput(value) : value;
    const newValues = { ...formValues, [name]: nextValue };
    setFormValues(newValues);
    setClientErrors(getLiveSignInFieldErrors(newValues));
  }

  return (
    <>
      <form
        action={(formData) => {
          setDismissedLockMessage(null);

          if (Object.values(clientErrors).some(Boolean)) {
            return;
          }

          formAction(formData);
        }}
        className="mt-6 space-y-4"
        noValidate
      >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <FieldWithTooltip
        autoComplete="username"
        value={formValues.username}
        onChange={handleChange}
        errorText={
          getErrorMessage("username", clientErrors.username, messages.fieldErrors) ??
          getErrorMessage("username", state.fieldErrors.username, messages.fieldErrors)
        }
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
        errorText={
          getErrorMessage("password", clientErrors.password, messages.fieldErrors) ??
          getErrorMessage("password", state.fieldErrors.password, messages.fieldErrors)
        }
        id="login-password"
        label={labels.password}
        maxLength={32}
        name="password"
        placeholder="****"
        tooltip={tooltips.password}
        type="password"
      />
      {state.authError && state.authError !== "locked" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
          {state.authError === "security" ? messages.securityFailed : messages.authFailed}
        </div>
      ) : null}
      <div className="grid gap-3 pt-2">
        <Button disabled={isPending || Object.values(clientErrors).some(Boolean)} type="submit">
          {labels.submit}
        </Button>
      </div>
    </form>
    <Dialog
      open={lockDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          setDismissedLockMessage(lockedMessage);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{messages.lockedTitle}</DialogTitle>
          <DialogDescription>{lockedMessage}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
    {isPending && <FullPageLoader text="로그인 중입니다..." />}
    </>
  );
}

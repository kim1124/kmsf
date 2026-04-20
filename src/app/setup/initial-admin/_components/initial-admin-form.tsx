"use client";

import { useActionState, useState } from "react";

import {
  createInitialAdminAction,
  type InitialAdminFormState,
} from "@/app/setup/initial-admin/actions";
import { FieldWithTooltip } from "@/components/auth/_components/field-with-tooltip";
import { FullPageLoader } from "@/components/ui/full-page-loader";
import { Button } from "@/components/ui/button";
import {
  createEmptyAccountFieldErrors,
  createEmptyAccountFields,
} from "@/lib/auth/validation";

type InitialAdminFormProps = {
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

const initialState: InitialAdminFormState = {
  authError: null,
  fields: createEmptyAccountFields(),
  fieldErrors: createEmptyAccountFieldErrors(),
};

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

export function InitialAdminForm({
  csrfToken,
  labels,
  tooltips,
  messages,
}: InitialAdminFormProps) {
  const [state, formAction, isPending] = useActionState(createInitialAdminAction, initialState);

  const [formValues, setFormValues] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  function validateForm(values: typeof formValues) {
    const newErrors: Record<string, string> = {};

    if (values.username.trim().length < 3) {
      newErrors.username = "아이디는 3자 이상이어야 합니다.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      newErrors.email = "유효한 이메일 형식이 아닙니다.";
    }

    if (values.password.trim().length < 4) {
      newErrors.password = "비밀번호는 최소 4자 이상 지정해야 합니다.";
    }

    if (values.password !== values.passwordConfirm) {
      newErrors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
    }

    setClientErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const newValues = { ...formValues, [name]: value };
    setFormValues(newValues);
    validateForm(newValues);
  }

  return (
    <>
    <form action={(formData) => {
      if (Object.keys(clientErrors).length > 0) return;
      formAction(formData);
    }} className="mt-6 space-y-4" noValidate>
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <FieldWithTooltip
        value={formValues.username}
        onChange={handleChange}
        errorText={clientErrors.username || getErrorMessage("username", state.fieldErrors.username, messages.fieldErrors)}
        id="initial-admin-username"
        label={labels.username}
        maxLength={32}
        name="username"
        tooltip={tooltips.username}
      />
      <FieldWithTooltip
        value={formValues.email}
        onChange={handleChange}
        errorText={clientErrors.email || getErrorMessage("email", state.fieldErrors.email, messages.fieldErrors)}
        id="initial-admin-email"
        label={labels.email}
        name="email"
        tooltip={tooltips.email}
        type="text"
      />
      <FieldWithTooltip
        value={formValues.password}
        onChange={handleChange}
        errorText={clientErrors.password || getErrorMessage("password", state.fieldErrors.password, messages.fieldErrors)}
        id="initial-admin-password"
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
        errorText={clientErrors.passwordConfirm || getErrorMessage(
          "passwordConfirm",
          state.fieldErrors.passwordConfirm,
          messages.fieldErrors,
        )}
        id="initial-admin-password-confirm"
        label={labels.passwordConfirm}
        maxLength={32}
        name="passwordConfirm"
        placeholder="****"
        tooltip={tooltips.passwordConfirm}
        type="password"
      />
      {state.authError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.authError === "security.invalid" ? messages.securityFailed : messages.authFailed}
        </div>
      ) : null}
      <Button className="w-full" disabled={isPending || Object.keys(clientErrors).length > 0} type="submit">
        {labels.submit}
      </Button>
    </form>
    {isPending && <FullPageLoader text="처리 중입니다..." />}
    </>
  );
}

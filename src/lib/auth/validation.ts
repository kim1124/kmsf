import { z } from "zod";

export const USERNAME_MIN_LENGTH = 6;
export const USERNAME_MAX_LENGTH = 32;
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 32;

const usernamePattern = /^[A-Za-z0-9]+$/;
const passwordLetterPattern = /[A-Za-z]/;
const passwordNumberPattern = /[0-9]/;
const passwordSpecialPattern = /[^A-Za-z0-9]/;

export type AccountFields = {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
};

export type AccountFieldErrors = {
  username: string | null;
  email: string | null;
  password: string | null;
  passwordConfirm: string | null;
};

export type SignInFields = {
  username: string;
  password: string;
};

export type SignInFieldErrors = {
  username: string | null;
  password: string | null;
};

export function createEmptyAccountFields(): AccountFields {
  return {
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
  };
}

export function createEmptyAccountFieldErrors(): AccountFieldErrors {
  return {
    username: null,
    email: null,
    password: null,
    passwordConfirm: null,
  };
}

export function createEmptySignInFields(): SignInFields {
  return {
    username: "",
    password: "",
  };
}

export function createEmptySignInFieldErrors(): SignInFieldErrors {
  return {
    username: null,
    password: null,
  };
}

function isEmailLike(value: string) {
  return z.email().safeParse(value).success;
}

function isValidUsername(value: string) {
  return isEmailLike(value) || usernamePattern.test(value);
}

function isValidPassword(value: string) {
  return (
    passwordLetterPattern.test(value) &&
    passwordNumberPattern.test(value) &&
    passwordSpecialPattern.test(value)
  );
}

export const usernameSchema = z
  .string()
  .trim()
  .min(USERNAME_MIN_LENGTH, { message: "username.invalid" })
  .max(USERNAME_MAX_LENGTH, { message: "username.invalid" })
  .refine(isValidUsername, { message: "username.invalid" });

export const emailSchema = z
  .string()
  .trim()
  .email({ message: "email.invalid" });

export const passwordSchema = z
  .string()
  .trim()
  .min(PASSWORD_MIN_LENGTH, { message: "password.invalid" })
  .max(PASSWORD_MAX_LENGTH, { message: "password.invalid" })
  .refine(isValidPassword, { message: "password.invalid" });

export const signInSchema = z.object({
  locale: z.string().default("ko"),
  username: usernameSchema,
  password: passwordSchema,
});

export const accountSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    passwordConfirm: z.string().trim(),
  })
  .superRefine((value, context) => {
    if (value.passwordConfirm.length < PASSWORD_MIN_LENGTH) {
      context.addIssue({
        code: "custom",
        message: "passwordConfirm.invalid",
        path: ["passwordConfirm"],
      });
      return;
    }

    if (value.password !== value.passwordConfirm) {
      context.addIssue({
        code: "custom",
        message: "passwordConfirm.mismatch",
        path: ["passwordConfirm"],
      });
    }
  });

export function getAccountFieldErrors(error: z.ZodError<AccountFields>) {
  const fieldErrors = createEmptyAccountFieldErrors();

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (
      (field === "username" ||
        field === "email" ||
        field === "password" ||
        field === "passwordConfirm") &&
      !fieldErrors[field]
    ) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}

export function getSignInFieldErrors(error: z.ZodError<SignInFields>) {
  const fieldErrors = createEmptySignInFieldErrors();

  for (const issue of error.issues) {
    const field = issue.path[0];

    if ((field === "username" || field === "password") && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}

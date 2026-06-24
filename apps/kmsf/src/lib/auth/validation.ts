import DOMPurify from "isomorphic-dompurify";
import { z } from "zod";

export const USERNAME_MIN_LENGTH = 5;
export const USERNAME_MAX_LENGTH = 32;
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 32;
export const INITIAL_ADMIN_USERNAME = "admin";

const usernamePattern = /^[A-Za-z0-9]+$/;
const passwordLetterPattern = /[A-Za-z]/;
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

export type ProfileFields = {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
};

export type ProfileFieldErrors = {
  username: string | null;
  email: string | null;
  password: string | null;
  passwordConfirm: string | null;
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

export function createEmptyProfileFieldErrors(): ProfileFieldErrors {
  return {
    username: null,
    email: null,
    password: null,
    passwordConfirm: null,
  };
}

export function sanitizeVisibleInput(value: string) {
  if (!value) {
    return "";
  }

  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
    .replace(/[<>]/g, "")
    .replace(/\u0000/g, "")
    .trim();
}

export function sanitizeUsernameInput(value: string) {
  return sanitizeVisibleInput(value).replace(/\s+/g, "");
}

export function sanitizeEmailInput(value: string) {
  return sanitizeVisibleInput(value).replace(/\s+/g, "").toLowerCase();
}

export function sanitizeConfirmationInput(value: string) {
  return sanitizeVisibleInput(value).toUpperCase();
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
    passwordSpecialPattern.test(value)
  );
}

export const usernameSchema = z
  .string()
  .trim()
  .max(USERNAME_MAX_LENGTH, { message: "username.invalid" })
  .refine((value) => value.length >= USERNAME_MIN_LENGTH, {
    message: "username.invalid",
  })
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

export const profileSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: z.string().trim(),
    passwordConfirm: z.string().trim(),
  })
  .superRefine((value, context) => {
    const passwordProvided = value.password.length > 0 || value.passwordConfirm.length > 0;

    if (!passwordProvided) {
      return;
    }

    const passwordParsed = passwordSchema.safeParse(value.password);

    if (!passwordParsed.success) {
      context.addIssue({
        code: "custom",
        message: "password.invalid",
        path: ["password"],
      });
    }

    if (!value.passwordConfirm) {
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

export function getProfileFieldErrors(error: z.ZodError<ProfileFields>) {
  const fieldErrors = createEmptyProfileFieldErrors();

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

export function getLiveSignInFieldErrors(fields: SignInFields) {
  const parsed = signInSchema.safeParse({
    locale: "ko",
    username: sanitizeUsernameInput(fields.username),
    password: fields.password,
  });

  return parsed.success ? createEmptySignInFieldErrors() : getSignInFieldErrors(parsed.error);
}

export function getLiveAccountFieldErrors(fields: AccountFields) {
  const parsed = accountSchema.safeParse({
    username: sanitizeUsernameInput(fields.username),
    email: sanitizeEmailInput(fields.email),
    password: fields.password,
    passwordConfirm: fields.passwordConfirm,
  });

  return parsed.success ? createEmptyAccountFieldErrors() : getAccountFieldErrors(parsed.error);
}

export function getLiveProfileFieldErrors(fields: ProfileFields) {
  const parsed = profileSchema.safeParse({
    username: sanitizeUsernameInput(fields.username),
    email: sanitizeEmailInput(fields.email),
    password: fields.password,
    passwordConfirm: fields.passwordConfirm,
  });

  return parsed.success ? createEmptyProfileFieldErrors() : getProfileFieldErrors(parsed.error);
}

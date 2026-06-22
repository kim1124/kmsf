"use client";

import type { ReactNode } from "react";
import { useActionState, useState } from "react";

import {
  deleteAccountAction,
  type DeleteAccountFormState,
} from "@/app/[locale]/(protected)/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type AccountDeleteDialogProps = {
  locale: string;
  csrfToken: string;
  trigger?: ReactNode;
};

const initialDeleteState: DeleteAccountFormState = {
  error: null,
};

export function AccountDeleteDialog({ locale, csrfToken, trigger }: AccountDeleteDialogProps) {
  const [password, setPassword] = useState("");
  const [state, formAction, isPending] = useActionState(
    deleteAccountAction,
    initialDeleteState,
  );

  const errorMessage =
    state.error === "password"
      ? "비밀번호가 올바르지 않습니다."
      : state.error === "security"
        ? "보안 검증에 실패했습니다. 다시 시도해 주세요."
        : state.error === "service-role"
          ? "계정 삭제를 위한 서버 권한 설정이 필요합니다."
          : state.error === "delete"
            ? "회원 탈퇴 처리 중 문제가 발생했습니다."
            : state.error === "validation"
              ? "회원 탈퇴 요청을 처리할 수 없습니다."
              : null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="w-full" type="button" variant="destructive">
            회원 탈퇴
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>회원 탈퇴</DialogTitle>
          <DialogDescription>
            계정을 삭제하면 로그인 정보와 프로필 정보가 함께 제거됩니다. 계속하려면 현재
            비밀번호를 다시 입력해 주세요.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="mt-5 space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <div>
            <label className="mb-[10px] block text-sm font-medium" htmlFor="delete-account-password">
              현재 비밀번호
            </label>
            <Input
              aria-describedby={errorMessage ? "delete-account-password-error" : undefined}
              aria-invalid={Boolean(errorMessage)}
              autoComplete="current-password"
              id="delete-account-password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="현재 비밀번호 입력"
              type="password"
              value={password}
            />
            {errorMessage ? (
              <p className="mt-[10px] text-sm text-red-600" id="delete-account-password-error">
                {errorMessage}
              </p>
            ) : null}
          </div>
          <div className="flex justify-end pt-2">
            <Button disabled={!password || isPending} type="submit" variant="destructive">
              탈퇴 진행
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

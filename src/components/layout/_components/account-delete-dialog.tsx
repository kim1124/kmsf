"use client";

import { useState } from "react";

import { deleteAccountAction } from "@/app/[locale]/(protected)/actions";
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
};

export function AccountDeleteDialog({ locale, csrfToken }: AccountDeleteDialogProps) {
  const [confirmation, setConfirmation] = useState("");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full" type="button" variant="destructive">
          회원 탈퇴
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>회원 탈퇴</DialogTitle>
          <DialogDescription>
            계정을 삭제하면 로그인 정보와 프로필 정보가 함께 제거됩니다. 계속하려면 아래에
            <span className="mx-1 font-semibold text-foreground">DELETE</span>
            를 입력해 주세요.
          </DialogDescription>
        </DialogHeader>

        <form action={deleteAccountAction} className="mt-5 space-y-[10px]">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <div className="space-y-[10px]">
            <label className="text-sm font-medium" htmlFor="delete-account-confirmation">
              확인 문구
            </label>
            <Input
              id="delete-account-confirmation"
              name="confirmation"
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="DELETE"
              value={confirmation}
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button disabled={confirmation !== "DELETE"} type="submit" variant="destructive">
              탈퇴 진행
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

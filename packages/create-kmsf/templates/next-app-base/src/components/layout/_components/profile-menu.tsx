"use client";

import Image from "next/image";
import { UserRound } from "lucide-react";
import { useRef, useState, useTransition } from "react";

import {
  signOutAction,
  updateProfileAction,
} from "@/app/[locale]/(protected)/actions";
import { FieldWithTooltip } from "@/components/auth/_components/field-with-tooltip";
import { AccountDeleteDialog } from "@/components/layout/_components/account-delete-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { FullPageLoader } from "@/components/ui/full-page-loader";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  createEmptyProfileFieldErrors,
  getLiveProfileFieldErrors,
  sanitizeEmailInput,
  sanitizeUsernameInput,
} from "@/lib/auth/validation";
import type { AppSessionUser } from "@/lib/auth/session";

type ProfileMenuProps = {
  locale: string;
  user: AppSessionUser;
  csrfToken: string;
};

export function ProfileMenu({ locale, user, csrfToken }: ProfileMenuProps) {
  const [avatarPreview, setAvatarPreview] = useState(user.avatarDataUrl ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    username: user.displayName ?? "",
    email: user.email ?? "",
    password: "",
    passwordConfirm: "",
  });
  const [errors, setErrors] = useState(createEmptyProfileFieldErrors);
  const [isPending, startTransition] = useTransition();
  const profileFieldErrors =
    locale === "en"
      ? {
          usernameInvalid: "The ID must be 6-32 letters, numbers, or an email-style value.",
          emailInvalid: "Enter a valid E-mail address.",
          passwordInvalid:
            "The password must be 6-32 characters and include letters, numbers, and special characters.",
          passwordConfirmInvalid:
            "The password confirmation must be at least 6 characters long.",
          passwordConfirmMismatch: "The passwords do not match.",
        }
      : {
          usernameInvalid: "ID는 6자~32자의 영문, 숫자 또는 이메일 형식이어야 합니다.",
          emailInvalid: "올바른 E-mail 주소를 입력해 주세요.",
          passwordInvalid:
            "비밀번호는 6자~32자의 영문, 숫자, 특수문자를 모두 포함해야 합니다.",
          passwordConfirmInvalid: "비밀번호 확인은 6자 이상 입력해 주세요.",
          passwordConfirmMismatch: "비밀번호가 일치하지 않습니다.",
        };

  function getErrorMessage(code: string | null) {
    if (!code) {
      return null;
    }

    if (code === "username.invalid") {
      return profileFieldErrors.usernameInvalid;
    }

    if (code === "email.invalid") {
      return profileFieldErrors.emailInvalid;
    }

    if (code === "password.invalid") {
      return profileFieldErrors.passwordInvalid;
    }

    if (code === "passwordConfirm.mismatch") {
      return profileFieldErrors.passwordConfirmMismatch;
    }

    return profileFieldErrors.passwordConfirmInvalid;
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const img = document.createElement("img");
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 300, 300);
        const scale = Math.max(300 / img.width, 300 / img.height);
        const x = (300 - img.width * scale) / 2;
        const y = (300 - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        setAvatarPreview(canvas.toDataURL("image/jpeg", 0.9));
      }
    };
    reader.readAsDataURL(file);
  }

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
    setErrors(getLiveProfileFieldErrors(newValues));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = getLiveProfileFieldErrors(formValues);
    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("locale", locale);
      formData.append("csrfToken", csrfToken);
      formData.append("avatarDataUrl", avatarPreview);
      formData.append("username", sanitizeUsernameInput(formValues.username));
      formData.append("email", sanitizeEmailInput(formValues.email));
      formData.append("password", formValues.password);
      formData.append("passwordConfirm", formValues.passwordConfirm);

      try {
        await updateProfileAction(formData);
        setDialogOpen(false);
      } catch (error) {
        setDialogOpen(false);
        throw error;
      }
    });
  }

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <button
            aria-label="프로필 메뉴"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-foreground transition-colors hover:bg-emerald-500 hover:text-white dark:bg-surface"
            type="button"
          >
            {avatarPreview ? (
              <Image
                alt={`${user.displayName} avatar`}
                className="h-full w-full rounded-full object-cover"
                height={40}
                src={avatarPreview}
                width={40}
                unoptimized
              />
            ) : (
              <UserRound className="h-4 w-4" />
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent align="end" sideOffset={8} className="w-[24rem] p-0 overflow-hidden shadow-xl">
          <div className="flex w-full">
            {/* 좌측: 유저 프로필 영역 */}
            <div className="flex flex-1 flex-col items-center justify-center border-r border-border p-4 bg-surface/30">
              <div className="relative flex h-[120px] w-[120px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-muted shadow-sm">
                {avatarPreview ? (
                  <Image
                    alt={`${user.displayName} preview`}
                    className="h-full w-full object-cover"
                    height={120}
                    src={avatarPreview}
                    width={120}
                    unoptimized
                  />
                ) : (
                  <span className="text-2xl font-semibold text-foreground/40">{user.avatarInitials}</span>
                )}
              </div>
            </div>

            {/* 우측: 계정 정보 및 버튼 컨트롤 */}
            <div className="flex flex-1 flex-col justify-center p-4">
              <div className="min-w-0 mb-4">
                <p className="truncate text-base font-bold text-foreground">{user.displayName}</p>
                <p className="mt-0.5 truncate text-xs text-foreground/60">{user.email}</p>
              </div>

              <div className="flex flex-col gap-2">
                <Dialog open={dialogOpen} onOpenChange={(open) => { if (!isPending) setDialogOpen(open); }}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-start px-0 border-0 shadow-none hover:text-[#10b981] hover:bg-transparent dark:hover:text-[#10b981] transition-colors">
                      계정 정보 변경
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader className="mb-4 space-y-2 text-center sm:text-center">
                      <DialogTitle className="font-display text-3xl font-semibold tracking-tight">계정 정보 변경</DialogTitle>
                      <DialogDescription className="hidden">계정 정보 변경 팝업</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-foreground">
                      <div className="mb-6 flex flex-col items-center">
                        <div
                          className="relative flex h-32 w-32 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[#10b981]/50 bg-surface-muted shadow-sm transition-all hover:border-[#10b981] group"
                          onClick={openFilePicker}
                        >
                          {avatarPreview ? (
                            <Image
                              alt="Avatar preview"
                              className="h-full w-full object-cover"
                              height={128}
                              src={avatarPreview}
                              width={128}
                              unoptimized
                            />
                          ) : (
                            <span className="text-4xl font-semibold text-foreground/40">{user.avatarInitials}</span>
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs font-semibold text-white">사진 변경</span>
                          </div>
                        </div>
                        <input
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                          ref={fileInputRef}
                          type="file"
                        />
                      </div>

                      <FieldWithTooltip
                        value={formValues.username}
                        onChange={handleChange}
                        errorText={getErrorMessage(errors.username)}
                        id="profile-username"
                        label="ID"
                        maxLength={32}
                        name="username"
                        tooltip="프로젝트에 표시될 닉네임을 입력하세요."
                      />

                      <FieldWithTooltip
                        value={formValues.email}
                        onChange={handleChange}
                        errorText={getErrorMessage(errors.email)}
                        id="profile-email"
                        label="E-mail"
                        name="email"
                        tooltip="자주 사용하는 이메일을 입력하세요."
                        type="text"
                      />

                      <FieldWithTooltip
                        value={formValues.password}
                        onChange={handleChange}
                        errorText={getErrorMessage(errors.password)}
                        id="profile-password"
                        label="새 비밀번호 (선택)"
                        maxLength={32}
                        name="password"
                        placeholder="****"
                        tooltip="비밀번호를 변경하려면 4자 이상 입력하세요."
                        type="password"
                      />

                      <FieldWithTooltip
                        value={formValues.passwordConfirm}
                        onChange={handleChange}
                        errorText={getErrorMessage(errors.passwordConfirm)}
                        id="profile-password-confirm"
                        label="PW 확인 (선택)"
                        maxLength={32}
                        name="passwordConfirm"
                        placeholder="****"
                        tooltip="위와 동일한 비밀번호를 입력해주세요."
                        type="password"
                      />

                      <div className="flex justify-end gap-2 pt-2 border-t border-border mt-4">
                        <DialogClose asChild>
                          <Button type="button" variant="outline" disabled={isPending}>
                            취소
                          </Button>
                        </DialogClose>
                        <Button
                          type="submit"
                          disabled={Object.values(errors).some(Boolean) || isPending}
                        >
                          저장
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <form action={signOutAction} className="w-full">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="csrfToken" value={csrfToken} />
                  <Button className="w-full justify-start px-0 border-0 shadow-none text-foreground hover:text-[#10b981] hover:bg-transparent dark:hover:text-[#10b981] transition-colors" type="submit" variant="ghost" size="sm">
                    로그아웃
                  </Button>
                </form>
                <AccountDeleteDialog csrfToken={csrfToken} locale={locale} />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Global Saving Blocker Overlay */}
      {isPending && <FullPageLoader text="저장 중입니다..." />}
    </>
  );
}

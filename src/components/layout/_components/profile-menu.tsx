"use client";

import Image from "next/image";
import { UserRound } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { z } from "zod";

import {
  signOutAction,
  updateProfileAction,
} from "@/app/[locale]/(protected)/actions";
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
import { FieldWithTooltip } from "@/components/auth/_components/field-with-tooltip";
import type { AppSessionUser } from "@/lib/auth/session";

type ProfileMenuProps = {
  locale: string;
  user: AppSessionUser;
  csrfToken: string;
};

const profileSchema = z
  .object({
    username: z.string().trim().min(3, "아이디는 3자 이상이어야 합니다."),
    email: z.string().trim().email("유효한 이메일 형식이 아닙니다."),
    password: z.string().trim().optional(),
    passwordConfirm: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (data.password || data.passwordConfirm) {
        return (data.password?.length ?? 0) >= 4;
      }
      return true;
    },
    {
      message: "비밀번호는 최소 4자 이상 지정해야 합니다.",
      path: ["password"],
    }
  )
  .refine(
    (data) => {
      if (data.password || data.passwordConfirm) {
        return data.password === data.passwordConfirm;
      }
      return true;
    },
    {
      message: "비밀번호가 일치하지 않습니다.",
      path: ["passwordConfirm"],
    }
  );

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

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

  function validateForm(values: typeof formValues) {
    const newErrors: Record<string, string> = {};

    if (values.username.trim().length < 3) {
      newErrors.username = "아이디는 3자 이상이어야 합니다.";
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      newErrors.email = "유효한 이메일 형식이 아닙니다.";
    }

    if (values.password || values.passwordConfirm) {
      if (values.password.trim().length < 4) {
        newErrors.password = "비밀번호는 최소 4자 이상 지정해야 합니다.";
      }
      if (values.password !== values.passwordConfirm) {
        newErrors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const newValues = { ...formValues, [name]: value };
    setFormValues(newValues);
    validateForm(newValues);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateForm(formValues)) return;
    
    startTransition(async () => {
      const formData = new FormData();
      formData.append("locale", locale);
      formData.append("csrfToken", csrfToken);
      formData.append("avatarDataUrl", avatarPreview);
      formData.append("username", formValues.username);
      formData.append("email", formValues.email);
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
                        errorText={errors.username || null}
                        id="profile-username"
                        label="ID"
                        maxLength={32}
                        name="username"
                        tooltip="프로젝트에 표시될 닉네임을 입력하세요."
                      />
                      
                      <FieldWithTooltip
                        value={formValues.email}
                        onChange={handleChange}
                        errorText={errors.email || null}
                        id="profile-email"
                        label="E-mail"
                        name="email"
                        tooltip="자주 사용하는 이메일을 입력하세요."
                        type="text"
                      />

                      <FieldWithTooltip
                        value={formValues.password}
                        onChange={handleChange}
                        errorText={errors.password || null}
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
                        errorText={errors.passwordConfirm || null}
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
                        <Button type="submit" disabled={Object.keys(errors).length > 0 || isPending}>
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

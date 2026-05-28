"use client";

import { useMemo, useState } from "react";

import { resetSystemAction } from "@/app/[locale]/(protected)/actions";
import { SYSTEM_RESET_CONFIRMATION } from "@/lib/auth/system-reset";
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

type SystemResetPanelProps = {
  csrfToken: string;
  errorMessage: string | null;
  labels: {
    button: string;
    confirm: string;
    confirmation: string;
    confirmationPlaceholder: string;
    description: string;
    dialogDescription: string;
    dialogTitle: string;
    password: string;
    settingsOnlyComingSoon: string;
    title: string;
  };
};

export function SystemResetPanel({ csrfToken, errorMessage, labels }: SystemResetPanelProps) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const canSubmit = useMemo(
    () => password.length > 0 && confirmation.trim() === SYSTEM_RESET_CONFIRMATION,
    [confirmation, password],
  );

  return (
    <article className="content-panel p-6">
      <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">{labels.title}</h3>
      <p className="mt-2 text-sm leading-6 text-foreground/65">{labels.description}</p>
      <p className="mt-4 rounded-[var(--kmsf-radius-xl)] border border-border bg-surface p-4 text-sm text-foreground/70">
        {labels.settingsOnlyComingSoon}
      </p>
      {errorMessage ? (
        <p className="mt-4 rounded-[var(--kmsf-radius-xl)] border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {errorMessage}
        </p>
      ) : null}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="mt-6" type="button" variant="destructive">
            {labels.button}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{labels.dialogTitle}</DialogTitle>
            <DialogDescription>{labels.dialogDescription}</DialogDescription>
          </DialogHeader>
          <form action={resetSystemAction} className="mt-5 space-y-4">
            <input name="csrfToken" type="hidden" value={csrfToken} />
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="system-reset-password">
                {labels.password}
              </label>
              <Input
                autoComplete="current-password"
                id="system-reset-password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="system-reset-confirmation">
                {labels.confirmation}
              </label>
              <Input
                id="system-reset-confirmation"
                name="confirmation"
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder={labels.confirmationPlaceholder}
                value={confirmation}
              />
            </div>
            <div className="flex justify-end">
              <Button disabled={!canSubmit} type="submit" variant="destructive">
                {labels.confirm}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </article>
  );
}

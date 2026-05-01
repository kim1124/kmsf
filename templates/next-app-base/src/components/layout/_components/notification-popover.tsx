"use client";

import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const notifications = [
  {
    title: "배포 준비 완료",
    description: "운영 반영 전 마지막 검토가 필요합니다.",
  },
  {
    title: "차트 샘플 데이터 갱신",
    description: "최근 7일 기준 데이터가 반영되었습니다.",
  },
];

export function NotificationPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="알림"
          className="h-10 w-10 rounded-full px-0 hover:bg-emerald-500 hover:text-white transition-colors"
          size="sm"
          variant="secondary"
        >
          <Bell className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[22rem] p-4 text-foreground">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold">알림</p>
            <p className="mt-1 text-xs text-foreground/60">최근 업데이트 2건</p>
          </div>
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.title}
                className="cursor-pointer rounded-xl border border-border bg-surface p-3 transition-colors hover:bg-[#10b981] hover:text-white"
              >
                <p className="text-sm font-medium">{notification.title}</p>
                <p className="mt-1 text-xs leading-5 text-foreground/60">
                  {notification.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

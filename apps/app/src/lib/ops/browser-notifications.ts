"use client";

import {
  opsBrowserNotificationOptions,
  type Locale,
  type OpsNotification,
} from "@leclerc/core";

export type BrowserOpsNotificationPermission = NotificationPermission | "unsupported";

export function browserOpsNotificationPermission(): BrowserOpsNotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function requestBrowserOpsNotifications(): Promise<BrowserOpsNotificationPermission> {
  const current = browserOpsNotificationPermission();
  if (current !== "default") return current;
  return Notification.requestPermission();
}

export async function showOpsBrowserNotification(input: {
  notification: OpsNotification;
  title: string;
  body: string;
  locale: Locale;
}): Promise<boolean> {
  if (browserOpsNotificationPermission() !== "granted") return false;
  const registration = await navigator.serviceWorker.ready;
  const options = opsBrowserNotificationOptions({
    notificationId: input.notification.id,
    locale: input.locale,
  });
  const notificationOptions = {
    body: input.body,
    tag: options.tag,
    icon: options.iconPath,
    badge: options.badgePath,
    renotify: options.renotify,
    data: {
      url: options.url,
      notificationId: input.notification.id,
      kind: input.notification.kind,
    },
  };
  await registration.showNotification(input.title, notificationOptions);
  return true;
}

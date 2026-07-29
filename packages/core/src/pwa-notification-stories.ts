import type { Locale } from "./intel";

export interface PwaServiceWorkerCopy {
  path: string;
  registrationFailedMessage: string;
}

export interface OpsBrowserNotificationCopy {
  tagPrefix: string;
  iconPath: string;
  badgePath: string;
  openUrl: Record<Locale, string>;
  renotify: boolean;
}

export interface PwaNotificationStory {
  id: string;
  serviceWorker: PwaServiceWorkerCopy;
  opsBrowser: OpsBrowserNotificationCopy;
}

export interface OpsBrowserNotificationOptions {
  tag: string;
  iconPath: string;
  badgePath: string;
  renotify: boolean;
  url: string;
}

export const DEFAULT_PWA_NOTIFICATION_STORY: PwaNotificationStory = {
  id: "pwa-ops-notification-wire",
  serviceWorker: {
    path: "/sw.js",
    registrationFailedMessage: "Service worker registration failed",
  },
  opsBrowser: {
    tagPrefix: "leclerc-ops",
    iconPath: "/android-chrome-192x192.png",
    badgePath: "/icon.svg",
    openUrl: {
      en: "/en/operaciones",
      es: "/es/operaciones",
    },
    renotify: true,
  },
};

export function pwaServiceWorkerPath(
  story: PwaNotificationStory = DEFAULT_PWA_NOTIFICATION_STORY,
): string {
  return story.serviceWorker.path;
}

export function pwaServiceWorkerRegistrationFailedMessage(
  story: PwaNotificationStory = DEFAULT_PWA_NOTIFICATION_STORY,
): string {
  return story.serviceWorker.registrationFailedMessage;
}

export function opsBrowserNotificationOptions(
  input: { notificationId: string; locale: Locale },
  story: PwaNotificationStory = DEFAULT_PWA_NOTIFICATION_STORY,
): OpsBrowserNotificationOptions {
  return {
    tag: `${story.opsBrowser.tagPrefix}-${input.notificationId}`,
    iconPath: story.opsBrowser.iconPath,
    badgePath: story.opsBrowser.badgePath,
    renotify: story.opsBrowser.renotify,
    url: story.opsBrowser.openUrl[input.locale],
  };
}

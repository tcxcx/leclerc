import type { Locale } from "./intel";
import type { OpsNotificationKind } from "./ops-console";

export type OpsBrowserNotificationPermission = "default" | "denied" | "granted" | "unsupported";

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
  opsFeed: {
    browserPermissionIcons: Record<OpsBrowserNotificationPermission, string>;
    refreshIcon: string;
    notificationIcons: Record<OpsNotificationKind, string>;
    notificationIconClasses: Record<OpsNotificationKind, string>;
  };
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
  opsFeed: {
    browserPermissionIcons: {
      granted: "notifications_active",
      denied: "notifications_off",
      default: "notifications",
      unsupported: "notifications_off",
    },
    refreshIcon: "sync",
    notificationIcons: {
      assignment: "assignment_turned_in",
      invite: "forward_to_inbox",
      funding: "account_balance_wallet",
      system: "notifications",
    },
    notificationIconClasses: {
      assignment: "bg-ignyte text-on-ignyte",
      invite: "bg-primary-container text-on-primary-container",
      funding: "bg-secondary-container text-on-secondary-container",
      system: "bg-surface-container-high text-on-surface-variant",
    },
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

export function opsBrowserPermissionIcon(
  permission: OpsBrowserNotificationPermission,
  story: PwaNotificationStory = DEFAULT_PWA_NOTIFICATION_STORY,
): string {
  return story.opsFeed.browserPermissionIcons[permission];
}

export function opsNotificationRefreshIcon(story: PwaNotificationStory = DEFAULT_PWA_NOTIFICATION_STORY): string {
  return story.opsFeed.refreshIcon;
}

export function opsNotificationFeedIcon(
  kind: OpsNotificationKind,
  story: PwaNotificationStory = DEFAULT_PWA_NOTIFICATION_STORY,
): string {
  return story.opsFeed.notificationIcons[kind];
}

export function opsNotificationFeedIconClass(
  kind: OpsNotificationKind,
  story: PwaNotificationStory = DEFAULT_PWA_NOTIFICATION_STORY,
): string {
  return story.opsFeed.notificationIconClasses[kind];
}

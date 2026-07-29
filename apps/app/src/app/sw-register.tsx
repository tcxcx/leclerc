"use client";

import { useEffect } from "react";
import {
  pwaServiceWorkerPath,
  pwaServiceWorkerRegistrationFailedMessage,
} from "@leclerc/core/pwa-notification-stories";

/** Registers the service worker once the app shell has mounted. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register(pwaServiceWorkerPath()).catch((err) => {
      console.error(pwaServiceWorkerRegistrationFailedMessage(), err);
    });
  }, []);

  return null;
}

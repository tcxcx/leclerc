import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ServiceWorkerRegister } from "./sw-register";

// Dev-only inspector (react-grab). Never loads in production builds.
const enableReactGrab = process.env.NODE_ENV === "development";

export const metadata: Metadata = {
  title: "LeClerc — Field Intelligence Station",
  description:
    "Local-first field intelligence: capture, recall, analyze, pay and dead-drop — nothing leaves a server you don't control. Powered by QVAC.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LeClerc",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

/**
 * Thin root shell. The real app chrome + i18n provider live in
 * [locale]/layout.tsx (next-international rewrite strategy).
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;600;700;800&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full bg-surface text-on-surface font-body-md antialiased"
      >
        {enableReactGrab && (
          <Script
            src="https://unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

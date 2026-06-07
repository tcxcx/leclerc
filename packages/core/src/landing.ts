export type LandingActionKind = "operation-room" | "pwa" | "expo";

export interface LandingAction {
  id: LandingActionKind;
  labelKey: string;
  descriptionKey: string;
  icon: string;
  href: string;
  enabled: boolean;
}

export interface LandingSurface {
  id: string;
  titleKey: string;
  bodyKey: string;
  icon: string;
}

export const LECLERC_LANDING_ACTIONS = [
  {
    id: "operation-room",
    labelKey: "landing.actions.room.label",
    descriptionKey: "landing.actions.room.description",
    icon: "login",
    href: "/",
    enabled: true,
  },
  {
    id: "pwa",
    labelKey: "landing.actions.pwa.label",
    descriptionKey: "landing.actions.pwa.description",
    icon: "install_mobile",
    href: "/manifest.webmanifest",
    enabled: true,
  },
  {
    id: "expo",
    labelKey: "landing.actions.expo.label",
    descriptionKey: "landing.actions.expo.description",
    icon: "phone_iphone",
    href: "/downloads/leclerc-expo",
    enabled: false,
  },
] as const satisfies readonly LandingAction[];

export const LECLERC_LANDING_SURFACES = [
  {
    id: "p2p",
    titleKey: "landing.surfaces.p2p.title",
    bodyKey: "landing.surfaces.p2p.body",
    icon: "hub",
  },
  {
    id: "wallet",
    titleKey: "landing.surfaces.wallet.title",
    bodyKey: "landing.surfaces.wallet.body",
    icon: "account_balance_wallet",
  },
  {
    id: "ai",
    titleKey: "landing.surfaces.ai.title",
    bodyKey: "landing.surfaces.ai.body",
    icon: "neurology",
  },
] as const satisfies readonly LandingSurface[];

export function listLandingActions(): LandingAction[] {
  return [...LECLERC_LANDING_ACTIONS];
}

export function listLandingSurfaces(): LandingSurface[] {
  return [...LECLERC_LANDING_SURFACES];
}

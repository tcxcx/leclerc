import type { Locale } from "./intel";

export type NavigationItemId =
  | "console"
  | "capture"
  | "dossier"
  | "analysis"
  | "wallet"
  | "operations"
  | "settings"
  | "link";

export interface NavigationItemStory {
  id: NavigationItemId;
  segment: string;
  icon: string;
  labelKey: string;
}

export interface NavigationStory {
  id: string;
  home: NavigationItemStory;
  intelToggle: Pick<NavigationItemStory, "icon" | "labelKey">;
  bottomNav: NavigationItemStory[];
  topBar: NavigationItemStory[];
  intelLayer: NavigationItemStory[];
}

export const DEFAULT_NAVIGATION_STORY: NavigationStory = {
  id: "cleo-surface-navigation",
  home: {
    id: "console",
    segment: "",
    icon: "shield_person",
    labelKey: "app.name",
  },
  intelToggle: {
    icon: "shield_person",
    labelKey: "console.intelLayer",
  },
  bottomNav: [
    { id: "console", segment: "", icon: "credit_card", labelKey: "nav.console" },
    { id: "capture", segment: "capturar", icon: "mic", labelKey: "nav.capture" },
    { id: "dossier", segment: "expediente", icon: "folder_shared", labelKey: "nav.dossier" },
    { id: "analysis", segment: "analisis", icon: "analytics", labelKey: "nav.analysis" },
    { id: "wallet", segment: "billetera", icon: "account_balance_wallet", labelKey: "nav.wallet" },
  ],
  topBar: [
    { id: "operations", segment: "operaciones", icon: "assignment_ind", labelKey: "nav.operations" },
    { id: "settings", segment: "ajustes", icon: "settings", labelKey: "nav.settings" },
  ],
  intelLayer: [
    { id: "capture", segment: "capturar", icon: "fiber_manual_record", labelKey: "nav.capture" },
    { id: "dossier", segment: "expediente", icon: "folder_open", labelKey: "nav.dossier" },
    { id: "analysis", segment: "analisis", icon: "query_stats", labelKey: "nav.analysis" },
    { id: "link", segment: "enlace", icon: "hub", labelKey: "nav.link" },
  ],
};

export function navigationHome(story: NavigationStory = DEFAULT_NAVIGATION_STORY): NavigationItemStory {
  return { ...story.home };
}

export function intelLayerToggle(story: NavigationStory = DEFAULT_NAVIGATION_STORY): Pick<NavigationItemStory, "icon" | "labelKey"> {
  return { ...story.intelToggle };
}

export function bottomNavigationItems(story: NavigationStory = DEFAULT_NAVIGATION_STORY): NavigationItemStory[] {
  return story.bottomNav.map(cloneNavigationItem);
}

export function topBarNavigationItems(story: NavigationStory = DEFAULT_NAVIGATION_STORY): NavigationItemStory[] {
  return story.topBar.map(cloneNavigationItem);
}

export function intelLayerNavigationItems(story: NavigationStory = DEFAULT_NAVIGATION_STORY): NavigationItemStory[] {
  return story.intelLayer.map(cloneNavigationItem);
}

export function localizedNavigationHref(
  item: Pick<NavigationItemStory, "segment">,
  locale: Locale,
): string {
  return item.segment ? `/${locale}/${item.segment}` : `/${locale}`;
}

function cloneNavigationItem(item: NavigationItemStory): NavigationItemStory {
  return { ...item };
}

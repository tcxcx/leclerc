export type LeclercSurface = "pwa" | "desktop" | "mobile" | "worklet";

export interface SurfaceCapabilities {
  surface: LeclercSurface;
  qvac: "station" | "delegate" | "on-device";
  voice: "station-ws" | "worklet";
  wallet: "route" | "delegate" | "worklet";
  p2p: "station" | "worklet";
  storage: "indexeddb" | "filesystem" | "secure-storage" | "memory";
}

export const PWA_CAPABILITIES: SurfaceCapabilities = {
  surface: "pwa",
  qvac: "station",
  voice: "station-ws",
  wallet: "route",
  p2p: "station",
  storage: "indexeddb",
};

export const DESKTOP_CAPABILITIES: SurfaceCapabilities = {
  surface: "desktop",
  qvac: "on-device",
  voice: "worklet",
  wallet: "worklet",
  p2p: "worklet",
  storage: "filesystem",
};

export const MOBILE_CAPABILITIES: SurfaceCapabilities = {
  surface: "mobile",
  qvac: "on-device",
  voice: "worklet",
  wallet: "worklet",
  p2p: "worklet",
  storage: "secure-storage",
};

export const WORKLET_CAPABILITIES: SurfaceCapabilities = {
  surface: "worklet",
  qvac: "on-device",
  voice: "worklet",
  wallet: "worklet",
  p2p: "worklet",
  storage: "memory",
};

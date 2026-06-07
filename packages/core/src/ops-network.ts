export type OpsNodeRole = "station" | "mobile-agent" | "desktop-peer" | "observer";
export type OpsNodeStatus = "online" | "standby" | "degraded";

export interface OpsNetworkNode {
  id: string;
  labelKey: string;
  role: OpsNodeRole;
  status: OpsNodeStatus;
  location: [number, number];
  size: number;
  color: [number, number, number];
}

export interface OpsNetworkArc {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  color: [number, number, number];
}

export const OPS_NETWORK_NODES = [
  {
    id: "safehouse-ba",
    labelKey: "ops.nodes.safehouseBa",
    role: "station",
    status: "online",
    location: [-34.6037, -58.3816],
    size: 0.055,
    color: [0.96, 0.88, 0.01],
  },
  {
    id: "agent-nyc",
    labelKey: "ops.nodes.agentNyc",
    role: "mobile-agent",
    status: "online",
    location: [40.7128, -74.006],
    size: 0.04,
    color: [0.18, 0.78, 0.54],
  },
  {
    id: "desktop-london",
    labelKey: "ops.nodes.desktopLondon",
    role: "desktop-peer",
    status: "standby",
    location: [51.5072, -0.1276],
    size: 0.038,
    color: [0.5, 0.65, 1],
  },
  {
    id: "agent-dubai",
    labelKey: "ops.nodes.agentDubai",
    role: "mobile-agent",
    status: "degraded",
    location: [25.2048, 55.2708],
    size: 0.035,
    color: [1, 0.42, 0.32],
  },
  {
    id: "observer-tokyo",
    labelKey: "ops.nodes.observerTokyo",
    role: "observer",
    status: "standby",
    location: [35.6764, 139.65],
    size: 0.034,
    color: [0.72, 0.54, 1],
  },
] as const satisfies readonly OpsNetworkNode[];

export const OPS_NETWORK_ARCS = [
  {
    id: "ba-nyc",
    fromNodeId: "safehouse-ba",
    toNodeId: "agent-nyc",
    color: [0.96, 0.88, 0.01],
  },
  {
    id: "ba-london",
    fromNodeId: "safehouse-ba",
    toNodeId: "desktop-london",
    color: [0.5, 0.65, 1],
  },
  {
    id: "london-dubai",
    fromNodeId: "desktop-london",
    toNodeId: "agent-dubai",
    color: [1, 0.42, 0.32],
  },
  {
    id: "london-tokyo",
    fromNodeId: "desktop-london",
    toNodeId: "observer-tokyo",
    color: [0.72, 0.54, 1],
  },
] as const satisfies readonly OpsNetworkArc[];

export function listOpsNetworkNodes(): OpsNetworkNode[] {
  return [...OPS_NETWORK_NODES];
}

export function listOpsNetworkArcs(): OpsNetworkArc[] {
  return [...OPS_NETWORK_ARCS];
}

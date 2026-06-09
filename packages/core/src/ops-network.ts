import { DEFAULT_OPS_CONSOLE_STORY, type OpsConsoleStory } from "./ops-stories";
import type { OpsNetworkArc, OpsNetworkNode } from "./ops-console";

export type { OpsNetworkArc, OpsNetworkNode, OpsNodeRole, OpsNodeStatus } from "./ops-console";

export const OPS_NETWORK_NODES = DEFAULT_OPS_CONSOLE_STORY.network.nodes;
export const OPS_NETWORK_ARCS = DEFAULT_OPS_CONSOLE_STORY.network.arcs;

export function listOpsNetworkNodes(story: OpsConsoleStory = DEFAULT_OPS_CONSOLE_STORY): OpsNetworkNode[] {
  return story.network.nodes.map((node) => ({ ...node, location: [...node.location], color: [...node.color] }));
}

export function listOpsNetworkArcs(story: OpsConsoleStory = DEFAULT_OPS_CONSOLE_STORY): OpsNetworkArc[] {
  return story.network.arcs.map((arc) => ({ ...arc, color: [...arc.color] }));
}

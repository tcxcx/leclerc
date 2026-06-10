export type WalletAgentToolName = "wallet_balances" | "wallet_send" | "wallet_swap";

export interface WalletAgentToolCopy {
  title: string;
  description: string;
  mcpDescription: string;
}

export interface WalletAgentToolDescriptor extends WalletAgentToolCopy {
  name: WalletAgentToolName;
}

export interface WalletAgentToolStory {
  id: string;
  tools: Record<WalletAgentToolName, WalletAgentToolCopy>;
  schemaDescriptions: {
    decimalAmount: string;
  };
  blockedReasons: {
    swapNoVerifiedVenue: string;
  };
}

export const DEFAULT_WALLET_AGENT_TOOL_STORY: WalletAgentToolStory = {
  id: "arc-testnet-wallet-agent",
  tools: {
    wallet_balances: {
      title: "Wallet balances",
      description: "Read catalog-backed WDK wallet balances for the local wallet.",
      mcpDescription: "Read catalog-backed WDK wallet balances.",
    },
    wallet_send: {
      title: "Wallet send",
      description: "Propose an Arc Testnet EVM token transfer. Confirmation is required before execution.",
      mcpDescription: "Submit an Arc Testnet EVM token transfer through WDK.",
    },
    wallet_swap: {
      title: "Wallet swap intent",
      description: "Prepare a local wallet swap intent. Execution is blocked until a verified venue is wired.",
      mcpDescription: "Prepare a swap intent; execution is blocked until venue wiring is verified.",
    },
  },
  schemaDescriptions: {
    decimalAmount: "Decimal amount, not atomic units.",
  },
  blockedReasons: {
    swapNoVerifiedVenue: "No verified Arc Testnet swap venue has been wired into LeClerc yet.",
  },
};

export function walletAgentToolDescriptor(
  name: WalletAgentToolName,
  story: WalletAgentToolStory = DEFAULT_WALLET_AGENT_TOOL_STORY,
): WalletAgentToolDescriptor {
  return {
    name,
    ...story.tools[name],
  };
}

export function walletAgentToolDescriptors(
  story: WalletAgentToolStory = DEFAULT_WALLET_AGENT_TOOL_STORY,
): WalletAgentToolDescriptor[] {
  return (Object.keys(story.tools) as WalletAgentToolName[]).map((name) =>
    walletAgentToolDescriptor(name, story),
  );
}

export function walletAmountDescription(story: WalletAgentToolStory = DEFAULT_WALLET_AGENT_TOOL_STORY): string {
  return story.schemaDescriptions.decimalAmount;
}

export function walletSwapBlockedReason(story: WalletAgentToolStory = DEFAULT_WALLET_AGENT_TOOL_STORY): string {
  return story.blockedReasons.swapNoVerifiedVenue;
}

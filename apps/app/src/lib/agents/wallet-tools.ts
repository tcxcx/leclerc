import "server-only";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  ARC_TESTNET_CHAIN_ID,
  listLeclercTransferAssetsForChain,
  type LeclercAssetId,
} from "@leclerc/transfer-core";
import {
  walletAgentToolDescriptor,
  walletAgentToolDescriptors,
  walletAmountDescription,
  walletSwapBlockedReason,
  type WalletAgentToolName,
} from "@leclerc/core";
import { balances } from "@leclerc/wallet";
import { proposeTransfer } from "@leclerc/transfers";

const TESTNET_CHAIN_ID = ARC_TESTNET_CHAIN_ID;
const SENDABLE_ASSETS = ["usdc", "eurc", "mxnb", "qcad", "audf", "jpyc", "cirbtc"] as const;

const balanceSchema = z.object({
  seed: z.string().min(1),
});

const sendSchema = z.object({
  seed: z.string().min(1),
  assetId: z.enum(SENDABLE_ASSETS),
  recipient: z.string().min(1),
  amount: z.string().min(1).describe(walletAmountDescription()),
});

const swapSchema = z.object({
  seed: z.string().min(1),
  fromAssetId: z.enum(["usdc", "eurc", "mxnb", "qcad", "audf", "jpyc", "cirbtc"]),
  toAssetId: z.enum(["usdc", "eurc", "mxnb", "qcad", "audf", "jpyc", "cirbtc"]),
  amount: z.string().min(1).describe(walletAmountDescription()),
});

export type { WalletAgentToolName } from "@leclerc/core";

export const WALLET_AGENT_TOOL_NAMES = [
  "wallet_balances",
  "wallet_send",
  "wallet_swap",
] as const satisfies readonly WalletAgentToolName[];

export function walletAgentToolDefs() {
  return walletAgentToolDescriptors().map((tool) => ({
    name: tool.name,
    description: tool.description,
    schema: walletAgentSchema(tool.name),
  }));
}

export function createWalletMcpServer() {
  const server = new McpServer({
    name: "leclerc-wallet",
    version: "0.1.0",
  });
  const registerTool = server.registerTool.bind(server) as (
    name: string,
    config: {
      title: string;
      description: string;
      inputSchema: Record<string, unknown>;
    },
    cb: (args: Record<string, unknown>) => Promise<ReturnType<typeof textResult>>,
  ) => unknown;

  const balancesTool = walletAgentToolDescriptor("wallet_balances");
  registerTool(
    balancesTool.name,
    {
      title: balancesTool.title,
      description: balancesTool.mcpDescription,
      inputSchema: balanceSchema.shape,
    },
    async (args) => textResult(await callWalletAgentTool("wallet_balances", args)),
  );

  const sendTool = walletAgentToolDescriptor("wallet_send");
  registerTool(
    sendTool.name,
    {
      title: sendTool.title,
      description: sendTool.mcpDescription,
      inputSchema: sendSchema.shape,
    },
    async (args) => textResult(await callWalletAgentTool("wallet_send", args)),
  );

  const swapTool = walletAgentToolDescriptor("wallet_swap");
  registerTool(
    swapTool.name,
    {
      title: swapTool.title,
      description: swapTool.mcpDescription,
      inputSchema: swapSchema.shape,
    },
    async (args) => textResult(await callWalletAgentTool("wallet_swap", args)),
  );

  return server;
}

export async function callWalletAgentTool(name: WalletAgentToolName, args: unknown) {
  switch (name) {
    case "wallet_balances": {
      const parsed = balanceSchema.parse(args);
      return balances(parsed.seed);
    }
    case "wallet_send": {
      const parsed = sendSchema.parse(args);
      const result = proposeTransfer({
        seed: parsed.seed,
        to: parsed.recipient,
        amount: parsed.amount,
        assetId: parsed.assetId as LeclercAssetId,
        chainId: TESTNET_CHAIN_ID,
        purpose: "agent-wallet",
        metadata: { tool: "wallet_send" },
      });
      return {
        ...result,
        status: "requires_confirmation",
      };
    }
    case "wallet_swap": {
      const parsed = swapSchema.parse(args);
      return {
        status: "blocked",
        reason: walletSwapBlockedReason(),
        intent: {
          fromAssetId: parsed.fromAssetId,
          toAssetId: parsed.toAssetId,
          amount: parsed.amount,
          chainId: TESTNET_CHAIN_ID,
        },
        availableAssets: listLeclercTransferAssetsForChain(TESTNET_CHAIN_ID).map((asset) => asset.id),
      };
    }
  }
}

function walletAgentSchema(name: WalletAgentToolName) {
  switch (name) {
    case "wallet_balances":
      return balanceSchema;
    case "wallet_send":
      return sendSchema;
    case "wallet_swap":
      return swapSchema;
  }
}

function textResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

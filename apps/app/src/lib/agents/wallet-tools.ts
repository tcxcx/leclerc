import "server-only";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  listLeclercAssets,
  tokenAddress,
  type LeclercAssetId,
  type LeclercChainId,
} from "@leclerc/transfer-core";
import { balances } from "@leclerc/wallet";
import { proposeTransfer } from "@leclerc/transfers";

const TESTNET_CHAIN_ID = 5042002 satisfies LeclercChainId;
const SENDABLE_ASSETS = ["usdc", "eurc", "mxnb", "qcad", "audf", "jpyc", "cirbtc"] as const;

const balanceSchema = z.object({
  seed: z.string().min(1),
});

const sendSchema = z.object({
  seed: z.string().min(1),
  assetId: z.enum(SENDABLE_ASSETS),
  recipient: z.string().min(1),
  amount: z.string().min(1).describe("Decimal amount, not atomic units."),
});

const swapSchema = z.object({
  seed: z.string().min(1),
  fromAssetId: z.enum(["usdc", "eurc", "mxnb", "qcad", "audf", "jpyc", "cirbtc"]),
  toAssetId: z.enum(["usdc", "eurc", "mxnb", "qcad", "audf", "jpyc", "cirbtc"]),
  amount: z.string().min(1).describe("Decimal amount, not atomic units."),
});

export type WalletAgentToolName = "wallet_balances" | "wallet_send" | "wallet_swap";

export const WALLET_AGENT_TOOL_NAMES = [
  "wallet_balances",
  "wallet_send",
  "wallet_swap",
] as const satisfies readonly WalletAgentToolName[];

export function walletAgentToolDefs() {
  return [
    {
      name: "wallet_balances",
      description: "Read catalog-backed WDK wallet balances for the local wallet.",
      schema: balanceSchema,
    },
    {
      name: "wallet_send",
      description: "Propose an Arc Testnet EVM token transfer. Confirmation is required before execution.",
      schema: sendSchema,
    },
    {
      name: "wallet_swap",
      description: "Prepare a local wallet swap intent. Execution is blocked until a verified venue is wired.",
      schema: swapSchema,
    },
  ];
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

  registerTool(
    "wallet_balances",
    {
      title: "Wallet balances",
      description: "Read catalog-backed WDK wallet balances.",
      inputSchema: balanceSchema.shape,
    },
    async (args) => textResult(await callWalletAgentTool("wallet_balances", args)),
  );

  registerTool(
    "wallet_send",
    {
      title: "Wallet send",
      description: "Submit an Arc Testnet EVM token transfer through WDK.",
      inputSchema: sendSchema.shape,
    },
    async (args) => textResult(await callWalletAgentTool("wallet_send", args)),
  );

  registerTool(
    "wallet_swap",
    {
      title: "Wallet swap intent",
      description: "Prepare a swap intent; execution is blocked until venue wiring is verified.",
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
        reason: "No verified Arc Testnet swap venue has been wired into LeClerc yet.",
        intent: {
          fromAssetId: parsed.fromAssetId,
          toAssetId: parsed.toAssetId,
          amount: parsed.amount,
          chainId: TESTNET_CHAIN_ID,
        },
        availableAssets: listLeclercAssets()
          .filter((asset) => tokenAddress(asset.id, TESTNET_CHAIN_ID))
          .map((asset) => asset.id),
      };
    }
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

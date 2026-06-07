import { NextResponse } from "next/server";
import {
  callWalletAgentTool,
  createWalletMcpServer,
  walletAgentToolDefs,
  type WalletAgentToolName,
} from "@/lib/agents/wallet-tools";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      action?: string;
      tool?: WalletAgentToolName;
      args?: unknown;
    };
    switch (body.action) {
      case "list": {
        const server = createWalletMcpServer();
        return NextResponse.json({
          server: "leclerc-wallet",
          connected: server.isConnected(),
          tools: walletAgentToolDefs().map((tool) => ({
            name: tool.name,
            description: tool.description,
          })),
        });
      }
      case "call": {
        if (!body.tool) return NextResponse.json({ error: "tool required" }, { status: 400 });
        return NextResponse.json(await callWalletAgentTool(body.tool, body.args ?? {}));
      }
      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "wallet agent tool failed" },
      { status: 500 },
    );
  }
}

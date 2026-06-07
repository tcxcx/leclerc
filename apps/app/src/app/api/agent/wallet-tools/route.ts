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
    const guard = guardWalletToolsCaller(req);
    if (guard) return guard;
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

function guardWalletToolsCaller(req: Request): NextResponse | null {
  const expected = process.env.LECLERC_AGENT_WALLET_TOOLS_TOKEN?.trim();
  if (!expected) {
    return NextResponse.json({ error: "LECLERC_AGENT_WALLET_TOOLS_TOKEN is required" }, { status: 503 });
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized wallet tool caller" }, { status: 401 });
  }
  return null;
}

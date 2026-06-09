import { NextResponse } from "next/server";
import {
  callWalletAgentTool,
  createWalletMcpServer,
  walletAgentToolDefs,
  type WalletAgentToolName,
} from "@/lib/agents/wallet-tools";
import { apiError, apiErrorBody, apiErrorFromUnknown, type LeclercApiError } from "@/lib/api-errors";

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
        if (!body.tool) return apiErrorResponse(apiError("tool_required"));
        return NextResponse.json(await callWalletAgentTool(body.tool, body.args ?? {}));
      }
      default:
        return apiErrorResponse(apiError("unknown_action"));
    }
  } catch (err) {
    return apiErrorResponse(apiErrorFromUnknown(err, "wallet_agent_tool_failed"));
  }
}

function guardWalletToolsCaller(req: Request): NextResponse | null {
  const expected = process.env.LECLERC_AGENT_WALLET_TOOLS_TOKEN?.trim();
  if (!expected) {
    return apiErrorResponse(apiError("agent_wallet_token_required"));
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${expected}`) {
    return apiErrorResponse(apiError("unauthorized_wallet_tool_caller"));
  }
  return null;
}

function apiErrorResponse(error: LeclercApiError) {
  return NextResponse.json(apiErrorBody(error), { status: error.status });
}

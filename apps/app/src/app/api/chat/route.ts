import { NextResponse } from "next/server";
import { completeText, type CompleteMessage } from "@repo/qvacs";
import { loadLLM } from "@/lib/qvac/server";
import { persona, type Locale } from "@/lib/agents/persona";
import { apiErrorBody, apiErrorFromUnknown, type LeclercApiError } from "@/lib/api-errors";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Text chat turn (station, Node). The typed-input path of the Cleo home; the
 * voice path goes through the WS voice service. Persona-driven, grounded finance
 * context optional. POST { messages, locale, financeContext? } → { text }.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
      locale?: Locale;
      financeContext?: string;
    };
    const locale = body.locale ?? "es";
    const sys: CompleteMessage = { role: "system", content: persona(locale, { spoken: false }) };
    const history: CompleteMessage[] = [sys];
    if (body.financeContext) {
      history.push({ role: "system", content: `Contexto financiero local:\n${body.financeContext}` });
    }
    for (const m of body.messages.slice(-12)) history.push({ role: m.role, content: m.content });

    const llm = await loadLLM("media");
    const text = await completeText({ modelId: llm, history, stream: true });
    return NextResponse.json({ text: text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim() });
  } catch (err) {
    return apiErrorResponse(apiErrorFromUnknown(err, "chat_failed"));
  }
}

function apiErrorResponse(error: LeclercApiError) {
  return NextResponse.json(apiErrorBody(error), { status: error.status });
}

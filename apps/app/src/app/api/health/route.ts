import { NextResponse } from "next/server";
import { getWarmth, warmModels } from "@/lib/reports/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** GET — model warm-up status for ops/readiness checks. */
export async function GET() {
  return NextResponse.json(getWarmth());
}

/** POST — trigger background warm-up of the ASR + LLM models (idempotent). */
export async function POST() {
  // Fire-and-forget: don't block the response on the ~model load; poll GET.
  void warmModels().catch(() => {
    /* error is recorded in warmth state */
  });
  return NextResponse.json(getWarmth());
}

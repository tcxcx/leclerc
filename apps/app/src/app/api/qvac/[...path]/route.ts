// Vercel -> Railway proxy for `qvac serve openai`.
//
// IMPORTANT: do NOT import @qvac/sdk or @repo/qvacs here. They pull a native
// `bare` binary that crashes on Vercel. This route only does plain HTTP forwarding
// to an external OpenAI-compatible QVAC server (Railway), so it stays serverless-safe.

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Headers we must not forward upstream (hop-by-hop + host-specific).
const STRIPPED_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-length",
]);

// Headers we must not copy back from upstream onto the Next.js response.
const STRIPPED_RESPONSE_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-encoding",
  "content-length",
]);

type RouteContext = { params: Promise<{ path: string[] }> };

function buildTargetUrl(req: Request, path: string[]): string | null {
  const base = process.env.QVAC_BASE_URL;
  if (!base) return null;

  const trimmedBase = base.replace(/\/+$/, "");
  const suffix = path.map((p) => encodeURIComponent(p)).join("/");
  const query = new URL(req.url).search; // includes leading "?" or ""
  return `${trimmedBase}/${suffix}${query}`;
}

function buildForwardHeaders(req: Request): Headers {
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!STRIPPED_REQUEST_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const apiKey = process.env.QVAC_API_KEY;
  if (apiKey) {
    headers.set("authorization", `Bearer ${apiKey}`);
  }

  return headers;
}

function buildResponseHeaders(upstream: Response): Headers {
  const headers = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!STRIPPED_RESPONSE_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  return headers;
}

async function proxy(req: Request, ctx: RouteContext): Promise<Response> {
  const { path } = await ctx.params;
  const target = buildTargetUrl(req, path ?? []);

  if (!target) {
    return NextResponse.json(
      { error: "QVAC_BASE_URL not configured" },
      { status: 503 }
    );
  }

  // Read the raw body so multipart audio (and any binary payload) passes through
  // untouched. GET/HEAD have no body.
  let body: ArrayBuffer | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const buf = await req.arrayBuffer();
    if (buf.byteLength > 0) body = buf;
  }

  const upstream = await fetch(target, {
    method: req.method,
    headers: buildForwardHeaders(req),
    body,
    redirect: "manual",
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: buildResponseHeaders(upstream),
  });
}

export function GET(req: Request, ctx: RouteContext): Promise<Response> {
  return proxy(req, ctx);
}

export function POST(req: Request, ctx: RouteContext): Promise<Response> {
  return proxy(req, ctx);
}

export function OPTIONS(req: Request, ctx: RouteContext): Promise<Response> {
  return proxy(req, ctx);
}

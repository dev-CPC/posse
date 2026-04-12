import { NextRequest, NextResponse } from "next/server";

function getApiKey() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  return key;
}

const HEADERS = {
  "anthropic-version": "2023-06-01",
  "anthropic-beta": "managed-agents-2026-04-01",
  "content-type": "application/json",
};

// Health check — does the server have a key configured?
// GET /api/anthropic (no path param)
// Proxy — GET /api/anthropic?path=/v1/...
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");

  if (!path) {
    // Health check
    const hasKey = !!process.env.ANTHROPIC_API_KEY;
    return NextResponse.json({ configured: hasKey });
  }

  let apiKey: string;
  try { apiKey = getApiKey(); } catch {
    return NextResponse.json({ error: "Server missing ANTHROPIC_API_KEY" }, { status: 500 });
  }

  const url = `https://api.anthropic.com${path}`;
  const res = await fetch(url, {
    headers: { "x-api-key": apiKey, ...HEADERS },
  });

  const text = await res.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return new NextResponse(text, { status: res.status });
  }
}

async function proxyMutate(req: NextRequest, method: string) {
  let apiKey: string;
  try { apiKey = getApiKey(); } catch {
    return NextResponse.json({ error: "Server missing ANTHROPIC_API_KEY" }, { status: 500 });
  }

  const path = req.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Missing path param" }, { status: 400 });
  }

  const body = method === "DELETE" ? undefined : await req.text();
  const url = `https://api.anthropic.com${path}`;
  const res = await fetch(url, {
    method,
    headers: { "x-api-key": apiKey, ...HEADERS },
    body,
  });

  const text = await res.text();
  if (!text) return new NextResponse(null, { status: res.status });
  try {
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return new NextResponse(text, { status: res.status });
  }
}

export async function POST(req: NextRequest) { return proxyMutate(req, "POST"); }
export async function PATCH(req: NextRequest) { return proxyMutate(req, "PATCH"); }
export async function DELETE(req: NextRequest) { return proxyMutate(req, "DELETE"); }

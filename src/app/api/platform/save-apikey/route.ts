import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet } from "@/lib/kv";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { platform, api_key } = body;

  if (!platform || !api_key) {
    return NextResponse.json({ ok: false, error: "Missing platform or api_key" }, { status: 400 });
  }

  const raw = await kvGet(`platform:${platform}`);
  const stored = raw ? JSON.parse(raw) : {};
  stored.api_key = api_key;

  await kvSet(`platform:${platform}`, JSON.stringify(stored));

  return NextResponse.json({ ok: true });
}

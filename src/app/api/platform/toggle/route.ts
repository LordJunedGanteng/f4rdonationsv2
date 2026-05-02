import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet } from "@/lib/kv";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { platform, is_active } = body;

  if (!platform) {
    return NextResponse.json({ ok: false, error: "Missing platform" }, { status: 400 });
  }

  const raw = await kvGet(`platform:${platform}`);
  const stored = raw ? JSON.parse(raw) : {};
  stored.is_active = is_active;

  await kvSet(`platform:${platform}`, JSON.stringify(stored));

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet, type License } from "@/lib/kv";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const raw = await kvGet(`license:${id}`);
    if (!raw) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    const license = JSON.parse(raw) as License;
    const body = await request.json();

    if (body.status !== undefined) license.status = body.status;
    if (body.expires_at !== undefined) license.expires_at = body.expires_at;
    if (body.game_id !== undefined) license.game_id = body.game_id;
    if (body.game_name !== undefined) license.game_name = body.game_name;

    await kvSet(`license:${id}`, JSON.stringify(license));

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

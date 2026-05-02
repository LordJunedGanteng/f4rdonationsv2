import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet, kvDel, getGame, getGameDonations, getGameStats } from "@/lib/kv";

const CF_WORKER_URL = process.env.NEXT_PUBLIC_CF_WORKER_URL || "";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const game = await getGame(gameId);

  if (!game) {
    return NextResponse.json({ ok: false, error: "Game not found" }, { status: 404 });
  }

  const [donations, stats] = await Promise.all([
    getGameDonations(gameId, 50),
    getGameStats(gameId),
  ]);

  return NextResponse.json({
    ok: true,
    game: {
      ...game,
      webhook_url_saweria: `${CF_WORKER_URL}/webhook/${gameId}/saweria`,
      webhook_url_bagibagi: `${CF_WORKER_URL}/webhook/${gameId}/bagibagi`,
    },
    donations,
    stats,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const game = await getGame(gameId);

  if (!game) {
    return NextResponse.json({ ok: false, error: "Game not found" }, { status: 404 });
  }

  const body = await request.json();

  if (body.game_name !== undefined) game.game_name = body.game_name;
  if (body.roblox_game_id !== undefined) game.roblox_game_id = body.roblox_game_id;
  if (body.saweria_username !== undefined) game.saweria_username = body.saweria_username;
  if (body.bagibagi_username !== undefined) game.bagibagi_username = body.bagibagi_username;
  if (body.is_temporary !== undefined) game.is_temporary = body.is_temporary;

  await kvSet(`game:${gameId}:config`, JSON.stringify(game));

  return NextResponse.json({ ok: true, game });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const game = await getGame(gameId);

  if (!game) {
    return NextResponse.json({ ok: false, error: "Game not found" }, { status: 404 });
  }

  await kvDel(`game:${gameId}:config`);
  await kvDel(`secret:${game.secret_key}`);
  await kvDel(`game:${gameId}:pending`);
  await kvDel(`game:${gameId}:history`);
  await kvDel(`game:${gameId}:total`);
  await kvDel(`game:${gameId}:count`);

  const idsRaw = await kvGet("games:index");
  if (idsRaw) {
    const ids: string[] = JSON.parse(idsRaw);
    await kvSet("games:index", JSON.stringify(ids.filter((id) => id !== gameId)));
  }

  return NextResponse.json({ ok: true });
}

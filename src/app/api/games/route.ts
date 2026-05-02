import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet, listGames, type GameConfig } from "@/lib/kv";

const CF_WORKER_URL = process.env.NEXT_PUBLIC_CF_WORKER_URL || "";

function generateId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 20);
}

export async function GET() {
  const games = await listGames();

  const gamesWithWebhook = games.map((g) => ({
    ...g,
    webhook_url_saweria: `${CF_WORKER_URL}/webhook/${g.game_id}/saweria`,
    webhook_url_bagibagi: `${CF_WORKER_URL}/webhook/${g.game_id}/bagibagi`,
  }));

  return NextResponse.json({ games: gamesWithWebhook });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    game_name,
    roblox_game_id,
    saweria_username = "",
    bagibagi_username = "",
    is_temporary = false,
  } = body;

  if (!game_name || !roblox_game_id) {
    return NextResponse.json({ ok: false, error: "Missing game_name or roblox_game_id" }, { status: 400 });
  }

  const gameId = generateId();
  const secretKey = crypto.randomUUID();

  const game: GameConfig = {
    game_id: gameId,
    secret_key: secretKey,
    game_name,
    roblox_game_id,
    saweria_username,
    bagibagi_username,
    is_temporary,
    created_at: new Date().toISOString(),
  };

  await kvSet(`game:${gameId}:config`, JSON.stringify(game));
  await kvSet(`secret:${secretKey}`, gameId);

  const idsRaw = await kvGet("games:index");
  const ids: string[] = idsRaw ? JSON.parse(idsRaw) : [];
  ids.push(gameId);
  await kvSet("games:index", JSON.stringify(ids));

  return NextResponse.json({
    ok: true,
    game: {
      ...game,
      webhook_url_saweria: `${CF_WORKER_URL}/webhook/${gameId}/saweria`,
      webhook_url_bagibagi: `${CF_WORKER_URL}/webhook/${gameId}/bagibagi`,
    },
  });
}

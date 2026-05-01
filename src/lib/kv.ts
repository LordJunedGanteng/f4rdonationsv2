const KV_URL = process.env.KV_REST_API_URL!;
const KV_TOKEN = process.env.KV_REST_API_TOKEN!;

export async function kvCommand<T = unknown>(command: string[]): Promise<T> {
  const res = await fetch(`${KV_URL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`KV error ${res.status}`);
  const data = await res.json();
  return (data as { result: T }).result;
}

export async function kvGet(key: string): Promise<string | null> {
  return kvCommand<string | null>(["GET", key]);
}

export async function kvSet(key: string, value: string): Promise<void> {
  await kvCommand(["SET", key, value]);
}

export async function kvDel(key: string): Promise<void> {
  await kvCommand(["DEL", key]);
}

// ── Game helpers ──────────────────────────────────────────────────────────────

export interface GameConfig {
  game_id: string;
  secret_key: string;
  game_name: string;
  roblox_game_id: string;
  saweria_username: string;
  bagibagi_username: string;
  is_temporary: boolean;
  created_at: string;
}

export async function getGame(gameId: string): Promise<GameConfig | null> {
  const raw = await kvGet(`game:${gameId}:config`);
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function listGames(): Promise<GameConfig[]> {
  const idsRaw = await kvGet("games:index");
  if (!idsRaw) return [];
  const ids: string[] = JSON.parse(idsRaw);
  const games = await Promise.all(ids.map((id) => getGame(id)));
  return games.filter((g): g is GameConfig => g !== null);
}

// ── Donation helpers ──────────────────────────────────────────────────────────

export interface Donation {
  donation_id: string;
  donor_name: string;
  amount: number;
  currency: string;
  message: string;
  platform: string;
  timestamp: string;
}

export async function getGameDonations(gameId: string, limit = 20): Promise<Donation[]> {
  const raw = await kvCommand<string[]>(["LRANGE", `game:${gameId}:history`, "0", String(limit - 1)]);
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((entry) => JSON.parse(entry));
}

export async function getGameStats(gameId: string) {
  const [countRaw, totalRaw] = await Promise.all([
    kvGet(`game:${gameId}:count`),
    kvGet(`game:${gameId}:total`),
  ]);
  return {
    count: countRaw ? parseInt(countRaw, 10) : 0,
    total: totalRaw ? parseInt(totalRaw, 10) : 0,
  };
}

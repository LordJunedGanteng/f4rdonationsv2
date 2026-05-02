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

// ── User helpers ──────────────────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  password?: string;
  role: "admin" | "user";
  created_at: string;
}

export async function listUsers(): Promise<User[]> {
  const idsRaw = await kvGet("users:index");
  if (!idsRaw) return [];
  const ids: number[] = JSON.parse(idsRaw);
  const users = await Promise.all(ids.map(async (id) => {
    const raw = await kvGet(`user:${id}`);
    return raw ? (JSON.parse(raw) as User) : null;
  }));
  return users.filter((u): u is User => u !== null);
}

export async function saveUser(user: User): Promise<void> {
  // Update index if new
  const idsRaw = await kvGet("users:index");
  const ids: number[] = idsRaw ? JSON.parse(idsRaw) : [];
  if (!ids.includes(user.id)) {
    ids.push(user.id);
    await kvSet("users:index", JSON.stringify(ids));
  }
  await kvSet(`user:${user.id}`, JSON.stringify(user));
  // Also index by username for login
  await kvSet(`user:by-username:${user.username.toLowerCase()}`, String(user.id));
}

export async function getUserById(id: number): Promise<User | null> {
  const raw = await kvGet(`user:${id}`);
  return raw ? JSON.parse(raw) : null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const id = await kvGet(`user:by-username:${username.toLowerCase()}`);
  if (!id) return null;
  return getUserById(parseInt(id, 10));
}

export async function deleteUser(id: number): Promise<void> {
  const user = await getUserById(id);
  if (user) {
    await kvDel(`user:by-username:${user.username.toLowerCase()}`);
  }
  await kvDel(`user:${id}`);
  const idsRaw = await kvGet("users:index");
  if (idsRaw) {
    const ids: number[] = JSON.parse(idsRaw);
    await kvSet("users:index", JSON.stringify(ids.filter((i) => i !== id)));
  }
}

// ── License helpers ───────────────────────────────────────────────────────────

export interface License {
  id: number;
  license_key: string;
  user_id: number;
  game_id: string;
  game_name: string | null;
  status: "active" | "suspended" | "expired";
  expires_at: string | null;
  created_at: string;
}

export async function listLicenses(userId?: number): Promise<License[]> {
  const idsRaw = await kvGet("licenses:index");
  if (!idsRaw) return [];
  const ids: number[] = JSON.parse(idsRaw);
  const all = await Promise.all(ids.map(async (id) => {
    const raw = await kvGet(`license:${id}`);
    return raw ? (JSON.parse(raw) as License) : null;
  }));
  const filtered = all.filter((l): l is License => l !== null);
  if (userId) return filtered.filter((l) => l.user_id === userId);
  return filtered;
}

export async function saveLicense(license: License): Promise<void> {
  const idsRaw = await kvGet("licenses:index");
  const ids: number[] = idsRaw ? JSON.parse(idsRaw) : [];
  if (!ids.includes(license.id)) {
    ids.push(license.id);
    await kvSet("licenses:index", JSON.stringify(ids));
  }
  await kvSet(`license:${license.id}`, JSON.stringify(license));
  // Also index by key for validation
  await kvSet(`license:by-key:${license.license_key}`, String(license.id));
}

export async function getLicenseByKey(key: string): Promise<License | null> {
  const id = await kvGet(`license:by-key:${key}`);
  if (!id) return null;
  const raw = await kvGet(`license:${id}`);
  return raw ? JSON.parse(raw) : null;
}

const BASE = process.env.NEXT_PUBLIC_API_URL || "";

function getAuthHeader(): Record<string, string> {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('f4r_token');
    if (token) return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const safeBase = BASE.replace(/\/$/, "");
  const url = new URL(safeBase + path, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: getAuthHeader() });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { msg = JSON.parse(text).error || text; } catch { /* ignore */ }
    throw new Error(msg || `API ${path} → ${res.status}`);
  }
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error(`Invalid JSON response: ${text.slice(0, 50)}...`); }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const safeBase = BASE.replace(/\/$/, "");
  const res = await fetch(safeBase + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { msg = JSON.parse(text).error || text; } catch { /* ignore */ }
    throw new Error(msg || `API ${path} → ${res.status}`);
  }
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error(`Invalid JSON response: ${text.slice(0, 50)}...`); }
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const safeBase = BASE.replace(/\/$/, "");
  const res = await fetch(safeBase + path, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { msg = JSON.parse(text).error || text; } catch { /* ignore */ }
    throw new Error(msg || `API ${path} → ${res.status}`);
  }
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error(`Invalid JSON response: ${text.slice(0, 50)}...`); }
}

async function del<T>(path: string): Promise<T> {
  const safeBase = BASE.replace(/\/$/, "");
  const res = await fetch(safeBase + path, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { msg = JSON.parse(text).error || text; } catch { /* ignore */ }
    throw new Error(msg || `API ${path} → ${res.status}`);
  }
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error(`Invalid JSON response: ${text.slice(0, 50)}...`); }
}

export const WORKER_URL = process.env.NEXT_PUBLIC_CF_WORKER_URL || BASE;

export function getWebhookUrls(gameId: string): Record<string, string> {
  return {
    saweria:    `${WORKER_URL}/webhook/${gameId}/saweria`,
    socialbuzz: `${WORKER_URL}/webhook/${gameId}/socialbuzz`,
    bagibagi:   `${WORKER_URL}/webhook/${gameId}/bagibagi`,
    trakteer:   `${WORKER_URL}/webhook/${gameId}/trakteer`,
  };
}

export const apiCall = async <T>(path: string, options: RequestInit): Promise<T> => {
  const safeBase = BASE.replace(/\/$/, "");
  const res = await fetch(safeBase + path, {
    ...options,
    headers: {
      ...options.headers,
      ...getAuthHeader(),
    }
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { msg = JSON.parse(text).error || text; } catch { /* ignore */ }
    throw new Error(msg || `API ${path} → ${res.status}`);
  }
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error(`Invalid JSON response: ${text.slice(0, 50)}...`); }
}

export const api = {
  status: () => get<{ ok: boolean; ts: number }>("/api/status"),

  games: {
    list: () =>
      get<{ games: GameEntry[] }>("/api/games"),
    create: (body: { game_name: string; roblox_game_id: string; saweria_username?: string; bagibagi_username?: string; is_temporary?: boolean }) =>
      post<{ ok: boolean; game: GameEntry }>("/api/games", body),
    get: (gameId: string) =>
      get<{ ok: boolean; game: GameEntry; donations: Donation[]; stats: { count: number; total: number } }>(`/api/games/${gameId}`),
    update: (gameId: string, body: Partial<{ game_name: string; roblox_game_id: string; saweria_username: string; bagibagi_username: string; is_temporary: boolean }>) =>
      put<{ ok: boolean; game: GameEntry }>(`/api/games/${gameId}`, body),
    delete: (gameId: string) =>
      del<{ ok: boolean }>(`/api/games/${gameId}`),
  },

  platform: {
    generateSecret: (platform: string) =>
      post<{ ok: boolean; webhook_secret: string; webhook_url: string }>("/api/platform/generate-secret", { platform }),
    saveApiKey: (platform: string, apiKey: string) =>
      post<{ ok: boolean }>("/api/platform/save-apikey", { platform, api_key: apiKey }),
    getConfigs: () =>
      get<{ configs: PlatformConfig[] }>("/api/platform/configs"),
    toggle: (platform: string, isActive: boolean) =>
      post<{ ok: boolean }>("/api/platform/toggle", { platform, is_active: isActive }),
  },

  donations: {
    recent: (gameId: string, limit = 10) =>
      get<{ donations: Donation[] }>("/api/donations/recent", {
        game_id: gameId,
        limit: String(limit),
      }),
    stats: (gameId: string) =>
      get<StatsResponse>("/api/donations/stats", { game_id: gameId }),
  },

  leaderboard: (gameId: string, timeframe: string) =>
    get<{ leaderboard: LeaderboardEntry[] }>(`/api/leaderboard/${timeframe}`, {
      game_id: gameId,
    }),

  admin: {
    users: () =>
      get<{ users: AdminUser[] }>("/api/admin/users"),
    deleteUser: (id: number) =>
      del<{ ok: boolean }>(`/api/admin/users/${id}`),
  },

  license: {
    validate: (licenseKey: string, gameId: string) =>
      post<LicenseValidation>("/api/license/validate", {
        license_key: licenseKey,
        game_id: gameId,
        timestamp: Math.floor(Date.now() / 1000),
      }),
    list: (userId: number) =>
      get<{ licenses: License[] }>("/api/licenses", { user_id: String(userId) }),
    create: (body: { user_id: number; game_id: string; game_name?: string; expires_at?: string }) =>
      post<{ license_key: string }>("/api/licenses", body),
    update: (id: number, body: { status?: string; expires_at?: string; game_id?: string; game_name?: string }) =>
      put<{ ok: boolean }>(`/api/licenses/${id}`, body),
  },

  roblox: {
    game: (universeId: string) =>
      get<RobloxGameInfo>("/api/roblox/game", { universe_id: universeId }),
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface GameEntry {
  game_id:           string;
  secret_key:        string;
  game_name:         string;
  roblox_game_id:    string;
  saweria_username:  string;
  bagibagi_username: string;
  is_temporary:      boolean;
  created_at:        string;
  webhook_url_saweria?:  string;
  webhook_url_bagibagi?: string;
}

export interface AdminUser {
  id: number;
  username: string;
  role: string;
  created_at: string;
  license_key: string | null;
  status: string | null;
  universe_ids: string[];
  platform_api_keys: Record<string, string>;
}
export interface Donation {
  id?:          number;
  donation_id?: string;
  donor_name:   string;
  amount:       number;
  platform:     string;
  message?:     string;
  avatar_url?:  string;
  currency?:    string;
  timestamp:    string;
}

export interface LeaderboardEntry {
  rank:           number;
  donor_name:     string;
  platform:       string;
  total_amount:   number;
  donation_count: number;
}

export interface StatsResponse {
  totals: { count: number; total: number; avg: number; unique_donors: number } | null;
  by_platform: { platform: string; total: number; count: number }[];
  by_day:      { day: string; total: number; count: number }[];
}

export interface LicenseValidation {
  valid:        boolean;
  license_key?: string;
  owner?:       string;
  expires_at?:  string;
  reason?:      string;
}

export interface PlatformConfig {
  platform:         string;
  has_api_key:      boolean;
  webhook_secret:   string | null;
  webhook_url:      string | null;
  is_active:        boolean;
  last_verified_at: string | null;
  platform_api_key?: string;
}

export interface License {
  id:          number;
  license_key: string;
  game_id:     string;
  game_name:   string | null;
  status:      "active" | "suspended" | "expired";
  expires_at:  string | null;
  created_at:  string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function formatRp(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

export function formatRpFull(n: number): string {
  return Math.floor(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export const PLATFORM_COLOR: Record<string, string> = {
  saweria:    "text-primary",
  socialbuzz: "text-secondary",
  bagibagi:   "text-tertiary",
  trakteer:   "text-error",
};

export const PLATFORM_LABEL: Record<string, string> = {
  saweria:    "Saweria",
  socialbuzz: "SocialBuzz",
  bagibagi:   "BagiBagi",
  trakteer:   "Trakteer",
};

export interface RobloxGameInfo {
  universeId: number;
  name: string;
  description: string;
  creator: string;
  playing: number;
  visits: number;
  maxPlayers: number;
  thumbnailUrl: string | null;
}

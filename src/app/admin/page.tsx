'use client';

import { useState } from 'react';
import { apiCall } from '@/lib/api';
import AuthGate from '@/components/AuthGate';

export default function AdminPage() {
  return (
    <AuthGate adminOnly={true}>
      <AdminContent />
    </AuthGate>
  );
}

function AdminContent() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [universeIds, setUniverseIds] = useState<string[]>(['']);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleAddUniverse = () => {
    if (universeIds.length < 5) setUniverseIds([...universeIds, '']);
  };

  const handleRemoveUniverse = (idx: number) => {
    setUniverseIds(universeIds.filter((_, i) => i !== idx));
  };

  const handleChangeUniverse = (idx: number, val: string) => {
    const newIds = [...universeIds];
    newIds[idx] = val;
    setUniverseIds(newIds);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);

    try {
      // Filter out empty universe IDs
      const filteredUniverses = universeIds.map(id => id.trim()).filter(id => id !== '');
      if (filteredUniverses.length === 0) {
        throw new Error('At least one Universe ID is required');
      }

      const res = await apiCall<{
        ok: true;
        license_key: string;
        webhook_urls: Record<string, string>;
        platform_api_keys: Record<string, string>;
      }>('/api/admin/generate-key', {
        method: 'POST',
        body: JSON.stringify({
          username,
          password,
          universe_ids: filteredUniverses,
        }),
      });

      setResult(res);
      setUsername('');
      setPassword('');
      setUniverseIds(['']);
    } catch (err: any) {
      setError(err.message || 'Failed to generate key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pb-8 space-y-8 max-w-lg mx-auto">
      <section className="space-y-4 pt-4">
        <h2 className="text-xl font-bold font-headline mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
          Admin Panel
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        {result ? (
          <div className="bg-surface-container-highest rounded-2xl p-6 border border-emerald-500/20 space-y-6">
            <div className="text-center space-y-2">
              <span className="material-symbols-outlined text-4xl text-emerald-400">check_circle</span>
              <h3 className="text-xl font-bold text-emerald-400">Successfully Generated!</h3>
              <p className="text-sm text-on-surface-variant">User account and license are ready.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 block">License Key (For Login)</label>
                <div className="bg-surface-container-lowest p-3 rounded-xl font-mono text-primary text-sm break-all border border-outline-variant/10">
                  {result.license_key}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 block">Webhook URLs</label>
                <p className="text-xs text-on-surface-variant mb-2">Paste these into the respective platforms (Saweria, SocialBuzz, etc.)</p>
                <div className="space-y-2">
                  {Object.entries(result.webhook_urls).map(([platform, url]) => (
                    <div key={platform} className="bg-surface-container-lowest p-3 rounded-xl flex flex-col gap-1 border border-outline-variant/10">
                      <span className="text-[10px] font-bold text-primary uppercase">{platform}</span>
                      <span className="font-mono text-xs break-all text-on-surface">{String(url)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 block">Platform API Keys</label>
                <p className="text-xs text-on-surface-variant mb-2">Copy this table into the Roblox Script's <code>Config.PLATFORM_KEYS</code></p>
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10 overflow-x-auto">
                  <pre className="text-xs font-mono text-primary m-0">
{`Config.PLATFORM_KEYS = {
  saweria    = "${result.platform_api_keys.saweria}",
  socialbuzz = "${result.platform_api_keys.socialbuzz}",
  bagibagi   = "${result.platform_api_keys.bagibagi}",
  trakteer   = "${result.platform_api_keys.trakteer}"
}`}
                  </pre>
                </div>
              </div>

              <button 
                onClick={() => setResult(null)}
                className="btn btn-primary w-full py-3"
              >
                Generate Another
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-highest rounded-2xl p-6 border border-outline-variant/10">
            <form onSubmit={handleGenerate} className="space-y-5">
              <div>
                <label className="text-[10px] uppercase font-bold text-on-surface-variant mb-2 block">User Account</label>
                <div className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input w-full"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant">Universe IDs (Max 5)</label>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                    {universeIds.length}/5
                  </span>
                </div>
                
                <div className="space-y-2">
                  {universeIds.map((uid, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 1234567890"
                        value={uid}
                        onChange={(e) => handleChangeUniverse(idx, e.target.value)}
                        className="input flex-1 font-mono text-sm"
                      />
                      {universeIds.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveUniverse(idx)}
                          className="w-12 flex items-center justify-center bg-surface-container-low rounded-xl text-error hover:bg-error/20 transition-colors border border-outline-variant/10"
                        >
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {universeIds.length < 5 && (
                    <button 
                      type="button" 
                      onClick={handleAddUniverse}
                      className="w-full py-2 flex justify-center items-center gap-1 text-sm text-primary font-bold border border-dashed border-primary/30 rounded-xl hover:bg-primary/5 transition-colors mt-2"
                    >
                      <span className="material-symbols-outlined text-sm">add</span> Add Universe ID
                    </button>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !username || !password || universeIds.every(u => !u.trim())}
                className="btn btn-primary w-full py-3 mt-4 text-base"
              >
                {loading ? 'Generating...' : 'Generate Key'}
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}

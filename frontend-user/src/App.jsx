import React, { useState, useEffect } from 'react';
import { Terminal, Search, Info, HelpCircle, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

const API_BASE = 'http://localhost:4000/api';

function App() {
  const [orgSlug, setOrgSlug] = useState('');
  const [featureKey, setFeatureKey] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Results
  const [checked, setChecked] = useState(false);
  const [flagKey, setFlagKey] = useState('');
  const [enabled, setEnabled] = useState(null); // true, false, or null (if error/not found)
  const [errorMsg, setErrorMsg] = useState('');

  const handleCheckFlag = async (e) => {
    e.preventDefault();
    if (!orgSlug.trim() || !featureKey.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setChecked(false);

    try {
      const res = await fetch(`${API_BASE}/flags/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationSlug: orgSlug.trim(),
          key: featureKey.trim()
        })
      });
      const data = await res.json();

      setFlagKey(featureKey.trim());
      setChecked(true);

      if (!res.ok) {
        if (res.status === 404) {
          setEnabled(null);
          setErrorMsg(data.error?.message || 'Feature flag not found');
        } else {
          throw new Error(data.error?.message || 'Check failed');
        }
      } else {
        setEnabled(data.enabled);
      }
    } catch (err) {
      setChecked(true);
      setEnabled(null);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-6">
        
        {/* Terminal Header */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 border-b-2 border-b-blue-500/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-100">Byepo SDK Checker</h1>
              <p className="text-xs text-zinc-400">Evaluate tenant feature flags in real-time</p>
            </div>
          </div>
          
          <form onSubmit={handleCheckFlag} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Organization Slug</label>
              <input
                type="text"
                required
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                placeholder="e.g. acme-corp"
                className="mt-1 block w-full rounded-lg glass-input px-3 py-2 text-sm font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Feature Key</label>
              <div className="relative mt-1">
                <input
                  type="text"
                  required
                  value={featureKey}
                  onChange={(e) => setFeatureKey(e.target.value)}
                  placeholder="e.g. new_dashboard_ui"
                  className="block w-full rounded-lg glass-input pl-3 pr-10 py-2 text-sm font-mono"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-zinc-500">
                  <Search className="h-4 w-4" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white btn-primary focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <span>{loading ? 'Evaluating...' : 'Check Status'}</span>
            </button>
          </form>
        </div>

        {/* Results Panel */}
        {checked && (
          <div className="glass-panel p-6 rounded-2xl animate-in fade-in duration-300">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Evaluation Result</h2>
            <div className="font-mono text-sm bg-black/45 p-3 rounded-lg border border-zinc-800 space-y-1 mb-4">
              <p className="text-zinc-500">Target Key: <span className="text-zinc-200">{flagKey}</span></p>
              <p className="text-zinc-500">Tenant Slug: <span className="text-zinc-300">{orgSlug}</span></p>
            </div>

            {enabled === true && (
              <div className="flex items-center gap-3 bg-emerald-950/20 border border-emerald-500/35 p-4 rounded-xl text-emerald-400">
                <CheckCircle2 className="h-10 w-10 shrink-0 text-emerald-400 animate-pulse" />
                <div>
                  <h3 className="font-bold text-base">✅ Enabled</h3>
                  <p className="text-xs text-emerald-500/80 mt-0.5">This feature is active for the requested organization.</p>
                </div>
              </div>
            )}

            {enabled === false && (
              <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700/60 p-4 rounded-xl text-zinc-400">
                <XCircle className="h-10 w-10 shrink-0 text-zinc-500" />
                <div>
                  <h3 className="font-bold text-base">❌ Disabled</h3>
                  <p className="text-xs text-zinc-500/80 mt-0.5">This feature exists but is currently deactivated.</p>
                </div>
              </div>
            )}

            {enabled === null && (
              <div className="flex items-center gap-3 bg-amber-950/20 border border-amber-500/35 p-4 rounded-xl text-amber-400">
                <AlertTriangle className="h-10 w-10 shrink-0 text-amber-500" />
                <div>
                  <h3 className="font-bold text-base">🔍 Not Found</h3>
                  <p className="text-xs text-amber-500/80 mt-0.5">{errorMsg || "Feature flag does not exist."}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

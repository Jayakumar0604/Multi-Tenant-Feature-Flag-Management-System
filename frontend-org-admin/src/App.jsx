import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, Trash2, Plus, LogOut, ShieldAlert, CheckCircle2, RefreshCw, Layers, Layout, Info } from 'lucide-react';

const API_BASE = 'http://localhost:4000/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('org_admin_token') || '');
  const [orgId, setOrgId] = useState(localStorage.getItem('org_admin_org_id') || '');
  const [orgName, setOrgName] = useState(localStorage.getItem('org_admin_org_name') || '');
  
  // Auth state
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  
  // DB references
  const [publicOrgs, setPublicOrgs] = useState([]);
  const [flags, setFlags] = useState([]);
  
  // Forms & UI
  const [newFlagKey, setNewFlagKey] = useState('');
  const [newFlagDesc, setNewFlagDesc] = useState('');
  const [newFlagEnabled, setNewFlagEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPublicOrgs();
  }, []);

  useEffect(() => {
    if (token) {
      fetchFlags();
    }
  }, [token]);

  const fetchPublicOrgs = async () => {
    try {
      const res = await fetch(`${API_BASE}/organizations/public`);
      const data = await res.json();
      if (res.ok) {
        setPublicOrgs(data);
        if (data.length > 0) {
          setSelectedOrgId(data[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching orgs:', err);
    }
  };

  const fetchFlags = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/flags`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          handleLogout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(data.error?.message || 'Failed to fetch feature flags');
      }
      setFlags(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    const endpoint = isLogin ? 'login' : 'signup';
    const payload = isLogin 
      ? { email, password } 
      : { email, password, organizationId: selectedOrgId };

    try {
      const res = await fetch(`${API_BASE}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Authentication failed');
      }

      if (data.role !== 'org_admin') {
        throw new Error('Access denied. You are not an Organization Admin.');
      }

      // Find organization name
      let foundOrgName = 'My Organization';
      const oId = data.organizationId;
      const resPublic = await fetch(`${API_BASE}/organizations/public`);
      if (resPublic.ok) {
        const publicList = await resPublic.json();
        const matched = publicList.find(o => o._id === oId);
        if (matched) foundOrgName = matched.name;
      }

      localStorage.setItem('org_admin_token', data.token);
      localStorage.setItem('org_admin_org_id', oId);
      localStorage.setItem('org_admin_org_name', foundOrgName);

      setToken(data.token);
      setOrgId(oId);
      setOrgName(foundOrgName);
      setSuccess('Logged in successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('org_admin_token');
    localStorage.removeItem('org_admin_org_id');
    localStorage.removeItem('org_admin_org_name');
    setToken('');
    setOrgId('');
    setOrgName('');
    setFlags([]);
    setEmail('');
    setPassword('');
  };

  const handleCreateFlag = async (e) => {
    e.preventDefault();
    if (!newFlagKey.trim()) return;

    if (!/^[a-zA-Z0-9_]+$/.test(newFlagKey)) {
      setError('Feature key can only contain letters, numbers, and underscores');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE}/flags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          key: newFlagKey.trim(),
          description: newFlagDesc.trim(),
          enabled: newFlagEnabled
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to create feature flag');
      }

      setSuccess(`Feature flag "${data.key}" created!`);
      setNewFlagKey('');
      setNewFlagDesc('');
      setNewFlagEnabled(false);
      fetchFlags();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlag = async (flagId, currentStatus) => {
    setError('');
    // Optimistic UI update
    setFlags(prev => prev.map(f => f._id === flagId ? { ...f, enabled: !currentStatus } : f));
    
    try {
      const res = await fetch(`${API_BASE}/flags/${flagId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enabled: !currentStatus })
      });
      const data = await res.json();

      if (!res.ok) {
        // Rollback
        setFlags(prev => prev.map(f => f._id === flagId ? { ...f, enabled: currentStatus } : f));
        throw new Error(data.error?.message || 'Failed to toggle feature flag');
      }
    } catch (err) {
      // Rollback
      setFlags(prev => prev.map(f => f._id === flagId ? { ...f, enabled: currentStatus } : f));
      setError(err.message);
    }
  };

  const handleDeleteFlag = async (flagId) => {
    if (!window.confirm('Are you sure you want to delete this feature flag?')) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE}/flags/${flagId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to delete feature flag');
      }

      setSuccess('Feature flag deleted successfully');
      fetchFlags();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Compute Stats
  const totalFlags = flags.length;
  const activeFlags = flags.filter(f => f.enabled).length;
  const inactiveFlags = totalFlags - activeFlags;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-2xl">
          <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Layout className="h-6 w-6" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight gradient-text">
              {isLogin ? 'Admin Portal' : 'Register Admin'}
            </h2>
            <p className="mt-2 text-center text-sm text-zinc-400">
              Manage your organization's feature flags
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleAuth}>
            {error && (
              <div className="rounded-md bg-red-900/30 border border-red-500/30 p-3 text-sm text-red-400 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-4 rounded-md shadow-sm">
              {!isLogin && (
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Select Organization</label>
                  {publicOrgs.length === 0 ? (
                    <p className="text-sm text-amber-400 bg-amber-950/20 p-2 rounded border border-amber-500/30 mt-1 flex items-center gap-1.5">
                      <Info className="h-4 w-4 shrink-0" />
                      No organizations available. Contact Super Admin.
                    </p>
                  ) : (
                    <select
                      value={selectedOrgId}
                      onChange={(e) => setSelectedOrgId(e.target.value)}
                      className="mt-1 block w-full rounded-lg glass-input px-3 py-2 text-sm bg-zinc-900"
                    >
                      {publicOrgs.map(org => (
                        <option key={org._id} value={org._id} className="bg-zinc-950 text-white">
                          {org.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-lg glass-input px-3 py-2 text-sm"
                  placeholder="admin@yourcompany.com"
                />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-lg glass-input px-3 py-2 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || (!isLogin && publicOrgs.length === 0)}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white btn-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
              </button>
            </div>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-sm text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-4"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already registered? Log in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-zinc-100">{orgName}</h1>
                <p className="text-xs text-emerald-400/80">Organization Workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={fetchFlags}
                disabled={loading}
                className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 transition-colors"
                title="Refresh Feature Flags"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/30 border border-red-500/20 hover:border-red-500/40 transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Status Indicators */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-900/30 border border-red-500/30 p-4 text-sm text-red-400 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-lg bg-emerald-900/30 border border-emerald-500/30 p-4 text-sm text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-panel p-4 rounded-xl text-center">
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Total Flags</p>
            <p className="text-2xl font-bold text-zinc-100 mt-1">{totalFlags}</p>
          </div>
          <div className="glass-panel p-4 rounded-xl text-center border-l-2 border-l-emerald-500/50">
            <p className="text-emerald-500/80 text-xs font-semibold uppercase tracking-wider">Active</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{activeFlags}</p>
          </div>
          <div className="glass-panel p-4 rounded-xl text-center border-l-2 border-l-zinc-700/50">
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Disabled</p>
            <p className="text-2xl font-bold text-zinc-400 mt-1">{inactiveFlags}</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Create Feature Flag Form */}
          <div className="lg:col-span-1">
            <div className="glass-panel p-6 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2">
                <Plus className="h-5 w-5" />
                <h2>Create Feature Flag</h2>
              </div>
              <p className="text-sm text-zinc-400">
                Register a new flag key for code integrations. Keys must be alphanumeric/underscores.
              </p>
              
              <form onSubmit={handleCreateFlag} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Flag Key (feature_key)</label>
                  <input
                    type="text"
                    required
                    value={newFlagKey}
                    onChange={(e) => setNewFlagKey(e.target.value)}
                    placeholder="e.g. beta_billing_portal"
                    className="mt-1 block w-full rounded-lg glass-input px-3 py-2 text-sm"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Description</label>
                  <textarea
                    rows="3"
                    value={newFlagDesc}
                    onChange={(e) => setNewFlagDesc(e.target.value)}
                    placeholder="Brief description of what this controls..."
                    className="mt-1 block w-full rounded-lg glass-input px-3 py-2 text-sm resize-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-zinc-300">Enabled by Default</label>
                  <button
                    type="button"
                    onClick={() => setNewFlagEnabled(!newFlagEnabled)}
                    className="text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    {newFlagEnabled ? (
                      <ToggleRight className="h-9 w-9" />
                    ) : (
                      <ToggleLeft className="h-9 w-9 text-zinc-600" />
                    )}
                  </button>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white btn-primary focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>{loading ? 'Creating...' : 'Create Flag'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Feature Flags Workspace */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-400" />
              <span>Feature Flags ({flags.length})</span>
            </h2>

            {/* List */}
            <div className="overflow-x-auto glass-panel rounded-xl">
              <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
                <thead className="bg-zinc-900/40 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4">Status</th>
                    <th scope="col" className="px-6 py-4">Key</th>
                    <th scope="col" className="px-6 py-4">Description</th>
                    <th scope="col" className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {flags.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-zinc-500">
                        {loading ? 'Loading workspace...' : 'No feature flags defined yet.'}
                      </td>
                    </tr>
                  ) : (
                    flags.map((flag) => (
                      <tr key={flag._id} className="hover:bg-zinc-900/25 transition-colors">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleFlag(flag._id, flag.enabled)}
                            className="transition-colors"
                          >
                            {flag.enabled ? (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <ToggleRight className="h-8 w-8" />
                                <span className="text-xs font-bold uppercase tracking-wider">Active</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-zinc-500">
                                <ToggleLeft className="h-8 w-8" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Off</span>
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-zinc-200">
                          {flag.key}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 max-w-xs truncate">
                          {flag.description || <span className="text-zinc-600 italic">No description</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteFlag(flag._id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-500/20 transition-all"
                            title="Delete Flag"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { Shield, Building, LogOut, Plus, RefreshCw, AlertTriangle, CheckCircle, Search } from 'lucide-react';

const API_BASE = 'http://localhost:4000/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('super_admin_token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgs, setOrgs] = useState([]);
  const [newOrgName, setNewOrgName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (token) {
      fetchOrganizations();
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      if (data.role !== 'super_admin') {
        throw new Error('Access denied. You are not a Super Admin.');
      }

      localStorage.setItem('super_admin_token', data.token);
      setToken(data.token);
      setSuccess('Logged in successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('super_admin_token');
    setToken('');
    setOrgs([]);
  };

  const fetchOrganizations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/super-admin/organizations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          handleLogout();
          throw new Error('Session expired or unauthorized');
        }
        throw new Error(data.error?.message || 'Failed to fetch organizations');
      }
      setOrgs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE}/super-admin/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newOrgName }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to create organization');
      }

      setSuccess(`Organization "${data.name}" created!`);
      setNewOrgName('');
      fetchOrganizations();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrgs = orgs.filter(org => 
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org._id.includes(searchQuery)
  );

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-2xl">
          <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight gradient-text">
              Super Admin Portal
            </h2>
            <p className="mt-2 text-center text-sm text-zinc-400">
              Multi-Tenant Feature Flag Management System
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-md bg-red-900/30 border border-red-500/30 p-3 text-sm text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-lg glass-input px-3 py-2 text-sm"
                  placeholder="superadmin@byepo.com"
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
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white btn-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">Byepo Control Panel</h1>
                <p className="text-xs text-indigo-400/80">Super Admin Zone</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={fetchOrganizations}
                disabled={loading}
                className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 transition-colors"
                title="Refresh Organizations"
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
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-lg bg-emerald-900/30 border border-emerald-500/30 p-4 text-sm text-emerald-400 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Create Organization Form */}
          <div className="lg:col-span-1">
            <div className="glass-panel p-6 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-2">
                <Building className="h-5 w-5" />
                <h2>Create Organization</h2>
              </div>
              <p className="text-sm text-zinc-400">
                Register a new tenant in the system. Slugs will be generated automatically.
              </p>
              <form onSubmit={handleCreateOrg} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Organization Name</label>
                  <input
                    type="text"
                    required
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="e.g. Acme Corporation"
                    className="mt-1 block w-full rounded-lg glass-input px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold text-white btn-primary focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>{loading ? 'Creating...' : 'Create Org'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Organizations Directory */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <Building className="h-5 w-5 text-indigo-400" />
                <span>Organizations ({filteredOrgs.length})</span>
              </h2>
              
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Filter orgs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg glass-input"
                />
              </div>
            </div>

            {/* List */}
            <div className="overflow-x-auto glass-panel rounded-xl">
              <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
                <thead className="bg-zinc-900/40 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4">Organization</th>
                    <th scope="col" className="px-6 py-4">Slug</th>
                    <th scope="col" className="px-6 py-4">Tenant ID</th>
                    <th scope="col" className="px-6 py-4">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredOrgs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-zinc-500">
                        {loading ? 'Fetching tenants...' : 'No organizations found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredOrgs.map((org) => (
                      <tr key={org._id} className="hover:bg-zinc-900/25 transition-colors">
                        <td className="px-6 py-4 font-semibold text-zinc-200">{org.name}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-xs font-mono">
                            {org.slug}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-zinc-500">{org._id}</td>
                        <td className="px-6 py-4 text-zinc-400">
                          {new Date(org.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
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

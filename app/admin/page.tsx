'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Heart,
  Lock,
  RefreshCw,
  ArrowLeft,
  KeyRound,
  ShieldAlert,
  Calendar,
  Activity,
  FileKey2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface AdminStats {
  overview: {
    totalUsers: number;
    consentedUsers: number;
    consentRate: number;
    totalConversations: number;
    totalMessages: number;
    avgMessagesPerConv: number;
    dau: number;
    wau: number;
    mau: number;
    totalSafetyFlags: number;
  };
  relationshipBreakdown: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  safetyBreakdown: Array<{
    category: string;
    count: number;
  }>;
  dailyActivity: Array<{
    date: string;
    messages: number;
    conversations: number;
  }>;
  recentAuditLogs: Array<{
    id: string;
    actor: string;
    action: string;
    createdAt: string;
    metadata: Record<string, unknown> | null;
  }>;
  retentionStatus: {
    windowDays: number;
    nextAutoPurge: string;
    complianceStatus: string;
  };
}

interface DecryptedResult {
  user: {
    id: string;
    email: string | null;
    createdAt: string;
    consentBackupAckAt: string | null;
  };
  conversations: Array<{
    id: string;
    title: string;
    createdAt: string;
    messages: Array<{
      id: string;
      role: string;
      content: string;
      createdAt: string;
    }>;
  }>;
}

export default function AdminDashboardPage() {
  const [passkey, setPasskey] = useState('hushlee-admin-2026');
  const [authenticated, setAuthenticated] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authorized Access Form State
  const [targetUserId, setTargetUserId] = useState('cmumh7brb000qr8bs49cnwt5y');
  const [adminId, setAdminId] = useState('compliance-officer@hushlee.app');
  const [accessReason, setAccessReason] = useState('Authorized personnel compliance review testing');
  const [decrypting, setDecrypting] = useState(false);
  const [decryptResult, setDecryptResult] = useState<DecryptedResult | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('hushlee_admin_passkey') || 'hushlee-admin-2026';
    setPasskey(saved);
    const safetyTimer = setTimeout(() => {
      setInitialLoading(false);
    }, 7000);

    fetchStats(saved, true).finally(() => {
      clearTimeout(safetyTimer);
    });

    return () => clearTimeout(safetyTimer);
  }, []);

  const fetchStats = async (keyToUse: string, isInitial = false) => {
    if (isInitial) setInitialLoading(true);
    else setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`/api/admin/stats?key=${encodeURIComponent(keyToUse)}`, {
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.status === 401) {
        setAuthenticated(false);
        setError('Incorrect Admin Passkey. Please verify your secret.');
        return;
      }
      if (!res.ok) throw new Error('Failed to load admin stats');

      const data = await res.json();
      setStats(data);
      setAuthenticated(true);
      localStorage.setItem('hushlee_admin_passkey', keyToUse);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching analytics';
      setError(msg);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStats(passkey);
  };

  const handleAuthorizedDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || !accessReason || accessReason.trim().length < 10) {
      setDecryptError('Please provide a target User ID and a justification reason (min 10 characters).');
      return;
    }

    setDecrypting(true);
    setDecryptError(null);
    setDecryptResult(null);

    try {
      const res = await fetch('/api/admin/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passkey,
          userId: targetUserId.trim(),
          adminId: adminId.trim(),
          reason: accessReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to decrypt user data');
      }

      setDecryptResult(data);
      fetchStats(passkey);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error during authorized decryption';
      setDecryptError(msg);
    } finally {
      setDecrypting(false);
    }
  };

  // Initial loading screen while verifying passkey and fetching live PostgreSQL state
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#2C3333] flex flex-col justify-center items-center p-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#EFECE6] text-[#5D7052] flex items-center justify-center animate-spin">
            <Loader2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-serif text-xl text-[#1F2421]">Loading Hushlee Intelligence</h2>
            <p className="text-xs text-[#7B8580] mt-1">Connecting to live Render PostgreSQL...</p>
          </div>
        </div>
      </div>
    );
  }

  // Passkey gate if authentication failed
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#2C3333] flex flex-col justify-center items-center p-6">
        <div className="bg-white border border-[#E8E1D7] rounded-3xl p-8 max-w-sm w-full shadow-xs text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#EFECE6] text-[#5D7052] flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl text-[#1F2421] mb-2">Hushlee Intelligence</h1>
          <p className="text-xs text-[#5A6460] mb-6">
            Enter your admin passkey to access operational metrics and marketing strategy analytics.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                {error}
              </div>
            )}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-medium text-[#4A5548]">
                  Admin Passkey
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setPasskey('hushlee-admin-2026');
                    fetchStats('hushlee-admin-2026');
                  }}
                  className="text-[10px] text-[#5D7052] font-semibold hover:underline"
                >
                  Use Default Passkey
                </button>
              </div>
              <input
                type="text"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Admin Passkey"
                required
                className="w-full text-xs p-3 rounded-xl border border-[#E0D7CC] font-mono focus:outline-none focus:ring-1 focus:ring-[#5D7052]"
              />
              <p className="text-[10px] text-[#7B8580] mt-1 text-left">
                Default: <span className="font-mono font-medium text-[#1F2421]">hushlee-admin-2026</span>
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-[#5D7052] text-white text-xs font-medium hover:bg-[#4D5E44] transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Access Dashboard</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#F0ECE6]">
            <Link href="/chat" className="text-xs text-[#7B8580] hover:text-[#1F2421]">
              Return to Coach
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C3333] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D9]">
          <div className="flex items-center gap-3">
            <Link href="/chat" className="p-2 rounded-xl text-[#5A6460] hover:bg-[#EFECE6] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#5D7052] flex items-center justify-center text-white font-medium text-xs">
                  H
                </span>
                <h1 className="font-serif text-2xl text-[#1F2421]">Hushlee Admin &amp; Usage Intelligence</h1>
              </div>
              <p className="text-xs text-[#7B8580] mt-0.5">
                Privacy-preserving operational metrics, growth indicators, and authorized audit portal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchStats(passkey)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EFECE6] hover:bg-[#E2DDD3] text-xs font-medium text-[#4A5548] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F2E4] border border-[#C5DEC0] text-xs font-medium text-[#3A632F]">
              <span className="w-2 h-2 rounded-full bg-[#5D7052] animate-pulse" />
              <span>PostgreSQL Live</span>
            </div>
          </div>
        </header>

        {/* 1. Core KPIs Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-[#E8E1D7] shadow-xs">
            <div className="flex items-center justify-between text-[#7B8580] mb-2">
              <span className="text-xs font-medium">Total Users</span>
              <Users className="w-4 h-4 text-[#5D7052]" />
            </div>
            <div className="font-serif text-3xl text-[#1F2421]">{stats?.overview.totalUsers ?? 0}</div>
            <div className="text-[11px] text-[#5D7052] mt-1 font-medium">
              {stats?.overview.consentRate}% retention consent rate
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#E8E1D7] shadow-xs">
            <div className="flex items-center justify-between text-[#7B8580] mb-2">
              <span className="text-xs font-medium">Active Users (DAU / MAU)</span>
              <Activity className="w-4 h-4 text-[#5D7052]" />
            </div>
            <div className="font-serif text-3xl text-[#1F2421]">
              {stats?.overview.dau ?? 0} <span className="text-sm font-sans text-[#7B8580]">/ {stats?.overview.mau ?? 0}</span>
            </div>
            <div className="text-[11px] text-[#7B8580] mt-1">
              WAU: {stats?.overview.wau ?? 0} active users
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#E8E1D7] shadow-xs">
            <div className="flex items-center justify-between text-[#7B8580] mb-2">
              <span className="text-xs font-medium">Reflections &amp; Messages</span>
              <MessageSquare className="w-4 h-4 text-[#5D7052]" />
            </div>
            <div className="font-serif text-3xl text-[#1F2421]">{stats?.overview.totalConversations ?? 0}</div>
            <div className="text-[11px] text-[#7B8580] mt-1">
              {stats?.overview.totalMessages ?? 0} encrypted messages ({stats?.overview.avgMessagesPerConv} avg/thread)
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#E8E1D7] shadow-xs">
            <div className="flex items-center justify-between text-[#7B8580] mb-2">
              <span className="text-xs font-medium">Safety Escalations</span>
              <ShieldAlert className="w-4 h-4 text-[#B84E42]" />
            </div>
            <div className="font-serif text-3xl text-[#1F2421]">{stats?.overview.totalSafetyFlags ?? 0}</div>
            <div className="text-[11px] text-[#7B8580] mt-1">
              Discreet hotline assistance triggered
            </div>
          </div>
        </section>

        {/* 2. Marketing & Usage Trends */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Audience Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E1D7] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg text-[#1F2421]">Marketing Strategy: Audience Interest</h2>
                <p className="text-xs text-[#7B8580]">
                  User selections from onboarding context (guides your ad copy and content)
                </p>
              </div>
              <Heart className="w-5 h-5 text-[#5D7052]" />
            </div>

            <div className="space-y-3 pt-2">
              {stats?.relationshipBreakdown.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="capitalize text-[#3E4A44]">
                      {item.category === 'romantic' && 'Romantic / Partner'}
                      {item.category === 'family' && 'Family Dynamics'}
                      {item.category === 'friendship' && 'Friendship'}
                      {item.category === 'workplace' && 'Workplace / Team'}
                      {item.category === 'other' && 'General Reflection'}
                    </span>
                    <span className="text-[#1F2421]">
                      {item.percentage}% ({item.count})
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#EFECE6] overflow-hidden">
                    <div
                      className="h-full bg-[#5D7052] rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7-Day Activity Trends */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E1D7] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg text-[#1F2421]">7-Day Usage Activity</h2>
                <p className="text-xs text-[#7B8580]">Daily conversation starts &amp; encrypted message volume</p>
              </div>
              <TrendingUp className="w-5 h-5 text-[#5D7052]" />
            </div>

            <div className="space-y-2 pt-2">
              {stats?.dailyActivity.map((day) => (
                <div key={day.date} className="flex items-center justify-between text-xs py-1.5 border-b border-[#F4EFEB]">
                  <div className="flex items-center gap-2 text-[#5A6460]">
                    <Calendar className="w-3.5 h-3.5 text-[#8F9A95]" />
                    <span>{day.date}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px]">
                    <span className="text-[#7B8580]">
                      <strong className="text-[#1F2421]">{day.conversations}</strong> reflections
                    </span>
                    <span className="text-[#5D7052] font-medium">
                      <strong className="text-[#5D7052]">{day.messages}</strong> messages
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Authorized Personnel Data Access (SPEC.md Section 5 Compliance Tool) */}
        <section className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E1D7] shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#EFECE6] text-[#5D7052] flex items-center justify-center">
                <FileKey2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-xl text-[#1F2421]">
                  Authorized Personnel Data Access
                </h2>
                <p className="text-xs text-[#7B8580]">
                  SPEC.md Section 5: Decrypt conversation records within 90 days with mandatory logged justification
                </p>
              </div>
            </div>
            <span className="text-[11px] px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
              Audit-Enforced
            </span>
          </div>

          <form onSubmit={handleAuthorizedDecrypt} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#4A5548] mb-1">
                  Target User ID or Email
                </label>
                <input
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="e.g. cmumh7brb000qr8bs49cnwt5y"
                  required
                  className="w-full text-xs p-3 rounded-xl border border-[#E0D7CC] font-mono focus:outline-none focus:ring-1 focus:ring-[#5D7052]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A5548] mb-1">
                  Authorized Admin Sign-Off ID
                </label>
                <input
                  type="text"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="e.g. legal-counsel@hushlee.app"
                  required
                  className="w-full text-xs p-3 rounded-xl border border-[#E0D7CC] focus:outline-none focus:ring-1 focus:ring-[#5D7052]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A5548] mb-1">
                Mandatory Justification Reason (Logged to PostgreSQL Audit Trail)
              </label>
              <input
                type="text"
                value={accessReason}
                onChange={(e) => setAccessReason(e.target.value)}
                placeholder="e.g. Compliance review for safety escalation test"
                required
                className="w-full text-xs p-3 rounded-xl border border-[#E0D7CC] focus:outline-none focus:ring-1 focus:ring-[#5D7052]"
              />
            </div>

            {decryptError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{decryptError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={decrypting}
              className="px-6 py-2.5 rounded-full bg-[#5D7052] hover:bg-[#4D5E44] text-white text-xs font-medium transition-colors flex items-center gap-2 disabled:opacity-60 shadow-xs"
            >
              <FileKey2 className="w-4 h-4" />
              <span>{decrypting ? 'Verifying & Decrypting...' : 'Request Decrypted Access (Audit-Logged)'}</span>
            </button>
          </form>

          {/* Decrypted Results Display */}
          {decryptResult && (
            <div className="mt-6 p-5 rounded-2xl bg-[#FAF8F5] border border-[#EAE3D9] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D9]">
                <div className="flex items-center gap-2 text-[#335629] text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#5D7052]" />
                  <span>Decryption Successful &amp; Audit Log Committed to PostgreSQL</span>
                </div>
                <span className="font-mono text-[11px] text-[#7B8580]">
                  User: {decryptResult.user.id}
                </span>
              </div>

              {decryptResult.conversations.length === 0 ? (
                <div className="text-xs text-[#7B8580] italic">No conversations found for this user.</div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {decryptResult.conversations.map((conv) => (
                    <div key={conv.id} className="p-4 rounded-xl bg-white border border-[#E8E1D7] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <strong className="text-[#1F2421] font-serif text-sm">&quot;{conv.title}&quot;</strong>
                        <span className="text-[11px] text-[#8F9A95]">
                          {new Date(conv.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-2 pt-2 text-xs">
                        {conv.messages.map((m) => (
                          <div
                            key={m.id}
                            className={`p-2.5 rounded-xl ${
                              m.role === 'assistant'
                                ? 'bg-[#F7F4EE] text-[#2C3333]'
                                : 'bg-[#5D7052]/10 text-[#1F2421]'
                            }`}
                          >
                            <span className="font-medium uppercase text-[10px] text-[#7B8580] block mb-0.5">
                              {m.role === 'assistant' ? 'Coach' : 'User'}
                            </span>
                            <p className="whitespace-pre-wrap">{m.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* 4. Live Compliance Audit Trail Feed */}
        <section className="bg-white p-6 rounded-3xl border border-[#E8E1D7] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg text-[#1F2421]">Live Compliance Audit Log</h2>
              <p className="text-xs text-[#7B8580]">
                Verifiable audit records committed directly to PostgreSQL (proves access justification)
              </p>
            </div>
            <Lock className="w-4 h-4 text-[#5D7052]" />
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-64 pr-2">
            {stats?.recentAuditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D9] text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${
                      log.actor === 'admin'
                        ? 'bg-amber-100 text-amber-800'
                        : log.actor === 'system'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-[#EFECE6] text-[#4A5548]'
                    }`}
                  >
                    {log.actor}
                  </span>
                  <span className="font-mono text-[#1F2421]">{log.action}</span>
                </div>
                <span className="text-[11px] text-[#8F9A95]">
                  {new Date(log.createdAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

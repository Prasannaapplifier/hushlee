'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Trash2,
  ShieldAlert,
  Clock,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
} from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState<{
    id: string;
    email?: string | null;
    consentBackupAckAt?: string | null;
    isGuest?: boolean;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Confirmation modals
  const [confirmDeleteData, setConfirmDeleteData] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/user/status');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        console.error('Error fetching user status:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch('/api/export');
      if (!res.ok) throw new Error('Failed to generate data export');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hushlee-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setActionSuccess('Your decrypted conversation archive has been downloaded successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error exporting data';
      setActionError(msg);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteData = async () => {
    setIsDeleting(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'data_only' }),
      });

      if (!res.ok) throw new Error('Failed to delete data');
      const data = await res.json();

      setConfirmDeleteData(false);
      setActionSuccess(data.message || 'All conversations have been permanently erased.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting data';
      setActionError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'account' }),
      });

      if (!res.ok) throw new Error('Failed to delete account');

      setConfirmDeleteAccount(false);
      window.location.href = '/?deleted=true';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting account';
      setActionError(msg);
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C3333] p-4 sm:p-8 selection:bg-[#E2D4C9]">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#5A6460] hover:text-[#1F2421] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Chat</span>
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFECE6] border border-[#DDD7CD] text-xs font-medium text-[#4A5548]">
            <Lock className="w-3.5 h-3.5 text-[#5D7052]" />
            <span>Privacy &amp; Data Rights</span>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1F2421]">Account &amp; Confidentiality</h1>
          <p className="text-sm text-[#5A6460] mt-1.5">
            Transparent data management, legal retention policies, and self-service privacy controls.
          </p>
        </div>

        {/* Feedback banners */}
        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-[#EBF3E8] border border-[#C5DEC0] text-[#335629] text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Section 1: Plain Language Retention Explainer */}
        <section className="bg-white/80 p-6 sm:p-7 rounded-3xl border border-[#E8E1D7] shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 mb-1">
            <Clock className="w-5 h-5 text-[#5D7052]" />
            <h2 className="font-serif text-xl text-[#1F2421]">Plain-Language 90-Day Retention Policy</h2>
          </div>

          <div className="text-xs text-[#5A6460] leading-relaxed space-y-3">
            <p>
              Hushlee does not retain conversation histories indefinitely. All conversation records and encrypted message contents are automatically purged after <strong>90 days</strong> from creation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EAE3D9]">
                <strong className="text-[#1F2421] block mb-1">What is stored?</strong>
                Your messages are encrypted at rest with per-user cryptographic keys (envelope encryption). Plaintext is never stored in database logs.
              </div>
              <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EAE3D9]">
                <strong className="text-[#1F2421] block mb-1">Who can view it?</strong>
                Nobody by default. Hushlee support and engineering teams cannot read raw messages without an explicit, audited access justification.
              </div>
            </div>

            <div className="p-3.5 bg-[#F4EFEB] rounded-2xl border border-[#E5DFD5] text-[#424A45]">
              <div className="flex items-center gap-2 font-medium text-[#1F2421] mb-1">
                <ShieldCheck className="w-4 h-4 text-[#5D7052]" />
                <span>Our Permanent No-Sale Commitment</span>
              </div>
              We do not sell your data. We do not share it with advertisers, data brokers, or any third party. It is used only to generate your coaching responses and is never used for marketing resale or commercial model training.
            </div>
          </div>
        </section>

        {/* Section 2: Account & Consent Info */}
        <section className="bg-white/80 p-6 sm:p-7 rounded-3xl border border-[#E8E1D7] shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 mb-1">
            <FileText className="w-5 h-5 text-[#5D7052]" />
            <h2 className="font-serif text-xl text-[#1F2421]">Your Profile &amp; Consent Log</h2>
          </div>

          <div className="text-xs text-[#5A6460] space-y-2">
            <div className="flex justify-between py-2 border-b border-[#F0ECE6]">
              <span className="font-medium text-[#3E4A44]">Account Identifier:</span>
              <span className="font-mono text-[#7B8580]">{loading ? '...' : user?.email || user?.id || 'Active Session'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#F0ECE6]">
              <span className="font-medium text-[#3E4A44]">Retention Policy Consent:</span>
              <span className="text-[#5D7052] font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {user?.consentBackupAckAt
                    ? `Acknowledged on ${new Date(user.consentBackupAckAt).toLocaleDateString()}`
                    : 'Active'}
                </span>
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-medium text-[#3E4A44]">Envelope Encryption Status:</span>
              <span className="text-[#5D7052] font-medium">Active (AES-256-GCM)</span>
            </div>
          </div>
        </section>

        {/* Section 3: Data Rights & Controls */}
        <section className="bg-white/80 p-6 sm:p-7 rounded-3xl border border-[#E8E1D7] shadow-xs space-y-5">
          <h2 className="font-serif text-xl text-[#1F2421]">Self-Service Privacy Controls</h2>

          {/* Export */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-[#F0ECE6]">
            <div>
              <h3 className="text-sm font-medium text-[#1F2421]">Export My Data</h3>
              <p className="text-xs text-[#7B8580] mt-0.5">
                Download a complete, decrypted JSON archive of all your conversations and reflections.
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-5 py-2.5 rounded-full bg-[#EFECE6] hover:bg-[#E5DFD5] text-xs font-medium text-[#3E4A44] flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-[#5D7052]" />
              <span>{exporting ? 'Decrypting & Exporting...' : 'Export JSON'}</span>
            </button>
          </div>

          {/* Delete Conversations */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-[#F0ECE6]">
            <div>
              <h3 className="text-sm font-medium text-[#1F2421]">Delete My Conversations</h3>
              <p className="text-xs text-[#7B8580] mt-0.5">
                Permanently purge all chat reflections and message contents while keeping your account.
              </p>
            </div>
            <button
              onClick={() => setConfirmDeleteData(true)}
              className="px-5 py-2.5 rounded-full border border-[#E0D7CC] hover:bg-[#FAF4EE] text-xs font-medium text-[#A8423F] flex items-center justify-center gap-2 transition-colors shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Conversations</span>
            </button>
          </div>

          {/* Delete Account */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
            <div>
              <h3 className="text-sm font-medium text-[#1F2421]">Delete Account</h3>
              <p className="text-xs text-[#7B8580] mt-0.5">
                Permanently erase your account, sessions, and all cryptographic keys. This cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setConfirmDeleteAccount(true)}
              className="px-5 py-2.5 rounded-full bg-[#A8423F] hover:bg-[#913735] text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors shadow-2xs shrink-0"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Delete Entire Account</span>
            </button>
          </div>
        </section>

        {/* Footer Admin Link */}
        <div className="pt-4 text-center">
          <Link
            href="/admin"
            className="text-xs text-[#8F9A95] hover:text-[#5D7052] transition-colors"
          >
            Admin &amp; Operational Intelligence →
          </Link>
        </div>
      </div>

      {/* Confirmation Modal: Delete Data */}
      {confirmDeleteData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <div className="bg-[#FAF8F5] border border-[#E8E1D7] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl text-[#2C3333]">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl text-[#1F2421] mb-2">Purge All Conversations?</h3>
            <p className="text-xs text-[#5A6460] leading-relaxed mb-6">
              This will permanently delete all your conversation reflections and encrypted message contents from our database. This action is irreversible.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteData(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-full text-xs font-medium text-[#5A6460] hover:bg-[#EFECE6] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteData}
                disabled={isDeleting}
                className="px-5 py-2 rounded-full bg-[#A8423F] hover:bg-[#913735] text-white text-xs font-medium transition-colors disabled:opacity-60"
              >
                {isDeleting ? 'Purging...' : 'Yes, Delete All Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Account */}
      {confirmDeleteAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <div className="bg-[#FAF8F5] border border-[#E8E1D7] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl text-[#2C3333]">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl text-[#1F2421] mb-2">Permanently Delete Account?</h3>
            <p className="text-xs text-[#5A6460] leading-relaxed mb-6">
              Your profile, sessions, consent history, encryption keys, and all conversation reflections will be permanently erased immediately.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteAccount(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-full text-xs font-medium text-[#5A6460] hover:bg-[#EFECE6] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-5 py-2 rounded-full bg-[#A8423F] hover:bg-[#913735] text-white text-xs font-medium transition-colors disabled:opacity-60"
              >
                {isDeleting ? 'Deleting Account...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

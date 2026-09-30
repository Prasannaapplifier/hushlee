import Link from 'next/link';
import { ShieldCheck, Heart, Lock, Clock, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C3333] flex flex-col justify-between selection:bg-[#E2D4C9]">
      {/* Header */}
      <header className="border-b border-[#EAE3D9] bg-[#FAF8F5]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#5D7052] flex items-center justify-center text-white font-medium text-lg">
              H
            </span>
            <span className="font-serif text-2xl tracking-tight text-[#1F2421]">Hushlee</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EFECE6] text-xs font-medium text-[#4A5548] border border-[#DDD7CD]">
              <Lock className="w-3.5 h-3.5 text-[#5D7052]" />
              <span>Never sold or shared</span>
            </div>
            <Link
              href="/chat"
              className="px-5 py-2.5 rounded-full bg-[#5D7052] text-white text-sm font-medium hover:bg-[#4D5E44] transition-colors shadow-sm"
            >
              Start Conversation
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 sm:py-24 text-center flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F0ECE1] text-[#4A5548] text-xs font-medium mb-8 border border-[#DFD8CC]">
          <ShieldCheck className="w-4 h-4 text-[#5D7052]" />
          <span>Strictly Confidential AI Relationship Coaching</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl text-[#1F2421] leading-tight max-w-3xl mb-6">
          A calm, private space to talk through your relationship.
        </h1>

        <p className="text-lg sm:text-xl text-[#5A6460] font-light max-w-2xl leading-relaxed mb-10">
          Navigate romantic, family, friendship, or workplace dynamics with an AI coach that truly listens.
          <strong className="font-normal text-[#1F2421] block mt-2">
            Never sold. Never shared. Used only to serve you.
          </strong>
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Link
            href="/chat"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#5D7052] text-white font-medium text-base hover:bg-[#4D5E44] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <span>Begin Free Session</span>
            <Sparkles className="w-4 h-4 opacity-80" />
          </Link>
          <a
            href="#commitment"
            className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#EFECE6] text-[#4A5548] font-medium text-base hover:bg-[#E5E0D7] transition-colors"
          >
            Our Privacy Commitment
          </a>
        </div>

        {/* Framing callout */}
        <div className="mt-14 max-w-xl text-xs text-[#7B8580] bg-[#F4EFEB]/80 p-4 rounded-xl border border-[#E5DFD5]">
          <strong className="text-[#3E4A44] font-medium">Important Framing:</strong> Hushlee is an AI relationship coach designed for communication guidance and self-reflection, not a licensed therapist or crisis counselor.
        </div>

        {/* 3 Pillars */}
        <section id="commitment" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left w-full">
          <div className="bg-white/70 p-6 rounded-2xl border border-[#E8E1D7] shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#F0ECE1] flex items-center justify-center text-[#5D7052] mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-medium text-[#1F2421] mb-2">Zero Data Brokering</h3>
            <p className="text-sm text-[#5A6460] leading-relaxed">
              We never sell your data to advertisers, data brokers, or third parties. It is never used for marketing resale.
            </p>
          </div>

          <div className="bg-white/70 p-6 rounded-2xl border border-[#E8E1D7] shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#F0ECE1] flex items-center justify-center text-[#5D7052] mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-medium text-[#1F2421] mb-2">90-Day Auto-Purge</h3>
            <p className="text-sm text-[#5A6460] leading-relaxed">
              Conversations are automatically purged after 90 days. You can also export or delete all your data at any time.
            </p>
          </div>

          <div className="bg-white/70 p-6 rounded-2xl border border-[#E8E1D7] shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#F0ECE1] flex items-center justify-center text-[#5D7052] mb-4">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-medium text-[#1F2421] mb-2">Non-Judgmental Coaching</h3>
            <p className="text-sm text-[#5A6460] leading-relaxed">
              Empathetic perspective-taking, communication frameworks, and boundary setting without pressure or gamification.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#EAE3D9] py-8 bg-[#F5F1EB] text-xs text-[#7B8580]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Hushlee. Confidential Relationship Coaching.</p>
          <div className="flex items-center gap-6">
            <Link href="/settings" className="hover:text-[#2C3333]">Privacy & Settings</Link>
            <span className="text-[#B6B0A6]">•</span>
            <Link href="/admin" className="hover:text-[#2C3333]">Admin Dashboard</Link>
            <span className="text-[#B6B0A6]">•</span>
            <span>Render Node.js Runtime</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

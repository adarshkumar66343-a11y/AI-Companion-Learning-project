'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PWASupportPage() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] font-sans min-h-screen">
      {isDarkMode && (
        <style dangerouslySetInnerHTML={{ __html: `
          body, html, .min-h-screen, .bg-\\[\\#f8f9ff\\] { background-color: #121212 !important; color: #f8fafc !important; }
          header { background-color: #1e1e1e !important; border-bottom-color: #2a2a2a !important; }
          header * { color: #f8fafc !important; }
          header a:hover { color: #3b82f6 !important; }
          .bg-white { background-color: #1e1e1e !important; color: #f8fafc !important; border-color: #2a2a2a !important; }
          h2, h3, h4, .text-\\[\\#191B23\\] { color: #ffffff !important; }
          p, span, .text-\\[\\#64748B\\], .text-\\[\\#434655\\] { color: #a3a3a3 !important; }
          .border-\\[\\#E2E8F0\\] { border-color: #2a2a2a !important; }
          .bg-blue-50 { background-color: #262626 !important; color: #3b82f6 !important; }
          input, select, textarea { background-color: #262626 !important; color: #f8fafc !important; border-color: #2a2a2a !important; }
          .bg-slate-50 { background-color: #262626 !important; border-color: #2a2a2a !important; }
          .bg-slate-200 { background-color: #262626 !important; }
          .hover\\:bg-slate-50:hover { background-color: #262626 !important; }
        `}} />
      )}
      {/* TopNavBar */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 md:px-10 h-16 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-10">
            <span className="font-hanken-title text-[24px] font-extrabold text-[#004ac6]">Brainzy</span>
            <nav className="hidden md:flex gap-8 items-center">
              <Link href="/app" className="text-sm font-semibold text-[#434655] hover:text-[#004ac6] transition-colors">Workspace</Link>
              <Link href="/summary" className="text-sm font-semibold text-[#434655] hover:text-[#004ac6] transition-colors">AI Summary</Link>
              <Link href="/audio" className="text-sm font-semibold text-[#434655] hover:text-[#004ac6] transition-colors">Audio &amp; Transcription</Link>
              <Link href="/ocr" className="text-sm font-semibold text-[#434655] hover:text-[#004ac6] transition-colors">Vision OCR</Link>
              <Link href="#" className="text-sm font-bold text-[#004ac6] border-b-2 border-[#004ac6] pb-1">Offline PWA</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all flex items-center justify-center active:scale-95"
              title="Toggle Light/Dark Mode"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <Link href="/" className="text-sm font-bold text-[#64748B] hover:text-[#191B23] flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">home</span> Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto pt-10 px-6 pb-12 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="font-hanken-title text-3xl font-extrabold text-[#191B23]">Offline PWA Support</h2>
          <p className="text-sm text-[#64748B] max-w-lg mx-auto">
            Brainzy is a Progressive Web App (PWA). You can install it on your device and use it without active internet connections.
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-8 rounded-3xl shadow-sm space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#004ac6] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[28px]">install_desktop</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#191B23]">Application Install Guide</h3>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                PWAs load instantly, offer home screen icons, and cache crucial deck files for offline usage.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <p className="text-xs font-bold text-[#191B23]">Service Worker Sync Status</p>
                <p className="text-[10px] text-emerald-600 font-bold mt-0.5">✓ Activated and caching files locally</p>
              </div>
              <span className="material-symbols-outlined text-emerald-500">cloud_done</span>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <p className="text-xs font-bold text-[#191B23]">Offline Database Storage</p>
                <p className="text-[10px] text-[#64748B]">Ready (SQLite IndexedDB fallback active)</p>
              </div>
              <span className="material-symbols-outlined text-blue-500">database</span>
            </div>
          </div>

          <div className="pt-4 flex justify-center">
            {isInstalled ? (
              <span className="bg-green-50 text-green-700 font-bold px-8 py-3 rounded-xl border border-green-200 text-xs">
                ✓ Brainzy is installed on this device
              </span>
            ) : (
              <button
                onClick={() => {
                  setIsInstalled(true);
                  alert('Thank you for installing Brainzy!');
                }}
                className="bg-[#004ac6] text-white font-bold px-8 py-3 rounded-xl hover:opacity-95 transition-all text-xs shadow-md shadow-blue-500/10 active:scale-95"
              >
                Install App on Home Screen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

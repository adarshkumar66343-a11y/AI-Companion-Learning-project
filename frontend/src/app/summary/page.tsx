'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { lemma, AcademicPaper } from '@/lib/lemma';

export default function SummaryGeneratorPage() {
  const [papers, setPapers] = useState<AcademicPaper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<AcademicPaper | null>(null);
  const [format, setFormat] = useState<'bullets' | 'paragraph'>('bullets');
  const [wordCount, setWordCount] = useState(250);
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const list = await lemma.listPapers();
        setPapers(list);
        if (list.length > 0) {
          setSelectedPaper(list[0]);
          setGeneratedSummary(list[0].summary || 'No summary currently cached for this document. Click Generate below.');
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, []);

  const handleGenerate = async () => {
    if (!selectedPaper) return;
    setIsGenerating(true);
    try {
      const prompt = format === 'bullets'
        ? `Provide a detailed bullet-point summary of the document. Keep the total length around ${wordCount} words.`
        : `Provide a detailed paragraph summary of the document. Keep the total length around ${wordCount} words.`;
        
      const data = await lemma.askDoubt(selectedPaper.id, null, prompt);
      setGeneratedSummary(data.reply);
    } catch (e: any) {
      alert(`Error generating summary: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] font-sans min-h-screen">
      {isDarkMode && (
        <style dangerouslySetInnerHTML={{ __html: `
          body, html, .min-h-screen, .bg-\\[\\#f8f9ff\\] { background-color: #121212 !important; color: #f8fafc !important; }
          header { background-color: #1e1e1e !important; border-bottom-color: #2a2a2a !important; }
          header * { color: #f8fafc !important; }
          header a:hover { color: #3b82f6 !important; }
          aside { background-color: #1e1e1e !important; border-color: #2a2a2a !important; }
          aside * { color: #f8fafc !important; }
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
              <Link href="#" className="text-sm font-bold text-[#004ac6] border-b-2 border-[#004ac6] pb-1">AI Summary</Link>
              <Link href="/audio" className="text-sm font-semibold text-[#434655] hover:text-[#004ac6] transition-colors">Audio &amp; Transcription</Link>
              <Link href="/ocr" className="text-sm font-semibold text-[#434655] hover:text-[#004ac6] transition-colors">Vision OCR</Link>
              <Link href="/pwa" className="text-sm font-semibold text-[#434655] hover:text-[#004ac6] transition-colors">Offline PWA</Link>
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

      <div className="flex max-w-[1440px] mx-auto relative pt-6 px-6 md:px-10">
        {/* Left config pane */}
        <aside className="w-80 bg-slate-50 border border-[#E2E8F0] p-6 rounded-2xl shrink-0 hidden lg:block sticky top-24 h-[calc(100vh-120px)] flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#004ac6]">auto_stories</span>
              <h2 className="font-bold text-sm text-[#004ac6] uppercase tracking-wider">Summary Config</h2>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Select Source</label>
              {papers.map((paper) => (
                <button
                  key={paper.id}
                  onClick={() => {
                    setSelectedPaper(paper);
                    setGeneratedSummary(paper.summary || '');
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${selectedPaper?.id === paper.id ? 'border-[#004ac6] bg-blue-50/50 text-[#004ac6]' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  <span className="truncate max-w-[160px]">{paper.title}</span>
                  {selectedPaper?.id === paper.id && <span className="material-symbols-outlined text-[16px]">check_circle</span>}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Output Format</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-200 p-1 rounded-xl text-xs font-bold text-slate-600">
                  <button
                    onClick={() => setFormat('bullets')}
                    className={`py-2 rounded-lg transition-all ${format === 'bullets' ? 'bg-[#004ac6] text-white' : 'hover:bg-slate-300/50'}`}
                  >
                    Bullet Points
                  </button>
                  <button
                    onClick={() => setFormat('paragraph')}
                    className={`py-2 rounded-lg transition-all ${format === 'paragraph' ? 'bg-[#004ac6] text-white' : 'hover:bg-slate-300/50'}`}
                  >
                    Paragraph
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Target Word Count ({wordCount} words)</label>
                <input
                  type="range"
                  min="50"
                  max="800"
                  step="50"
                  value={wordCount}
                  onChange={(e) => setWordCount(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#004ac6]"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedPaper}
              className="w-full bg-[#004ac6] hover:opacity-95 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md shadow-blue-500/10 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px] animate-pulse">bolt</span>
              {isGenerating ? 'Summarizing...' : 'Generate Summary'}
            </button>
          </div>
        </aside>

        {/* Main display panel */}
        <main className="flex-grow lg:pl-10 pb-12">
          <div className="bg-white border border-[#E2E8F0] p-8 rounded-3xl shadow-sm min-h-[calc(100vh-120px)] flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h2 className="font-hanken-title text-2xl font-extrabold text-[#191B23]">
                  {selectedPaper ? `${selectedPaper.title} Summary` : 'AI Summary Output'}
                </h2>
                <p className="text-xs text-[#64748B]">Adjust parameters in the left sidebar and click generate to run local model summary synthesis.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 min-h-[300px]">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <div className="w-10 h-10 border-4 border-[#004ac6] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-slate-500 font-bold">Synthesizing document semantic blocks...</p>
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed text-[#434655] whitespace-pre-line font-medium">
                    {generatedSummary}
                  </div>
                )}
              </div>
            </div>

            <footer className="flex justify-between items-center text-[10px] text-slate-400 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <span>Lemma Summary Engine</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span>Context Window: 128k</span>
              </div>
              <div className="flex items-center gap-1 text-green-600 font-semibold">
                <span className="material-symbols-outlined text-[14px]">cloud_done</span>
                <span>Ready</span>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

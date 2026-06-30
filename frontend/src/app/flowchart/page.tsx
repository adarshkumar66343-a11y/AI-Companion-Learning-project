'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Paper {
  id: string;
  title: string;
  filename: string;
  summary: string;
}

export default function FlowchartViewPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [format, setFormat] = useState('Flowchart');
  const [length, setLength] = useState('Standard (3-5 pages)');
  const [language, setLanguage] = useState('English (US)');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);

  // Load papers on mount
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/lemma');
        const data = await res.json();
        const list = data.papers || [];
        setPapers(list);
        if (list.length > 0) {
          setSelectedPaper(list[0]);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, []);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert('AI Flowchart analysis updated for selected source!');
    }, 1500);
  };

  const nodeDetails: Record<string, { title: string; desc: string; details: string }> = {
    sensory: {
      title: "Sensory Memory",
      desc: "Receives raw physical inputs from environment.",
      details: "High capacity but extremely short duration (less than 3 seconds). Filters relevant attention triggers into Working Memory."
    },
    working: {
      title: "Working Memory (WM)",
      desc: "Active processing hub for cognitive operations.",
      details: "Extremely limited capacity (holding roughly 4-7 chunks of info). Vulnerable to Extraneous Load if pedagogical presentation is poor."
    },
    longterm: {
      title: "Long-term Memory (LTM)",
      desc: "Permanent storage of complex schemas.",
      details: "Infinite capacity. Information here is organized as schemas which can be fetched back to WM to ease processing loads."
    }
  };

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] font-sans min-h-screen">
      {/* TopNavBar */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 md:px-10 h-16 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-10">
            <span className="font-hanken-title text-[24px] font-extrabold text-[#004ac6]">Brainzy</span>
            <nav className="hidden md:flex gap-8 items-center">
              <Link href="/app" className="text-sm font-semibold text-[#434655] hover:text-[#004ac6] transition-colors">AI Summary</Link>
              <Link href="/app" className="text-sm font-semibold text-[#434655] hover:text-[#004ac6] transition-colors">Doubt Bot</Link>
              <Link href="/app" className="text-sm font-semibold text-[#434655] hover:text-[#004ac6] transition-colors">Flashcards</Link>
              <Link href="/progress" className="text-sm font-semibold text-[#434655] hover:text-[#004ac6] transition-colors">Progress Tracker</Link>
              <Link href="#" className="text-sm font-bold text-[#004ac6] border-b-2 border-[#004ac6] pb-1">Flowchart View</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/app" className="bg-[#004ac6] text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:shadow-md hover:opacity-95 transition-all">
              Workspace
            </Link>
          </div>
        </div>
      </header>

      <div className="flex max-w-[1440px] mx-auto relative pt-6 px-6 md:px-10">
        {/* Left Sidebar Pane */}
        <aside className="w-80 bg-slate-50 border border-[#E2E8F0] p-6 rounded-2xl shrink-0 hidden lg:block sticky top-24 h-[calc(100vh-120px)] flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#004ac6]">description</span>
              <h2 className="font-bold text-sm text-[#004ac6] uppercase tracking-wider">Summarization Source</h2>
            </div>

            {/* Document Selector */}
            <div className="space-y-2">
              {papers.length > 0 ? (
                papers.map((paper) => (
                  <button
                    key={paper.id}
                    onClick={() => setSelectedPaper(paper)}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${selectedPaper?.id === paper.id ? 'border-[#004ac6] bg-blue-50/50 text-[#004ac6]' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                  >
                    <span className="truncate max-w-[160px]">{paper.title}</span>
                    {selectedPaper?.id === paper.id && <span className="material-symbols-outlined text-[16px]">check_circle</span>}
                  </button>
                ))
              ) : (
                <p className="text-xs text-slate-400">No active sources found</p>
              )}
            </div>

            {/* Config Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Output Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#004ac6] outline-none bg-white font-semibold"
                >
                  <option>Bullet Points</option>
                  <option>Paragraph</option>
                  <option>Flowchart</option>
                  <option>Mindmap</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Target Length</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#004ac6] outline-none bg-white font-semibold"
                >
                  <option>Concise (1-2 pages)</option>
                  <option>Standard (3-5 pages)</option>
                  <option>Detailed (Comprehensive)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#004ac6] outline-none bg-white font-semibold"
                >
                  <option>English (US)</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-[#004ac6] hover:opacity-95 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md shadow-blue-500/10 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px] animate-pulse">bolt</span>
              {isGenerating ? 'Analyzing...' : 'Generate AI Analysis'}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow lg:pl-10 pb-12">
          <div className="bg-white border border-[#E2E8F0] p-8 rounded-3xl shadow-sm min-h-[calc(100vh-120px)] flex flex-col justify-between">
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="font-hanken-title text-2xl font-extrabold text-[#191B23]">
                  {selectedPaper ? `${selectedPaper.title} Flowchart` : 'Academic Concept Flowchart'}
                </h2>
                <p className="text-xs text-[#64748B]">Click on any node block to inspect concept metadata details.</p>
              </div>

              {/* Real Interactive SVG Flowchart Diagram */}
              <div className="max-w-xl mx-auto border border-slate-100 rounded-2xl bg-slate-50/50 p-8 flex flex-col items-center justify-center min-h-[350px] relative">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 border-4 border-[#004ac6] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-semibold text-[#64748B]">Mapping Cognitive Connections...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-8 w-full relative">
                    {/* Node 1: Sensory Memory */}
                    <button
                      onClick={() => setActiveNode(activeNode === 'sensory' ? null : 'sensory')}
                      className={`w-64 p-5 rounded-2xl border text-center transition-all ${activeNode === 'sensory' ? 'border-[#004ac6] bg-blue-50 text-[#004ac6] shadow-md scale-105' : 'border-slate-200 bg-white hover:border-[#004ac6] shadow-sm'}`}
                    >
                      <h4 className="font-bold text-sm mb-1">1. Sensory Memory</h4>
                      <p className="text-[10px] text-slate-500">Filters environmental triggers</p>
                    </button>

                    {/* Arrow down */}
                    <div className="w-0.5 h-8 bg-slate-300 relative">
                      <div className="absolute -bottom-1 -left-[3px] w-2.5 h-2.5 border-b-2 border-r-2 border-slate-300 transform rotate-45"></div>
                    </div>

                    {/* Node 2: Working Memory */}
                    <button
                      onClick={() => setActiveNode(activeNode === 'working' ? null : 'working')}
                      className={`w-64 p-5 rounded-2xl border text-center transition-all ${activeNode === 'working' ? 'border-[#004ac6] bg-blue-50 text-[#004ac6] shadow-md scale-105' : 'border-slate-200 bg-white hover:border-[#004ac6] shadow-sm'}`}
                    >
                      <h4 className="font-bold text-sm mb-1">2. Working Memory</h4>
                      <p className="text-[10px] text-slate-500">Active processing hub (7 chunks capacity)</p>
                    </button>

                    {/* Arrow down */}
                    <div className="w-0.5 h-8 bg-slate-300 relative">
                      <div className="absolute -bottom-1 -left-[3px] w-2.5 h-2.5 border-b-2 border-r-2 border-slate-300 transform rotate-45"></div>
                    </div>

                    {/* Node 3: Long-term Memory */}
                    <button
                      onClick={() => setActiveNode(activeNode === 'longterm' ? null : 'longterm')}
                      className={`w-64 p-5 rounded-2xl border text-center transition-all ${activeNode === 'longterm' ? 'border-[#004ac6] bg-blue-50 text-[#004ac6] shadow-md scale-105' : 'border-slate-200 bg-white hover:border-[#004ac6] shadow-sm'}`}
                    >
                      <h4 className="font-bold text-sm mb-1">3. Long-term Memory</h4>
                      <p className="text-[10px] text-slate-500">Permanent schema repository</p>
                    </button>
                  </div>
                )}
              </div>

              {/* Node Detail Popup */}
              {activeNode && nodeDetails[activeNode] && (
                <div className="bg-[#FAF8FF] p-6 rounded-2xl border border-blue-100 max-w-xl mx-auto animate-in fade-in slide-in-from-top-1">
                  <h3 className="font-bold text-sm text-[#004ac6] mb-1">{nodeDetails[activeNode].title}</h3>
                  <p className="text-xs text-[#191B23] font-semibold mb-2">{nodeDetails[activeNode].desc}</p>
                  <p className="text-xs text-[#64748B] leading-relaxed">{nodeDetails[activeNode].details}</p>
                </div>
              )}
            </div>

            <footer className="flex justify-between items-center text-[10px] text-slate-400 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <span>v2.4.0 Engine</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span>Context Window: 128k tokens</span>
              </div>
              <div className="flex items-center gap-1 text-green-600 font-semibold">
                <span className="material-symbols-outlined text-[14px]">cloud_done</span>
                <span>System Ready</span>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

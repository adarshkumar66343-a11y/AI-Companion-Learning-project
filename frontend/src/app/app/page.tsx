'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { lemma } from '@/lib/lemma';

interface Paper {
  id: string;
  title: string;
  filename: string;
  file_path: string;
  summary?: string;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  thinking?: boolean;
}

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  difficulty?: string;
  mastered?: boolean;
}

interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export default function UnifiedWorkspace() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'summary' | 'doubtbot' | 'flashcards' | 'exam' | 'timer' | 'progress' | 'roadmap' | 'planner' | 'storage'>('doubtbot');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Papers/sources states
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  
  // Custom text summary tab state
  const [summaryMode, setSummaryMode] = useState<'papers' | 'custom'>('papers');
  const [customText, setCustomText] = useState('');
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Doubt Bot chat states
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Flashcards state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  const [isExtractingFlashcards, setIsExtractingFlashcards] = useState(false);

  // Practice Exam state
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [selectedExamAnswers, setSelectedExamAnswers] = useState<Record<string, string>>({});
  const [isExamGraded, setIsExamGraded] = useState(false);
  const [examScore, setExamScore] = useState(0);
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [numExamQuestions, setNumExamQuestions] = useState(3);

  // Study Timer Pomodoro states
  const [timerSeconds, setTimerSeconds] = useState(1500); // 25 min
  const [timerActive, setTimerActive] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [activePreset, setActivePreset] = useState<'focus' | 'short' | 'long'>('focus');

  // Roadmap flowchart active node state
  const [roadmapActiveNode, setRoadmapActiveNode] = useState<string | null>(null);
  const [roadmapGenerated, setRoadmapGenerated] = useState(false);
  const [roadmapMilestones, setRoadmapMilestones] = useState<Array<{ num: number; title: string; duration: string; desc: string }>>([
    {
      num: 1,
      title: 'Foundational Vocabulary & core taxonomy',
      duration: '1.5 hours',
      desc: 'Master the fundamental vocabulary, core taxonomy, and biological context of systems-level sleep consolidation.'
    },
    {
      num: 2,
      title: 'Oscillatory triple-coupling & synchronization',
      duration: '2 hours',
      desc: 'Explore neocortical slow oscillations (<1 Hz), sleep spindles (11–16 Hz), and sharp-wave ripples (150–250 Hz).'
    },
    {
      num: 3,
      title: 'Experimental methodologies & data analyses',
      duration: '3 hours',
      desc: 'Analyze primary optogenetic and electrophysiological case studies in rodents and human clinical subjects.'
    }
  ]);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);

  // Planner revision slots states
  const [revisionSlots, setRevisionSlots] = useState<Array<{ id: number; subject: string; priority: string; title: string; date: string; time: string; duration: string; completed: boolean }>>([
    { id: 1, subject: 'Neuroscience', priority: 'high priority', title: 'Oscillatory triple-coupling in slow-wave sleep', date: '2026-06-29', time: '10:00', duration: '45 min', completed: true },
    { id: 2, subject: 'Educational Psychology', priority: 'medium priority', title: "Sweller's CLT: Worked-example effect", date: '2026-06-30', time: '14:30', duration: '30 min', completed: false },
    { id: 3, subject: 'Quantum Mechanics', priority: 'high priority', title: "Bell's Inequality & Quantum Cryptography", date: '2026-07-01', time: '09:00', duration: '60 min', completed: false },
  ]);
  const [slotSubject, setSlotSubject] = useState('Neuroscience');
  const [slotPriority, setSlotPriority] = useState('high priority');
  const [slotTitle, setSlotTitle] = useState('Oscillatory triple-coupling in slow-wave sleep');
  const [slotDate, setSlotDate] = useState('2026-06-29');
  const [slotTime, setSlotTime] = useState('10:00');
  const [slotDuration, setSlotDuration] = useState('45 min');

  // Progress tracker states
  const [accumulatedFocus, setAccumulatedFocus] = useState(250);
  const [completedActivitiesCount, setCompletedActivitiesCount] = useState(6);
  const [studyStreakCount, setStudyStreakCount] = useState(5);
  const [activityLogs, setActivityLogs] = useState<Array<{ id: number; topic: string; duration: number; activity: string; date: string }>>([
    { id: 1, topic: 'Cognitive Load Intrinsic', duration: 40, activity: 'Flashcards', date: '2026-06-28' },
    { id: 2, topic: 'Systems Memory Sleep', duration: 30, activity: 'Doubt Bot', date: '2026-06-29' },
  ]);
  const [newTopic, setNewTopic] = useState('Systems Memory Sleep');
  const [newDuration, setNewDuration] = useState('30');
  const [newActivity, setNewActivity] = useState('Doubt Bot');

  // Upload/Presettings
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFilename, setUploadFilename] = useState('');
  const [uploadPath, setUploadPath] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  // Load papers on mount
  useEffect(() => {
    fetchPapers();
  }, []);

  // Chat scroll anchor
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reload study materials when question count changes
  useEffect(() => {
    if (selectedPaper) {
      loadStudyResources(selectedPaper.id);
    }
  }, [numExamQuestions]);

  // Pomodoro countdown timer logic
  useEffect(() => {
    let interval: any;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerActive(false);
      setCompletedPomodoros((prev) => prev + 1);
      alert('Focus session interval finished! Take a well-earned break.');
      setTimerSeconds(activePreset === 'focus' ? 1500 : activePreset === 'short' ? 300 : 900);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds, activePreset]);

  const fetchPapers = async () => {
    try {
      const list = await lemma.listPapers();
      setPapers(list);
      if (list.length > 0 && !selectedPaper) {
        setSelectedPaper(list[0]);
        // Seed initial bot context greeting
        setMessages([
          {
            role: 'assistant',
            text: `Hello! I am Doubt Bot, your elite academic companion. I have analyzed "${list[0].title}". Feel free to ask any complex question, or request a formula breakdown, custom quiz, or explanation.`
          }
        ]);
        // Also fetch flashcards & exams for this paper
        loadStudyResources(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadStudyResources = async (paperId: string) => {
    try {
      // Flashcards
      const fList = await lemma.listFlashcards(paperId);
      setFlashcards(fList);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setMasteredCount(fList.filter((fc: any) => fc.difficulty === 'easy').length);

      // Exam
      const listQuestions = await lemma.listExamQuestions(paperId);
      const fallbackQuestions = [
        {
          id: 'mock-1',
          question: 'During which phase of sleep does systems memory consolidation primarily occur?',
          options: ['REM sleep', 'Light Stage 1 sleep', 'Slow-wave sleep (SWS)', 'Waking transitional state'],
          correct_answer: 'Slow-wave sleep (SWS)',
          explanation: 'SWS is critical for consolidation.'
        },
        {
          id: 'mock-2',
          question: 'Which type of cognitive load contributes nothing to actual learning and is caused by poor design?',
          options: ['Intrinsic Cognitive Load', 'Extraneous Cognitive Load', 'Germane Cognitive Load', 'Consolidation Cognitive Load'],
          correct_answer: 'Extraneous Cognitive Load',
          explanation: 'Extraneous load clogs working memory.'
        },
        {
          id: 'mock-3',
          question: 'What did Einstein call the phenomenon of quantum entanglement?',
          options: ['Spooky action at a distance', 'Relativity constant', 'Quantum bridge', 'Uncertainty principle'],
          correct_answer: 'Spooky action at a distance',
          explanation: 'Einstein coined this to express skepticism.'
        }
      ];
      
      const mergedQuestions = [...listQuestions, ...fallbackQuestions].slice(0, numExamQuestions);
      setExamQuestions(mergedQuestions);
      setSelectedExamAnswers({});
      setIsExamGraded(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectPaper = (paper: Paper) => {
    setSelectedPaper(paper);
    setConversationId(null);
    setMessages([
      {
        role: 'assistant',
        text: `Hello! I am Doubt Bot. I have analyzed "${paper.title}". Feel free to ask specific questions about this paper!`
      }
    ]);
    loadStudyResources(paper.id);
  };

  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !selectedPaper || isChatLoading) return;

    const userText = chatInput;
    setChatInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setIsChatLoading(true);

    // Add thinking placeholder
    setMessages((prev) => [...prev, { role: 'assistant', text: '', thinking: true }]);

    try {
      const data = await lemma.askDoubt(selectedPaper.id, conversationId, userText);
      setConversationId(data.conversationId);
      setMessages((prev) => {
        const cleaned = prev.filter(m => !m.thinking);
        return [...cleaned, { role: 'assistant', text: data.reply }];
      });
    } catch (err: any) {
      setMessages((prev) => {
        const cleaned = prev.filter(m => !m.thinking);
        return [...cleaned, { role: 'assistant', text: `⚠️ Error: ${err.message}` }];
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGenerateMaterials = async () => {
    if (!selectedPaper) return;
    setIsExtractingFlashcards(true);
    setIsGeneratingExam(true);
    try {
      await lemma.generateStudyMaterials(selectedPaper.id);
      alert('Successfully extracted fresh study materials using Lemma grounding!');
      loadStudyResources(selectedPaper.id);
    } catch (e: any) {
      alert(`Error generating materials: ${e.message}`);
    } finally {
      setIsExtractingFlashcards(false);
      setIsGeneratingExam(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (summaryMode === 'papers' && !selectedPaper) return;
    setIsGeneratingSummary(true);
    try {
      const prompt = summaryMode === 'papers'
        ? "Provide a concise summary of the selected document in under 150 words."
        : `Provide a concise summary of this custom text: "${customText}" in under 150 words.`;
      
      const data = await lemma.askDoubt(
        selectedPaper ? selectedPaper.id : (papers[0]?.id || ''),
        null,
        prompt
      );
      setGeneratedSummary(data.reply);
    } catch (e: any) {
      alert(`Error generating summary: ${e.message}`);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!selectedPaper) return;
    setIsGeneratingRoadmap(true);
    try {
      const prompt = "Act as an academic planner. Generate a structured learning roadmap for this paper. Suggest exactly 3 milestones. For each milestone, provide a short title and a one-sentence description. Format your answer as a clear numbered list.";
      const data = await lemma.askDoubt(selectedPaper.id, null, prompt);
      const text = data.reply || "";
      const lines = text.split('\n').filter((l: string) => l.trim().length > 0);
      const parsedMilestones: any[] = [];
      let currentNum = 1;
      
      lines.forEach((line: string) => {
        const match = line.match(/^\d+[\.\)\-]\s*(.*?)(?::| -)\s*(.*)/);
        if (match && currentNum <= 3) {
          parsedMilestones.push({
            num: currentNum,
            title: match[1].trim().slice(0, 50),
            duration: `${currentNum + 0.5} hours`,
            desc: match[2].trim()
          });
          currentNum++;
        }
      });

      if (parsedMilestones.length < 3) {
        setRoadmapMilestones([
          { num: 1, title: 'Concept Introduction & Key Terms', duration: '1 hour', desc: text.slice(0, 120) },
          { num: 2, title: 'Core Mechanisms & Theoretical Framework', duration: '2 hours', desc: text.slice(120, 240) || 'Synthesize experimental evidence.' },
          { num: 3, title: 'Evaluation & Advanced Methodologies', duration: '3 hours', desc: text.slice(240, 360) || 'Critically assess findings and methodologies.' }
        ]);
      } else {
        setRoadmapMilestones(parsedMilestones);
      }
      setRoadmapGenerated(true);
    } catch (e: any) {
      alert(`Error generating roadmap: ${e.message}`);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsUploading(true);
    setUploadMessage(`Uploading ${file.name} to Lemma pod...`);

    try {
      const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setUploadMessage('Grounding in Lemma file system...');
      await lemma.createPaper(title, file.name, file);
      setUploadMessage('✓ Document grounded in pod — AI agents can now read it!');
      setTimeout(() => setUploadMessage(''), 4000);
      fetchPapers();
    } catch (err: any) {
      console.error(err);
      setUploadMessage(`⚠️ Upload failed: ${err.message}`);
      setTimeout(() => setUploadMessage(''), 4000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddReviewReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle || !uploadFilename) return;
    try {
      await lemma.createPaper(uploadTitle, uploadFilename, null, '');
      setShowUploadModal(false);
      setUploadTitle('');
      setUploadFilename('');
      setUploadPath('');
      fetchPapers();
    } catch (e: any) {
      alert(`Error saving reference: ${e.message}`);
    }
  };

  const handleDeletePaper = async (paperId: string, title: string) => {
    if (!confirm(`Delete "${title}" from your library?`)) return;
    await lemma.deletePaper(paperId);
    setPapers(prev => prev.filter(p => p.id !== paperId));
    if (selectedPaper?.id === paperId) {
      setSelectedPaper(null);
      setMessages([]);
      setFlashcards([]);
      setExamQuestions([]);
    }
  };

  const formatTimerTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`font-sans min-h-screen flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-[#0f172a] text-[#f8fafc]' : 'bg-[#f8f9ff] text-[#0b1c30]'}`}>
      {isDarkMode && (
        <style dangerouslySetInnerHTML={{ __html: `
          /* Charcoal Dark Mode overrides */
          body, html, .min-h-screen, .bg-\\[\\#f8f9ff\\] { background-color: #121212 !important; color: #f8fafc !important; }
          main, .bg-\\[\\#F8FAFC\\] { background-color: #121212 !important; }
          
          /* Header and Sidebars */
          header { background-color: #1e1e1e !important; border-bottom: 1px solid #2a2a2a !important; }
          header h1, header span, header a { color: #f8fafc !important; }
          
          /* Cards and containers */
          .bg-white, .bg-slate-50\\/50, [class*="bg-white"] { background-color: #1e1e1e !important; color: #f8fafc !important; border-color: #2a2a2a !important; }
          .bg-slate-50, .bg-slate-55, .bg-slate-100, .bg-slate-200, [class*="bg-slate-50"], [class*="bg-slate-55"] { background-color: #262626 !important; color: #f8fafc !important; border-color: #2a2a2a !important; }
          
          /* Navigation tabs container */
          .bg-white.border-b.border-b-slate-200, .bg-white.border-b, .flex.gap-2.overflow-x-auto { background-color: #1e1e1e !important; border-color: #2a2a2a !important; }
          .flex.gap-2.overflow-x-auto button { color: #a3a3a3 !important; }
          .flex.gap-2.overflow-x-auto button.bg-\\[\\#004ac6\\], .flex.gap-2.overflow-x-auto button.bg-blue-600, .flex.gap-2.overflow-x-auto button.bg-[#004ac6] { background-color: #3b82f6 !important; color: #ffffff !important; }
          
          /* Sidebar aside */
          aside { background-color: #1e1e1e !important; border-right-color: #2a2a2a !important; }
          aside * { color: #e5e5e5 !important; }
          aside select, aside input, aside button { background-color: #262626 !important; border-color: #2a2a2a !important; color: #f8fafc !important; }
          
          /* Titles and descriptions */
          h3, h4, .font-hanken-title, .text-slate-800, .text-\\[\\#191B23\\], .text-slate-750 { color: #ffffff !important; }
          p, span, label, .text-slate-500, .text-\\[\\#64748B\\], .text-\\[\\#434655\\], .text-slate-400 { color: #a3a3a3 !important; }
          
          /* Inputs and buttons */
          input, select, textarea { background-color: #262626 !important; color: #f8fafc !important; border-color: #2a2a2a !important; }
          
          /* Highlighted or active states */
          .bg-blue-50, [class*="bg-blue-50"], .bg-blue-100 { background-color: #262626 !important; color: #3b82f6 !important; border-color: #2a2a2a !important; }
          .text-\\[\\#004ac6\\] { color: #3b82f6 !important; }
          .bg-blue-50\\/20, [class*="bg-blue-50/20"] { background-color: rgba(59, 130, 246, 0.15) !important; border-color: #3b82f6 !important; }
          
          /* Specific component patches */
          .min-h-\\[300px\\], .min-h-\\[220px\\] { background-color: #262626 !important; color: #f8fafc !important; }
          .border-slate-200, .border-\\[\\#E2E8F0\\] { border-color: #2a2a2a !important; }
        `}} />
      )}
      {/* Header Banner */}
      <header className="bg-white border-b border-[#E2E8F0] px-8 h-16 flex items-center justify-between sticky top-0 z-50 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <span className="font-hanken-title text-[24px] font-extrabold text-[#004ac6]">Brainzy</span>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">Workspace Sandbox</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Lemma Pod Connected
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all flex items-center justify-center active:scale-95"
            title="Toggle Light/Dark Mode"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <Link href="/" className="text-sm font-bold text-[#64748B] hover:text-[#004ac6] flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-[18px]">home</span> Back to Home
          </Link>
        </div>
      </header>

      {/* Tabs Horizontal Navigation */}
      <div className="bg-white border-b border-[#E2E8F0] px-8 py-3 flex gap-2 overflow-x-auto">
        {(['summary', 'doubtbot', 'flashcards', 'exam', 'timer', 'progress', 'roadmap', 'planner', 'storage'] as const).map((tab) => {
          const labels: Record<string, string> = {
            summary: 'AI Summary',
            doubtbot: 'Doubt Bot',
            flashcards: 'Flashcards',
            exam: 'Practice Exam',
            timer: 'Study Timer',
            progress: 'Progress Tracker',
            roadmap: 'Roadmap',
            planner: 'Planner',
            storage: 'Storage',
          };
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 active:scale-95 ${isActive ? 'bg-[#004ac6] text-white shadow-sm' : 'text-[#64748B] hover:bg-slate-50'}`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Workspace Split Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
        {/* LEFT CONTROL SIDEBAR - ACTIVE DOCUMENT CONTEXT BOX */}
        <aside className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-[#E2E8F0] p-6 flex flex-col gap-6 shrink-0">
          {!['progress', 'timer', 'planner', 'storage'].includes(activeTab) && (
            <div className="space-y-4">
              <div className="bg-[#111827] text-white p-5 rounded-2xl space-y-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
                <h4 className="text-[11px] uppercase tracking-wider font-extrabold text-blue-400">Active Document Context:</h4>
                <div className="relative">
                  <select
                    value={selectedPaper?.id || ''}
                    onChange={(e) => {
                      const paper = papers.find(p => p.id === e.target.value);
                      if (paper) handleSelectPaper(paper);
                    }}
                    className="w-full bg-slate-800 text-white rounded-lg p-2.5 text-xs outline-none border border-slate-700 font-bold focus:ring-1 focus:ring-blue-500 appearance-none pr-8"
                  >
                    {papers.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined text-[16px] text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                </div>
                <div className="relative">
                  <label className="border border-dashed border-slate-700 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-800/50 transition-colors block">
                    <span className="material-symbols-outlined text-[24px] text-blue-400 mb-1">cloud_upload</span>
                    <p className="text-[10px] text-slate-400">Drag &amp; Drop or <span className="text-blue-400 font-bold underline">browse files</span></p>
                    <input
                      type="file"
                      accept=".pdf,.txt"
                      disabled={isUploading}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {uploadMessage && (
                    <div className="mt-2 p-2 bg-slate-800 border border-slate-700 rounded-xl text-[10px] font-bold text-center text-blue-400 animate-pulse">
                      {uploadMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions List depending on Tab */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                    <button onClick={() => setSummaryMode('papers')} className={`py-2 rounded-lg text-center ${summaryMode === 'papers' ? 'bg-white text-[#004ac6] shadow-sm' : 'text-slate-500'}`}>Academic Papers</button>
                    <button onClick={() => setSummaryMode('custom')} className={`py-2 rounded-lg text-center ${summaryMode === 'custom' ? 'bg-white text-[#004ac6] shadow-sm' : 'text-slate-500'}`}>Custom Text Box</button>
                  </div>
                  {summaryMode === 'papers' ? (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select preseeded research:</p>
                      {papers.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleSelectPaper(p)}
                          className={`w-full text-left p-3 rounded-xl border text-xs flex flex-col gap-1 transition-all ${selectedPaper?.id === p.id ? 'border-[#004ac6] bg-blue-50/50 text-[#004ac6]' : 'border-slate-200 hover:bg-slate-50'}`}
                        >
                          <span className="font-bold truncate">{p.title}</span>
                          <span className="text-[9px] text-slate-400 truncate">{p.summary || 'No summary cache'}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      placeholder="Paste your custom study texts here..."
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      className="w-full h-40 p-3 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#004ac6] bg-white resize-none"
                    />
                  )}
                </div>
              )}

              {activeTab === 'doubtbot' && (
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Suggested Quick Queries:</p>
                  <div className="space-y-2 text-left">
                    {[
                      'Synthesize the main argument of this topic.',
                      'Formulate 3 practice questions with explanations.',
                      'Explain this like I am a 10-year-old.',
                      'Break down the critical terms used here.',
                    ].map((q, i) => (
                      <button
                        key={i}
                        onClick={() => { setChatInput(q); }}
                        className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-[#004ac6] hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-all flex items-start gap-2"
                      >
                        <span className="material-symbols-outlined text-[16px] text-blue-500 shrink-0">help_outline</span>
                        <span>{q}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'flashcards' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                    <p className="font-bold text-slate-700">Study Progress</p>
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                      <span>{masteredCount} of {flashcards.length} Mastered</span>
                      <span>{Math.round((masteredCount / (flashcards.length || 1)) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(masteredCount / (flashcards.length || 1)) * 100}%` }}></div>
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateMaterials}
                    disabled={isExtractingFlashcards}
                    className="w-full bg-[#004ac6] text-white py-3 rounded-xl font-bold text-xs hover:opacity-95 disabled:opacity-50 transition-opacity"
                  >
                    {isExtractingFlashcards ? 'Extracting...' : `Extract from "${selectedPaper?.filename || 'Active source'}"`}
                  </button>
                </div>
              )}

              {activeTab === 'exam' && (
                <div className="space-y-4 text-left">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                    <p className="font-bold text-slate-700">Exam Statistics</p>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-white p-2 rounded-lg border border-slate-100">
                        <span className="block text-slate-400 text-[10px] uppercase font-bold">Total Questions</span>
                        <span className="text-sm font-black text-slate-800">{examQuestions.length}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-100">
                        <span className="block text-slate-400 text-[10px] uppercase font-bold">Status</span>
                        <span className="text-xs font-bold text-blue-600">{isExamGraded ? 'Graded' : 'In Progress'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Number of Questions</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={numExamQuestions}
                      onChange={(e) => setNumExamQuestions(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#004ac6] text-slate-800 font-bold"
                    />
                  </div>

                  <button
                    onClick={handleGenerateMaterials}
                    disabled={isGeneratingExam}
                    className="w-full bg-[#004ac6] text-white py-3 rounded-xl font-bold text-xs hover:opacity-95 disabled:opacity-50 transition-opacity"
                  >
                    {isGeneratingExam ? 'Generating...' : `Generate from "${selectedPaper?.filename || 'Active source'}"`}
                  </button>
                </div>
              )}

              {activeTab === 'timer' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                    <p className="font-bold text-slate-700">Streak &amp; Focus Stats</p>
                    <div className="space-y-1 text-[11px] text-[#434655]">
                      <p className="flex justify-between"><span>Completed Sessions:</span> <strong className="text-slate-800">{completedPomodoros}</strong></p>
                      <p className="flex justify-between"><span>Total Focus Minutes:</span> <strong className="text-slate-800">{completedPomodoros * 25} min</strong></p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interval Presets:</p>
                    {[
                      { id: 'focus', label: 'Academic Focus (25m)', sec: 1500 },
                      { id: 'short', label: 'Short Coffee Break (5m)', sec: 300 },
                      { id: 'long', label: 'Extended Recharging (15m)', sec: 900 },
                    ].map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setTimerActive(false);
                          setActivePreset(preset.id as any);
                          setTimerSeconds(preset.sec);
                        }}
                        className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${activePreset === preset.id ? 'border-[#004ac6] bg-blue-50/50 text-[#004ac6]' : 'border-slate-200 hover:bg-slate-50'}`}
                      >
                        <span>{preset.label}</span>
                        {activePreset === preset.id && <span className="w-2 h-2 rounded-full bg-[#004ac6]"></span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'progress' && (
                <div className="space-y-4 text-left">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newTopic.trim()) return;
                      const mins = parseInt(newDuration) || 0;
                      setActivityLogs([
                        ...activityLogs,
                        {
                          id: Date.now(),
                          topic: newTopic,
                          duration: mins,
                          activity: newActivity,
                          date: new Date().toISOString().split('T')[0]
                        }
                      ]);
                      setAccumulatedFocus((prev) => prev + mins);
                      setCompletedActivitiesCount((prev) => prev + 1);
                      setNewTopic('Systems Memory Sleep');
                      setNewDuration('30');
                      alert('Manual session study log added successfully!');
                    }}
                    className="space-y-4 bg-slate-50 p-4 border border-slate-200 rounded-2xl"
                  >
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Log Manual Study Session</p>
                    
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Topic / Subject</label>
                      <input
                        type="text"
                        required
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        placeholder="e.g. Systems Memory Sleep"
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white text-[#191B23] focus:ring-1 focus:ring-[#004ac6]"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Duration (mins)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={newDuration}
                        onChange={(e) => setNewDuration(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white text-[#191B23] focus:ring-1 focus:ring-[#004ac6]"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Activity Type</label>
                      <select
                        value={newActivity}
                        onChange={(e) => setNewActivity(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#004ac6]"
                      >
                        <option>Doubt Bot</option>
                        <option>Flashcards</option>
                        <option>Practice Exam</option>
                        <option>Summary</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#004ac6] hover:opacity-95 text-white font-bold py-2 rounded-lg text-xs transition-opacity"
                    >
                      Log Study Session
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'roadmap' && (
                <div className="space-y-4 text-left">
                  {!roadmapGenerated ? (
                    <>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                        <p className="font-bold text-slate-700">Path Completion Metrics</p>
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                          <span>Milestones Complete:</span>
                          <span className="font-bold">0 of 4</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1 italic">Formulated using John Sweller Schema building guides.</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Generate dynamic path for any topic:</label>
                        <button
                          type="button"
                          disabled={isGeneratingRoadmap}
                          onClick={handleGenerateRoadmap}
                          className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-[#004ac6] hover:bg-slate-55/50 text-[11px] font-bold text-slate-600 transition-all leading-snug disabled:opacity-50"
                        >
                          {isGeneratingRoadmap ? 'Analyzing...' : `Analyze "${selectedPaper?.filename || 'Systems Memory Consolidation in Sleep.txt'}"...`}
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={isGeneratingRoadmap}
                        onClick={handleGenerateRoadmap}
                        className="w-full bg-[#004ac6] text-white py-3 rounded-xl font-bold text-xs hover:opacity-95 transition-opacity disabled:opacity-50"
                      >
                        {isGeneratingRoadmap ? 'Generating Roadmap...' : 'Generate AI Roadmap'}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                        <p className="font-bold text-slate-700">Revision Compliance</p>
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                          <span>Completed Sessions:</span>
                          <span className="font-bold text-[#004ac6]">1 of 3</span>
                        </div>
                        <div className="w-full h-1 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full bg-[#004ac6] w-1/3"></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Schedule Revision Slot</label>
                        <button
                          type="button"
                          onClick={() => alert('Syncing new study records with local revision indexes...')}
                          className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-[#004ac6] hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-all"
                        >
                          Schedule Revision Slot
                        </button>
                        <p className="text-[9px] text-slate-400 italic">Syncs with local session records automatically.</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setRoadmapGenerated(false)}
                        className="w-full border border-[#004ac6] text-[#004ac6] py-2.5 rounded-xl font-bold text-xs hover:bg-blue-50/50 transition-colors"
                      >
                        View Milestones Outline
                      </button>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'planner' && (
                <div className="space-y-4 text-left">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                    <p className="font-bold text-slate-700">Revision Compliance</p>
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                      <span>Completed Sessions:</span>
                      <span className="font-bold text-[#004ac6]">
                        {revisionSlots.filter(s => s.completed).length} of {revisionSlots.length}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-[#004ac6]" style={{ width: `${(revisionSlots.filter(s => s.completed).length / revisionSlots.length) * 100}%` }}></div>
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!slotTitle.trim()) return;
                      setRevisionSlots([
                        ...revisionSlots,
                        {
                          id: Date.now(),
                          subject: slotSubject,
                          priority: slotPriority,
                          title: slotTitle,
                          date: slotDate,
                          time: slotTime,
                          duration: slotDuration,
                          completed: false
                        }
                      ]);
                      setSlotTitle('');
                      alert('Revision slot scheduled successfully!');
                    }}
                    className="space-y-3"
                  >
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Schedule Revision Slot</p>
                    
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Subject</label>
                      <input
                        type="text"
                        required
                        value={slotSubject}
                        onChange={(e) => setSlotSubject(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#004ac6] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Topic / Concept Description</label>
                      <input
                        type="text"
                        required
                        value={slotTitle}
                        onChange={(e) => setSlotTitle(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#004ac6] bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Date</label>
                        <input
                          type="date"
                          required
                          value={slotDate}
                          onChange={(e) => setSlotDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] outline-none focus:ring-1 focus:ring-[#004ac6] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Time</label>
                        <input
                          type="time"
                          required
                          value={slotTime}
                          onChange={(e) => setSlotTime(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] outline-none focus:ring-1 focus:ring-[#004ac6] bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Duration</label>
                        <input
                          type="text"
                          required
                          value={slotDuration}
                          onChange={(e) => setSlotDuration(e.target.value)}
                          placeholder="e.g. 45 min"
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#004ac6] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Priority</label>
                        <select
                          value={slotPriority}
                          onChange={(e) => setSlotPriority(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#004ac6]"
                        >
                          <option>high priority</option>
                          <option>medium priority</option>
                          <option>low priority</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#004ac6] text-white py-2.5 rounded-xl font-bold text-xs hover:opacity-95 transition-opacity"
                    >
                      Schedule Revision Slot
                    </button>
                    <p className="text-[9px] text-slate-400 italic text-center">Syncs with local session records automatically.</p>
                  </form>
                </div>
              )}

              {activeTab === 'storage' && (
                <div className="space-y-4 text-left">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                    <p className="font-bold text-slate-700">Storage Usage Allocation</p>
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                      <span>Capacity Utilized:</span>
                      <span className="font-bold text-[#004ac6]">54 KB / 50,000 KB</span>
                    </div>
                    <div className="w-full h-1 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-[#004ac6] w-[0.11%]"></div>
                    </div>
                    <p className="text-[9px] text-[#64748B] font-bold mt-1 flex justify-between">
                      <span>Secure cloud encryption enabled</span>
                      <span className="text-[#004ac6]">{papers.length} files</span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Create Custom File</p>
                    <div
                      onClick={() => setShowUploadModal(true)}
                      className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:bg-slate-50/50 hover:border-[#004ac6]/40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[32px] text-[#004ac6] mb-2">upload_file</span>
                      <p className="text-xs font-bold text-slate-750">Drag &amp; Drop Syllabus Material Here</p>
                      <p className="text-[9px] text-slate-400 mt-1">Accepts PDF, DOCX, TXT, MD, etc. or click to browse local storage</p>
                    </div>
                    <p className="text-[9px] text-slate-450 text-center font-semibold mt-1">Upload limit is 10MB per active upload sequence.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom generate triggers */}
            {activeTab === 'summary' && (
              <button
                onClick={handleGenerateSummary}
                className="w-full bg-[#004ac6] text-white py-3.5 rounded-xl font-bold text-xs hover:opacity-95 transition-opacity"
              >
                Synthesize Analysis Summary
              </button>
            )}
          </div>
        </aside>

        {/* RIGHT DISPLAY CANVAS PANEL */}
        <main className="flex-1 bg-[#F8FAFC] p-4 md:p-8 overflow-y-auto flex flex-col">
          {/* TAB 1: SUMMARY */}
          {activeTab === 'summary' && (
            <div className="bg-white border border-[#E2E8F0] p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-sm flex-grow flex flex-col justify-between">
              <div className="space-y-6">
                <h3 className="font-hanken-title text-xl font-extrabold text-[#191B23]">Summary Synthesis Content</h3>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 min-h-[300px]">
                  {isGeneratingSummary ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-3">
                      <div className="w-8 h-8 border-4 border-[#004ac6] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs text-slate-500 font-bold">Drafting core details...</p>
                    </div>
                  ) : generatedSummary ? (
                    <p className="text-xs leading-relaxed text-[#434655] whitespace-pre-wrap">{generatedSummary}</p>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400 space-y-2">
                      <span className="material-symbols-outlined text-[36px]">auto_stories</span>
                      <p className="text-xs font-semibold">No Summary Active</p>
                      <p className="text-[10px]">Configure your document inputs on the left pane and generate an academic synthesis to view it here.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOUBT BOT CHAT */}
          {activeTab === 'doubtbot' && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl md:rounded-3xl shadow-sm flex-grow flex flex-col overflow-hidden">
              {/* Header inside chat */}
              <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs font-bold text-slate-700">DOUBT BOT AGENT • LIVE WORKSPACE</span>
                </div>
                <button
                  onClick={() => setMessages([])}
                  className="text-xs text-[#64748B] hover:text-[#004ac6] border border-slate-200 px-3 py-1.5 rounded-lg bg-white"
                >
                  Clear History
                </button>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[300px]">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-3`}>
                    {m.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-[#004ac6] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                      </div>
                    )}
                    {m.thinking ? (
                      <div className="bg-slate-100 px-3 py-2 rounded-full flex gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      </div>
                    ) : (
                      <div className={`p-4 rounded-2xl max-w-[80%] text-xs leading-relaxed ${m.role === 'user' ? 'bg-[#004ac6] text-white rounded-tr-none' : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'}`}>
                        {m.text}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef}></div>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendChat} className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask any complex academic question here..."
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary bg-white text-[#191B23]"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="bg-[#004ac6] text-white hover:opacity-95 px-5 rounded-xl text-xs font-bold disabled:opacity-50 transition-opacity"
                >
                  Send
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: FLASHCARDS */}
          {activeTab === 'flashcards' && (
            <div className="bg-white border border-[#E2E8F0] p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-sm flex-grow flex flex-col justify-between">
              {flashcards.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <span className="material-symbols-outlined text-[64px] text-slate-300">style</span>
                  <h4 className="font-bold text-sm">No Flashcards loaded</h4>
                  <p className="text-xs text-slate-500">Click "Extract from source" in the left panel to generate flashcard study decks.</p>
                </div>
              ) : (
                <div className="space-y-8 flex flex-col items-center">
                  <div className="w-full flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-bold">Card {currentCardIndex + 1} of {flashcards.length}</span>
                    <button
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="border border-[#E2E8F0] hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                    >
                      Flip to reveal
                    </button>
                  </div>

                  {/* Flipped Container Card */}
                  <div className="w-full max-w-lg min-h-[220px] bg-slate-50 border border-slate-200 p-4 md:p-8 rounded-2xl md:rounded-3xl flex items-center justify-center text-center shadow-sm relative overflow-hidden transition-all duration-300">
                    <div className="absolute top-2 left-2 text-[9px] uppercase tracking-wider font-extrabold text-[#004ac6]/60">
                      {isFlipped ? 'Answer View' : 'Active Recall Prompt'}
                    </div>
                    <p className="text-lg font-bold text-[#191B23] leading-relaxed">
                      {isFlipped ? flashcards[currentCardIndex].answer : flashcards[currentCardIndex].question}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setIsFlipped(false);
                        setCurrentCardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
                      }}
                      className="border border-[#E2E8F0] hover:bg-slate-50 p-2.5 rounded-xl transition-all"
                    >
                      <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                    </button>
                    <button
                      onClick={() => {
                        // Mark mastered
                        const updated = [...flashcards];
                        updated[currentCardIndex].mastered = true;
                        setFlashcards(updated);
                        setMasteredCount(updated.filter(fc => fc.mastered).length);
                        alert('Card marked as Mastered!');
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs"
                    >
                      Mark Mastered
                    </button>
                    <button
                      onClick={() => {
                        setIsFlipped(false);
                        setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
                      }}
                      className="border border-[#E2E8F0] hover:bg-slate-50 p-2.5 rounded-xl transition-all"
                    >
                      <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PRACTICE EXAM */}
          {activeTab === 'exam' && (
            <div className="bg-white border border-[#E2E8F0] p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-sm flex-grow flex flex-col justify-between text-left">
              {examQuestions.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <span className="material-symbols-outlined text-[64px] text-slate-300">quiz</span>
                  <h4 className="font-bold text-sm">No Practice Questions Loaded</h4>
                  <p className="text-xs text-slate-500">Click "Generate from source" in the left panel to load practice exams.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <span className="text-[10px] uppercase font-extrabold text-[#004ac6] bg-blue-50 px-2.5 py-1 rounded-full">
                      Active Practice Mode: Retrieval Practice Theory.
                    </span>
                    {isExamGraded && (
                      <span className="text-[11px] font-bold text-slate-400">
                        Completed retrieval session
                      </span>
                    )}
                  </div>
                  {examQuestions.map((q, index) => (
                    <div key={q.id} className="border border-slate-200 rounded-2xl p-5 space-y-3 bg-white shadow-sm text-left">
                      <span className="bg-slate-100 text-[#004ac6] px-2 py-0.5 rounded text-[10px] font-bold">QUESTION {index + 1}</span>
                      <h4 className="font-bold text-xs text-slate-800 leading-snug">{q.question}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedExamAnswers[q.id] === opt;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => {
                                if (isExamGraded) return;
                                setSelectedExamAnswers({ ...selectedExamAnswers, [q.id]: opt });
                              }}
                              className={`p-3 border rounded-xl text-left text-xs font-semibold flex items-center gap-2 transition-all ${isSelected ? 'border-[#004ac6] bg-blue-50/50 text-[#004ac6]' : 'border-slate-200 hover:bg-slate-50'}`}
                            >
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-[#004ac6] bg-[#004ac6]' : 'border-slate-300'}`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                              </div>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                    {isExamGraded ? (
                      <span className="bg-emerald-50 text-emerald-700 font-bold px-6 py-2.5 rounded-xl border border-emerald-200 text-xs">
                        Grade: {examScore} / {examQuestions.length} Correct Answers
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          let score = 0;
                          examQuestions.forEach(q => {
                            const ans = selectedExamAnswers[q.id];
                            if (ans && (ans.trim().toLowerCase() === q.correct_answer.trim().toLowerCase() || ans.trim().toLowerCase().startsWith(q.correct_answer.trim().toLowerCase()))) {
                              score++;
                            }
                          });
                          setExamScore(score);
                          setIsExamGraded(true);
                          alert(`Exam graded! Your score is ${score} of ${examQuestions.length}`);
                        }}
                        className="bg-[#004ac6] text-white font-bold px-6 py-2.5 rounded-xl text-xs hover:opacity-95"
                      >
                        Submit &amp; Grade Exam
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: STUDY TIMER */}
          {activeTab === 'timer' && (
            <div className="bg-white border border-[#E2E8F0] p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-sm flex-grow flex flex-col justify-center items-center">
              <div className="space-y-6 text-center">
                {/* Circular timer dial */}
                <div className="w-52 h-52 rounded-full border-8 border-primary/20 flex flex-col items-center justify-center mx-auto bg-white shadow-md relative">
                  <span className="text-4xl font-black text-[#0b1c30]">
                    {formatTimerTime(timerSeconds)}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">
                    {timerActive ? 'Active Focus' : 'Paused'}
                  </span>
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setTimerActive(false);
                      setTimerSeconds(activePreset === 'focus' ? 1500 : activePreset === 'short' ? 300 : 900);
                    }}
                    className="p-3 border border-slate-200 hover:bg-slate-50 rounded-full flex items-center justify-center shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[20px] text-slate-500">replay</span>
                  </button>

                  <button
                    onClick={() => setTimerActive(!timerActive)}
                    className="bg-[#004ac6] hover:opacity-95 text-white font-bold px-8 py-3 rounded-full text-xs shadow-sm flex items-center gap-2 transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">{timerActive ? 'pause' : 'play_arrow'}</span>
                    <span>{timerActive ? 'Pause Session' : 'Begin Interval'}</span>
                  </button>
                </div>

                <div className="flex gap-2 justify-center pt-2">
                  <button
                    onClick={() => setTimerSeconds(prev => prev + 60)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-55 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1 text-slate-600"
                    title="Add 1 minute to session"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span> 1 Min
                  </button>
                  <button
                    onClick={() => setTimerSeconds(prev => prev + 300)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-55 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1 text-slate-600"
                    title="Add 5 minutes to session"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span> 5 Min
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PROGRESS TRACKER */}
          {activeTab === 'progress' && (
            <div className="bg-white border border-[#E2E8F0] p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-sm flex-grow space-y-8 text-left">
              <div>
                <h3 className="font-hanken-title text-xl font-extrabold text-[#191B23]">Visual Performance Analysis</h3>
                <p className="text-xs text-[#64748B] mt-1">Track focused study sessions, completed exercises, and active retention milestones.</p>
              </div>

              {/* Three Stat Cards matching request */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[#64748B] text-[10px] uppercase tracking-wider font-extrabold block">Accumulated Focus</span>
                  <p className="text-3xl font-black text-[#004ac6] mt-2">{accumulatedFocus} min</p>
                  <p className="text-[11px] text-slate-500 mt-1">Across all productivity tools</p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[#64748B] text-[10px] uppercase tracking-wider font-extrabold block">Completed Activities</span>
                  <p className="text-3xl font-black text-slate-800 mt-2">{completedActivitiesCount} modules</p>
                  <p className="text-[11px] text-slate-500 mt-1">Summaries, exams, &amp; flashcards</p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[#64748B] text-[10px] uppercase tracking-wider font-extrabold block">Current Study Streak</span>
                  <p className="text-3xl font-black text-emerald-600 mt-2">{studyStreakCount} days</p>
                  <p className="text-[11px] text-slate-500 mt-1">Active review session daily</p>
                </div>
              </div>

              {/* Visual Performance Analysis SVG Graph */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-xs text-slate-700 mb-4">Study Distribution Analysis (M - S)</h4>
                <div className="h-40 w-full flex items-end justify-between px-4 pb-2 border-b border-slate-300">
                  {[
                    { day: 'Mon', mins: 45 },
                    { day: 'Tue', mins: 25 },
                    { day: 'Wed', mins: 60 },
                    { day: 'Thu', mins: 30 },
                    { day: 'Fri', mins: 50 },
                    { day: 'Sat', mins: 20 },
                    { day: 'Sun', mins: 20 },
                  ].map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 flex-grow">
                      <div className="w-8 bg-[#004ac6] hover:bg-blue-600 rounded-t transition-all" style={{ height: `${(d.mins / 70) * 120}px` }}></div>
                      <span className="text-[10px] font-bold text-slate-500">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form & Log List split */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                {/* Log List: Academic Session Activity Log */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-[#191B23]">Academic Session Activity Log</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center text-xs shadow-sm hover:shadow-md transition-shadow">
                        <div>
                          <p className="font-bold text-slate-800">{log.topic}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-bold">{log.date} | {log.activity}</p>
                        </div>
                        <span className="bg-blue-100 text-[#004ac6] px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0">
                          {log.duration} mins
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: ROADMAP */}
          {activeTab === 'roadmap' && (
            <div className="bg-white border border-[#E2E8F0] p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-sm flex-grow space-y-6 text-left">
              {!roadmapGenerated ? (
                <>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-[#004ac6] bg-blue-50 px-2.5 py-1 rounded-full">Active Curriculum Outline</span>
                    <h3 className="font-hanken-title text-xl font-extrabold text-[#191B23] mt-3">Neuroscience Sleep Memory Consolidation</h3>
                    <p className="text-xs text-[#64748B] mt-2 leading-relaxed max-w-2xl">
                      A mathematically structured academic trajectory designed to take you from foundational basics to fluent synthesis and implementation.
                    </p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    {roadmapMilestones.map((m) => (
                      <div key={m.num} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 hover:shadow-sm transition-all">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#004ac6] flex items-center justify-center font-black text-sm shrink-0">
                          {m.num}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-xs text-slate-800">{m.title}</h4>
                            <span className="bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">{m.duration}</span>
                          </div>
                          <p className="text-[11px] text-[#434655] leading-relaxed">{m.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">✓ Generated Learning Roadmap</span>
                    <h3 className="font-hanken-title text-xl font-extrabold text-[#191B23] mt-3">Syllabus Path Milestones</h3>
                    <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                      Custom structural milestones designed dynamically by Gemini context parsing.
                    </p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100 animate-in slide-in-from-bottom duration-300">
                    {roadmapMilestones.map((m) => (
                      <div key={m.num} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 hover:shadow-sm transition-all">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#004ac6] flex items-center justify-center font-black text-sm shrink-0">
                          {m.num}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-xs text-slate-800">{m.title}</h4>
                            <span className="bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">{m.duration}</span>
                          </div>
                          <p className="text-[11px] text-[#434655] leading-relaxed">{m.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

            </div>
          )}

          {/* TAB 8: PLANNER */}
          {activeTab === 'planner' && (
            <div className="bg-white border border-[#E2E8F0] p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-sm flex-grow space-y-6 text-left">
              <div>
                <span className="text-[10px] uppercase font-extrabold text-[#004ac6] bg-blue-50 px-2.5 py-1 rounded-full">Active Revision Itinerary</span>
                <h3 className="font-hanken-title text-xl font-extrabold text-[#191B23] mt-3">Scheduled Study Slots</h3>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  Your customized academic slots synchronized across registered local syllabus references.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                {revisionSlots.map((slot) => {
                  const getPriorityStyles = (prio: string) => {
                    if (prio === 'high priority') return 'bg-red-55/70 text-red-800 border-red-200';
                    if (prio === 'medium priority') return 'bg-amber-55/70 text-amber-800 border-amber-200';
                    return 'bg-blue-55/70 text-blue-800 border-blue-200';
                  };
                  return (
                    <div key={slot.id} className={`border border-slate-200 rounded-2xl p-5 hover:shadow-sm transition-all flex flex-col md:flex-row justify-between md:items-center gap-4 ${slot.completed ? 'bg-slate-50/50 opacity-60' : 'bg-white'}`}>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="checkbox"
                            checked={slot.completed}
                            onChange={() => {
                              setRevisionSlots(revisionSlots.map(s => s.id === slot.id ? { ...s, completed: !s.completed } : s));
                            }}
                            className="w-4 h-4 text-[#004ac6] border-slate-350 rounded focus:ring-[#004ac6]"
                          />
                          <span className={`text-xs font-black ${slot.completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>{slot.subject}</span>
                          <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border ${getPriorityStyles(slot.priority)}`}>
                            {slot.priority}
                          </span>
                        </div>
                        <p className={`text-xs font-bold ${slot.completed ? 'line-through text-slate-500' : 'text-[#191B23]'}`}>{slot.title}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#64748B] shrink-0 font-semibold bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-blue-500">calendar_today</span>
                          <span>{slot.date}</span>
                        </div>
                        <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                          <span className="material-symbols-outlined text-[16px] text-blue-500">schedule</span>
                          <span>{slot.time}</span>
                        </div>
                        <div className="flex items-center gap-1 border-l border-slate-200 pl-3 text-[#004ac6] font-bold">
                          <span>{slot.duration}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setRevisionSlots(revisionSlots.filter(s => s.id !== slot.id));
                          }}
                          className="border-l border-slate-200 pl-3 text-red-500 hover:text-red-700 font-bold material-symbols-outlined text-[16px] active:scale-95 transition-all"
                        >
                          delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 9: STORAGE */}
          {activeTab === 'storage' && (
            <div className="bg-white border border-[#E2E8F0] p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-sm flex-grow space-y-6 text-left flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h3 className="font-hanken-title text-xl font-extrabold text-[#191B23]">Academic Inventory</h3>
                  <p className="text-xs text-[#64748B] mt-1">Grounding syllabus resources available for AI tutoring operations.</p>
                </div>

                <div className="space-y-3">
                  {papers.map((p) => {
                    const isSelected = selectedPaper?.id === p.id;
                    const getExtAndSize = (filename: string) => {
                      const ext = filename.split('.').pop()?.toUpperCase() || 'TXT';
                      let size = '12 KB';
                      if (ext === 'PDF') size = '18 KB';
                      if (ext === 'DOCX') size = '24 KB';
                      return { ext, size };
                    };
                    const { ext, size } = getExtAndSize(p.filename);
                    return (
                      <div key={p.id} className={`p-4 border rounded-2xl flex justify-between items-center transition-all ${isSelected ? 'border-[#004ac6] bg-blue-50/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <div className="space-y-1">
                          <p className="font-bold text-xs text-slate-800">{p.title}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{size} • {ext}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleSelectPaper(p)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${isSelected ? 'bg-[#004ac6] text-white shadow-sm' : 'border border-[#E2E8F0] bg-white text-slate-700 hover:bg-slate-50'}`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </button>
                          <button
                            onClick={() => handleDeletePaper(p.id, p.title)}
                            className="text-red-500 hover:text-red-700 font-bold material-symbols-outlined text-[18px] active:scale-95"
                          >
                            delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 text-center">
                <p className="text-[10px] font-bold text-[#64748B] flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-blue-500">info</span>
                  Select a paper to automatically propagate context to summarize, chat, exams and paths.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Upload/Reference Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-[450px] shadow-xl border border-[#E2E8F0]">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-hanken-title text-[18px] font-bold text-[#0b1c30]">Add Custom Paper Reference</h3>
              <button onClick={() => setShowUploadModal(false)} className="material-symbols-outlined text-slate-400 hover:text-slate-600">close</button>
            </div>
            <form onSubmit={handleAddReviewReference} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1">Paper Title</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Cognitive Load Theory"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#004ac6] outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Filename</label>
                <input
                  type="text"
                  required
                  value={uploadFilename}
                  onChange={(e) => setUploadFilename(e.target.value)}
                  placeholder="e.g. Cognitive_Load.pdf"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#004ac6] outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Storage Path (optional)</label>
                <input
                  type="text"
                  value={uploadPath}
                  onChange={(e) => setUploadPath(e.target.value)}
                  placeholder="e.g. /knowledge/Cognitive_Load.pdf"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#004ac6] outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-[#434655]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#004ac6] text-white rounded-xl hover:opacity-90"
                >
                  Save Reference
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

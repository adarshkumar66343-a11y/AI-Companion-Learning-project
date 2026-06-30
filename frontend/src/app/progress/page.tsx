'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Paper {
  id: string;
  title: string;
  filename: string;
  summary: string;
}

export default function ProgressTrackerPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [plannerTasks, setPlannerTasks] = useState([
    { id: 1, text: 'Review Neural Networks', checked: true },
    { id: 2, text: 'Complete Flashcards (50)', checked: true },
    { id: 3, text: 'Draft Research Summary', checked: false },
    { id: 4, text: 'Practice Exam: Module 3', checked: false },
  ]);
  const [streak, setStreak] = useState(12);
  const [avgScore, setAvgScore] = useState(88.5);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    // Fetch papers to get true subject list
    async function loadData() {
      try {
        const res = await fetch('/api/lemma');
        const data = await res.json();
        if (data.papers) {
          setPapers(data.papers);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadData();

    // Load custom planner items if saved in local storage
    const storedTasks = localStorage.getItem('BrainzyPlannerTasks');
    if (storedTasks) {
      try {
        setPlannerTasks(JSON.parse(storedTasks));
      } catch (e) {}
    }
  }, []);

  const toggleTask = (id: number) => {
    const updated = plannerTasks.map(t => t.id === id ? { ...t, checked: !t.checked } : t);
    setPlannerTasks(updated);
    localStorage.setItem('BrainzyPlannerTasks', JSON.stringify(updated));
  };

  const addTask = () => {
    const text = prompt('Enter a new study task:');
    if (!text) return;
    const newTask = {
      id: Date.now(),
      text,
      checked: false
    };
    const updated = [...plannerTasks, newTask];
    setPlannerTasks(updated);
    localStorage.setItem('BrainzyPlannerTasks', JSON.stringify(updated));
  };

  // Calculate stats based on checked planner tasks
  const completedCount = plannerTasks.filter(t => t.checked).length;
  const plannerProgressPercent = plannerTasks.length > 0 
    ? Math.round((completedCount / plannerTasks.length) * 100) 
    : 0;

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] font-sans min-h-screen selection:bg-primary/20 flex flex-col">
      {/* TopNavBar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E2E8F0]">
        <div className="flex justify-between items-center w-full px-6 md:px-10 h-16 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-hanken-title text-[24px] font-extrabold text-[#004ac6]">Brainzy</Link>
          </div>
          <nav className="hidden md:flex gap-8">
            <Link href="/app" className="text-sm font-semibold text-[#434655] hover:text-[#004ac6] transition-colors">AI Summary</Link>
            <Link href="/app" className="text-sm font-semibold text-[#434655] hover:text-[#004ac6] transition-colors">Doubt Bot</Link>
            <Link href="/app" className="text-sm font-semibold text-[#434655] hover:text-[#004ac6] transition-colors">Flashcards</Link>
             <Link href="/progress" className="text-sm font-bold text-[#004ac6] border-b-2 border-[#004ac6] pb-1">Progress Tracker</Link>
             <Link href="/flowchart" className="text-sm font-semibold text-[#434655] hover:text-[#004ac6] transition-colors">Flowchart View</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/app" className="bg-[#004ac6] text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:shadow-md hover:opacity-95 transition-all">
              Launch Workspace
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <aside className="fixed left-0 top-16 bottom-0 w-64 flex flex-col p-6 z-40 bg-slate-50 border-r border-[#E2E8F0] hidden lg:flex">
          <div className="flex flex-col gap-2 mb-8">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 rounded-lg bg-[#004ac6]/10 text-[#004ac6] flex items-center justify-center">
                <span className="material-symbols-outlined">workspaces</span>
              </div>
              <div>
                <p className="font-bold text-sm leading-tight text-[#191B23]">Workspace Alpha</p>
                <p className="text-xs text-[#64748B]">Academic Research</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 flex flex-col gap-1">
            <Link href="/app" className="text-[#434655] flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 rounded-lg transition-all text-sm font-semibold">
              <span className="material-symbols-outlined text-[20px]">description</span>
              <span>Sources</span>
            </Link>
            <Link href="/progress" className="bg-slate-100 text-[#004ac6] flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-bold">
              <span className="material-symbols-outlined text-[20px]">analytics</span>
              <span>Progress Tracker</span>
            </Link>
            <Link href="/app" className="text-[#434655] flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 rounded-lg transition-all text-sm font-semibold">
              <span className="material-symbols-outlined text-[20px]">history</span>
              <span>Recent sessions</span>
            </Link>
          </nav>
        </aside>

        {/* Main Canvas */}
        <main className="flex-1 p-6 md:p-10 lg:ml-64 max-w-[1200px] mx-auto w-full space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="font-hanken-title text-[32px] font-extrabold text-[#191B23]">Progress Tracker</h1>
              <p className="text-[#64748B] text-sm">Analyze your learning velocity and subject mastery with local Lemma records.</p>
            </div>
            <div className="bg-slate-200/60 p-1 rounded-xl flex gap-1 text-xs font-bold">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'daily' ? 'bg-white text-[#004ac6] shadow-sm' : 'text-[#64748B] hover:text-[#191B23]'}`}
              >
                Daily
              </button>
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'weekly' ? 'bg-white text-[#004ac6] shadow-sm' : 'text-[#64748B] hover:text-[#191B23]'}`}
              >
                Weekly
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'monthly' ? 'bg-white text-[#004ac6] shadow-sm' : 'text-[#64748B] hover:text-[#191B23]'}`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Daily Mode Visuals */}
          {viewMode === 'daily' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Daily Planner Card */}
              <div className="md:col-span-5 bg-white border border-[#E2E8F0] p-6 rounded-2xl flex flex-col shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-[#191B23]">Daily Planner</h3>
                  <span className="text-[#004ac6] material-symbols-outlined">calendar_today</span>
                </div>
                <div className="flex-1 flex flex-col gap-3 mb-6">
                  {plannerTasks.map((task) => (
                    <label key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={task.checked}
                        onChange={() => toggleTask(task.id)}
                        className="w-4 h-4 text-[#004ac6] border-slate-300 rounded focus:ring-[#004ac6]"
                      />
                      <span className={`text-sm ${task.checked ? 'line-through opacity-50' : 'text-[#434655] font-medium'}`}>
                        {task.text}
                      </span>
                    </label>
                  ))}
                </div>
                <button 
                  onClick={addTask}
                  className="w-full bg-[#004ac6]/10 text-[#004ac6] hover:bg-[#004ac6]/20 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 mb-4"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span> Add Task
                </button>
                <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-200"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#004ac6]"
                        strokeDasharray={`${plannerProgressPercent}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute font-bold text-sm text-[#004ac6]">
                      {plannerProgressPercent}%
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Completed Today</p>
                    <p className="text-xl font-extrabold text-[#191B23]">{completedCount} / {plannerTasks.length}</p>
                  </div>
                </div>
              </div>

              {/* Day's Quick insights */}
              <div className="md:col-span-7 bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg text-[#191B23] mb-2">Today's Focus Activity</h3>
                  <p className="text-sm text-[#64748B]">You have focused for 4.2 hours today. Keep going to reach your daily goal of 6 hours.</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#FAF8FF] p-4 rounded-xl border border-[#E2E8F0] text-center">
                    <p className="text-xs text-[#64748B] font-bold mb-1">Doubt Bot Chat</p>
                    <p className="text-xl font-extrabold text-[#004ac6]">1.8h</p>
                  </div>
                  <div className="bg-[#FAF8FF] p-4 rounded-xl border border-[#E2E8F0] text-center">
                    <p className="text-xs text-[#64748B] font-bold mb-1">Flashcards</p>
                    <p className="text-xl font-extrabold text-[#004ac6]">1.5h</p>
                  </div>
                  <div className="bg-[#FAF8FF] p-4 rounded-xl border border-[#E2E8F0] text-center">
                    <p className="text-xs text-[#64748B] font-bold mb-1">Mock Exams</p>
                    <p className="text-xl font-extrabold text-[#004ac6]">0.9h</p>
                  </div>
                </div>
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 flex items-center gap-3 text-sm">
                  <span className="material-symbols-outlined text-[20px]">emoji_events</span>
                  <span><strong>Optimal Focus Streak:</strong> You are studying 15% faster during evening sessions today.</span>
                </div>
              </div>
            </div>
          )}

          {/* Weekly Mode Visuals */}
          {viewMode === 'weekly' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Weekly Engagement Chart */}
              <div className="md:col-span-8 bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-lg text-[#191B23] mb-6">Weekly Engagement</h3>
                <div className="relative h-64 flex flex-col justify-between">
                  <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-[#64748B] pointer-events-none">
                    <div className="flex items-center gap-4 w-full"><span className="w-6 text-right">8h</span><div className="flex-1 border-t border-slate-100"></div></div>
                    <div className="flex items-center gap-4 w-full"><span className="w-6 text-right">6h</span><div className="flex-1 border-t border-slate-100"></div></div>
                    <div className="flex items-center gap-4 w-full"><span className="w-6 text-right">4h</span><div className="flex-1 border-t border-slate-100"></div></div>
                    <div className="flex items-center gap-4 w-full"><span className="w-6 text-right">2h</span><div className="flex-1 border-t border-slate-100"></div></div>
                    <div className="flex items-center gap-4 w-full"><span className="w-6 text-right">0</span><div className="flex-1 border-t border-slate-200"></div></div>
                  </div>
                  <div className="absolute inset-0 left-10 flex items-end justify-between px-4 pb-1">
                    {[
                      { day: 'Mon', hrs: 4.5, pct: '56%' },
                      { day: 'Tue', hrs: 6.2, pct: '77%' },
                      { day: 'Wed', hrs: 3.1, pct: '38%' },
                      { day: 'Thu', hrs: 7.0, pct: '87%' },
                      { day: 'Fri', hrs: 5.2, pct: '65%' },
                      { day: 'Sat', hrs: 2.1, pct: '26%' },
                      { day: 'Sun', hrs: 1.5, pct: '18%' }
                    ].map((b, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                        <div className="absolute -top-6 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow transition-opacity">
                          {b.hrs}h
                        </div>
                        <div className="w-8 bg-[#004ac6] hover:bg-[#004ac6]/80 rounded-t-lg transition-all cursor-pointer" style={{ height: b.pct }}></div>
                        <span className="text-[10px] text-[#64748B] mt-2 font-bold">{b.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Weekly stats summary */}
              <div className="md:col-span-4 bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg text-[#191B23] mb-4">Weekly Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm text-[#64748B]">Total Hours Studied</span>
                      <span className="text-sm font-bold text-[#191B23]">29.6h</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm text-[#64748B]">Daily Average</span>
                      <span className="text-sm font-bold text-[#191B23]">4.22h / day</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-[#64748B]">Completion Rate</span>
                      <span className="text-sm font-bold text-[#004ac6]">84.2%</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 text-[#004ac6] rounded-xl border border-blue-100 text-xs font-semibold">
                  You spent 5 hours more on reading papers compared to last week.
                </div>
              </div>
            </div>
          )}

          {/* Monthly Mode Visuals */}
          {viewMode === 'monthly' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Monthly grid */}
              <div className="md:col-span-7 bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-lg text-[#191B23] mb-6">Monthly Consistency</h3>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 31 }).map((_, idx) => {
                    const intensities = ['bg-primary/10', 'bg-primary/40', 'bg-primary/20', 'bg-primary/60', 'bg-primary/80', 'bg-primary', 'bg-primary/20'];
                    const colorClass = intensities[idx % intensities.length];
                    return (
                      <div key={idx} className={`h-8 rounded ${colorClass} hover:opacity-80 transition-all cursor-pointer`} title={`Day ${idx+1}`}></div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-end gap-2 mt-6">
                  <span className="text-xs text-[#64748B]">Less</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-sm bg-primary/10"></div>
                    <div className="w-3 h-3 rounded-sm bg-primary/40"></div>
                    <div className="w-3 h-3 rounded-sm bg-primary/70"></div>
                    <div className="w-3 h-3 rounded-sm bg-primary"></div>
                  </div>
                  <span className="text-xs text-[#64748B]">More</span>
                </div>
              </div>

              {/* Monthly line graph */}
              <div className="md:col-span-5 bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg text-[#191B23] mb-4">Monthly Growth</h3>
                  <div className="h-32 relative flex items-center justify-center overflow-hidden">
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 200">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3"></stop>
                          <stop offset="100%" stopColor="#2563eb" stopOpacity="0"></stop>
                        </linearGradient>
                      </defs>
                      <path d="M0 180 Q 50 160, 100 140 T 200 100 T 300 60 T 400 20 L 400 200 L 0 200 Z" fill="url(#chartGradient)"></path>
                      <path d="M0 180 Q 50 160, 100 140 T 200 100 T 300 60 T 400 20" fill="none" stroke="#2563eb" strokeLinecap="round" strokeWidth="3"></path>
                      <circle cx="100" cy="140" fill="white" r="4" stroke="#2563eb" strokeWidth="2"></circle>
                      <circle cx="200" cy="100" fill="white" r="4" stroke="#2563eb" strokeWidth="2"></circle>
                      <circle cx="300" cy="60" fill="white" r="4" stroke="#2563eb" strokeWidth="2"></circle>
                    </svg>
                  </div>
                  <div className="flex justify-between text-[10px] text-[#64748B] font-bold mt-2">
                    <span>Week 1</span>
                    <span>Week 2</span>
                    <span>Week 3</span>
                    <span>Week 4</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-50/50 rounded-xl text-center text-xs font-bold text-[#004ac6] border border-blue-100">
                  +24 Concepts Mastered This Month
                </div>
              </div>
            </div>
          )}

          {/* Unified Subject Mastery Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Daily Planner Card */}
            <div className="md:col-span-4 bg-white border border-[#E2E8F0] p-6 rounded-2xl flex flex-col shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-[#191B23]">Daily Planner</h3>
                <span className="text-[#004ac6] material-symbols-outlined">calendar_today</span>
              </div>
              <div className="flex-1 flex flex-col gap-3 mb-6">
                {plannerTasks.map((task) => (
                  <label key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={task.checked}
                      onChange={() => toggleTask(task.id)}
                      className="w-4 h-4 text-[#004ac6] border-slate-300 rounded focus:ring-[#004ac6]"
                    />
                    <span className={`text-sm ${task.checked ? 'line-through opacity-50' : 'text-[#434655] font-medium'}`}>
                      {task.text}
                    </span>
                  </label>
                ))}
              </div>
              <button 
                onClick={addTask}
                className="w-full bg-[#004ac6]/10 text-[#004ac6] hover:bg-[#004ac6]/20 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 mb-4"
              >
                <span className="material-symbols-outlined text-[16px]">add</span> Add Task
              </button>
              <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#004ac6]"
                      strokeDasharray={`${plannerProgressPercent}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute font-bold text-sm text-[#004ac6]">
                    {plannerProgressPercent}%
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Completed Today</p>
                  <p className="text-xl font-extrabold text-[#191B23]">{completedCount} / {plannerTasks.length}</p>
                </div>
              </div>
            </div>

            {/* Weekly Engagement Chart */}
            <div className="md:col-span-8 bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm">
              <h3 className="font-bold text-lg text-[#191B23] mb-6">Weekly Engagement</h3>
              <div className="relative h-64 flex flex-col justify-between">
                {/* Horizontal grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-[#64748B] pointer-events-none">
                  <div className="flex items-center gap-4 w-full"><span className="w-6 text-right">8h</span><div className="flex-1 border-t border-slate-100"></div></div>
                  <div className="flex items-center gap-4 w-full"><span className="w-6 text-right">6h</span><div className="flex-1 border-t border-slate-100"></div></div>
                  <div className="flex items-center gap-4 w-full"><span className="w-6 text-right">4h</span><div className="flex-1 border-t border-slate-100"></div></div>
                  <div className="flex items-center gap-4 w-full"><span className="w-6 text-right">2h</span><div className="flex-1 border-t border-slate-100"></div></div>
                  <div className="flex items-center gap-4 w-full"><span className="w-6 text-right">0</span><div className="flex-1 border-t border-slate-200"></div></div>
                </div>
                {/* Bars */}
                <div className="absolute inset-0 left-10 flex items-end justify-between px-4 pb-1">
                  {[
                    { day: 'Mon', hrs: 4.5, pct: '56%' },
                    { day: 'Tue', hrs: 6.2, pct: '77%' },
                    { day: 'Wed', hrs: 3.1, pct: '38%' },
                    { day: 'Thu', hrs: 7.0, pct: '87%' },
                    { day: 'Fri', hrs: 5.2, pct: '65%' },
                    { day: 'Sat', hrs: 2.1, pct: '26%' },
                    { day: 'Sun', hrs: 1.5, pct: '18%' }
                  ].map((b, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      <div className="absolute -top-6 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow transition-opacity">
                        {b.hrs}h
                      </div>
                      <div className="w-8 bg-[#004ac6] hover:bg-[#004ac6]/80 rounded-t-lg transition-all cursor-pointer" style={{ height: b.pct }}></div>
                      <span className="text-[10px] text-[#64748B] mt-2 font-bold">{b.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Subject Mastery list */}
            <div className="md:col-span-7 bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm">
              <h3 className="font-bold text-lg text-[#191B23] mb-6">Subject Mastery</h3>
              <div className="space-y-6">
                {papers.length > 0 ? (
                  papers.map((paper, idx) => {
                    const progressVal = [92, 78, 64, 45][idx % 4] || 50;
                    return (
                      <div key={paper.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#191B23] font-semibold">{paper.title}</span>
                          <span className="text-[#004ac6] font-bold">{progressVal}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#004ac6] rounded-full transition-all duration-500" style={{ width: `${progressVal}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#191B23] font-semibold">Cognitive Load Theory</span>
                        <span className="text-[#004ac6] font-bold">92%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#004ac6] rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#191B23] font-semibold">Systems Memory Consolidation</span>
                        <span className="text-[#004ac6] font-bold">78%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#004ac6] rounded-full" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Stats Sidebar */}
            <div className="md:col-span-5 flex flex-col gap-6">
              <div className="bg-[#004ac6] text-white p-6 rounded-2xl shadow-md">
                <p className="text-xs font-bold uppercase tracking-wider opacity-75 mb-1">Current Streak</p>
                <div className="flex items-end gap-2">
                  <h2 className="text-4xl font-extrabold leading-none">{streak}</h2>
                  <span className="text-sm font-semibold mb-1">Days Focus Streak</span>
                </div>
                <div className="mt-4 flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-white opacity-40"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-white opacity-40"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-white opacity-40"></div>
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[#004ac6] flex items-center justify-center">
                    <span className="material-symbols-outlined">auto_stories</span>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] font-semibold">Total Mastered</p>
                    <p className="text-lg font-extrabold text-[#191B23]">148 Units</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[#004ac6] flex items-center justify-center">
                    <span className="material-symbols-outlined">grade</span>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] font-semibold">Avg. Quiz Score</p>
                    <p className="text-lg font-extrabold text-[#191B23]">{avgScore}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

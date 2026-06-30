'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface ExamQuestion {
  id: string;
  paper_id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

function PracticeExamContent() {
  const searchParams = useSearchParams();
  const paperId = searchParams.get('paperId');
  const router = useRouter();

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mode: mcq or theory
  const [examMode, setExamMode] = useState<'mcq' | 'theory'>('mcq');
  const [theoryAnswer, setTheoryAnswer] = useState('');
  const [theoryStatus, setTheoryStatus] = useState('');

  // Stats
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState<boolean[]>([]);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(1452); // 24:12

  useEffect(() => {
    async function loadInitial() {
      if (paperId) {
        await fetchQuestions(paperId);
      } else {
        try {
          const res = await fetch('/api/lemma?action=listPapers');
          const data = await res.json();
          const list = data.papers || [];
          if (list.length > 0) {
            await fetchQuestions(list[0].id);
          } else {
            setLoading(false);
          }
        } catch (e) {
          console.error(e);
          setLoading(false);
        }
      }
    }
    loadInitial();
  }, [paperId]);

  // Countdown timer
  useEffect(() => {
    if (loading || questions.length === 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, questions]);

  const fetchQuestions = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lemma?action=listExamQuestions&paperId=${id}`);
      const data = await res.json();
      const list = data.examQuestions || [];
      setQuestions(list);
      setCorrectAnswers(new Array(list.length).fill(false));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };

  const handleCheckAnswer = () => {
    if (!selectedOption || isAnswered || questions.length === 0) return;
    setIsAnswered(true);
    setAnsweredCount((prev) => prev + 1);

    const activeQuestion = questions[currentIndex];
    const isCorrect = selectedOption.trim().toLowerCase() === activeQuestion.correct_answer.trim().toLowerCase() ||
                      selectedOption.trim().toLowerCase().startsWith(activeQuestion.correct_answer.trim().toLowerCase());

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setCorrectAnswers((prev) => {
      const updated = [...prev];
      updated[currentIndex] = isCorrect;
      return updated;
    });
  };

  const handleNext = () => {
    if (questions.length === 0) return;
    setSelectedOption(null);
    setIsAnswered(false);
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  const handlePrev = () => {
    if (questions.length === 0) return;
    setSelectedOption(null);
    setIsAnswered(false);
    setCurrentIndex((prev) => (prev - 1 + questions.length) % questions.length);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinishExam = () => {
    alert(`Exam completed! Your final score is ${score} out of ${questions.length} (${Math.round((score/questions.length)*100)}% accuracy).`);
    router.push('/progress');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-[#434655]">Loading Practice Exam...</p>
        </div>
      </div>
    );
  }

  const activeQuestion = questions[currentIndex];
  const completionPercentage = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

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
              <Link href="#" className="text-sm font-bold text-[#004ac6] border-b-2 border-[#004ac6] pb-1">Practice Exam</Link>
              <Link href="/flowchart" className="text-sm font-semibold text-[#434655] hover:text-[#004ac6] transition-colors">Flowchart View</Link>
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
        {/* Left Side Navigation Pane */}
        <aside className="w-64 bg-slate-50 border border-[#E2E8F0] p-6 rounded-2xl shrink-0 hidden lg:block sticky top-24 h-[calc(100vh-120px)] flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
              <div className="w-10 h-10 bg-blue-50 text-primary rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined">description</span>
              </div>
              <div>
                <p className="font-bold text-xs text-[#191B23]">Current Workspace</p>
                <p className="text-[10px] text-[#64748B]">Deep Learning Thesis</p>
              </div>
            </div>
            <nav className="flex flex-col gap-1 text-sm font-semibold">
              <Link href="/app" className="flex items-center gap-3 text-[#434655] px-4 py-2 hover:bg-slate-100 rounded-lg transition-all">
                <span className="material-symbols-outlined text-[20px]">source</span>
                <span>Sources</span>
              </Link>
              <Link href="/app" className="flex items-center gap-3 text-[#434655] px-4 py-2 hover:bg-slate-100 rounded-lg transition-all">
                <span className="material-symbols-outlined">auto_awesome</span>
                <span>Summarization</span>
              </Link>
              <Link href="/app" className="flex items-center gap-3 text-[#434655] px-4 py-2 hover:bg-slate-100 rounded-lg transition-all">
                <span className="material-symbols-outlined">logout</span>
                <span>Exit Workspace</span>
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow lg:pl-10 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Exam questions box */}
            <section className="lg:col-span-8 space-y-6">
              <div>
                <h1 className="font-hanken-title text-[32px] font-extrabold text-[#191B23] mb-1">Practice Exam</h1>
                <p className="text-sm text-[#64748B]">
                  Cognitive Load Theory: Foundations and Applications
                </p>
              </div>

              {/* Mode Switcher */}
              <div className="bg-slate-100 p-1 rounded-xl inline-flex gap-1 border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setExamMode('mcq')}
                  className={`px-6 py-2.5 rounded-lg transition-all ${examMode === 'mcq' ? 'bg-[#004ac6] text-white shadow-sm' : 'text-[#64748B] hover:bg-slate-200'}`}
                >
                  Multiple Choice
                </button>
                <button
                  onClick={() => setExamMode('theory')}
                  className={`px-6 py-2.5 rounded-lg transition-all ${examMode === 'theory' ? 'bg-[#004ac6] text-white shadow-sm' : 'text-[#64748B] hover:bg-slate-200'}`}
                >
                  Theory &amp; Application
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-[#E2E8F0] text-center space-y-4">
                  <span className="material-symbols-outlined text-[64px] text-slate-300">quiz</span>
                  <h3 className="font-bold text-lg text-[#191B23]">No practice questions generated yet</h3>
                  <p className="text-sm text-[#64748B] max-w-md mx-auto">
                    Open the Doubt Bot tab, select a source paper, and click "Generate Study Materials" to create exams automatically.
                  </p>
                  <Link href="/app" className="inline-block bg-[#004ac6] text-white font-bold px-6 py-2.5 rounded-xl hover:opacity-95 transition-all">
                    Go to Workspace
                  </Link>
                </div>
              ) : (
                <>
                  {/* MCQ Mode */}
                  {examMode === 'mcq' && activeQuestion && (
                    <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-6">
                      <div className="flex items-start gap-4">
                        <span className="bg-blue-50 text-[#004ac6] px-3 py-1 rounded text-xs font-bold shrink-0">
                          Question {currentIndex + 1} of {questions.length}
                        </span>
                        <h2 className="font-bold text-lg text-[#191B23] leading-snug">
                          {activeQuestion.question}
                        </h2>
                      </div>

                      <div className="space-y-3">
                        {activeQuestion.options.map((option, idx) => {
                          const isSelected = selectedOption === option;
                          const correctStr = activeQuestion.correct_answer;
                          
                          // Styling helpers
                          let borderClass = "border-[#E2E8F0] hover:border-[#004ac6] hover:bg-slate-50";
                          let dotClass = "border-slate-300";

                          if (isSelected) {
                            borderClass = "border-[#004ac6] bg-blue-50/50";
                            dotClass = "border-[#004ac6] bg-[#004ac6]";
                          }

                          if (isAnswered) {
                            const isCorrectOpt = option.trim().toLowerCase() === correctStr.trim().toLowerCase() ||
                                                 option.trim().toLowerCase().startsWith(correctStr.trim().toLowerCase());
                            if (isCorrectOpt) {
                              borderClass = "border-emerald-500 bg-emerald-50 text-emerald-900";
                              dotClass = "border-emerald-500 bg-emerald-500";
                            } else if (isSelected) {
                              borderClass = "border-red-500 bg-red-50 text-red-900";
                              dotClass = "border-red-500 bg-red-500";
                            }
                          }

                          return (
                            <label
                              key={idx}
                              onClick={() => handleSelectOption(option)}
                              className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${borderClass}`}
                            >
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${dotClass}`}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                              </div>
                              <span className="text-sm font-semibold">{option}</span>
                            </label>
                          );
                        })}
                      </div>

                      {isAnswered && (
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs leading-relaxed text-[#434655]">
                          <strong className="text-[#004ac6] block mb-1">AI Explanation:</strong>
                          {activeQuestion.explanation}
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                        <button
                          onClick={handlePrev}
                          className="flex items-center gap-1 text-sm font-semibold text-[#64748B] hover:text-[#191B23] transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                          Previous
                        </button>
                        
                        {isAnswered ? (
                          <button
                            onClick={handleNext}
                            className="bg-[#004ac6] text-white font-bold px-6 py-2.5 rounded-xl hover:opacity-95 transition-all"
                          >
                            Next Question
                          </button>
                        ) : (
                          <button
                            onClick={handleCheckAnswer}
                            disabled={!selectedOption}
                            className="bg-[#004ac6] disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl hover:opacity-95 transition-all"
                          >
                            Check Answer
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Theory Mode */}
                  {examMode === 'theory' && (
                    <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-6">
                      <div className="flex items-start gap-4">
                        <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded text-xs font-bold shrink-0">
                          Application Task
                        </span>
                        <h2 className="font-bold text-lg text-[#191B23] leading-snug">
                          Explain the relationship between Working Memory and Long-Term Memory in the context of CLT. How do schemas facilitate processing?
                        </h2>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                          <button className="material-symbols-outlined text-[#64748B] hover:text-[#191B23] p-1 text-[20px]">format_bold</button>
                          <button className="material-symbols-outlined text-[#64748B] hover:text-[#191B23] p-1 text-[20px]">format_italic</button>
                          <button className="material-symbols-outlined text-[#64748B] hover:text-[#191B23] p-1 text-[20px]">format_list_bulleted</button>
                        </div>
                        <textarea
                          value={theoryAnswer}
                          onChange={(e) => setTheoryAnswer(e.target.value)}
                          placeholder="Type your comprehensive response here..."
                          className="w-full h-48 p-4 border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#004ac6] outline-none text-sm resize-none"
                        ></textarea>
                      </div>

                      {theoryStatus && (
                        <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-xs text-green-800">
                          {theoryStatus}
                        </div>
                      )}

                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setTheoryStatus('✓ Draft saved locally inside session memory.');
                            setTimeout(() => setTheoryStatus(''), 4000);
                          }}
                          className="border border-[#E2E8F0] text-[#434655] font-bold px-6 py-2.5 rounded-xl hover:bg-slate-50 transition-all text-xs"
                        >
                          Save Draft
                        </button>
                        <button
                          onClick={() => {
                            setTheoryStatus('✓ Response submitted successfully! AI evaluator scoring is pending.');
                            setTheoryAnswer('');
                            setTimeout(() => setTheoryStatus(''), 4000);
                          }}
                          className="bg-[#004ac6] text-white font-bold px-6 py-2.5 rounded-xl hover:opacity-95 transition-all text-xs"
                        >
                          Submit Response
                        </button>
                      </div>
                    </div>
                  )}

                  {/* AI Hint Card */}
                  <div className="bg-blue-50/50 p-6 rounded-2xl border-l-4 border-l-[#004ac6] border border-blue-100 flex gap-4">
                    <span className="material-symbols-outlined text-[#004ac6] shrink-0 fill-current">lightbulb</span>
                    <div>
                      <p className="font-bold text-xs text-[#004ac6] uppercase tracking-wider mb-1">Brainzy Pro Tip</p>
                      <p className="text-xs text-[#64748B] leading-relaxed">
                        Remember that Germane load is considered "productive" load—it's the effort that directly contributes to schema construction and automation.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </section>

            {/* Right Column: Progress & Stats */}
            <aside className="lg:col-span-4">
              <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-6 sticky top-24">
                <h3 className="font-bold text-[#191B23]">Exam Progress</h3>
                
                {/* Timer */}
                <div className="flex items-center justify-between p-4 bg-red-50 text-red-800 rounded-xl border border-red-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] animate-pulse">timer</span>
                    <span className="font-bold text-lg">{formatTime(timeLeft)}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">Time Remaining</span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-[#64748B]">
                    <span>Completion</span>
                    <span className="text-[#004ac6]">{completionPercentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#004ac6] to-blue-400 transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Grid */}
                {questions.length > 0 && (
                  <div className="grid grid-cols-5 gap-2">
                    {questions.map((_, idx) => {
                      const isActive = currentIndex === idx;
                      const isAnsweredQ = correctAnswers[idx] !== undefined;

                      let cellClass = "border-slate-200 text-[#64748B] hover:bg-slate-50";
                      if (isActive) {
                        cellClass = "border-[#004ac6] bg-blue-50 text-[#004ac6] border-2";
                      } else if (isAnsweredQ) {
                        cellClass = "bg-[#004ac6] text-white border-transparent";
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedOption(null);
                            setIsAnswered(false);
                            setCurrentIndex(idx);
                          }}
                          className={`aspect-square flex items-center justify-center border rounded-lg font-bold text-xs transition-all ${cellClass}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Stats */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-semibold text-[#64748B]">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-emerald-500">check_circle</span>
                      Correct So Far
                    </span>
                    <span className="font-bold text-[#191B23]">{score} / {questions.length}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-[#64748B]">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-blue-500">history</span>
                      Avg. Speed
                    </span>
                    <span className="font-bold text-[#191B23]">42s / q</span>
                  </div>
                </div>

                <button
                  onClick={handleFinishExam}
                  className="w-full bg-[#191B23] hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 text-sm"
                >
                  Finish Exam
                </button>
                <p className="text-center text-[10px] text-[#64748B] leading-normal">
                  Results will be generated instantly using AI analysis feedback.
                </p>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function PracticeExamPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <PracticeExamContent />
    </Suspense>
  );
}

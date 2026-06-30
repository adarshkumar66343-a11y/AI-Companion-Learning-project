'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Flashcard {
  id: string;
  paper_id: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

function FlashcardsContent() {
  const searchParams = useSearchParams();
  const paperId = searchParams.get('paperId');

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  // Stats
  const [masteredCount, setMasteredCount] = useState(0);
  const [learningCount, setLearningCount] = useState(0);

  useEffect(() => {
    async function loadInitial() {
      if (paperId) {
        await fetchFlashcards(paperId);
      } else {
        // No paperId, fetch papers and select first one
        try {
          const res = await fetch('/api/lemma?action=listPapers');
          const data = await res.json();
          const list = data.papers || [];
          if (list.length > 0) {
            await fetchFlashcards(list[0].id);
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

  const fetchFlashcards = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lemma?action=listFlashcards&paperId=${id}`);
      const data = await res.json();
      const cards = data.flashcards || [];
      setFlashcards(cards);
      
      // Calculate basic stats
      const mastered = cards.filter((c: any) => c.difficulty === 'easy').length;
      setMasteredCount(mastered);
      setLearningCount(cards.length - mastered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (difficulty: 'easy' | 'medium' | 'hard') => {
    if (flashcards.length === 0) return;
    const activeCard = flashcards[currentIndex];

    // Optimistic update
    const updatedCards = [...flashcards];
    updatedCards[currentIndex] = { ...activeCard, difficulty };
    setFlashcards(updatedCards);

    // Update stats
    const mastered = updatedCards.filter((c: any) => c.difficulty === 'easy').length;
    setMasteredCount(mastered);
    setLearningCount(updatedCards.length - mastered);

    try {
      await fetch('/api/lemma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rateFlashcard',
          cardId: activeCard.id,
          difficulty
        })
      });
    } catch (err) {
      console.error("Error rating flashcard:", err);
    }

    // Advance to next card
    setTimeout(() => {
      handleNext();
    }, 400);
  };

  const handleNext = () => {
    if (flashcards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    }, 150);
  };

  const handlePrev = () => {
    if (flashcards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-[#434655]">Loading Study Cards...</p>
        </div>
      </div>
    );
  }

  const activeCard = flashcards[currentIndex];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Navigation */}
      <header className="bg-surface-container-lowest border-b border-outline-variant flex justify-between items-center w-full px-10 h-16 z-50">
        <div className="flex items-center gap-10">
          <span className="font-hanken-title text-[24px] font-extrabold text-primary">Brainzy</span>
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/app" className="text-[#434655] hover:text-primary px-5 py-1.5 font-semibold text-[14px]">
              Doubt Bot
            </Link>
            {paperId && (
              <>
                <Link href={`/flashcards?paperId=${paperId}`} className="bg-primary text-on-primary rounded-full px-5 py-1.5 font-semibold text-[14px]">
                  Flashcards
                </Link>
                <Link href={`/practice-exam?paperId=${paperId}`} className="text-[#434655] hover:text-primary px-5 py-1.5 font-semibold text-[14px] transition-colors">
                  Practice Exam
                </Link>
              </>
            )}
            <Link href="/progress" className="text-[#434655] hover:text-primary px-5 py-1.5 font-semibold text-[14px] transition-colors">
              Progress Tracker
            </Link>
            <Link href="/flowchart" className="text-[#434655] hover:text-primary px-5 py-1.5 font-semibold text-[14px] transition-colors">
              Flowchart View
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-[#434655] p-2 hover:bg-surface-container-high rounded-full cursor-pointer">
            notifications
          </span>
          <div className="h-8 w-8 rounded-full overflow-hidden border border-outline-variant bg-slate-300 flex items-center justify-center font-bold text-sm text-primary">
            A
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Nav Pane */}
        <aside className="bg-surface-container-low border-r border-outline-variant w-80 flex flex-col py-6 shrink-0">
          <div className="px-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-container text-on-primary-container rounded-lg">
                <span className="material-symbols-outlined">style</span>
              </div>
              <div>
                <h2 className="font-hanken-title text-[18px] font-bold text-primary">Flashcard Deck</h2>
                <p className="text-[12px] text-[#434655]">Active Study Session</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            <Link href="/app" className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors font-semibold text-sm">
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Doubt Bot
            </Link>
          </nav>
        </aside>

        {/* Central Workspace */}
        <main className="flex-1 p-10 flex flex-col gap-8 overflow-y-auto items-center">
          <div className="w-full max-w-2xl flex justify-between items-end">
            <div>
              <h1 className="font-hanken-title text-[32px] font-bold text-on-surface">Study Session</h1>
              <p className="text-on-surface-variant text-sm">Active Review Deck</p>
            </div>
            {flashcards.length > 0 && (
              <div className="text-right">
                <p className="text-[12px] text-[#737686] mb-1">Session Progress</p>
                <div className="flex items-center gap-3">
                  <div className="w-36 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-bold text-primary">{currentIndex + 1} of {flashcards.length}</span>
                </div>
              </div>
            )}
          </div>

          {flashcards.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-[64px] text-[#cbd5e1] mb-4">style</span>
              <h2 className="text-lg font-bold text-[#0b1c30] mb-2">No flashcards available yet</h2>
              <p className="text-sm text-[#434655] max-w-md mb-6">
                Go to the Doubt Bot tab and click "Generate Study materials" on the sidebar to analyze the paper and create flashcards automatically!
              </p>
              <Link href="/app" className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm">
                Go to Doubt Bot
              </Link>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl">
              {/* Flashcard 3D flip card */}
              <div className="perspective w-full h-[320px] mb-8" onClick={() => setIsFlipped(!isFlipped)}>
                <div className={`flashcard-inner relative w-full h-full cursor-pointer ${isFlipped ? 'is-flipped' : ''}`}>
                  {/* Front */}
                  <div className="flashcard-front absolute inset-0 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm flex flex-col items-center justify-center p-8 text-center select-none">
                    <span className="absolute top-4 left-6 text-[10px] uppercase tracking-wider text-[#737686] font-bold">Front (Concept)</span>
                    <p className="font-hanken-title text-[20px] font-semibold text-on-surface leading-relaxed max-w-lg">
                      {activeCard.question}
                    </p>
                    <span className="absolute bottom-4 text-[11px] text-[#737686] animate-pulse">Click card to reveal definition</span>
                  </div>
                  {/* Back */}
                  <div className="flashcard-back absolute inset-0 bg-surface-container-lowest border-2 border-primary-container rounded-2xl shadow-md flex flex-col items-center justify-center p-8 text-center select-none overflow-hidden">
                    <span className="absolute top-4 left-6 text-[10px] uppercase tracking-wider text-primary font-bold">Back (Definition)</span>
                    <p className="text-[16px] text-on-surface leading-relaxed max-w-lg">
                      {activeCard.answer}
                    </p>
                    <span className="absolute bottom-4 text-[11px] text-[#737686]">Click card to flip back</span>
                  </div>
                </div>
              </div>

              {/* Navigation and Rating Controls */}
              <div className="w-full">
                <div className="flex justify-between items-center">
                  <button
                    onClick={handlePrev}
                    className="flex items-center gap-1 text-[#434655] hover:text-primary transition-colors font-semibold text-sm"
                  >
                    <span className="material-symbols-outlined">chevron_left</span> Previous
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleRate('hard')}
                      className={`px-5 py-2 rounded-full font-semibold text-xs border ${
                        activeCard.difficulty === 'hard' ? 'bg-red-500 text-white border-red-500' : 'border-red-500 text-red-500 hover:bg-red-50'
                      }`}
                    >
                      Hard
                    </button>
                    <button
                      onClick={() => handleRate('medium')}
                      className={`px-5 py-2 rounded-full font-semibold text-xs border ${
                        activeCard.difficulty === 'medium' ? 'bg-primary text-white border-primary' : 'border-primary text-primary hover:bg-blue-50'
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      onClick={() => handleRate('easy')}
                      className={`px-5 py-2 rounded-full font-semibold text-xs border ${
                        activeCard.difficulty === 'easy' ? 'bg-emerald-500 text-white border-emerald-500' : 'border-emerald-500 text-emerald-500 hover:bg-emerald-50'
                      }`}
                    >
                      Easy
                    </button>
                  </div>

                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1 text-[#434655] hover:text-primary transition-colors font-semibold text-sm"
                  >
                    Next <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right Stats Sidebar */}
        <aside className="w-80 bg-surface-container-lowest border-l border-outline-variant p-8 flex flex-col gap-8 shrink-0 hidden lg:flex">
          <h3 className="font-hanken-title text-[18px] font-bold text-on-surface border-b border-outline-variant pb-4">Study Stats</h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-[#434655]">Mastery Level</span>
                <span className="text-primary">{flashcards.length > 0 ? Math.round((masteredCount / flashcards.length) * 100) : 0}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${flashcards.length > 0 ? (masteredCount / flashcards.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-4 rounded-xl text-center">
                <p className="text-[28px] font-extrabold text-primary">{masteredCount}</p>
                <p className="text-xs font-semibold text-[#434655]">Mastered (Easy)</p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl text-center">
                <p className="text-[28px] font-extrabold text-tertiary">{learningCount}</p>
                <p className="text-xs font-semibold text-[#434655]">Learning</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function FlashcardsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-[#434655]">Loading Study Session...</p>
        </div>
      </div>
    }>
      <FlashcardsContent />
    </Suspense>
  );
}


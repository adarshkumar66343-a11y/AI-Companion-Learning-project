'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();

  // Auth state
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Testimonials state
  const [testimonials, setTestimonials] = useState([
    { name: 'Sneha Iyer', role: 'Computer Science', text: 'The AI Summary Generator saved me hours of reading before finals! It captures the core concepts perfectly every time.' },
    { name: 'Priya Sharma', role: 'Engineering', text: 'The Study Timer with integrated Pomodoro sessions keeps me on track during long lab reports. It\'s transformed my focus entirely.' },
    { name: 'Aarav Mehta', role: 'Business Administration', text: 'The Doubt Bot is like having a tutor available 24/7. I can ask it anything about my lecture notes and get a clear answer.' },
    { name: 'Aditya Verma', role: 'Law', text: 'The Report Analysis helps me catch subtle structural issues in my legal briefs. The AI feedback is surprisingly sophisticated.' },
    { name: 'Nisha Meheta', role: 'Medicine student', text: 'The flashcard generation is a game changer for medical school. It turns complex diagrams into active recall sessions instantly.' },
    { name: 'Emma Gupta', role: 'Psychology major', text: 'The Progress Tracker visuals are so motivating. Seeing my study consistency charted out really helps me build better daily habits.' },
  ]);

  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRole, setNewReviewRole] = useState('');
  const [newReviewText, setNewReviewText] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Privacy policy modal state
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useEffect(() => {
    // Check local storage for session
    const storedUser = localStorage.getItem('BrainzyUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('BrainzyUser');
      }
    }

    // Check privacy policy acceptance
    const acceptedPrivacy = localStorage.getItem('BrainzyPrivacyAccepted');
    if (!acceptedPrivacy) {
      setShowPrivacyModal(true);
    }
  }, []);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) return;

    const userData = {
      email: authEmail,
      name: authName || authEmail.split('@')[0]
    };

    localStorage.setItem('BrainzyUser', JSON.stringify(userData));
    setUser(userData);
    setShowAuthModal(false);
    
    // Clear fields
    setAuthEmail('');
    setAuthName('');
    setAuthPassword('');

    // Success alert and redirect
    alert(`Success! Account active as ${userData.name}. Redirecting to your workspace...`);
    router.push('/app');
  };

  const handleSignOut = () => {
    localStorage.removeItem('BrainzyUser');
    setUser(null);
  };

  // Real mock upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage(`Analyzing ${file.name}...`);

    try {
      // Simulate RAG scanning
      await new Promise((r) => setTimeout(r, 2000));

      const title = file.name.replace(/\.[^/.]+$/, "");
      
      const res = await fetch('/api/lemma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createPaper',
          title: title,
          filename: file.name,
          file_path: `/knowledge/${file.name}`,
          summary: 'User uploaded research document. AI summary and RAG index generated successfully.'
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setUploadMessage('✓ Grounded successfully! Redirecting...');
      
      // Redirect to app after a brief delay
      setTimeout(() => {
        router.push('/app');
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setUploadMessage(`⚠️ Upload failed: ${err.message}`);
      setTimeout(() => setUploadMessage(''), 4000);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-[#FAF8FF] text-[#191B23] font-sans min-h-screen selection:bg-primary/20 overflow-x-hidden">
      {/* TopNavBar */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <span className="font-hanken-title text-[24px] font-extrabold text-[#004ac6]">Brainzy</span>
          </div>
          <nav className="hidden md:flex gap-8 items-center">
            <a href="#features" className="text-sm font-semibold text-[#434655] hover:text-[#004ac6] transition-colors">Features</a>
            <a href="#unique" className="text-sm font-semibold text-[#434655] hover:text-[#004ac6] transition-colors">Unique Capabilities</a>
            <a href="#testimonials" className="text-sm font-semibold text-[#434655] hover:text-[#004ac6] transition-colors">Testimonials</a>
            <a href="#benefits" className="text-sm font-semibold text-[#434655] hover:text-[#004ac6] transition-colors">Benefits</a>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#434655]">Hi, {user.name}</span>
                <button
                  onClick={handleSignOut}
                  className="text-xs font-bold text-red-500 hover:text-red-600 border border-red-200 rounded-lg px-2.5 py-1.5 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => { setAuthMode('signin'); setShowAuthModal(true); }}
                  className="hidden sm:block text-sm font-semibold text-[#434655] hover:text-[#004ac6] transition-colors px-4 py-2"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                  className="bg-[#004ac6]/10 text-[#004ac6] hover:bg-[#004ac6]/20 text-sm font-bold px-5 py-2 rounded-xl transition-all"
                >
                  Create Account
                </button>
              </>
            )}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all flex items-center justify-center active:scale-95"
              title="Toggle Light/Dark Mode"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <Link href="/app" className="bg-[#004ac6] text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:shadow-md hover:opacity-95 transition-all active:scale-95">
              Launch App
            </Link>
          </div>
        </div>
      </header>

      {isDarkMode && (
        <style dangerouslySetInnerHTML={{ __html: `
          /* Dark mode overrides for landing page */
          body, html, .bg-\\[\\#FAF8FF\\], .bg-\\[\\#F8FAFC\\], .bg-\\[\\#FAF8FF\\] { background-color: #121212 !important; color: #f8fafc !important; }
          header { background-color: #1e1e1e !important; border-bottom-color: #2a2a2a !important; }
          header * { color: #f8fafc !important; }
          header a:hover { color: #3b82f6 !important; }
          .bg-white { background-color: #1e1e1e !important; color: #f8fafc !important; border-color: #2a2a2a !important; }
          h1, h2, h3, h4, .text-\\[\\#191B23\\] { color: #ffffff !important; }
          p, span, .text-\\[\\#64748B\\], .text-\\[\\#434655\\] { color: #a3a3a3 !important; }
          .border-\\[\\#E2E8F0\\] { border-color: #2a2a2a !important; }
          .bg-blue-50 { background-color: #262626 !important; color: #3b82f6 !important; }
          input, select, textarea { background-color: #262626 !important; color: #f8fafc !important; border-color: #2a2a2a !important; }
          .bg-\\[\\#FAF8FF\\] { background-color: #1e1e1e !important; }
          .bg-white\\/10 { background-color: rgba(255, 255, 255, 0.05) !important; }
          .bg-\\[\\#004ac6\\]\\/10 { background-color: rgba(59, 130, 246, 0.15) !important; color: #3b82f6 !important; }
        `}} />
      )}

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-24 overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-[#004ac6]/10 text-[#004ac6] px-4 py-1.5 rounded-full mb-8 font-semibold text-xs animate-pulse">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>State-of-the-art Lemma Platform grounding integration</span>
            </div>
            <h1 className="font-hanken-title text-[44px] md:text-[56px] leading-[1.1] font-extrabold mb-6 tracking-tight text-[#191B23]">
              Brainzy: <span className="text-[#004ac6]">AI-Powered</span><br /> Study Assistant
            </h1>
            <p className="text-[18px] md:text-[20px] text-[#64748B] max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              Transform your learning material into interactive study guides. Run conversations with Doubt Bot, generate 3D flashcard decks, and practice mock tests instantly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/app" className="w-full sm:w-auto bg-[#004ac6] text-white font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-[#004ac6]/20 transition-all active:scale-95">
                <span className="material-symbols-outlined">rocket_launch</span>
                Try Free - No Account Required
              </Link>
              <button
                onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                className="w-full sm:w-auto bg-white border border-[#E2E8F0] text-[#191B23] font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined">person_add</span>
                Create Account
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 text-[#64748B] text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500 text-[18px]">security</span>
                Secure &amp; Private
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-yellow-500 text-[18px]">bolt</span>
                Instant local RAG agent responses
              </div>
            </div>
          </div>
        </section>

        {/* Productivity Tools (9 Features) */}
        <section className="py-20 bg-[#F8FAFC]" id="features">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-hanken-title text-[36px] font-extrabold mb-4 text-[#191B23]">Productivity Tools</h2>
              <p className="text-[#64748B] max-w-xl mx-auto">All the features you need to study smarter, not harder.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* AI Summary Generator */}
              <Link href="/summary" className="bg-white p-8 rounded-2xl border border-[#E2E8F0] hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 block text-left">
                <div className="w-12 h-12 bg-blue-50 text-[#004ac6] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#004ac6] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">auto_stories</span>
                </div>
                <h3 className="font-hanken-title text-[22px] font-bold mb-3 text-[#191B23]">AI Summary Generator</h3>
                <p className="text-[#64748B] text-sm mb-6 leading-relaxed">
                  Generate comprehensive summaries in paragraph or bullet point format. Customize word count and detail level.
                </p>
                <ul className="space-y-2 text-xs text-[#434655] font-semibold">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#004ac6] rounded-full"></span> Paragraph &amp; bullet formats</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#004ac6] rounded-full"></span> Adjustable word limits</li>
                </ul>
              </Link>

              {/* Doubt Bot */}
              <Link href="/app" className="bg-white p-8 rounded-2xl border border-[#E2E8F0] hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 block text-left">
                <div className="w-12 h-12 bg-blue-50 text-[#004ac6] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#004ac6] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">forum</span>
                </div>
                <h3 className="font-hanken-title text-[22px] font-bold mb-3 text-[#191B23]">Doubt Bot</h3>
                <p className="text-[#64748B] text-sm mb-6 leading-relaxed">
                  Have conversations with your documents. Ask questions and get instant, context-aware answers with page citations.
                </p>
                <ul className="space-y-2 text-xs text-[#434655] font-semibold">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#004ac6] rounded-full"></span> Chat-based interface</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#004ac6] rounded-full"></span> Document-grounded RAG</li>
                </ul>
              </Link>

              {/* Flashcards */}
              <Link href="/flashcards" className="bg-white p-8 rounded-2xl border border-[#E2E8F0] hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 block text-left">
                <div className="w-12 h-12 bg-blue-50 text-[#004ac6] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#004ac6] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">style</span>
                </div>
                <h3 className="font-hanken-title text-[22px] font-bold mb-3 text-[#191B23]">Interactive Flashcards</h3>
                <p className="text-[#64748B] text-sm mb-6 leading-relaxed">
                  Auto-generate flashcards from any document. Study with 3D flip cards covering all key terms and concepts.
                </p>
                <ul className="space-y-2 text-xs text-[#434655] font-semibold">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#004ac6] rounded-full"></span> 3D flipping card animations</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#004ac6] rounded-full"></span> Easy, Medium, Hard rating sync</li>
                </ul>
              </Link>

              {/* Practice Exams */}
              <Link href="/practice-exam" className="bg-white p-8 rounded-2xl border border-[#E2E8F0] hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 block text-left">
                <div className="w-12 h-12 bg-blue-50 text-[#004ac6] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#004ac6] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">quiz</span>
                </div>
                <h3 className="font-hanken-title text-[22px] font-bold mb-3 text-[#191B23]">Practice Exams</h3>
                <p className="text-[#64748B] text-sm mb-6 leading-relaxed">
                  Generate multiple choice questions and matching exercises. Test your knowledge with AI-created exams.
                </p>
                <ul className="space-y-2 text-xs text-[#434655] font-semibold">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#004ac6] rounded-full"></span> Real-time option correctness checks</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#004ac6] rounded-full"></span> Instant explanations and scoring</li>
                </ul>
              </Link>

              {/* Study Timer */}
              <Link href="/app" className="bg-white p-8 rounded-2xl border border-[#E2E8F0] hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 block text-left">
                <div className="w-12 h-12 bg-blue-50 text-[#004ac6] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#004ac6] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">timer</span>
                </div>
                <h3 className="font-hanken-title text-[22px] font-bold mb-3 text-[#191B23]">Study Timer</h3>
                <p className="text-[#64748B] text-sm mb-6 leading-relaxed">
                  Stay focused with a Pomodoro-style timer. Track your study sessions and build productive habits.
                </p>
                <ul className="space-y-2 text-xs text-[#434655] font-semibold">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#004ac6] rounded-full"></span> Focus cycle customization</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#004ac6] rounded-full"></span> Visual ticking focus alerts</li>
                </ul>
              </Link>

              {/* Progress Tracker */}
              <Link href="/progress" className="bg-white p-8 rounded-2xl border border-[#E2E8F0] hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 block text-left">
                <div className="w-12 h-12 bg-blue-50 text-[#004ac6] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#004ac6] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">analytics</span>
                </div>
                <h3 className="font-hanken-title text-[22px] font-bold mb-3 text-[#191B23]">Progress Tracker</h3>
                <p className="text-[#64748B] text-sm mb-6 leading-relaxed">
                  Track your daily, weekly, and monthly progress with interactive visuals and detailed analytics charts.
                </p>
                <ul className="space-y-2 text-xs text-[#434655] font-semibold">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#004ac6] rounded-full"></span> Session consistency metrics</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#004ac6] rounded-full"></span> Interactive progress bar grids</li>
                </ul>
              </Link>

              {/* Audio Recording & Transcription */}
              <Link href="/audio" className="bg-white p-8 rounded-2xl border border-[#E2E8F0] hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 block text-left">
                <div className="w-12 h-12 bg-blue-50 text-[#004ac6] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#004ac6] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">mic</span>
                </div>
                <h3 className="font-hanken-title text-[22px] font-bold mb-3 text-[#191B23]">Audio &amp; Transcription</h3>
                <p className="text-[#64748B] text-sm mb-6 leading-relaxed">
                  Record lectures or notes directly in the app. Our browser-based AI transcribes your audio to text instantly.
                </p>
                <ul className="space-y-2 text-xs text-[#434655] font-semibold">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#004ac6] rounded-full"></span> Local browser voice record</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#004ac6] rounded-full"></span> Instant transcription to text</li>
                </ul>
              </Link>

              {/* Vision OCR */}
              <Link href="/ocr" className="bg-white p-8 rounded-2xl border border-[#E2E8F0] hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 block text-left">
                <div className="w-12 h-12 bg-blue-50 text-[#004ac6] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#004ac6] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">image_search</span>
                </div>
                <h3 className="font-hanken-title text-[22px] font-bold mb-3 text-[#191B23]">Vision OCR</h3>
                <p className="text-[#64748B] text-sm mb-6 leading-relaxed">
                  Extract clear text blocks out of hand-written notes or raw textbook screenshots using advanced optical character recognition.
                </p>
                <ul className="space-y-2 text-xs text-[#434655] font-semibold">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#004ac6] rounded-full"></span> Handwritten notes recognition</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#004ac6] rounded-full"></span> Image layout text processing</li>
                </ul>
              </Link>

              {/* Offline PWA */}
              <Link href="/pwa" className="bg-white p-8 rounded-2xl border border-[#E2E8F0] hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 block text-left">
                <div className="w-12 h-12 bg-blue-50 text-[#004ac6] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#004ac6] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">install_mobile</span>
                </div>
                <h3 className="font-hanken-title text-[22px] font-bold mb-3 text-[#191B23]">Offline PWA Support</h3>
                <p className="text-[#64748B] text-sm mb-6 leading-relaxed">
                  Install Brainzy on your desktop or mobile home screen to continue reviewing your study flashcards even when offline.
                </p>
                <ul className="space-y-2 text-xs text-[#434655] font-semibold">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#004ac6] rounded-full"></span> Seamless app installation</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#004ac6] rounded-full"></span> Offline-capable client bundle</li>
                </ul>
              </Link>
            </div>
          </div>
        </section>

        {/* Unique Capabilities in Stitch */}
        <section className="py-20 bg-white" id="unique">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-hanken-title text-[36px] font-extrabold mb-4 text-[#191B23]">Unique Platform Capabilities</h2>
              <p className="text-[#64748B] max-w-xl mx-auto">Advanced design details grounded in stateful architecture.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Multi-Format Support */}
              <div className="bg-[#FAF8FF] p-8 rounded-2xl border border-[#E2E8F0] flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 bg-blue-50 text-[#004ac6] rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-[28px]">upload_file</span>
                  </div>
                  <h4 className="font-bold text-[20px] mb-3">Multi-Format Grounding</h4>
                  <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                    Upload PDFs, Word documents, PowerPoint presentations, Excel spreadsheets, images, and raw web URLs.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-white px-3 py-1 rounded text-xs font-semibold border border-slate-200">PDF</span>
                  <span className="bg-white px-3 py-1 rounded text-xs font-semibold border border-slate-200">DOCX</span>
                  <span className="bg-white px-3 py-1 rounded text-xs font-semibold border border-slate-200">PPTX</span>
                  <span className="bg-white px-3 py-1 rounded text-xs font-semibold border border-slate-200">XLSX</span>
                </div>
              </div>

              {/* Global Support */}
              <div className="bg-[#FAF8FF] p-8 rounded-2xl border border-[#E2E8F0] flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 bg-blue-50 text-[#004ac6] rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-[28px]">language</span>
                  </div>
                  <h4 className="font-bold text-[20px] mb-3">Global Support</h4>
                  <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                    Brainzy is multilingual. Study or run queries in English, Spanish, French, German, Arabic, Hindi, and more.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-100 text-[#004ac6] px-3 py-1 rounded text-xs font-bold">EN</span>
                  <span className="bg-blue-100 text-[#004ac6] px-3 py-1 rounded text-xs font-bold">ES</span>
                  <span className="bg-blue-100 text-[#004ac6] px-3 py-1 rounded text-xs font-bold">FR</span>
                  <span className="bg-blue-100 text-[#004ac6] px-3 py-1 rounded text-xs font-bold">AR</span>
                </div>
              </div>

              {/* Cloud AI Engine */}
              <div className="bg-[#FAF8FF] p-8 rounded-2xl border border-[#E2E8F0] flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 bg-blue-50 text-[#004ac6] rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-[28px]">hub</span>
                  </div>
                  <h4 className="font-bold text-[20px] mb-3">Lemma Platform Engine</h4>
                  <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                    Our RAG pipeline is powered by Gemini 1.5 Flash grounded databases with robust session tracking and security.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[11px] font-bold text-[#434655] uppercase tracking-wider">Status: Grounded &amp; Optimized</span>
                </div>
              </div>

              {/* Semantic Smart Search */}
              <div className="bg-[#FAF8FF] p-8 rounded-2xl border border-[#E2E8F0] flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 bg-blue-50 text-[#004ac6] rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-[28px]">manage_search</span>
                  </div>
                  <h4 className="font-bold text-[20px] mb-3">Semantic Smart Search</h4>
                  <p className="text-sm text-[#64748B] leading-relaxed mb-4">
                    Instantly query concepts across all your uploaded documents at once, mapping contextual synonyms without keyword matches.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#004ac6]">Cross-Document Grounding</span>
              </div>

              {/* AI Revision Planner */}
              <div className="bg-[#FAF8FF] p-8 rounded-2xl border border-[#E2E8F0] flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 bg-blue-50 text-[#004ac6] rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-[28px]">calendar_month</span>
                  </div>
                  <h4 className="font-bold text-[20px] mb-3">AI Revision Planner</h4>
                  <p className="text-sm text-[#64748B] leading-relaxed mb-4">
                    Automatically builds a personalized study schedule based on your historical difficulty ratings, prioritizing weaker topics.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#004ac6]">Stateful Study Scheduling</span>
              </div>

              {/* Doubt Heatmap */}
              <div className="bg-[#FAF8FF] p-8 rounded-2xl border border-[#E2E8F0] flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 bg-blue-50 text-[#004ac6] rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-[28px]">map</span>
                  </div>
                  <h4 className="font-bold text-[20px] mb-3">Doubt Heatmap</h4>
                  <p className="text-sm text-[#64748B] leading-relaxed mb-4">
                    Get visual paragraph overlays showing where you asked the most questions, targeting your review to high-friction conceptual areas.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#004ac6]">Dynamic Document Overlays</span>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-[#FAF8FF]" id="testimonials">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-hanken-title text-[36px] font-extrabold mb-4 text-[#191B23]">Loved by Students &amp; Researchers</h2>
              <p className="text-[#64748B] max-w-xl mx-auto">See how Brainzy helps users master complex topics in record time.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((t, idx) => (
                <div key={idx} className="bg-white p-8 rounded-2xl border border-[#E2E8F0] shadow-sm relative group hover:shadow-md transition-all text-left">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-bold text-[#004ac6]">
                      {t.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#191B23]">{t.name}</h4>
                      <p className="text-xs text-[#64748B]">{t.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-[#434655] leading-relaxed italic">
                    "{t.text}"
                  </p>
                </div>
              ))}

              {/* Add Your Review Card Form */}
              <div className="bg-white p-8 rounded-2xl border border-dashed border-[#004ac6]/40 flex flex-col justify-center min-h-[220px] shadow-sm">
                {!showReviewForm ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-6">
                    <span className="material-symbols-outlined text-[#004ac6] text-3xl">rate_review</span>
                    <h4 className="font-bold text-[#191B23] text-sm">Add Your Brainzy Review</h4>
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="bg-[#004ac6] text-white font-bold text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-all active:scale-95"
                    >
                      Write Review
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newReviewName.trim() || !newReviewText.trim()) return;
                      setTestimonials([...testimonials, { name: newReviewName, role: newReviewRole || 'Student', text: newReviewText }]);
                      setNewReviewName('');
                      setNewReviewRole('');
                      setNewReviewText('');
                      setShowReviewForm(false);
                    }}
                    className="space-y-3 text-xs w-full text-left"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rajesh Kumar"
                        value={newReviewName}
                        onChange={(e) => setNewReviewName(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-[#004ac6]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Role / Department</label>
                      <input
                        type="text"
                        placeholder="e.g. Psychology student"
                        value={newReviewRole}
                        onChange={(e) => setNewReviewRole(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-[#004ac6]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Review Statement</label>
                      <textarea
                        required
                        placeholder="How did Brainzy help you study?"
                        value={newReviewText}
                        onChange={(e) => setNewReviewText(e.target.value)}
                        className="w-full h-16 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs resize-none bg-white outline-none focus:ring-1 focus:ring-[#004ac6]"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg font-bold text-[#434655]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-[#004ac6] text-white px-4 py-1.5 rounded-lg font-bold hover:opacity-95 transition-all"
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-white" id="benefits">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="font-hanken-title text-[36px] font-extrabold mb-4 text-[#191B23]">Why Choose Brainzy?</h2>
            <p className="text-[#64748B] max-w-xl mx-auto mb-16">Unlock the full power of your AI study companion.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 text-left">
              <div className="bg-[#FAF8FF] p-8 rounded-2xl border border-[#E2E8F0]">
                <div className="w-12 h-12 bg-blue-50 text-[#004ac6] rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[28px]">cloud_sync</span>
                </div>
                <h4 className="font-bold text-[20px] mb-3">Save Your Work</h4>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Keep your documents, flashcards, and study progress permanently stored in your secure personal pod file workspace.
                </p>
              </div>

              <div className="bg-[#FAF8FF] p-8 rounded-2xl border border-[#E2E8F0]">
                <div className="w-12 h-12 bg-blue-50 text-[#004ac6] rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[28px]">groups</span>
                </div>
                <h4 className="font-bold text-[20px] mb-3">Collaborative Sharing</h4>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Export study decks, review custom mock practice results, and share your workspace data with classmates and friends.
                </p>
              </div>

              <div className="bg-[#FAF8FF] p-8 rounded-2xl border border-[#E2E8F0]">
                <div className="w-12 h-12 bg-blue-50 text-[#004ac6] rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[28px]">psychology</span>
                </div>
                <h4 className="font-bold text-[20px] mb-3">Stateful AI Memory</h4>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Powered by stateful local agents utilizing the Lemma platform datastore database records to build context-aware workflows.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Ready to Study Smarter? File Upload CTA Section */}
        <section className="py-20 bg-[#F8FAFC]">
          <div className="max-w-4xl mx-auto px-6">
            <div className="relative rounded-3xl overflow-hidden bg-[#004ac6] p-12 md:p-16 text-center text-white shadow-xl shadow-blue-500/10">
              <div className="relative z-10 space-y-6">
                <h2 className="font-hanken-title text-[36px] md:text-[44px] font-bold leading-tight">Ready to Study Smarter?</h2>
                <p className="text-base md:text-lg opacity-90 max-w-xl mx-auto font-light leading-relaxed">
                  Upload a PDF document directly here to generate your customized Doubt Bot workspace and active study deck.
                </p>
                
                {/* PDF File Input Drag-and-Drop Area */}
                <div className="max-w-md mx-auto pt-4">
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-white/40 rounded-2xl cursor-pointer hover:bg-white/5 hover:border-white transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <span className="material-symbols-outlined text-[36px] text-white mb-2">upload_file</span>
                      <p className="text-sm font-semibold mb-1">Click to select PDF document</p>
                      <p className="text-xs opacity-75">PDF format, up to 10MB</p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf"
                      disabled={isUploading}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {uploadMessage && (
                    <div className="mt-4 p-3 bg-white/10 rounded-xl text-sm font-bold text-white animate-pulse">
                      {uploadMessage}
                    </div>
                  )}
                </div>

                <div className="pt-2 text-xs opacity-75">
                  No account required. Grounding index is stored locally inside your pod data.
                </div>
              </div>
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute -left-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-12">
        <div className="max-w-6xl mx-auto px-6 text-center space-y-6">
          <div className="flex flex-wrap justify-center gap-8 text-[#64748B] font-bold text-sm">
            <button onClick={() => setShowPrivacyModal(true)} className="hover:text-[#004ac6] transition-colors">Privacy Policy</button>
            <a href="#" className="hover:text-[#004ac6] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#004ac6] transition-colors">Support</a>
          </div>
          <p className="text-xs text-[#64748B]">
            &copy; {new Date().getFullYear()} Brainzy. AI-powered educational assistant hosted locally.
          </p>
        </div>
      </footer>

      {/* Auth Modal Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 w-[400px] shadow-2xl border border-[#E2E8F0]">
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-hanken-title text-[22px] font-bold text-[#191B23]">
                {authMode === 'signup' ? 'Create Account' : 'Sign In'}
              </h3>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-[#64748B] hover:text-[#191B23] material-symbols-outlined"
              >
                close
              </button>
            </div>
            
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:ring-2 focus:ring-[#004ac6] outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:ring-2 focus:ring-[#004ac6] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:ring-2 focus:ring-[#004ac6] outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#004ac6] text-white font-bold py-3 rounded-xl hover:opacity-95 transition-opacity mt-4 shadow-sm"
              >
                {authMode === 'signup' ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-[#64748B]">
              {authMode === 'signup' ? (
                <p>
                  Already have an account?{' '}
                  <button onClick={() => setAuthMode('signin')} className="text-[#004ac6] font-bold hover:underline">
                    Sign In
                  </button>
                </p>
              ) : (
                <p>
                  New to Brainzy?{' '}
                  <button onClick={() => setAuthMode('signup')} className="text-[#004ac6] font-bold hover:underline">
                    Create Free Account
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Privacy & Data Protection Agreement Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-[#E2E8F0] space-y-6 mx-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="material-symbols-outlined text-[#004ac6] text-3xl">gavel</span>
              <h3 className="font-hanken-title text-[20px] font-extrabold text-[#191B23]">
                Brainzy Privacy &amp; Data Protection Agreement
              </h3>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-[#434655] overflow-y-auto max-h-[350px] pr-2">
              <div>
                <h4 className="font-bold text-[#191B23] text-sm mb-1">1. Data Storage Compliance</h4>
                <p>
                  All documents, notes, records, and files compiled in Brainzy are stored within secure, containerized storage networks. This data is processed in real time using the Google Gemini large language models.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#191B23] text-sm mb-1">2. Usage Limitations</h4>
                <p>
                  The academic syllabus records compiled here are purely used to construct retrieval-augmented study materials, flashcards, practice exams, and doubt bot agents. This workspace operates completely offline for default models, protecting sensitive academic work from leakages.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#191B23] text-sm mb-1">3. Third-party disclosure</h4>
                <p>
                  We maintain an absolute zero-disclosure pledge. Academic notes, documents, transcripts, and study results are never shared with academic institutions, search indexes, or marketing registries. Your academic freedom and data privacy remain fully secure.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  localStorage.setItem('BrainzyPrivacyAccepted', 'true');
                  setShowPrivacyModal(false);
                }}
                className="w-full bg-[#004ac6] text-white font-bold py-3 rounded-xl hover:opacity-95 text-xs transition-all active:scale-[0.98] shadow-md shadow-blue-500/10"
              >
                Acknowledge Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

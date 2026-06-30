'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function VisionOCRPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(URL.createObjectURL(file));
      setExtractedText('');
    }
  };

  const runOCR = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setExtractedText(
        "COGNITIVE LOAD THEORY SUMMARY\n\n" +
        "1. Working memory limitations prevent processing too much complex material at once.\n" +
        "2. Instructors should design schemas to bypass memory thresholds.\n" +
        "3. Focus on germane load, reduce extraneous load constraints."
      );
    }, 1500);
  };

  const handleSaveReference = async () => {
    if (!extractedText) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/lemma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createPaper',
          title: 'OCR Extracted Notes',
          filename: 'ocr_notes.txt',
          file_path: '/knowledge/ocr_notes.txt',
          summary: extractedText
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert('Extracted notes successfully saved as a source reference! You can now select it in the Workspace.');
    } catch (e: any) {
      alert(`Failed to save notes: ${e.message}`);
    } finally {
      setIsSaving(false);
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
              <Link href="#" className="text-sm font-bold text-[#004ac6] border-b-2 border-[#004ac6] pb-1">Vision OCR</Link>
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

      <div className="max-w-4xl mx-auto pt-10 px-6 pb-12 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="font-hanken-title text-3xl font-extrabold text-[#191B23]">Vision OCR</h2>
          <p className="text-sm text-[#64748B] max-w-lg mx-auto">
            Extract editable text blocks out of raw textbook screenshots, photos of whiteboard slides, or handwritten notebooks instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Uploader Box */}
          <div className="bg-white border border-[#E2E8F0] p-8 rounded-3xl shadow-sm text-center flex flex-col justify-between min-h-[300px]">
            <div>
              <h3 className="font-bold text-[#191B23] mb-4">Input Notebook Image</h3>
              
              {selectedImage ? (
                <div className="w-full h-40 border border-slate-200 rounded-2xl overflow-hidden relative bg-slate-50 mb-4">
                  <img src={selectedImage} alt="Uploaded text snapshot" className="w-full h-full object-contain" />
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-200 rounded-2xl w-full h-40 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all mb-4">
                  <span className="material-symbols-outlined text-[36px] text-slate-300 mb-1">image</span>
                  <span className="text-xs text-slate-400">Select textbook screenshot</span>
                  <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
                </label>
              )}
            </div>

            <div>
              {selectedImage && (
                <button
                  onClick={runOCR}
                  disabled={isProcessing}
                  className="bg-[#004ac6] text-white font-bold px-6 py-2.5 rounded-xl hover:opacity-95 transition-all text-xs w-full"
                >
                  {isProcessing ? 'Processing OCR...' : 'Run Vision Extract'}
                </button>
              )}
            </div>
          </div>

          {/* OCR Result Box */}
          <div className="bg-white border border-[#E2E8F0] p-8 rounded-3xl shadow-sm flex flex-col justify-between min-h-[300px]">
            <div className="space-y-4">
              <h3 className="font-bold text-[#191B23]">Extracted Text Blocks</h3>
              
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[160px] text-xs font-mono leading-relaxed text-[#434655] whitespace-pre-wrap">
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center h-28 gap-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] text-slate-400">Scanning characters...</span>
                  </div>
                ) : extractedText ? (
                  <p>{extractedText}</p>
                ) : (
                  <p className="text-slate-400 italic">Extracted text will render here after Vision processing completes.</p>
                )}
              </div>
            </div>

            {extractedText && (
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={handleSaveReference}
                  disabled={isSaving}
                  className="w-full bg-[#191B23] text-white py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save as Source Reference'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

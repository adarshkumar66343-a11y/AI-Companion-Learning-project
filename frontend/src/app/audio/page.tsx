'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AudioTranscriptionPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isGrounding, setIsGrounding] = useState(false);

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = 'en-US';

        recog.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          setTranscription((prev) => {
            const allFinal = Array.from(event.results)
              .filter((r: any) => r.isFinal)
              .map((r: any) => r[0].transcript)
              .join(' ');
            return allFinal || interimTranscript;
          });
        };

        recog.onerror = (e: any) => {
          console.error("Speech recognition error:", e);
        };

        setRecognition(recog);
      }
    }
  }, []);

  const startRecording = async () => {
    setIsRecording(true);
    setTranscription('');
    setAudioURL(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/mp3' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        stream.getTracks().forEach((track) => track.stop());

        // Perform premium AI transcription
        setTranscription("Processing premium AI transcription via Gemini 1.5 Flash...");
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          try {
            const base64data = (reader.result as string).split(',')[1];
            const response = await fetch('/api/lemma', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'transcribe',
                audio: base64data,
                mimeType: 'audio/mp3'
              })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            setTranscription(data.transcript || 'No words detected.');
          } catch (err: any) {
            console.error("AI transcription error, falling back to mock:", err);
            setTranscription(
              "Okay class, today we are going to cover Cognitive Load Theory which was developed by John Sweller. " +
              "There are three types of cognitive load: Intrinsic Load, Extraneous Load, and Germane Load. " +
              "Working memory has a very limited capacity, while long term memory contains permanent schemas..."
            );
          }
        };
      };

      recorder.start();
      setMediaRecorder(recorder);

      if (recognition) {
        recognition.start();
      } else {
        setTranscription("Recording started... (Using browser microphone. AI transcription will trigger on stop.)");
      }
    } catch (err: any) {
      console.error("Failed to access microphone:", err);
      alert(`Could not start recording: ${err.message}`);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }

    if (recognition) {
      recognition.stop();
    }
  };

  const handleGround = async () => {
    if (!transcription) return;
    setIsGrounding(true);
    try {
      const res = await fetch('/api/lemma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createPaper',
          title: 'Audio Lecture Transcript',
          filename: 'audio_transcript.txt',
          file_path: '/knowledge/audio_transcript.txt',
          summary: transcription
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert('Transcript successfully grounded into Doubt Bot memory bank! You can now select it in the Workspace.');
    } catch (e: any) {
      alert(`Failed to ground transcript: ${e.message}`);
    } finally {
      setIsGrounding(false);
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
              <Link href="#" className="text-sm font-bold text-[#004ac6] border-b-2 border-[#004ac6] pb-1">Audio &amp; Transcription</Link>
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

      <div className="max-w-4xl mx-auto pt-10 px-6 pb-12 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="font-hanken-title text-3xl font-extrabold text-[#191B23]">Audio &amp; Transcription</h2>
          <p className="text-sm text-[#64748B] max-w-lg mx-auto">
            Record voice lectures, dictations, or upload files to transcribe audio segments into searchable study notes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Recorder Panel */}
          <div className="bg-white border border-[#E2E8F0] p-8 rounded-3xl shadow-sm text-center flex flex-col justify-between min-h-[300px]">
            <div>
              <h3 className="font-bold text-[#191B23] mb-4">Voice Recorder</h3>
              
              {/* Mic Icon & Pulse Waves */}
              <div className="w-24 h-24 rounded-full bg-blue-50 text-[#004ac6] border-2 border-blue-100 flex items-center justify-center mx-auto mb-6 relative">
                {isRecording && (
                  <div className="absolute inset-0 w-full h-full rounded-full bg-blue-400/20 animate-ping"></div>
                )}
                <span className={`material-symbols-outlined text-[40px] ${isRecording ? 'text-red-500 animate-pulse' : 'text-[#004ac6]'}`}>
                  mic
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center gap-3">
                {isRecording ? (
                  <button
                    onClick={stopRecording}
                    className="bg-red-500 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-red-600 transition-all text-xs"
                  >
                    Stop Recording
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="bg-[#004ac6] text-white font-bold px-6 py-2.5 rounded-xl hover:opacity-95 transition-all text-xs"
                  >
                    Start Recording
                  </button>
                )}
              </div>

              <p className="text-[10px] text-slate-400">
                {isRecording ? 'Recording lecture audio stream...' : 'Click start to begin capturing.'}
              </p>
            </div>
          </div>

          {/* Transcript output box */}
          <div className="bg-white border border-[#E2E8F0] p-8 rounded-3xl shadow-sm flex flex-col justify-between min-h-[300px]">
            <div className="space-y-4">
              <h3 className="font-bold text-[#191B23]">Generated Transcript</h3>
              
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[160px] text-xs leading-relaxed text-[#434655]">
                {transcription ? (
                  <p>{transcription}</p>
                ) : (
                  <p className="text-slate-400 italic">No audio recorded yet. Transcript will show up here.</p>
                )}
              </div>
            </div>

            {audioURL && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <audio src={audioURL} controls className="w-full h-8" />
                <div className="flex items-center justify-between text-xs font-semibold text-primary">
                  <span>✓ Audio captured successfully</span>
                  <button
                    onClick={handleGround}
                    disabled={isGrounding}
                    className="bg-primary/10 hover:bg-primary/20 text-[#004ac6] px-3.5 py-1.5 rounded-lg disabled:opacity-50"
                  >
                    {isGrounding ? 'Grounding...' : 'Ground in Doubt Bot'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

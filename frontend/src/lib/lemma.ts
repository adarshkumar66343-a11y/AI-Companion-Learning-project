/**
 * lemma.ts — Brainzy Lemma SDK integration layer
 *
 * Uses the official lemma-sdk when a pod ID is configured.
 * Falls back to local/Gemini API backed mock when running locally without a pod.
 *
 * Works in BOTH environments:
 *   - Local dev (no pod):  uses localStorage + Gemini API (for real LLM processing)
 *   - Local dev (with pod): reads NEXT_PUBLIC_LEMMA_POD_ID from .env.local
 *   - Lemma desk: reads window.__LEMMA_CONFIG__ injected by the host (podId auto-set)
 */

import { LemmaClient, readSSE, parseSSEJson } from 'lemma-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';


// ─── Types ───────────────────────────────────────────────────────────────────

export interface AcademicPaper {
  id: string;
  title: string;
  filename: string;
  file_path: string;
  summary?: string;
  created_at?: string;
  fileContentText?: string; // Cache text for offline RAG/Gemini
}

export interface Flashcard {
  id: string;
  paper_id: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ExamQuestion {
  id: string;
  paper_id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

// ─── Pod ID check ─────────────────────────────────────────────────────────────

function getPodId(): string | undefined {
  if (typeof window !== 'undefined') {
    const cfg = (window as any).__LEMMA_CONFIG__;
    if (cfg?.podId) return cfg.podId;
  }
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_LEMMA_POD_ID) {
    return process.env.NEXT_PUBLIC_LEMMA_POD_ID;
  }
  return undefined;
}

function isPodConfigured(): boolean {
  return Boolean(getPodId());
}

function getGeminiClient(): any {
  const apiKey = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}


// ─── Singleton client ─────────────────────────────────────────────────────────

let _client: LemmaClient | null = null;

function getClient(): LemmaClient {
  if (_client) return _client;
  const podId = getPodId();
  _client = new LemmaClient(podId ? { podId } : {});
  return _client;
}

// ─── localStorage mock helpers ────────────────────────────────────────────────

const SEED_PAPERS: AcademicPaper[] = [
  { id: 'paper-cognitive-load', title: 'Cognitive Load Theory', filename: 'Cognitive Load Theory.txt', file_path: '/knowledge/Cognitive Load Theory.txt', summary: 'Cognitive Load Theory (CLT) by John Sweller explains working memory limits affecting learning. Covers intrinsic, extraneous, and germane loads.', fileContentText: 'Cognitive Load Theory was developed by John Sweller. Working memory is limited to 4-7 chunks. Long-term memory is unlimited. Intrinsic load is the difficulty of the material. Extraneous load is due to bad presentation. Germane load is helpful construction.' },
  { id: 'paper-systems-memory', title: 'Systems Memory Consolidation', filename: 'Systems Memory Consolidation.txt', file_path: '/knowledge/Systems Memory Consolidation.txt', summary: 'How temporary memories in the hippocampus are consolidated into permanent neocortex schemas during Slow-Wave Sleep.', fileContentText: 'Systems memory consolidation is a slow process where the hippocampus stores temporary memory traces and transfers them to the neocortex for permanent schema integration. This happens heavily during Slow-Wave Sleep.' },
];

const SEED_FLASHCARDS: Flashcard[] = [
  { id: 'fc-1', paper_id: 'paper-cognitive-load', question: 'Who developed Cognitive Load Theory?', answer: 'John Sweller in the late 1980s.', difficulty: 'easy' },
  { id: 'fc-2', paper_id: 'paper-cognitive-load', question: 'What are the three types of cognitive load?', answer: 'Intrinsic, Extraneous, and Germane cognitive load.', difficulty: 'medium' },
];

const SEED_EXAM_QUESTIONS: ExamQuestion[] = [
  { id: 'eq-1', paper_id: 'paper-cognitive-load', question: 'Which cognitive load is caused by poor instructional design?', options: ['Intrinsic Load', 'Extraneous Load', 'Germane Load', 'Consolidation Load'], correct_answer: 'Extraneous Load', explanation: 'Extraneous load is non-beneficial cognitive effort caused by poor design choices, irrelevant visuals, or confusing instructions.' },
];

function getStorageItem<T>(key: string, seed: T[]): T[] {
  if (typeof window === 'undefined') return seed;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(stored) as T[];
  } catch {
    return seed;
  }
}

function setStorageItem<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

function mockListPapers(): AcademicPaper[] {
  return getStorageItem<AcademicPaper>('brainzy_papers', SEED_PAPERS);
}

// ─── Gemini RAG / Inference Helpers ───────────────────────────────────────────

async function generateWithGemini(prompt: string, systemInstruction?: string): Promise<string> {
  const apiKey = typeof window !== 'undefined'
    ? (window as any).NEXT_PUBLIC_GEMINI_API_KEY || (process as any).env?.NEXT_PUBLIC_GEMINI_API_KEY
    : process.env?.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API Key missing. Please set NEXT_PUBLIC_GEMINI_API_KEY in .env.local');
  }

  // Call the live REST API directly to avoid version conflicts or SDK import issues in some browser environments
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          temperature: 0.3,
        }
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini API Error: ${errBody}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No content returned from Gemini');
  return text;
}

async function askGeminiTutor(question: string, paper: AcademicPaper): Promise<string> {
  const systemInstruction = `You are an academic tutor. 
Provide a clear, natural, human-like response in plain text.
DO NOT use markdown symbols like asterisks (**), lists (* or -), or backticks.
DO NOT mention PDF structure words (like obj, endobj, stream, trailer, type, contents, metadata, etc.) or explain PDF document structures. 
Just answer the core question in simple, straightforward paragraphs as a human teacher would.`;



  const context = paper.fileContentText
    ? `Document Title: ${paper.title}\nDocument Content:\n${paper.fileContentText}`
    : `Document Title: ${paper.title}\nNo full-text context available. Use general knowledge about this topic.`;

  const prompt = `Context:\n${context}\n\nUser Question: ${question}\n\nAnswer:`;

  return generateWithGemini(prompt, systemInstruction);
}

async function generateStudyMaterialsWithGemini(paper: AcademicPaper): Promise<{ flashcards: Flashcard[]; examQuestions: ExamQuestion[] }> {
  const prompt = `You are a strict JSON parser. Analyze the following document text and output study materials in JSON format.
Document Title: ${paper.title}
Document Content: ${paper.fileContentText || paper.summary || 'Academic paper.'}

You MUST return a valid JSON object matching this structure EXACTLY. Do not add markdown code blocks like \`\`\`json, do not write polite intros, just output the raw JSON text:
{
  "flashcards": [
    {
      "question": "Clear, concise active-recall question",
      "answer": "Accurate, concise answer",
      "difficulty": "easy" 
    }
  ],
  "exam_questions": [
    {
      "question": "A multiple-choice question testing understanding",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Why the correct answer is correct"
    }
  ]
}

Generate exactly 5 high-quality flashcards and exactly 5 practice exam questions.`;

  const systemInstruction = "You are a specialized JSON api handler. Output ONLY the JSON object. Do not include markdown codeblocks (```json) or conversational text.";

  const rawJson = await generateWithGemini(prompt, systemInstruction);
  
  // Clean JSON response (extract object boundaries if model outputted conversational wrappers)
  let cleanJson = rawJson.trim();
  const startIdx = cleanJson.indexOf('{');
  const endIdx = cleanJson.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1) {
    cleanJson = cleanJson.substring(startIdx, endIdx + 1);
  }

  const parsed = JSON.parse(cleanJson);

  const flashcards = (parsed.flashcards || []).map((f: any, idx: number) => ({
    id: `fc-gen-${Date.now()}-${idx}`,
    paper_id: paper.id,
    question: f.question,
    answer: f.answer,
    difficulty: f.difficulty || 'medium',
  }));

  const examQuestions = (parsed.exam_questions || []).map((q: any, idx: number) => ({
    id: `eq-gen-${Date.now()}-${idx}`,
    paper_id: paper.id,
    question: q.question,
    options: q.options || [],
    correct_answer: q.correct_answer,
    explanation: q.explanation || '',
  }));

  return { flashcards, examQuestions };
}


// ─── SSE / agent response helper ─────────────────────────────────────────────

async function runAgentAndGetReply(
  conversationId: string,
  message: string
): Promise<string> {
  const client = getClient();

  const stream = await client.conversations.sendMessageStream(conversationId, {
    content: message,
  });

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const textChunks: string[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const raw = line.slice(5).trim();
      if (!raw || raw === '[DONE]') continue;
      try {
        const evt = JSON.parse(raw);
        const delta =
          evt?.delta?.content?.[0]?.text ??
          evt?.content_block_delta?.delta?.text ??
          evt?.choices?.[0]?.delta?.content ??
          null;
        if (typeof delta === 'string') textChunks.push(delta);

        if (evt?.kind === 'text' && evt?.metadata?.is_final_answer === true) {
          textChunks.length = 0;
          textChunks.push(evt.text ?? '');
        }
      } catch {
        // Not JSON — ignore
      }
    }
  }

  const assembled = textChunks.join('');
  if (!assembled.trim()) {
    return pollForFinalMessage(conversationId);
  }
  return assembled;
}

async function pollForFinalMessage(
  conversationId: string,
  maxAttempts = 12,
  intervalMs = 2500
): Promise<string> {
  const client = getClient();

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));

    const res = await client.conversations.messages.list(conversationId, {
      limit: 50,
    });
    const messages = (res.items ?? []) as any[];

    const finalMsg = [...messages]
      .reverse()
      .find(
        (m: any) =>
          m.kind === 'text' &&
          m.metadata?.is_final_answer === true &&
          m.role !== 'user'
      );
    if (finalMsg?.text) return finalMsg.text;

    const assistantMsg = [...messages]
      .reverse()
      .find((m: any) => m.kind === 'text' && m.role !== 'user' && m.text);
    if (assistantMsg?.text && i >= 2) return assistantMsg.text;
  }

  return 'The AI tutor is still processing. Please try again in a moment.';
}

// ─── Public lemma API ─────────────────────────────────────────────────────────

export const lemma = {
  // ── Papers ──────────────────────────────────────────────────────────────────

  listPapers: async (): Promise<AcademicPaper[]> => {
    if (!isPodConfigured()) {
      return mockListPapers();
    }
    try {
      const client = getClient();
      const res = await client.records.list('academic_papers', { limit: 100 });
      return (res.items ?? []) as AcademicPaper[];
    } catch (e) {
      console.error('[lemma] listPapers error:', e);
      return mockListPapers();
    }
  },

  createPaper: async (
    title: string,
    filename: string,
    file?: File | null,
    summary: string = ''
  ): Promise<AcademicPaper> => {
    // Extract text from raw PDF pages or TXT files
    let extractedText = '';
    if (file) {
      try {
        if (file.name.toLowerCase().endsWith('.pdf') && typeof window !== 'undefined' && (window as any).pdfjsLib) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfjsLib = (window as any).pdfjsLib;
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item: any) => item.str).join(' ');
              fullText += pageText + '\n';
            }
            extractedText = fullText.trim();
          } catch (pdfErr) {
            console.error('PDF parsing failed, falling back to raw read:', pdfErr);
            extractedText = await file.text();
          }
        } else {
          extractedText = await file.text();
        }
      } catch (err) {
        console.error('Failed to read file contents:', err);
      }
    }


    if (!isPodConfigured()) {
      const papers = getStorageItem<AcademicPaper>('brainzy_papers', SEED_PAPERS);
      const newPaper: AcademicPaper = {
        id: `paper-${Date.now()}`,
        title: title || filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        filename,
        file_path: `/knowledge/${filename}`,
        summary: summary || 'User uploaded document.',
        created_at: new Date().toISOString(),
        fileContentText: extractedText,
      };
      papers.push(newPaper);
      setStorageItem('brainzy_papers', papers);
      return newPaper;
    }

    const client = getClient();
    let filePath = `/knowledge/${filename}`;

    if (file) {
      try {
        const uploaded = await client.files.upload(file, {
          name: filename,
          directoryPath: '/knowledge',
          searchEnabled: true,
          description: `Uploaded academic paper: ${title}`,
        });
        filePath = uploaded.path ?? filePath;
      } catch (uploadErr) {
        console.error('[lemma] file upload error:', uploadErr);
      }
    }

    try {
      const record = await client.records.create('academic_papers', {
        title,
        filename,
        file_path: filePath,
        summary,
        fileContentText: extractedText,
      });
      return record as AcademicPaper;
    } catch (e) {
      console.error('[lemma] createPaper record error:', e);
      // Fallback
      const papers = getStorageItem<AcademicPaper>('brainzy_papers', SEED_PAPERS);
      const newPaper: AcademicPaper = {
        id: `paper-${Date.now()}`,
        title: title || filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        filename,
        file_path: filePath,
        summary: summary || 'User uploaded document.',
        created_at: new Date().toISOString(),
        fileContentText: extractedText,
      };
      papers.push(newPaper);
      setStorageItem('brainzy_papers', papers);
      return newPaper;
    }
  },

  deletePaper: async (paperId: string): Promise<void> => {
    if (!isPodConfigured()) {
      const papers = getStorageItem<AcademicPaper>('brainzy_papers', SEED_PAPERS);
      setStorageItem('brainzy_papers', papers.filter(p => p.id !== paperId));
      return;
    }
    try {
      const client = getClient();
      await client.records.delete('academic_papers', paperId);
    } catch (e) {
      console.error('[lemma] deletePaper error:', e);
    }
  },

  // ── Flashcards ───────────────────────────────────────────────────────────────

  listFlashcards: async (paperId: string): Promise<Flashcard[]> => {
    if (!isPodConfigured()) {
      const all = getStorageItem<Flashcard>('brainzy_flashcards', SEED_FLASHCARDS);
      return all.filter(f => f.paper_id === paperId);
    }
    try {
      const client = getClient();
      const res = await client.records.list('flashcards', { limit: 200 });
      const items = (res.items ?? []) as Flashcard[];
      return items.filter((f) => f.paper_id === paperId);
    } catch (e) {
      console.error('[lemma] listFlashcards error:', e);
      const all = getStorageItem<Flashcard>('brainzy_flashcards', SEED_FLASHCARDS);
      return all.filter(f => f.paper_id === paperId);
    }
  },

  rateFlashcard: async (
    cardId: string,
    difficulty: 'easy' | 'medium' | 'hard'
  ): Promise<void> => {
    if (!isPodConfigured()) {
      const all = getStorageItem<Flashcard>('brainzy_flashcards', SEED_FLASHCARDS);
      const card = all.find(c => c.id === cardId);
      if (card) {
        card.difficulty = difficulty;
        setStorageItem('brainzy_flashcards', all);
      }
      return;
    }
    try {
      const client = getClient();
      await client.records.update('flashcards', cardId, { difficulty });
    } catch (e) {
      console.error('[lemma] rateFlashcard error:', e);
    }
  },

  // ── Exam Questions ────────────────────────────────────────────────────────────

  listExamQuestions: async (paperId: string): Promise<ExamQuestion[]> => {
    if (!isPodConfigured()) {
      const all = getStorageItem<ExamQuestion>('brainzy_exam_questions', SEED_EXAM_QUESTIONS);
      return all.filter(q => q.paper_id === paperId);
    }
    try {
      const client = getClient();
      const res = await client.records.list('exam_questions', { limit: 200 });
      const items = (res.items ?? []) as any[];
      return items
        .filter((q) => q.paper_id === paperId)
        .map((q) => ({
          ...q,
          options:
            typeof q.options === 'string' ? JSON.parse(q.options) : q.options ?? [],
        })) as ExamQuestion[];
    } catch (e) {
      console.error('[lemma] listExamQuestions error:', e);
      const all = getStorageItem<ExamQuestion>('brainzy_exam_questions', SEED_EXAM_QUESTIONS);
      return all.filter(q => q.paper_id === paperId);
    }
  },

  // ── Doubt Bot (tutor-agent / Gemini fallback) ────────────────────────────────

  askDoubt: async (
    paperId: string,
    conversationId: string | null,
    question: string
  ): Promise<{ reply: string; conversationId: string }> => {
    // If no pod, use local Gemini API directly
    if (!isPodConfigured()) {
      const papers = mockListPapers();
      const paper = papers.find(p => p.id === paperId);
      if (!paper) {
        throw new Error('Select a paper to ask questions.');
      }
      try {
        const reply = await askGeminiTutor(question, paper);
        return {
          reply,
          conversationId: conversationId || `gemini-conv-${Date.now()}`,
        };
      } catch (geminiErr: any) {
        console.error('[lemma] Gemini fallback error:', geminiErr);
        return {
          reply: `**Fallback Error:** ${geminiErr?.message || 'Failed to call Gemini.'}\n\nPlease verify that your \`NEXT_PUBLIC_GEMINI_API_KEY\` is correctly set in \`.env.local\`.`,
          conversationId: conversationId || 'error-conv',
        };
      }
    }

    const client = getClient();
    try {
      let activeConvId = conversationId;

      if (!activeConvId) {
        const conv = await client.conversations.create({
          agent_name: 'tutor-agent',
          title: `Doubt session — paper ${paperId}`,
        });
        activeConvId = conv.id;
      }

      const contextualQuestion =
        paperId && paperId !== '__custom__'
          ? `[Regarding document with paper_id: ${paperId}]\n\n${question}`
          : question;

      const reply = await runAgentAndGetReply(activeConvId, contextualQuestion);
      return { reply, conversationId: activeConvId };
    } catch (error: any) {
      console.error('[lemma] askDoubt error:', error);
      // Try Gemini fallback if agent fails
      const papers = mockListPapers();
      const paper = papers.find(p => p.id === paperId);
      if (paper) {
        try {
          const reply = await askGeminiTutor(question, paper);
          return { reply, conversationId: conversationId || 'gemini-fallback' };
        } catch {}
      }
      throw error;
    }
  },

  // ── Study Material Generation (quiz-generator-agent / Gemini fallback) ────────

  generateStudyMaterials: async (
    paperId: string
  ): Promise<{ success: boolean; flashcardsCount: number; questionsCount: number }> => {
    if (!isPodConfigured()) {
      const papers = mockListPapers();
      const paper = papers.find(p => p.id === paperId);
      if (!paper) throw new Error('Paper not found');

      try {
        const { flashcards, examQuestions } = await generateStudyMaterialsWithGemini(paper);
        
        // Save to localStorage
        const existingFlashcards = getStorageItem<Flashcard>('brainzy_flashcards', SEED_FLASHCARDS);
        const filteredFc = existingFlashcards.filter(f => f.paper_id !== paperId);
        setStorageItem('brainzy_flashcards', [...filteredFc, ...flashcards]);

        const existingQuestions = getStorageItem<ExamQuestion>('brainzy_exam_questions', SEED_EXAM_QUESTIONS);
        const filteredEq = existingQuestions.filter(q => q.paper_id !== paperId);
        setStorageItem('brainzy_exam_questions', [...filteredEq, ...examQuestions]);

        return {
          success: true,
          flashcardsCount: flashcards.length,
          questionsCount: examQuestions.length,
        };
      } catch (geminiErr: any) {
        console.error('[lemma] generateStudyMaterials Gemini error:', geminiErr);
        throw new Error(`Gemini Study Material Generation failed: ${geminiErr?.message || 'Verify your API key.'}`);
      }
    }

    const client = getClient();
    try {
      const resPaper = await client.records.get('academic_papers', paperId);
      if (!resPaper) throw new Error('Paper not found');

      const prompt = `Generate study flashcards AND practice exam questions for the paper with ID '${paperId}' titled '${resPaper.title}' stored at path '${resPaper.file_path}'. 
Read the document from the pod file system, extract key concepts, and:
1. Create at least 5 flashcards with question/answer pairs — write them to the flashcards table with paper_id='${paperId}'
2. Create at least 5 multiple-choice exam questions — write them to the exam_questions table with paper_id='${paperId}'
Link all records using paper_id='${paperId}'.`;

      const conv = await client.conversations.create({
        agent_name: 'quiz-generator-agent',
        title: `Generate materials for ${resPaper.title}`,
      });

      await client.conversations.messages.send(conv.id, { content: prompt });

      let flashcards: Flashcard[] = [];
      let examQuestions: ExamQuestion[] = [];

      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise((r) => setTimeout(r, 3000));
        flashcards = await lemma.listFlashcards(paperId);
        examQuestions = await lemma.listExamQuestions(paperId);
        if (flashcards.length > 0 || examQuestions.length > 0) break;
      }

      return {
        success: true,
        flashcardsCount: flashcards.length,
        questionsCount: examQuestions.length,
      };
    } catch (error: any) {
      console.error('[lemma] generateStudyMaterials error:', error);
      throw new Error(
        `Study material generation failed: ${error?.message ?? 'Unknown error'}`
      );
    }
  },
};

export { getClient };

/**
 * lemma.ts — Brainzy Lemma SDK integration layer
 *
 * Uses the official lemma-sdk to talk to the pod:
 *   - records API  → academic_papers, flashcards, exam_questions tables
 *   - files API    → /knowledge folder for PDF storage
 *   - conversations API → tutor-agent (chat/summary/roadmap) & quiz-generator-agent
 *
 * Works in BOTH environments:
 *   - Local dev:  reads NEXT_PUBLIC_LEMMA_POD_ID from .env.local
 *   - Lemma desk: reads window.__LEMMA_CONFIG__ injected by the host (podId auto-set)
 */

import { LemmaClient, readSSE, parseSSEJson } from 'lemma-sdk';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AcademicPaper {
  id: string;
  title: string;
  filename: string;
  file_path: string;
  summary?: string;
  created_at?: string;
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

// ─── Singleton client ─────────────────────────────────────────────────────────

let _client: LemmaClient | null = null;

function getClient(): LemmaClient {
  if (_client) return _client;

  // When deployed as a Lemma desk, window.__LEMMA_CONFIG__ is auto-injected.
  // LemmaClient() with no args reads from it automatically.
  // In local dev, pass the pod ID via env var.
  const podId =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_LEMMA_POD_ID) ||
    undefined;

  _client = new LemmaClient(podId ? { podId } : {});
  return _client;
}

// ─── SSE / agent response helper ─────────────────────────────────────────────

/**
 * Sends a message to an agent and consumes the SSE stream, collecting
 * all text chunks. Returns the final assembled text.
 */
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

    // Process complete SSE lines
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const raw = line.slice(5).trim();
      if (!raw || raw === '[DONE]') continue;
      try {
        const evt = JSON.parse(raw);
        // Text delta events
        const delta =
          evt?.delta?.content?.[0]?.text ??
          evt?.content_block_delta?.delta?.text ??
          evt?.choices?.[0]?.delta?.content ??
          null;
        if (typeof delta === 'string') textChunks.push(delta);

        // Final answer event (Lemma-specific)
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

  // If streaming gave nothing, fall back to polling messages list
  if (!assembled.trim()) {
    return pollForFinalMessage(conversationId);
  }
  return assembled;
}

/**
 * Polls conversation messages until a final-answer message appears.
 * Used as a fallback when the SSE stream yields no text.
 */
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

    // Look for final answer
    const finalMsg = [...messages]
      .reverse()
      .find(
        (m: any) =>
          m.kind === 'text' &&
          m.metadata?.is_final_answer === true &&
          m.role !== 'user'
      );
    if (finalMsg?.text) return finalMsg.text;

    // Also accept any non-user text message
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
    try {
      const client = getClient();
      const res = await client.records.list('academic_papers', { limit: 100 });
      return (res.items ?? []) as AcademicPaper[];
    } catch (e) {
      console.error('[lemma] listPapers error:', e);
      return [];
    }
  },

  /**
   * Upload a file to Lemma's /knowledge folder, then create a record in the
   * academic_papers table.  The `file` param is the raw File object from the
   * browser's file picker.
   */
  createPaper: async (
    title: string,
    filename: string,
    file?: File | null,
    summary: string = ''
  ): Promise<AcademicPaper> => {
    const client = getClient();
    let filePath = `/knowledge/${filename}`;

    if (file) {
      try {
        // Upload to Lemma file storage with search indexing enabled
        const uploaded = await client.files.upload(file, {
          name: filename,
          directoryPath: '/knowledge',
          searchEnabled: true,
          description: `Uploaded academic paper: ${title}`,
        });
        filePath = uploaded.path ?? filePath;
      } catch (uploadErr) {
        console.error('[lemma] file upload error:', uploadErr);
        // Continue — record can still be created with the path
      }
    }

    const record = await client.records.create('academic_papers', {
      title,
      filename,
      file_path: filePath,
      summary,
    });

    return record as AcademicPaper;
  },

  deletePaper: async (paperId: string): Promise<void> => {
    try {
      const client = getClient();
      await client.records.delete('academic_papers', paperId);
    } catch (e) {
      console.error('[lemma] deletePaper error:', e);
    }
  },

  // ── Flashcards ───────────────────────────────────────────────────────────────

  listFlashcards: async (paperId: string): Promise<Flashcard[]> => {
    try {
      const client = getClient();
      const res = await client.records.list('flashcards', { limit: 200 });
      const items = (res.items ?? []) as Flashcard[];
      return items.filter((f) => f.paper_id === paperId);
    } catch (e) {
      console.error('[lemma] listFlashcards error:', e);
      return [];
    }
  },

  rateFlashcard: async (
    cardId: string,
    difficulty: 'easy' | 'medium' | 'hard'
  ): Promise<void> => {
    try {
      const client = getClient();
      await client.records.update('flashcards', cardId, { difficulty });
    } catch (e) {
      console.error('[lemma] rateFlashcard error:', e);
    }
  },

  // ── Exam Questions ────────────────────────────────────────────────────────────

  listExamQuestions: async (paperId: string): Promise<ExamQuestion[]> => {
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
      return [];
    }
  },

  // ── Doubt Bot (tutor-agent via SSE streaming) ────────────────────────────────

  askDoubt: async (
    paperId: string,
    conversationId: string | null,
    question: string
  ): Promise<{ reply: string; conversationId: string }> => {
    const client = getClient();

    try {
      let activeConvId = conversationId;

      // Create a new conversation with tutor-agent if needed
      if (!activeConvId) {
        const conv = await client.conversations.create({
          agent_name: 'tutor-agent',
          title: `Doubt session — paper ${paperId}`,
        });
        activeConvId = conv.id;
      }

      // Build context-rich question that includes paper reference
      const contextualQuestion =
        paperId && paperId !== '__custom__'
          ? `[Regarding document with paper_id: ${paperId}]\n\n${question}`
          : question;

      const reply = await runAgentAndGetReply(activeConvId, contextualQuestion);

      return { reply, conversationId: activeConvId };
    } catch (error: any) {
      console.error('[lemma] askDoubt error:', error);
      throw new Error(`Agent error: ${error?.message ?? 'Unknown error'}`);
    }
  },

  // ── Study Material Generation (quiz-generator-agent) ────────────────────────

  generateStudyMaterials: async (
    paperId: string
  ): Promise<{ success: boolean; flashcardsCount: number; questionsCount: number }> => {
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

      // Start the agent — we don't need to wait for streaming, just fire and poll
      await client.conversations.messages.send(conv.id, { content: prompt });

      // Poll up to 30 seconds for the agent to write records
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

// ─── Auth helper re-export ────────────────────────────────────────────────────

export { getClient };

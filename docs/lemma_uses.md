# Lemma Integration in Brainzy

Brainzy is built on top of the **Lemma Platform**, utilizing the **Lemma TypeScript SDK (`lemma-sdk`)** for its entire data management, file grounding, and agent execution layers. This document details how each feature inside the application connects to a Lemma Pod.

---

## 🏗️ Architecture & Configuration

In production, Brainzy is deployed as a **Static App Desk** inside a Lemma Pod. 
- **Auto-Config**: The Lemma host automatically injects `window.__LEMMA_CONFIG__` (containing `podId`, `apiUrl`, and `authUrl`) into the desk's environment.
- **SSO Authentication**: The application utilizes Lemma's built-in session cookies, meaning users are automatically authenticated as pod members without managing credentials.
- **Client Instance**: The `LemmaClient` is initialized with zero overrides in production to dynamically read and bind to the active pod context.

---

## 🔌 API & Feature Mapping

### 1. Academic Storage (Files Upload)
- **Feature**: Uploading syllabus materials (PDF, TXT, etc.) to the academic library.
- **Lemma SDK Call**: `client.files.upload(file, { name, directoryPath: '/knowledge', searchEnabled: true })`
- **Mechanism**: Files are stored in the pod's `/knowledge` directory. Enabling `searchEnabled` allows Lemma's semantic search indexing engine to parse and present the content to agents.

### 2. Document Inventory (Datastore Records)
- **Feature**: Listing and selecting uploaded files.
- **Lemma SDK Call**: `client.records.list('academic_papers', { limit: 100 })` and `client.records.delete('academic_papers', id)`
- **Mechanism**: The metadata of the papers (title, filename, storage path, summaries) is persisted in the pod's `academic_papers` table.

### 3. Doubt Bot & AI Summary (Conversations & Agents)
- **Feature**: Grounded Q&A chat and automatic summary synthesis.
- **Lemma SDK Call**: 
  1. `client.conversations.create({ agent_name: 'tutor-agent', title })` (creates/resolves a thread linked to the pod's `tutor-agent`)
  2. `client.conversations.sendMessageStream(conversationId, { content })` (streams responses)
- **Mechanism**: The `tutor-agent` reads the paper content directly from `/knowledge` using its granted `POD` toolset permissions, maintaining a direct chat history thread.

### 4. Active Recall Flashcards (Records & Generator Agent)
- **Feature**: Self-assessment flashcard generator.
- **Lemma SDK Call**:
  - `client.conversations.create({ agent_name: 'quiz-generator-agent' })` (spawns generator thread)
  - `client.records.list('flashcards')` (retrieves generated cards)
  - `client.records.update('flashcards', cardId, { difficulty })` (updates user rating)
- **Mechanism**: Spawning `quiz-generator-agent` triggers the model to read the active paper from the pod, construct flashcard records, and insert them directly into the pod's `flashcards` table with foreign key references.

### 5. Practice Exam Generator (Records & Generator Agent)
- **Feature**: Practice multiple-choice exam generation.
- **Lemma SDK Call**:
  - `client.records.list('exam_questions')`
- **Mechanism**: Triggered simultaneously with flashcards via the `quiz-generator-agent`, which writes multi-choice structures (options array, correct answer, explanation) directly into the pod's `exam_questions` table.

---

## 📊 Database Schema Setup

The app utilizes four primary tables provisioned in the Lemma Pod Datastore:

1. **`academic_papers`**: Holds references and path names for uploaded documents.
2. **`flashcards`**: Stores question-answer pairs linked to `academic_papers.id`.
3. **`exam_questions`**: Stores JSON options, correct answers, and explanations.
4. **`user_progress`**: Tracks manual study logs and task completion states.

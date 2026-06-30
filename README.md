# Brainzy - AI Study Companion

An AI-powered academic learning companion that helps students study effectively through automated syllabus grounding, interactive tutoring, study planning, progress tracking, and dynamic quiz generation.

---

## 🚀 Features

1. **Academic Storage**: Manage syllabus materials (PDFs, DOCX, TXT, MD) with capacity allocation meters, secure upload sequences, and dynamic document selection context propagation.
2. **Doubt Bot**: Engage with a smart tutoring assistant grounded strictly in your selected storage documents, built on Lemma's `tutor-agent` pipeline.
3. **AI Summary Synthesis**: Generate in-depth summaries from academic papers utilizing the grounded content parser.
4. **Active Recall Flashcards**: Review terms, flip cards to show solutions, and rate difficulties (Easy, Medium, Hard) to track progress.
5. **Practice Exam**: Customize question counts, solve MCQs, and get instant grading feedback.
6. **Study Timer**: Run Pomodoro focus intervals with active state triggers.
7. **Progress Tracker**: Log manual study sessions, view accumulated metrics (focused minutes, streaks), and visualize study distribution on a weekly performance chart.
8. **Roadmap & Planner**: Schedule active revision itinerary slots with customizable dates, durations, and priorities, with toggleable checkboxes and deletion options.
9. **Premium Light & Dark Mode**: Professional dark mode theme switcher mapping to deep slate aesthetics.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Vanilla CSS
- **Orchestration Backend**: Lemma TypeScript SDK (`lemma-sdk`) for all datastores, files, and conversations
- **Deployment Platform**: Lemma.work Static App Desks
- **AI Runtimes**: `tutor-agent` and `quiz-generator-agent` running natively inside the Lemma Pod

---

## ⚙️ Prerequisites & Setup

Ensure the following tools are installed on your host system:
- **Node.js** (v18 or higher)

### 1. Install Project Dependencies
Navigate to the frontend folder and install the node dependencies:
```bash
cd frontend
npm install
```

### 2. Build the Static App Desk
Create the production-optimized static build bundle:
```bash
cd frontend
npm run build
```
This generates the static export inside the `frontend/out/` directory and creates `frontend/brainzy-desk.zip` (ready for uploading to Lemma.work).

---

## 💻 Running & Deploying the Application

### Deploying the Backend (Tables & Agents)
1. Get your Pod ID and API Token from [app.lemma.work](https://app.lemma.work) → Pod Settings → Developer.
2. Run the deployment script to provision tables (`academic_papers`, `flashcards`, etc.) and agents (`tutor-agent`, `quiz-generator-agent`) in your pod:
```bash
cd backend
$env:LEMMA_TOKEN = "your-api-token"
node deploy-to-lemma.js --pod-id <YOUR_POD_ID>
```

### Deploying the Frontend (Static App Desk)
1. Go to **[app.lemma.work](https://app.lemma.work)** → your pod → **Desks**.
2. Click **New Desk** and choose **Static App** / **Upload Files**.
3. Upload `frontend/brainzy-desk.zip`.
4. Set entry point to `index.html` and name the desk **Brainzy**.
5. Publish the desk. Lemma will automatically inject the required credentials via `window.__LEMMA_CONFIG__`.

---

## 📖 How the App Works (Core Workflow)

1. **Ground the AI (Storage Tab)**:
   - Go to the **Storage** tab.
   - Drag & drop a syllabus document (e.g. PDF or TXT) into the uploader.
   - The file is uploaded to the pod's `/knowledge` directory using the Lemma files API.
2. **Chat with Doubt Bot (Doubt Bot Tab)**:
   - Ask questions about the paper in natural language.
   - The bot communicates with `tutor-agent` via a Lemma conversation stream. The agent reads the context directly from the pod's file system.
3. **Generate Quizzes & Flashcards**:
   - Inside the flashcards or exam tab, select the active paper and click **Generate Study Materials**.
   - Brainzy spawns a `quiz-generator-agent` run, which reads the paper and writes flashcards and quiz questions directly to the corresponding datastore tables.
4. **Log & Review Analytics (Progress Tracker Tab)**:
   - View your study consistency graphs and streaks.
   - Submit manual entries to save progress records into the pod's `user_progress` table.

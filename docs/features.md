# Brainzy App Features

## 1. Academic Storage (Inventory)
Grounds your study companion with actual syllabus materials and document references inside Lemma.
- **Syllabus Uploader**: Selects a PDF/TXT document and uploads it directly to the pod's `/knowledge` directory using the Lemma Files API (`client.files.upload`).
- **Capacity Meter**: Real-time display showing allocation limits (`54 KB / 50,000 KB`) and cloud encryption indicators.
- **Active Document Selector**: Toggling document context instantly selects and propagates the chosen paper to all other AI tabs.

---

## 2. Doubt Bot (AI Tutor)
A chat interface connected to Lemma's `tutor-agent` for addressing queries about grounded text.
- **Contextual Grounding**: Uses the conversation API to stream answers from `tutor-agent`, which leverages its permissions to read files stored in the pod `/knowledge` directory.
- **Agent Chat History**: Retains session-specific conversation context dynamically mapped to a thread in the pod's workspace.

---

## 3. AI Summary Synthesis
Generates clear study outlines and summaries from long documents.
- **One-Click Synthesis**: Communicates with `tutor-agent` to outline core definitions and structural explanations of the selected paper.
- **Loading Synthesis State**: Interactive loading spinner reflecting active drafting phases.

---

## 4. Active Recall Flashcards
Enables fast self-testing and memorization.
- **Card Flipper**: Clean card flip animations showing question vs answer prompts.
- **Difficulty Ratings**: Rate cards (Easy, Medium, Hard) to automatically update record values in the pod's `flashcards` table.
- **Progress Tracking**: Bar meter showing completion percentages.

---

## 5. Practice Exam Generator
Creates interactive multiple-choice tests.
- **Custom Count Selector**: Select counts and trigger `quiz-generator-agent` which writes questions directly to the pod's `exam_questions` table.
- **Interactive MCQ Cards**: Select options with live checks and explanations.
- **Grading & Scoring**: Live submission grading revealing correct/incorrect answer structures.


---

## 6. Study Timer
A Pomodoro-style time manager.
- **Focus Presets**: Focus Session (25 min), Short Break (5 min), and Long Break (15 min).
- **Visual Circular Dial**: Minimalist countdown dial tracking study states.

---

## 7. Progress Tracker
Monitors streaks and session histories.
- **Academic Metrics**: Accumulates total focus time (e.g., `250 min`), streak days (`5 days`), and completed activities (`6 modules`).
- **Weekly Distribution Graph**: Custom SVG bar chart visualizing study time across weekdays.
- **Manual Logger Sidebar**: Submit customized study entries detailing subject, duration, and activity.

---

## 8. Revision Planner & Roadmap
Maps out goals and schedules.
- **Curriculum Milestones**: Preseeded structures for Neuroscience, Psychology, and Mechanics topics.
- **Interactive Revision Itinerary**: Add slots, check them as complete to update statistics, or delete unneeded schedules.

---

## 9. Audio & Transcription
Allows you to record voice lectures or dictations and transcribe them into study notes.
- **Real-Time Voice Recorder**: Captures mic inputs directly in the browser via HTML5 `MediaRecorder` API.
- **Live Speech-to-Text**: Outputs live transcription text instantly using browser `SpeechRecognition` API.
- **Interactive Playback**: Listen back to captured audio via integrated HTML5 audio player before grounding.

---

## 10. Premium Theme Switcher
- **Light/Dark Mode**: High-contrast theme mapping. The Workspace Sandbox defaults to **Light Mode** initially to optimize visibility, with toggleable support for a premium dark charcoal theme.

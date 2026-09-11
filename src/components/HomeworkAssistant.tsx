import { useState } from "react";
import Markdown from "react-markdown";
import {
  BookOpen,
  FileText,
  HelpCircle,
  Sparkles,
  Copy,
  Check,
  Download,
  Printer,
  Bookmark,
  BookmarkCheck,
  Volume2,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";
import { HomeworkRecord, StudentLevel, LanguageMode } from "../types";
import { exportAsFile, printContent } from "../lib/storage";
import { speechService } from "../lib/speech";

interface HomeworkAssistantProps {
  studentLevel: StudentLevel;
  languageMode: LanguageMode;
  onSaveRecord: (rec: HomeworkRecord) => void;
  recentRecords: HomeworkRecord[];
  onAddBookmark: (title: string, content: string, source: string) => void;
  onRemoveBookmark: (title: string) => void;
  isBookmarked: (id: string) => boolean;
}

export default function HomeworkAssistant({
  studentLevel,
  languageMode,
  onSaveRecord,
  recentRecords,
  onAddBookmark,
  onRemoveBookmark,
  isBookmarked,
}: HomeworkAssistantProps) {
  const [taskType, setTaskType] = useState<"guidance" | "notes">("guidance");
  const [subject, setSubject] = useState("Physics");
  const [assignmentText, setAssignmentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const subjects = [
    "Physics",
    "Chemistry",
    "Biology",
    "Mathematics",
    "Computer Science & ICT",
    "English Literature",
    "Economics & Business",
    "History & Social Sciences",
  ];

  const presets = [
    {
      subject: "Physics",
      title: "Electromagnetic Induction & Faraday's Law",
      taskType: "notes" as const,
      text: "Create revision study notes on Faraday's Law of Electromagnetic Induction, Lenz's Law, induced EMF formula, and real-world transformer applications.",
    },
    {
      subject: "Biology",
      title: "Cellular Respiration vs Photosynthesis",
      taskType: "guidance" as const,
      text: "I have an assignment comparing the biochemical pathways of aerobic cellular respiration (Glycolysis, Krebs Cycle, ETC) and Photosynthesis. How should I structure my essay?",
    },
    {
      subject: "Chemistry",
      title: "Periodic Trends & Chemical Bonding",
      taskType: "notes" as const,
      text: "High-yield summary notes on Electronegativity, Ionization Energy, Atomic Radius trends across groups and periods, and Ionic vs Covalent bonding differences.",
    },
  ];

  const handleGenerate = async () => {
    if (!assignmentText.trim() || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentText: assignmentText.trim(),
          taskType,
          subject,
          level: studentLevel,
          language: languageMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate homework response");
      }

      const data = await response.json();
      setResult(data.result);

      const record: HomeworkRecord = {
        id: `hw-${Date.now()}`,
        title: assignmentText.slice(0, 36) + (assignmentText.length > 36 ? "..." : ""),
        subject,
        taskType,
        content: data.result,
        timestamp: Date.now(),
      };

      setActiveRecordId(record.id);
      onSaveRecord(record);
    } catch (err: any) {
      console.error("Homework error:", err);
      setResult(
        `### Could not generate assistance\n\nError: ${err.message}. Please try again in a few moments.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    if (!result) return;
    exportAsFile(
      `# ${taskType === "notes" ? "Study Notes" : "Assignment Guidance"}: ${subject}\n\n${result}`,
      `${taskType}-${subject.toLowerCase()}-${Date.now()}.md`
    );
  };

  const handlePrint = () => {
    if (!result) return;
    printContent(
      `${taskType === "notes" ? "Study Notes" : "Assignment Guidance"}: ${subject}`,
      result
    );
  };

  const toggleSpeak = () => {
    if (!result) return;
    if (speaking) {
      speechService.stop();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      speechService.speak(result);
    }
  };

  const handleBookmarkCurrent = () => {
    if (!result || !activeRecordId) return;
    if (isBookmarked(activeRecordId)) {
      onRemoveBookmark(activeRecordId);
    } else {
      onAddBookmark(
        `${taskType === "notes" ? "Notes" : "Homework"}: ${subject} - ${assignmentText.slice(0, 30)}`,
        result,
        subject
      );
    }
  };

  return (
    <div id="homework-assistant-container" className="flex-1 overflow-y-auto max-w-6xl mx-auto w-full p-3 sm:p-6 space-y-6 custom-scrollbar">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Homework Assistant & Study Notes
          </h1>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
            Academic Integrity Friendly
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Gain deep conceptual understanding of homework questions, learn how to solve them step-by-step, or generate comprehensive high-retention study notes with mnemonics.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setTaskType("guidance")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            taskType === "guidance"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 dark:bg-emerald-500"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Assignment Guidance & Breakdown</span>
        </button>

        <button
          onClick={() => setTaskType("notes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            taskType === "notes"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 dark:bg-emerald-500"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Generate Structured Study Notes</span>
        </button>
      </div>

      {/* Grid: Form & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider block mb-1">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider block mb-1">
                {taskType === "guidance"
                  ? "Homework Question or Prompt"
                  : "Topic to Create Notes On"}
              </label>
              <textarea
                id="homework-input-textarea"
                rows={5}
                value={assignmentText}
                onChange={(e) => setAssignmentText(e.target.value)}
                placeholder={
                  taskType === "guidance"
                    ? "Paste the homework question you need help understanding..."
                    : "Enter topic (e.g., Photosynthesis, Thermodynamics, Quantum Numbers, Shakespeare's Macbeth)..."
                }
                className="w-full p-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <button
              id="generate-homework-btn"
              onClick={handleGenerate}
              disabled={!assignmentText.trim() || loading}
              className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 text-white transition-all shadow-md ${
                !assignmentText.trim() || loading
                  ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
              }`}
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Academic Materials...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {taskType === "guidance"
                      ? "Get Assignment Breakdown"
                      : "Generate Study Notes"}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Quick Examples */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Recommended Topics & Questions</span>
            </div>
            <div className="space-y-2">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSubject(p.subject);
                    setTaskType(p.taskType);
                    setAssignmentText(p.text);
                  }}
                  className="w-full text-left p-2.5 rounded-xl text-xs bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/70 dark:border-slate-700 transition group"
                >
                  <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    <span>{p.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 font-mono">
                      {p.taskType}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{p.text}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Output Column */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm min-h-[460px] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                {taskType === "guidance" ? "Guidance & Strategy" : "Structured Study Notes"}
              </span>

              {result && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleSpeak}
                    className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition ${
                      speaking ? "text-emerald-600" : "text-slate-400"
                    }`}
                    title="Read Aloud"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    title="Copy Content"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleBookmarkCurrent}
                    className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition ${
                      activeRecordId && isBookmarked(activeRecordId) ? "text-amber-500" : "text-slate-400"
                    }`}
                    title="Bookmark"
                  >
                    {activeRecordId && isBookmarked(activeRecordId) ? (
                      <BookmarkCheck className="w-4 h-4 text-amber-500 fill-amber-500" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={handleExport}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    title="Download as Markdown"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handlePrint}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    title="Print Document"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center gap-3 text-center p-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center animate-pulse">
                    <BookOpen className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Generating High-Yield Material...
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Structuring concepts, key definitions, formulas, and self-check rubrics.
                    </p>
                  </div>
                </div>
              ) : result ? (
                <div className="markdown-body prose dark:prose-invert max-w-none text-sm space-y-3">
                  <Markdown>{result}</Markdown>
                </div>
              ) : (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    No Material Generated Yet
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Select a subject and type an assignment topic or question to get step-by-step guidance or comprehensive study notes.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

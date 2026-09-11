import { useState } from "react";
import Markdown from "react-markdown";
import {
  PenTool,
  SpellCheck,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  Download,
  Printer,
  Bookmark,
  BookmarkCheck,
  Volume2,
  Lightbulb,
  FileCheck,
} from "lucide-react";
import { WritingRecord, StudentLevel } from "../types";
import { exportAsFile, printContent } from "../lib/storage";
import { speechService } from "../lib/speech";

interface WritingAssistantProps {
  studentLevel: StudentLevel;
  onSaveRecord: (rec: WritingRecord) => void;
  recentRecords: WritingRecord[];
  onAddBookmark: (title: string, content: string, source: string) => void;
  onRemoveBookmark: (title: string) => void;
  isBookmarked: (id: string) => boolean;
}

export default function WritingAssistant({
  studentLevel,
  onSaveRecord,
  recentRecords,
  onAddBookmark,
  onRemoveBookmark,
  isBookmarked,
}: WritingAssistantProps) {
  const [mode, setMode] = useState<"grammar" | "essay-feedback" | "improve-vocab">("grammar");
  const [inputText, setInputText] = useState("");
  const [targetTone, setTargetTone] = useState("academic");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const presets = [
    {
      title: "Grammar & Subject-Verb Agreement",
      mode: "grammar" as const,
      text: "The collection of scientific books are on the table, and each of the students have submitted their paper yesterday. Its important that everyone understands their role.",
    },
    {
      title: "College Essay on Renewable Energy",
      mode: "essay-feedback" as const,
      text: "Solar energy is good for the environment because coal causes big pollution. Many countries are putting solar panels everywhere. Therefore, the government should give more money for solar panels because it is very important for future generations.",
    },
    {
      title: "Vocabulary Upgrade Sample",
      mode: "improve-vocab" as const,
      text: "This experiment shows that the chemical reaction happens very fast when heated. We got big results that prove our idea is right.",
    },
  ];

  const handleAnalyze = async () => {
    if (!inputText.trim() || loading) return;
    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText.trim(),
          mode,
          level: studentLevel,
          targetTone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to analyze writing");
      }

      const data = await response.json();
      setFeedback(data.feedback);

      const record: WritingRecord = {
        id: `write-${Date.now()}`,
        originalText: inputText.trim(),
        mode,
        feedback: data.feedback,
        timestamp: Date.now(),
      };

      setActiveRecordId(record.id);
      onSaveRecord(record);
    } catch (err: any) {
      console.error("Writing assistant error:", err);
      setFeedback(
        `### Analysis Failed\n\nError: ${err.message}. Please check your connection and try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!feedback) return;
    navigator.clipboard.writeText(feedback);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    if (!feedback) return;
    exportAsFile(
      `# Writing Assistant Feedback (${mode.toUpperCase()})\n\nOriginal Text:\n${inputText}\n\n${feedback}`,
      `writing-${mode}-${Date.now()}.md`
    );
  };

  const handlePrint = () => {
    if (!feedback) return;
    printContent(`Writing Assistant Review: ${mode.toUpperCase()}`, feedback);
  };

  const toggleSpeak = () => {
    if (!feedback) return;
    if (speaking) {
      speechService.stop();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      speechService.speak(feedback);
    }
  };

  const handleBookmarkCurrent = () => {
    if (!feedback || !activeRecordId) return;
    if (isBookmarked(activeRecordId)) {
      onRemoveBookmark(activeRecordId);
    } else {
      onAddBookmark(
        `Writing (${mode}): ${inputText.slice(0, 30)}...`,
        feedback,
        "English Writing"
      );
    }
  };

  return (
    <div id="writing-assistant-container" className="flex-1 overflow-y-auto max-w-6xl mx-auto w-full p-3 sm:p-6 space-y-6 custom-scrollbar">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <PenTool className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Writing & Grammar Assistant
          </h1>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-800">
            English Fluency Coach
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Perfect your grammar, polish essays with structured thesis and flow feedback, and upgrade vocabulary to academic quality.
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setMode("grammar")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            mode === "grammar"
              ? "bg-rose-600 text-white shadow-md shadow-rose-600/20 dark:bg-rose-500"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          <SpellCheck className="w-4 h-4" />
          <span>Grammar & Punctuation Correction</span>
        </button>

        <button
          onClick={() => setMode("essay-feedback")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            mode === "essay-feedback"
              ? "bg-rose-600 text-white shadow-md shadow-rose-600/20 dark:bg-rose-500"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Essay Review & Argument Analysis</span>
        </button>

        <button
          onClick={() => setMode("improve-vocab")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            mode === "improve-vocab"
              ? "bg-rose-600 text-white shadow-md shadow-rose-600/20 dark:bg-rose-500"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Vocabulary & Style Booster</span>
        </button>
      </div>

      {/* Grid: Editor & Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Text to Analyze
              </label>
              {mode !== "grammar" && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Tone:</span>
                  <select
                    value={targetTone}
                    onChange={(e) => setTargetTone(e.target.value)}
                    className="text-xs px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="academic">Academic</option>
                    <option value="persuasive">Persuasive</option>
                    <option value="concise">Concise</option>
                    <option value="creative">Creative</option>
                  </select>
                </div>
              )}
            </div>

            <textarea
              id="writing-input-textarea"
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your essay paragraph, assignment draft, or sentences here..."
              className="w-full p-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{inputText.trim() ? inputText.trim().split(/\s+/).length : 0} words</span>
              <span>{inputText.length} characters</span>
            </div>

            <button
              id="analyze-writing-btn"
              onClick={handleAnalyze}
              disabled={!inputText.trim() || loading}
              className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 text-white transition-all shadow-md ${
                !inputText.trim() || loading
                  ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60"
                  : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
              }`}
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Analyzing Grammatical Nuances...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>
                    {mode === "grammar"
                      ? "Check Grammar & Punctuation"
                      : mode === "essay-feedback"
                      ? "Get Essay Feedback & Rubric"
                      : "Enhance Vocabulary & Style"}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Presets */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              <Lightbulb className="w-3.5 h-3.5 text-rose-500" />
              <span>Sample Writing Prompts</span>
            </div>
            <div className="space-y-2">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setMode(p.mode);
                    setInputText(p.text);
                  }}
                  className="w-full text-left p-2.5 rounded-xl text-xs bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/70 dark:border-slate-700 transition group"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400">
                    {p.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{p.text}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Output */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm min-h-[460px] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Writing Coach Review
              </span>

              {feedback && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleSpeak}
                    className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition ${
                      speaking ? "text-rose-600" : "text-slate-400"
                    }`}
                    title="Read Aloud"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    title="Copy Feedback"
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
                    title="Download Markdown"
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
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center animate-pulse">
                    <PenTool className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Polishing & Proofreading...
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Identifying grammatical anomalies, evaluating rhetorical structure, and preparing vocabulary replacements.
                    </p>
                  </div>
                </div>
              ) : feedback ? (
                <div className="markdown-body prose dark:prose-invert max-w-none text-sm space-y-3">
                  <Markdown>{feedback}</Markdown>
                </div>
              ) : (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                    <SpellCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    No Writing Analyzed Yet
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Paste your text on the left to get actionable grammar corrections, essay feedback, or elevated vocabulary.
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

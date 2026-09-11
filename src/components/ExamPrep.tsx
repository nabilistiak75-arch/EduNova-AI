import { useState } from "react";
import Markdown from "react-markdown";
import confetti from "canvas-confetti";
import {
  GraduationCap,
  Calendar,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Award,
  RotateCcw,
  Clock,
  Download,
  Printer,
  ChevronRight,
  Flame,
  BookOpen,
} from "lucide-react";
import { QuizQuestion, QuizRecord, RevisionPlanRecord, StudentLevel, LanguageMode } from "../types";
import { exportAsFile, printContent } from "../lib/storage";

interface ExamPrepProps {
  studentLevel: StudentLevel;
  languageMode: LanguageMode;
  onSaveQuizRecord: (rec: QuizRecord) => void;
  onSaveRevisionPlan: (rec: RevisionPlanRecord) => void;
  quizHistory: QuizRecord[];
}

export default function ExamPrep({
  studentLevel,
  languageMode,
  onSaveQuizRecord,
  onSaveRevisionPlan,
  quizHistory,
}: ExamPrepProps) {
  const [activeTab, setActiveTab] = useState<"quiz" | "revision">("quiz");

  // Quiz Form State
  const [quizTopic, setQuizTopic] = useState("Newton's Laws and Classical Mechanics");
  const [quizSubject, setQuizSubject] = useState("Physics");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [quizLoading, setQuizLoading] = useState(false);

  // Active Quiz State
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Revision Plan Form State
  const [revSubjects, setRevSubjects] = useState("Physics, Calculus, Chemistry");
  const [daysAvailable, setDaysAvailable] = useState(14);
  const [dailyHours, setDailyHours] = useState(4);
  const [revLoading, setRevLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);

  // Subjects
  const subjectsList = [
    "Physics",
    "Chemistry",
    "Mathematics",
    "Biology",
    "English & Literature",
    "Computer Science & ICT",
    "General Science",
  ];

  // Start Generating Quiz
  const handleGenerateQuiz = async () => {
    if (!quizTopic.trim() || quizLoading) return;
    setQuizLoading(true);
    setActiveQuizQuestions(null);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setCurrentQuestionIdx(0);

    try {
      const response = await fetch("/api/exam/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: quizTopic.trim(),
          subject: quizSubject,
          difficulty,
          count: questionCount,
          level: studentLevel,
          language: languageMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate quiz");
      }

      const data = await response.json();
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        setActiveQuizQuestions(data.questions);
      } else {
        throw new Error("Invalid questions format returned by AI");
      }
    } catch (err: any) {
      console.error("Quiz Error:", err);
      alert(`Could not generate quiz: ${err.message}. Please try again.`);
    } finally {
      setQuizLoading(false);
    }
  };

  // Submit Quiz & Grade
  const handleSubmitQuiz = () => {
    if (!activeQuizQuestions) return;

    let score = 0;
    activeQuizQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) {
        score++;
      }
    });

    setQuizScore(score);
    setIsSubmitted(true);

    const record: QuizRecord = {
      id: `quiz-${Date.now()}`,
      topic: quizTopic,
      subject: quizSubject,
      difficulty,
      questions: activeQuizQuestions,
      userAnswers: selectedAnswers,
      score,
      total: activeQuizQuestions.length,
      timestamp: Date.now(),
    };

    onSaveQuizRecord(record);

    // Confetti celebration if 80% or more!
    if (score / activeQuizQuestions.length >= 0.8) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  // Generate Revision Plan
  const handleGeneratePlan = async () => {
    if (!revSubjects.trim() || revLoading) return;
    setRevLoading(true);
    setGeneratedPlan(null);

    try {
      const response = await fetch("/api/exam/revision-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects: revSubjects.trim(),
          daysAvailable,
          dailyHours,
          level: studentLevel,
          language: languageMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate revision plan");
      }

      const data = await response.json();
      setGeneratedPlan(data.plan);

      const record: RevisionPlanRecord = {
        id: `rev-${Date.now()}`,
        subjects: revSubjects,
        daysAvailable,
        planContent: data.plan,
        timestamp: Date.now(),
      };

      onSaveRevisionPlan(record);
    } catch (err: any) {
      console.error("Revision plan error:", err);
      alert(`Could not generate plan: ${err.message}. Please try again.`);
    } finally {
      setRevLoading(false);
    }
  };

  return (
    <div id="exam-prep-container" className="flex-1 overflow-y-auto max-w-6xl mx-auto w-full p-3 sm:p-6 space-y-6 custom-scrollbar">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Exam Preparation & Mastery
          </h1>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-semibold border border-violet-200 dark:border-violet-800">
            Active Recall & Spaced Repetition
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Generate targeted multiple-choice practice quizzes with instant grading and comprehensive explanations, or build a personalized day-by-day exam revision plan.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          id="quiz-generator-tab"
          onClick={() => setActiveTab("quiz")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "quiz"
              ? "bg-violet-600 text-white shadow-md shadow-violet-600/20 dark:bg-violet-500"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Interactive MCQ Quiz Maker</span>
        </button>

        <button
          id="revision-plan-tab"
          onClick={() => setActiveTab("revision")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "revision"
              ? "bg-violet-600 text-white shadow-md shadow-violet-600/20 dark:bg-violet-500"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Exam Revision Plan Generator</span>
        </button>
      </div>

      {/* TAB 1: QUIZ MAKER */}
      {activeTab === "quiz" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
              <h2 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Quiz Configuration
              </h2>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Subject
                </label>
                <select
                  value={quizSubject}
                  onChange={(e) => setQuizSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-violet-500"
                >
                  {subjectsList.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Topic / Exam Syllabus Unit
                </label>
                <input
                  type="text"
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                  placeholder="e.g. Chemical Kinetics, Integration Techniques, Hamlet Act 1..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  >
                    <option value="easy">Easy (Fundamentals)</option>
                    <option value="medium">Medium (Standard Exam)</option>
                    <option value="hard">Hard (Advanced / Olympiad)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Number of Questions
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  >
                    <option value={3}>3 Questions (Quick Drill)</option>
                    <option value={5}>5 Questions (Recommended)</option>
                    <option value={10}>10 Questions (Full Mock)</option>
                  </select>
                </div>
              </div>

              <button
                id="start-quiz-btn"
                onClick={handleGenerateQuiz}
                disabled={!quizTopic.trim() || quizLoading}
                className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 text-white transition-all shadow-md ${
                  !quizTopic.trim() || quizLoading
                    ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60"
                    : "bg-violet-600 hover:bg-violet-700 shadow-violet-600/20"
                }`}
              >
                {quizLoading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Curating Exam Questions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate & Start Quiz</span>
                  </>
                )}
              </button>
            </div>

            {/* Quiz Performance History */}
            {quizHistory.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <span>Recent Quiz Scores</span>
                  <span>{quizHistory.length} completed</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {quizHistory.slice(0, 5).map((q) => {
                    const pct = Math.round((q.score / q.total) * 100);
                    return (
                      <div
                        key={q.id}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {q.topic}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {q.subject} • {q.difficulty}
                          </div>
                        </div>
                        <div
                          className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                            pct >= 80
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : pct >= 50
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                              : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                          }`}
                        >
                          {q.score} / {q.total} ({pct}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Quiz Player */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm min-h-[460px] flex flex-col">
              {quizLoading ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center gap-3 text-center p-6">
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center animate-pulse">
                    <Award className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Generating Interactive Questions...
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Constructing MCQs with multi-step distractor explanations according to {studentLevel} criteria.
                    </p>
                  </div>
                </div>
              ) : activeQuizQuestions ? (
                <div className="flex-1 flex flex-col justify-between">
                  {/* Score Summary Header if Submitted */}
                  {isSubmitted ? (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-sky-50 dark:from-violet-950/40 dark:to-slate-900 border border-violet-200 dark:border-violet-800 mb-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                          Quiz Complete!
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                          Your Score: {quizScore} / {activeQuizQuestions.length} (
                          {Math.round((quizScore / activeQuizQuestions.length) * 100)}%)
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {quizScore / activeQuizQuestions.length >= 0.8
                            ? "🎉 Outstanding mastery! Ready for exam day."
                            : "Keep practicing! Review the detailed explanations below to improve."}
                        </p>
                      </div>
                      <button
                        onClick={handleGenerateQuiz}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 shadow-md shadow-violet-600/20"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retake New</span>
                      </button>
                    </div>
                  ) : (
                    /* Progress header during active quiz */
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Question {currentQuestionIdx + 1} of {activeQuizQuestions.length}
                        </span>
                        <div className="text-xs text-slate-400">{quizTopic}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          Answered: {Object.keys(selectedAnswers).length}/{activeQuizQuestions.length}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Question Stream / Review */}
                  <div className="space-y-6 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                    {/* If submitted, show full review list. If not, show current question */}
                    {(isSubmitted ? activeQuizQuestions : [activeQuizQuestions[currentQuestionIdx]]).map(
                      (q, displayIdx) => {
                        const actualIdx = isSubmitted ? displayIdx : currentQuestionIdx;
                        const userChoice = selectedAnswers[actualIdx];
                        const isCorrect = userChoice === q.correctAnswerIndex;

                        return (
                          <div
                            key={q.id || actualIdx}
                            className={`p-4 rounded-2xl border transition ${
                              isSubmitted
                                ? isCorrect
                                  ? "bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900"
                                  : "bg-red-50/40 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                                : "bg-slate-50/60 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700"
                            }`}
                          >
                            <div className="flex items-start gap-2 mb-3">
                              <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                {actualIdx + 1}
                              </span>
                              <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                                {q.question}
                              </div>
                            </div>

                            {/* Options */}
                            <div className="space-y-2 pl-8">
                              {q.options.map((opt, optIdx) => {
                                const isSelected = userChoice === optIdx;
                                const isRightAnswer = isSubmitted && optIdx === q.correctAnswerIndex;
                                const isWrongSelection = isSubmitted && isSelected && !isRightAnswer;

                                return (
                                  <button
                                    key={optIdx}
                                    disabled={isSubmitted}
                                    onClick={() => {
                                      setSelectedAnswers({
                                        ...selectedAnswers,
                                        [actualIdx]: optIdx,
                                      });
                                    }}
                                    className={`w-full text-left p-3 rounded-xl text-xs font-medium border flex items-center justify-between transition ${
                                      isRightAnswer
                                        ? "bg-emerald-100 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-semibold"
                                        : isWrongSelection
                                        ? "bg-red-100 dark:bg-red-950/70 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200"
                                        : isSelected
                                        ? "bg-violet-50 dark:bg-violet-950/60 border-violet-400 text-violet-800 dark:text-violet-200 font-semibold"
                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-md border text-[10px] font-bold flex items-center justify-center uppercase">
                                        {String.fromCharCode(65 + optIdx)}
                                      </span>
                                      <span>{opt}</span>
                                    </div>
                                    {isRightAnswer && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                    {isWrongSelection && <XCircle className="w-4 h-4 text-red-600" />}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Explanation (Shown when submitted) */}
                            {isSubmitted && (
                              <div className="mt-3 ml-8 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                                <span className="font-bold text-violet-600 dark:text-violet-400 block mb-1">
                                  💡 Step-by-Step Explanation:
                                </span>
                                <p className="leading-relaxed">{q.explanation}</p>
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>

                  {/* Navigation / Submit footer for active quiz */}
                  {!isSubmitted && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between mt-4">
                      <button
                        onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))}
                        disabled={currentQuestionIdx === 0}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40"
                      >
                        Previous
                      </button>

                      <div className="flex items-center gap-2">
                        {currentQuestionIdx < activeQuizQuestions.length - 1 ? (
                          <button
                            onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 shadow-md shadow-violet-600/20 flex items-center gap-1"
                          >
                            <span>Next Question</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            id="submit-quiz-btn"
                            onClick={handleSubmitQuiz}
                            disabled={Object.keys(selectedAnswers).length === 0}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Submit Quiz & Grade</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    No Quiz Active
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Select a subject and syllabus topic on the left to generate customized MCQs with instant feedback.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REVISION PLAN GENERATOR */}
      {activeTab === "revision" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
              <h2 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Revision Schedule Parameters
              </h2>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Subjects / Exam Topics to Cover
                </label>
                <textarea
                  rows={3}
                  value={revSubjects}
                  onChange={(e) => setRevSubjects(e.target.value)}
                  placeholder="e.g. Higher Math (Calculus, Vectors), Physics (Thermodynamics, Waves), Chemistry"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Days Remaining
                  </label>
                  <select
                    value={daysAvailable}
                    onChange={(e) => setDaysAvailable(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  >
                    <option value={7}>7 Days (Final Crash)</option>
                    <option value={14}>14 Days (Standard)</option>
                    <option value={30}>30 Days (Comprehensive)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Daily Study Target
                  </label>
                  <select
                    value={dailyHours}
                    onChange={(e) => setDailyHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  >
                    <option value={2}>2 Hours / Day</option>
                    <option value={4}>4 Hours / Day</option>
                    <option value={6}>6 Hours / Day</option>
                  </select>
                </div>
              </div>

              <button
                id="generate-plan-btn"
                onClick={handleGeneratePlan}
                disabled={!revSubjects.trim() || revLoading}
                className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 text-white transition-all shadow-md ${
                  !revSubjects.trim() || revLoading
                    ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60"
                    : "bg-violet-600 hover:bg-violet-700 shadow-violet-600/20"
                }`}
              >
                {revLoading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Optimizing Revision Timetable...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Revision Plan</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm min-h-[460px] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Day-by-Day Revision Timetable
                </span>

                {generatedPlan && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        exportAsFile(
                          `# Revision Plan (${daysAvailable} Days)\n\n${generatedPlan}`,
                          `revision-plan-${daysAvailable}days-${Date.now()}.md`
                        );
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      title="Download Plan"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => printContent(`Revision Plan - ${daysAvailable} Days`, generatedPlan)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      title="Print Plan"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {revLoading ? (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center gap-3 text-center p-6">
                    <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center animate-pulse">
                      <Calendar className="w-6 h-6 animate-bounce" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Calculating Optimal Review Intervals...
                      </h3>
                      <p className="text-xs text-slate-400 max-w-xs mt-1">
                        Structuring spaced repetition blocks, mock test checkpoints, and Pomodoro schedules.
                      </p>
                    </div>
                  </div>
                ) : generatedPlan ? (
                  <div className="markdown-body prose dark:prose-invert max-w-none text-sm space-y-3">
                    <Markdown>{generatedPlan}</Markdown>
                  </div>
                ) : (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      No Revision Plan Yet
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Configure your exam subjects and remaining days on the left to generate an actionable revision calendar.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

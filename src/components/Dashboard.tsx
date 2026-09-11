import {
  BarChart3,
  Flame,
  Clock,
  Award,
  Calculator,
  BookOpen,
  Bookmark,
  CheckCircle2,
  TrendingUp,
  Target,
  Sparkles,
  ArrowUpRight,
  GraduationCap,
} from "lucide-react";
import { UserProfile, LearningStats, MathRecord, HomeworkRecord, QuizRecord, WritingRecord } from "../types";

interface DashboardProps {
  user: UserProfile;
  stats: LearningStats;
  mathRecords: MathRecord[];
  homeworkRecords: HomeworkRecord[];
  quizRecords: QuizRecord[];
  writingRecords: WritingRecord[];
  onNavigateTab: (tab: any) => void;
}

export default function Dashboard({
  user,
  stats,
  mathRecords,
  homeworkRecords,
  quizRecords,
  writingRecords,
  onNavigateTab,
}: DashboardProps) {
  const goalPercent = Math.min(100, Math.round((stats.studyMinutesToday / user.dailyGoalMinutes) * 100));

  const totalActivities =
    stats.totalQuestionsAsked + stats.mathProblemsSolved + stats.quizzesCompleted;

  const subjectEntries = Object.entries(stats.subjectCounts || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div id="student-dashboard-container" className="flex-1 overflow-y-auto max-w-6xl mx-auto w-full p-3 sm:p-6 space-y-6 custom-scrollbar">
      {/* Student Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-sky-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-sky-500/20 blur-3xl pointer-events-none"></div>
        <div className="absolute right-32 top-0 w-48 h-48 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-sky-200">
              <GraduationCap className="w-4 h-4" />
              <span className="capitalize">{user.level} Stage Scholar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome back, {user.name}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-sky-100/80 max-w-lg leading-relaxed">
              Your personalized academic learning progress is tracked in real-time. You're maintaining a great study rhythm today!
            </p>
          </div>

          {/* Daily Goal Gauge Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 flex items-center gap-4 min-w-[240px]">
            <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/20"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-sky-300 transition-all duration-1000 ease-out"
                  strokeDasharray={`${goalPercent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xs font-bold text-white">{goalPercent}%</span>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wider text-sky-200 font-semibold flex items-center gap-1">
                <Target className="w-3 h-3 text-sky-300" /> Daily Target
              </div>
              <div className="text-lg font-bold text-white mt-0.5">
                {stats.studyMinutesToday} / {user.dailyGoalMinutes} mins
              </div>
              <div className="text-[11px] text-sky-100/70">
                {stats.studyMinutesToday >= user.dailyGoalMinutes
                  ? "🎯 Goal Achieved!"
                  : `${user.dailyGoalMinutes - stats.studyMinutesToday} mins left`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-500 flex items-center justify-center flex-shrink-0">
            <Flame className="w-6 h-6 fill-orange-500" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              {user.streakDays} Days
            </div>
            <div className="text-xs text-slate-400 font-medium">Study Streak</div>
          </div>
        </div>

        {/* Math Problems */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center flex-shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              {stats.mathProblemsSolved} Solved
            </div>
            <div className="text-xs text-slate-400 font-medium">Math Problems</div>
          </div>
        </div>

        {/* Quizzes Average */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              {stats.averageQuizScore}% Avg
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {stats.quizzesCompleted} Quizzes Taken
            </div>
          </div>
        </div>

        {/* Saved Formulas / Bookmarks */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Bookmark className="w-6 h-6 fill-blue-600" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              {stats.totalBookmarks} Saved
            </div>
            <div className="text-xs text-slate-400 font-medium">Formulas & Notes</div>
          </div>
        </div>
      </div>

      {/* Middle Grid: Subject Distribution & Learning Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Subject Activity Breakdown */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Subject Focus Distribution</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">{totalActivities} total queries</span>
          </div>

          <div className="space-y-3">
            {subjectEntries.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">
                Start asking questions in Chat or Math Solver to build your subject chart.
              </div>
            ) : (
              subjectEntries.map(([subj, count]) => {
                const pct = Math.min(100, Math.round((count / Math.max(1, totalActivities)) * 100));
                return (
                  <div key={subj} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{subj}</span>
                      <span className="text-slate-400 font-medium">
                        {count} questions ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Personalized AI Learning Insights */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Personalized Study Insights</span>
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-semibold">
              AI Tutor Analysis
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-indigo-950 dark:text-indigo-200">
                  Calculus & Algebra Strength
                </div>
                <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                  You have solved {stats.mathProblemsSolved} problems with high derivation accuracy. Next, try Geometry 3D proofs.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 flex items-start gap-3">
              <TrendingUp className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-sky-950 dark:text-sky-200">
                  Bilingual Retention Boost
                </div>
                <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                  Switching between Bengali concepts and English scientific terms helps accelerate long-term memory encoding.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/50 flex items-start gap-3">
              <Award className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-violet-950 dark:text-violet-200">
                  Exam Readiness Recommendation
                </div>
                <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                  Try generating a 10-question MCQ quiz on your lowest scoring unit to solidify recall before your next exam.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Across Modules */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Recent Learning Records
          </h3>
          <span className="text-xs text-slate-400 font-medium">Cached locally & synced</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Recent Math */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-sky-600 dark:text-sky-400">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" /> Math Solutions
              </span>
              <button
                onClick={() => onNavigateTab("math")}
                className="hover:underline flex items-center gap-0.5"
              >
                Open <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            {mathRecords.length === 0 ? (
              <div className="text-[11px] text-slate-400 py-2">No math records yet.</div>
            ) : (
              mathRecords.slice(0, 3).map((r) => (
                <div key={r.id} className="text-xs truncate font-medium text-slate-700 dark:text-slate-300">
                  • {r.problem}
                </div>
              ))
            )}
          </div>

          {/* Recent Homework/Notes */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Study Notes & HW
              </span>
              <button
                onClick={() => onNavigateTab("homework")}
                className="hover:underline flex items-center gap-0.5"
              >
                Open <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            {homeworkRecords.length === 0 ? (
              <div className="text-[11px] text-slate-400 py-2">No study notes yet.</div>
            ) : (
              homeworkRecords.slice(0, 3).map((r) => (
                <div key={r.id} className="text-xs truncate font-medium text-slate-700 dark:text-slate-300">
                  • {r.title}
                </div>
              ))
            )}
          </div>

          {/* Recent Quizzes */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-violet-600 dark:text-violet-400">
              <span className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" /> Quizzes Taken
              </span>
              <button
                onClick={() => onNavigateTab("exam")}
                className="hover:underline flex items-center gap-0.5"
              >
                Open <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            {quizRecords.length === 0 ? (
              <div className="text-[11px] text-slate-400 py-2">No quizzes taken yet.</div>
            ) : (
              quizRecords.slice(0, 3).map((r) => (
                <div key={r.id} className="text-xs truncate font-medium text-slate-700 dark:text-slate-300">
                  • {r.topic} ({r.score}/{r.total})
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

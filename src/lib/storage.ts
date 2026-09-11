import {
  UserProfile,
  ChatSession,
  MathRecord,
  HomeworkRecord,
  QuizRecord,
  RevisionPlanRecord,
  WritingRecord,
  BookmarkItem,
  LearningStats,
} from "../types";

const STORAGE_KEYS = {
  USER: "edunova_user_profile",
  CHATS: "edunova_chat_sessions",
  ACTIVE_CHAT_ID: "edunova_active_chat_id",
  MATH: "edunova_math_records",
  HOMEWORK: "edunova_homework_records",
  QUIZZES: "edunova_quiz_records",
  REVISIONS: "edunova_revision_records",
  WRITING: "edunova_writing_records",
  BOOKMARKS: "edunova_bookmarks",
  STATS: "edunova_learning_stats",
  THEME: "edunova_theme_mode",
  ACCESSIBILITY_FONT: "edunova_font_scale",
};

const LEGACY_KEYS: Record<string, string> = {
  [STORAGE_KEYS.USER]: "shiksha_user_profile",
  [STORAGE_KEYS.CHATS]: "shiksha_chat_sessions",
  [STORAGE_KEYS.ACTIVE_CHAT_ID]: "shiksha_active_chat_id",
  [STORAGE_KEYS.MATH]: "shiksha_math_records",
  [STORAGE_KEYS.HOMEWORK]: "shiksha_homework_records",
  [STORAGE_KEYS.QUIZZES]: "shiksha_quiz_records",
  [STORAGE_KEYS.REVISIONS]: "shiksha_revision_records",
  [STORAGE_KEYS.WRITING]: "shiksha_writing_records",
  [STORAGE_KEYS.BOOKMARKS]: "shiksha_bookmarks",
  [STORAGE_KEYS.STATS]: "shiksha_learning_stats",
  [STORAGE_KEYS.THEME]: "shiksha_theme_mode",
  [STORAGE_KEYS.ACCESSIBILITY_FONT]: "shiksha_font_scale",
};

function getStorageItem(key: string): string | null {
  try {
    const val = localStorage.getItem(key);
    if (val !== null) return val;
    const legacy = LEGACY_KEYS[key];
    if (legacy) {
      return localStorage.getItem(legacy);
    }
    return null;
  } catch {
    return null;
  }
}

export const defaultUser: UserProfile = {
  id: "student-1",
  name: "Rahim Ahmed",
  email: "rahim.student@edu.org",
  level: "college",
  preferredLanguage: "both",
  avatarSeed: "Felix",
  dailyGoalMinutes: 45,
  streakDays: 4,
  lastActiveDate: new Date().toISOString().split("T")[0],
  joinedDate: "September 2025",
};

export const storage = {
  // User Profile
  getUser(): UserProfile {
    try {
      const data = getStorageItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : defaultUser;
    } catch {
      return defaultUser;
    }
  },

  saveUser(user: UserProfile) {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (e) {
      console.error("Failed to save user", e);
    }
  },

  // Chat Sessions
  getChatSessions(): ChatSession[] {
    try {
      const data = getStorageItem(STORAGE_KEYS.CHATS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error("Failed to get chats", e);
    }

    // Default welcoming chat session in English & Bengali
    const initialSession: ChatSession = {
      id: "session-welcome",
      title: "Welcome to EduNova AI",
      subject: "General",
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3600000,
      messages: [
        {
          id: "m-1",
          role: "model",
          content: `স্বাগতম! Welcome to **EduNova AI** — your intelligent academic study companion. 🎓

I can help you with:
- 💡 **Concepts & Questions**: Ask in **Bengali (বাংলা)** or **English**.
- 📐 **Step-by-step Math**: From algebra & calculus to geometry & statistics. You can also upload pictures of handwritten problems!
- 📚 **Homework & Study Notes**: Clear explanations and comprehensive revision notes.
- 🎯 **Exam Prep & Quizzes**: Custom MCQs and day-by-day revision schedules.
- ✍️ **Writing Assistant**: Essay feedback, grammar correction, and vocabulary enhancement.

What would you like to learn today? কি বিষয় নিয়ে আলোচনা করতে চাও?`,
          timestamp: Date.now() - 3600000,
        },
      ],
    };

    return [initialSession];
  },

  saveChatSessions(sessions: ChatSession[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(sessions));
    } catch (e) {
      console.error("Failed to save chats", e);
    }
  },

  getActiveChatId(): string {
    return getStorageItem(STORAGE_KEYS.ACTIVE_CHAT_ID) || "session-welcome";
  },

  setActiveChatId(id: string) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CHAT_ID, id);
  },

  // Math Records
  getMathRecords(): MathRecord[] {
    try {
      const data = getStorageItem(STORAGE_KEYS.MATH);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveMathRecord(record: MathRecord) {
    const list = storage.getMathRecords();
    const updated = [record, ...list.filter((r) => r.id !== record.id)].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.MATH, JSON.stringify(updated));
    storage.incrementStat("mathProblemsSolved");
  },

  // Homework Records
  getHomeworkRecords(): HomeworkRecord[] {
    try {
      const data = getStorageItem(STORAGE_KEYS.HOMEWORK);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveHomeworkRecord(record: HomeworkRecord) {
    const list = storage.getHomeworkRecords();
    const updated = [record, ...list.filter((r) => r.id !== record.id)].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.HOMEWORK, JSON.stringify(updated));
    storage.incrementStat("totalQuestionsAsked");
  },

  // Quiz Records
  getQuizRecords(): QuizRecord[] {
    try {
      const data = getStorageItem(STORAGE_KEYS.QUIZZES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveQuizRecord(record: QuizRecord) {
    const list = storage.getQuizRecords();
    const updated = [record, ...list.filter((r) => r.id !== record.id)].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(updated));

    // Update stats
    const stats = storage.getStats();
    const newTotalQuizzes = (stats.quizzesCompleted || 0) + 1;
    const scorePct = Math.round((record.score / record.total) * 100);
    const newAvg = Math.round(
      ((stats.averageQuizScore || 0) * (newTotalQuizzes - 1) + scorePct) / newTotalQuizzes
    );

    storage.updateStats({
      quizzesCompleted: newTotalQuizzes,
      averageQuizScore: newAvg,
    });
  },

  // Revision Plans
  getRevisionPlans(): RevisionPlanRecord[] {
    try {
      const data = getStorageItem(STORAGE_KEYS.REVISIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveRevisionPlan(record: RevisionPlanRecord) {
    const list = storage.getRevisionPlans();
    const updated = [record, ...list.filter((r) => r.id !== record.id)].slice(0, 20);
    localStorage.setItem(STORAGE_KEYS.REVISIONS, JSON.stringify(updated));
  },

  // Writing Records
  getWritingRecords(): WritingRecord[] {
    try {
      const data = getStorageItem(STORAGE_KEYS.WRITING);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveWritingRecord(record: WritingRecord) {
    const list = storage.getWritingRecords();
    const updated = [record, ...list.filter((r) => r.id !== record.id)].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.WRITING, JSON.stringify(updated));
  },

  // Bookmarks
  getBookmarks(): BookmarkItem[] {
    try {
      const data = getStorageItem(STORAGE_KEYS.BOOKMARKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addBookmark(item: BookmarkItem) {
    const list = storage.getBookmarks();
    if (!list.some((b) => b.id === item.id)) {
      const updated = [item, ...list];
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
      storage.incrementStat("totalBookmarks");
    }
  },

  removeBookmark(id: string) {
    const list = storage.getBookmarks();
    const updated = list.filter((b) => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
  },

  isBookmarked(id: string): boolean {
    const list = storage.getBookmarks();
    return list.some((b) => b.id === id);
  },

  // Learning Stats
  getStats(): LearningStats {
    try {
      const data = getStorageItem(STORAGE_KEYS.STATS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error("Failed to load stats", e);
    }
    return {
      totalQuestionsAsked: 14,
      mathProblemsSolved: 8,
      quizzesCompleted: 5,
      averageQuizScore: 84,
      studyMinutesToday: 32,
      totalBookmarks: 4,
      subjectCounts: {
        Mathematics: 9,
        Physics: 5,
        Chemistry: 4,
        English: 6,
        General: 3,
      },
    };
  },

  updateStats(partial: Partial<LearningStats>) {
    const current = storage.getStats();
    const updated = { ...current, ...partial };
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(updated));
  },

  incrementStat(key: keyof Omit<LearningStats, "subjectCounts">, amount = 1) {
    const stats = storage.getStats();
    const currentVal = (stats[key] as number) || 0;
    (stats[key] as number) = currentVal + amount;
    storage.updateStats(stats);
  },

  recordSubjectActivity(subject: string) {
    const stats = storage.getStats();
    stats.subjectCounts = stats.subjectCounts || {};
    stats.subjectCounts[subject] = (stats.subjectCounts[subject] || 0) + 1;
    stats.studyMinutesToday = (stats.studyMinutesToday || 0) + 5;
    storage.updateStats(stats);
  },

  // Convenience Aliases
  getUserProfile(): UserProfile {
    return storage.getUser();
  },
  saveUserProfile(user: UserProfile) {
    storage.saveUser(user);
  },
  getSessions(): ChatSession[] {
    return storage.getChatSessions();
  },
  saveSessions(sessions: ChatSession[]) {
    storage.saveChatSessions(sessions);
  },
  saveMathRecords(records: MathRecord[]) {
    localStorage.setItem(STORAGE_KEYS.MATH, JSON.stringify(records));
  },
  saveHomeworkRecords(records: HomeworkRecord[]) {
    localStorage.setItem(STORAGE_KEYS.HOMEWORK, JSON.stringify(records));
  },
  saveQuizRecords(records: QuizRecord[]) {
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(records));
  },
  saveWritingRecords(records: WritingRecord[]) {
    localStorage.setItem(STORAGE_KEYS.WRITING, JSON.stringify(records));
  },
  saveBookmarks(bookmarks: BookmarkItem[]) {
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  },
  saveRevisionPlans(plans: RevisionPlanRecord[]) {
    localStorage.setItem(STORAGE_KEYS.REVISIONS, JSON.stringify(plans));
  },
  saveStats(stats: LearningStats) {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  },
};

export const storageService = storage;

// Export helper for students
export function exportAsFile(content: string, filename: string, type: "markdown" | "text" = "markdown") {
  const mimeType = type === "markdown" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8";
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printContent(title: string, content: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 40px auto;
            padding: 0 20px;
            color: #1e293b;
          }
          h1, h2, h3 { color: #0f172a; }
          pre, code {
            background: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
          }
          pre { padding: 12px; overflow-x: auto; }
          blockquote {
            border-left: 4px solid #6366f1;
            margin: 0;
            padding-left: 16px;
            color: #475569;
          }
          hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <hr/>
        <div>${content.replace(/\n/g, "<br/>")}</div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
}

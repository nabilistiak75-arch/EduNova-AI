export type StudentLevel = "school" | "college" | "university";

export type LanguageMode = "both" | "bn" | "en";

export type NavTab = "chat" | "math" | "homework" | "exam" | "writing" | "dashboard" | "bookmarks";
export type StudentTab = NavTab;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  level: StudentLevel;
  preferredLanguage: LanguageMode;
  avatarSeed: string;
  dailyGoalMinutes: number;
  streakDays: number;
  lastActiveDate: string;
  joinedDate: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: number;
  modelUsed?: string;
  isBookmarked?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  subject: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export type MathBranch = "algebra" | "calculus" | "geometry" | "statistics" | "arithmetic";

export interface MathRecord {
  id: string;
  problem: string;
  branch: MathBranch;
  solution: string;
  hasImage: boolean;
  timestamp: number;
  isBookmarked?: boolean;
}

export interface HomeworkRecord {
  id: string;
  title: string;
  subject: string;
  taskType: "guidance" | "notes";
  content: string;
  timestamp: number;
  isBookmarked?: boolean;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizRecord {
  id: string;
  topic: string;
  subject: string;
  difficulty: "easy" | "medium" | "hard";
  questions: QuizQuestion[];
  userAnswers: Record<number, number>;
  score: number;
  total: number;
  timestamp: number;
}

export interface RevisionPlanRecord {
  id: string;
  subjects: string;
  daysAvailable: number;
  planContent: string;
  timestamp: number;
}

export interface WritingRecord {
  id: string;
  originalText: string;
  mode: "grammar" | "essay-feedback" | "improve-vocab";
  feedback: string;
  timestamp: number;
  isBookmarked?: boolean;
}

export interface BookmarkItem {
  id: string;
  type?: "chat" | "math" | "homework" | "writing" | string;
  title: string;
  content: string;
  source?: string;
  sourceSubject?: string;
  timestamp: number;
}

export interface LearningStats {
  totalQuestionsAsked: number;
  mathProblemsSolved: number;
  quizzesCompleted: number;
  averageQuizScore: number;
  studyMinutesToday: number;
  totalBookmarks: number;
  subjectCounts: Record<string, number>;
}

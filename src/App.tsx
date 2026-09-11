/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import {
  NavTab,
  ChatSession,
  UserProfile,
  LearningStats,
  MathRecord,
  HomeworkRecord,
  QuizRecord,
  WritingRecord,
  BookmarkItem,
} from "./types";
import { storageService } from "./lib/storage";

// Components
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ChatTutor from "./components/ChatTutor";
import MathSolver from "./components/MathSolver";
import HomeworkAssistant from "./components/HomeworkAssistant";
import ExamPrep from "./components/ExamPrep";
import WritingAssistant from "./components/WritingAssistant";
import Dashboard from "./components/Dashboard";
import BookmarksModal from "./components/BookmarksModal";
import AuthModal from "./components/AuthModal";

export default function App() {
  // App Core State
  const [user, setUser] = useState<UserProfile>(storageService.getUserProfile());
  const [stats, setStats] = useState<LearningStats>(storageService.getStats());
  const [activeTab, setActiveTab] = useState<NavTab>("chat");

  // Chat Sessions
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const existing = storageService.getSessions();
    if (existing.length === 0) {
      const initial: ChatSession = {
        id: "chat-welcome",
        title: "Welcome & Academic Orientation",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        subject: "General",
        messages: [
          {
            id: "msg-welcome",
            role: "model",
            content: `### Welcome to EduNova AI 🎓\n\nI am your dedicated **AI Study Assistant SaaS** designed for **School**, **College**, and **University** students. \n\n**Here is how I can assist your studies:**\n- 🗣️ **Bilingual AI Chat Tutor**: Ask questions in **বাংলা (Bengali)** or **English**. I break down complex concepts into crystal-clear steps with real-world analogies.\n- 🧮 **Mathematics Solver**: Step-by-step calculus, algebra, geometry, statistics, and arithmetic solutions, including handwritten photo uploads.\n- 📚 **Homework & Notes**: Comprehensive concept guides and memory-retention revision summaries.\n- 🏆 **Exam Prep & MCQs**: Interactive practice quizzes with step-by-step reasoning and revision timetables.\n- ✍️ **Writing Assistant**: Essay argumentation reviews, grammar correction, and academic vocabulary upgrades.\n\n*What topic or assignment would you like to explore today?*`,
            timestamp: Date.now(),
          },
        ],
      };
      storageService.saveSessions([initial]);
      return [initial];
    }
    return existing;
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(
    () => sessions[0]?.id || "chat-welcome"
  );

  // Modular Records State
  const [mathRecords, setMathRecords] = useState<MathRecord[]>(storageService.getMathRecords());
  const [homeworkRecords, setHomeworkRecords] = useState<HomeworkRecord[]>(
    storageService.getHomeworkRecords()
  );
  const [quizRecords, setQuizRecords] = useState<QuizRecord[]>(storageService.getQuizRecords());
  const [writingRecords, setWritingRecords] = useState<WritingRecord[]>(
    storageService.getWritingRecords()
  );
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(storageService.getBookmarks());

  // UI Modals & Settings State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem("edunova_theme") === "dark" ||
      localStorage.getItem("shiksha_theme") === "dark" ||
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  });
  const [fontScale, setFontScale] = useState<number>(1);

  // Sync Dark Mode with <html> class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("edunova_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("edunova_theme", "light");
    }
  }, [darkMode]);

  // Track Study Timer (1 min ticker)
  useEffect(() => {
    const timer = setInterval(() => {
      setStats((prev) => {
        const next = { ...prev, studyMinutesToday: prev.studyMinutesToday + 1 };
        storageService.saveStats(next);
        return next;
      });
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Session Handlers
  const currentSession =
    sessions.find((s) => s.id === activeSessionId) ||
    sessions[0] || {
      id: "chat-temp",
      title: "New Study Session",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      subject: "General",
      messages: [],
    };

  const handleUpdateCurrentSession = (updated: ChatSession) => {
    const nextSessions = sessions.map((s) => (s.id === updated.id ? updated : s));
    setSessions(nextSessions);
    storageService.saveSessions(nextSessions);

    // Update stats
    setStats((prev) => {
      const subject = updated.subject || "General";
      const count = (prev.subjectCounts[subject] || 0) + 1;
      const nextStats = {
        ...prev,
        totalQuestionsAsked: prev.totalQuestionsAsked + 1,
        subjectCounts: { ...prev.subjectCounts, [subject]: count },
      };
      storageService.saveStats(nextStats);
      return nextStats;
    });
  };

  const handleCreateNewSession = () => {
    const newSession: ChatSession = {
      id: `chat-${Date.now()}`,
      title: "New Study Session",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      subject: "General",
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: "model",
          content: `Hi ${user.name}! I'm ready to help. You can ask in Bengali or English. What topic are we working on?`,
          timestamp: Date.now(),
        },
      ],
    };
    const next = [newSession, ...sessions];
    setSessions(next);
    setActiveSessionId(newSession.id);
    storageService.saveSessions(next);
    setActiveTab("chat");
  };

  const handleDeleteSession = (id: string) => {
    const next = sessions.filter((s) => s.id !== id);
    setSessions(next);
    storageService.saveSessions(next);
    if (activeSessionId === id && next.length > 0) {
      setActiveSessionId(next[0].id);
    }
  };

  // Bookmark Handlers
  const handleAddBookmark = (title: string, content: string, source: string) => {
    const item: BookmarkItem = {
      id: `bm-${Date.now()}`,
      title,
      content,
      source,
      sourceSubject: source,
      timestamp: Date.now(),
    };
    const next = [item, ...bookmarks];
    setBookmarks(next);
    storageService.saveBookmarks(next);
    setStats((prev) => {
      const nextStats = { ...prev, totalBookmarks: next.length };
      storageService.saveStats(nextStats);
      return nextStats;
    });
  };

  const handleRemoveBookmark = (id: string) => {
    const next = bookmarks.filter((b) => b.id !== id);
    setBookmarks(next);
    storageService.saveBookmarks(next);
    setStats((prev) => {
      const nextStats = { ...prev, totalBookmarks: next.length };
      storageService.saveStats(nextStats);
      return nextStats;
    });
  };

  const isBookmarked = (id: string) => {
    return bookmarks.some((b) => b.id === id || b.title.includes(id));
  };

  // Record Handlers
  const handleSaveMathRecord = (rec: MathRecord) => {
    const next = [rec, ...mathRecords];
    setMathRecords(next);
    storageService.saveMathRecords(next);
    setStats((prev) => {
      const count = (prev.subjectCounts["Mathematics"] || 0) + 1;
      const nextStats = {
        ...prev,
        mathProblemsSolved: prev.mathProblemsSolved + 1,
        subjectCounts: { ...prev.subjectCounts, Mathematics: count },
      };
      storageService.saveStats(nextStats);
      return nextStats;
    });
  };

  const handleSaveHomeworkRecord = (rec: HomeworkRecord) => {
    const next = [rec, ...homeworkRecords];
    setHomeworkRecords(next);
    storageService.saveHomeworkRecords(next);
    setStats((prev) => {
      const count = (prev.subjectCounts[rec.subject] || 0) + 1;
      const nextStats = {
        ...prev,
        subjectCounts: { ...prev.subjectCounts, [rec.subject]: count },
      };
      storageService.saveStats(nextStats);
      return nextStats;
    });
  };

  const handleSaveQuizRecord = (rec: QuizRecord) => {
    const next = [rec, ...quizRecords];
    setQuizRecords(next);
    storageService.saveQuizRecords(next);

    setStats((prev) => {
      const totalScores = next.reduce((sum, q) => sum + (q.score / q.total) * 100, 0);
      const avg = Math.round(totalScores / next.length);
      const count = (prev.subjectCounts[rec.subject] || 0) + 1;
      const nextStats = {
        ...prev,
        quizzesCompleted: prev.quizzesCompleted + 1,
        averageQuizScore: avg,
        subjectCounts: { ...prev.subjectCounts, [rec.subject]: count },
      };
      storageService.saveStats(nextStats);
      return nextStats;
    });
  };

  const handleSaveRevisionPlan = (rec: any) => {
    const existing = storageService.getRevisionPlans();
    storageService.saveRevisionPlans([rec, ...existing]);
  };

  const handleSaveWritingRecord = (rec: WritingRecord) => {
    const next = [rec, ...writingRecords];
    setWritingRecords(next);
    storageService.saveWritingRecords(next);
    setStats((prev) => {
      const count = (prev.subjectCounts["English & Writing"] || 0) + 1;
      const nextStats = {
        ...prev,
        subjectCounts: { ...prev.subjectCounts, "English & Writing": count },
      };
      storageService.saveStats(nextStats);
      return nextStats;
    });
  };

  const handleUpdateUser = (updatedUser: Partial<UserProfile>) => {
    const full = { ...user, ...updatedUser };
    setUser(full);
    storageService.saveUserProfile(full);
  };

  return (
    <div
      id="edunova-app-root"
      style={{ fontSize: `${fontScale}rem` }}
      className="min-h-screen flex flex-col bg-slate-100/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200"
    >
      {/* Top Navbar */}
      <Navbar
        user={user}
        onUpdateUser={handleUpdateUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        fontScale={fontScale}
        onChangeFontScale={setFontScale}
        onOpenBookmarks={() => setIsBookmarksModalOpen(true)}
      />

      {/* Main Body Layout: Sidebar + Active Module */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Navigation & Chat History Sidebar */}
        <Sidebar
          currentTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === "bookmarks") {
              setIsBookmarksModalOpen(true);
            } else {
              setActiveTab(tab);
            }
          }}
          chatSessions={sessions}
          activeChatId={activeSessionId}
          onSelectChatSession={(id) => {
            setActiveSessionId(id);
            setActiveTab("chat");
          }}
          onNewChat={handleCreateNewSession}
          onDeleteChat={handleDeleteSession}
          studentLevel={user.level}
          totalBookmarks={bookmarks.length}
        />

        {/* Content Container */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
          {activeTab === "chat" && (
            <ChatTutor
              session={currentSession}
              onUpdateSession={handleUpdateCurrentSession}
              studentLevel={user.level}
              languageMode={user.preferredLanguage}
              onAddBookmark={handleAddBookmark}
              onRemoveBookmark={handleRemoveBookmark}
              isBookmarked={isBookmarked}
            />
          )}

          {activeTab === "math" && (
            <MathSolver
              studentLevel={user.level}
              languageMode={user.preferredLanguage}
              onSaveRecord={handleSaveMathRecord}
              recentRecords={mathRecords}
              onAddBookmark={handleAddBookmark}
              onRemoveBookmark={handleRemoveBookmark}
              isBookmarked={isBookmarked}
            />
          )}

          {activeTab === "homework" && (
            <HomeworkAssistant
              studentLevel={user.level}
              languageMode={user.preferredLanguage}
              onSaveRecord={handleSaveHomeworkRecord}
              recentRecords={homeworkRecords}
              onAddBookmark={handleAddBookmark}
              onRemoveBookmark={handleRemoveBookmark}
              isBookmarked={isBookmarked}
            />
          )}

          {activeTab === "exam" && (
            <ExamPrep
              studentLevel={user.level}
              languageMode={user.preferredLanguage}
              onSaveQuizRecord={handleSaveQuizRecord}
              onSaveRevisionPlan={handleSaveRevisionPlan}
              quizHistory={quizRecords}
            />
          )}

          {activeTab === "writing" && (
            <WritingAssistant
              studentLevel={user.level}
              onSaveRecord={handleSaveWritingRecord}
              recentRecords={writingRecords}
              onAddBookmark={handleAddBookmark}
              onRemoveBookmark={handleRemoveBookmark}
              isBookmarked={isBookmarked}
            />
          )}

          {activeTab === "dashboard" && (
            <Dashboard
              user={user}
              stats={stats}
              mathRecords={mathRecords}
              homeworkRecords={homeworkRecords}
              quizRecords={quizRecords}
              writingRecords={writingRecords}
              onNavigateTab={setActiveTab}
            />
          )}
        </main>
      </div>

      {/* Bookmarks Modal */}
      <BookmarksModal
        isOpen={isBookmarksModalOpen}
        onClose={() => setIsBookmarksModalOpen(false)}
        bookmarks={bookmarks}
        onRemoveBookmark={handleRemoveBookmark}
      />

      {/* Student Profile / Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={user}
        onUpdateUser={(updated) => handleUpdateUser(updated)}
      />
    </div>
  );
}

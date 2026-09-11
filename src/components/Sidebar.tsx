import {
  MessageSquare,
  Calculator,
  BookOpen,
  GraduationCap,
  PenTool,
  BarChart3,
  Bookmark,
  PlusCircle,
  Trash2,
  Sparkles,
  Search,
} from "lucide-react";
import { ChatSession, StudentLevel } from "../types";
import { useState } from "react";

export type NavTab = "chat" | "math" | "homework" | "exam" | "writing" | "dashboard" | "bookmarks";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  chatSessions: ChatSession[];
  activeChatId: string;
  onSelectChatSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  studentLevel: StudentLevel;
  totalBookmarks: number;
}

export default function Sidebar({
  currentTab,
  onSelectTab,
  chatSessions,
  activeChatId,
  onSelectChatSession,
  onNewChat,
  onDeleteChat,
  studentLevel,
  totalBookmarks,
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSessions = chatSessions.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navItems: { id: NavTab; label: string; sub: string; icon: any; color: string }[] = [
    {
      id: "chat",
      label: "AI Chat Tutor",
      sub: "Bengali + English Step-by-Step",
      icon: MessageSquare,
      color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50",
    },
    {
      id: "math",
      label: "Mathematics Solver",
      sub: "Algebra, Calculus & Image OCR",
      icon: Calculator,
      color: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50",
    },
    {
      id: "homework",
      label: "Homework & Notes",
      sub: "Guidance & Study Summaries",
      icon: BookOpen,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      id: "exam",
      label: "Exam Preparation",
      sub: "MCQ Quizzes & Revision Plans",
      icon: GraduationCap,
      color: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50",
    },
    {
      id: "writing",
      label: "Writing Assistant",
      sub: "Essays & Grammar Correction",
      icon: PenTool,
      color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50",
    },
    {
      id: "dashboard",
      label: "Student Progress",
      sub: "Analytics & Study History",
      icon: BarChart3,
      color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50",
    },
    {
      id: "bookmarks",
      label: "Saved Vault",
      sub: `${totalBookmarks} Formulas & Notes`,
      icon: Bookmark,
      color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50",
    },
  ];

  return (
    <aside
      id="app-sidebar"
      className="w-full lg:w-72 flex-shrink-0 flex flex-col border-r border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md lg:min-h-[calc(100vh-4rem)] p-3 lg:p-4 gap-4"
    >
      {/* Primary Navigation Tabs */}
      <div className="space-y-1">
        <div className="px-2 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>Study Tools</span>
          <span className="text-[10px] lowercase font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
            {studentLevel}
          </span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-indigo-600 dark:text-white font-semibold shadow-md shadow-slate-900/10 dark:shadow-indigo-600/20"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isActive ? "bg-white/20 text-white" : item.color
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold truncate">{item.label}</div>
                <div
                  className={`text-[10px] truncate ${
                    isActive ? "text-slate-200 dark:text-indigo-100" : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {item.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <hr className="border-slate-200/80 dark:border-slate-800/80" />

      {/* Previous Conversations History Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between px-2 pb-2">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Previous Chats ({chatSessions.length})
          </span>
          <button
            id="new-chat-btn"
            onClick={onNewChat}
            className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold p-1 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition"
            title="Start fresh conversation"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Search chat */}
        {chatSessions.length > 2 && (
          <div className="relative px-1 mb-2">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar max-h-56 lg:max-h-72">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">No chats found</div>
          ) : (
            filteredSessions.map((session) => {
              const isSelected = currentTab === "chat" && activeChatId === session.id;
              return (
                <div
                  key={session.id}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/60 dark:border-indigo-800/50"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                  }`}
                  onClick={() => {
                    onSelectChatSession(session.id);
                    onSelectTab("chat");
                  }}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="truncate font-medium">{session.title || "Untitled Study Chat"}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {session.subject} • {session.messages.length} msgs
                    </div>
                  </div>
                  {chatSessions.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 rounded transition"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom info banner */}
      <div className="rounded-xl p-3 bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-slate-800/80 dark:to-slate-800/40 border border-indigo-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-300 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Bilingual AI Tutor</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
          Ask questions in Bengali (বাংলা), English, or mixed Banglish. Supports high-thinking math & science reasoning.
        </p>
      </div>
    </aside>
  );
}

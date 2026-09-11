import { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  BrainCircuit,
  Zap,
  Globe,
  RefreshCw,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import { ChatSession, ChatMessage, StudentLevel, LanguageMode } from "../types";
import { speechService } from "../lib/speech";

interface ChatTutorProps {
  session: ChatSession;
  onUpdateSession: (updated: ChatSession) => void;
  studentLevel: StudentLevel;
  languageMode: LanguageMode;
  onAddBookmark: (title: string, content: string, source: string) => void;
  onRemoveBookmark: (title: string) => void;
  isBookmarked: (id: string) => boolean;
}

export default function ChatTutor({
  session,
  onUpdateSession,
  studentLevel,
  languageMode,
  onAddBookmark,
  onRemoveBookmark,
  isBookmarked,
}: ChatTutorProps) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(session.subject || "General");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages, loading]);

  useEffect(() => {
    const unsub = speechService.onStateChange((speaking) => {
      if (!speaking) setSpeakingId(null);
    });
    return unsub;
  }, []);

  const subjects = [
    "General",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English & Grammar",
    "ICT & Computer Science",
    "History & Social Studies",
  ];

  const quickPrompts = [
    {
      en: "Explain Photosynthesis step-by-step with simple analogies",
      bn: "সালোকসংশ্লেষণ প্রক্রিয়াটি সহজ ভাষায় উদাহরণসহ বুঝিয়ে দিন",
    },
    {
      en: "How does Calculus Derivative work? Explain with a real-world example",
      bn: "ক্যালকুলাসের ডিফারেন্সিয়েশন বা অন্তরীকরণ কী এবং কেন ব্যবহার করা হয়?",
    },
    {
      en: "Explain Newton's Laws of Motion with daily life examples",
      bn: "নিউটনের গতির ৩টি সূত্র সহজ বাস্তব উদাহরণের মাধ্যমে ব্যাখ্যা করুন",
    },
    {
      en: "How to memorize organic chemistry reaction mechanisms easily?",
      bn: "জৈব রসায়নের (Organic Chemistry) বিক্রিয়া সহজে মনে রাখার উপায় কী?",
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: Date.now(),
    };

    const updatedMessages = [...session.messages, userMessage];
    const updatedTitle =
      session.messages.length <= 1
        ? query.slice(0, 36) + (query.length > 36 ? "..." : "")
        : session.title;

    const updatedSession: ChatSession = {
      ...session,
      title: updatedTitle,
      subject: selectedSubject,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };

    onUpdateSession(updatedSession);
    setInputText("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          level: studentLevel,
          language: languageMode,
          subject: selectedSubject,
          thinking: thinkingMode,
          model: thinkingMode ? "gemini-3.1-pro-preview" : "gemini-3.8-flash",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();

      const modelMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "model",
        content: data.content,
        timestamp: Date.now(),
        modelUsed: data.modelUsed,
      };

      onUpdateSession({
        ...updatedSession,
        messages: [...updatedMessages, modelMessage],
        updatedAt: Date.now(),
      });
    } catch (err: any) {
      console.error("Chat Tutor Error:", err);
      const errorMessage: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: "model",
        content: `**Tutor Note**: I couldn't connect to the AI model right now (${err.message}). Please check your internet connection or try again in a moment.`,
        timestamp: Date.now(),
      };
      onUpdateSession({
        ...updatedSession,
        messages: [...updatedMessages, errorMessage],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if (speakingId === id) {
      speechService.stop();
      setSpeakingId(null);
    } else {
      setSpeakingId(id);
      speechService.speak(text);
    }
  };

  const handleToggleBookmark = (msg: ChatMessage) => {
    const bookmarkKey = `chat-${msg.id}`;
    if (isBookmarked(bookmarkKey)) {
      onRemoveBookmark(bookmarkKey);
    } else {
      onAddBookmark(
        `Answer: ${session.title}`,
        msg.content,
        selectedSubject
      );
    }
  };

  return (
    <div id="chat-tutor-container" className="flex-1 flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full p-2 sm:p-4">
      {/* Header Bar: Subject focus, Thinking mode toggle, Language info */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-200/80 dark:border-slate-800/80 mb-3">
        {/* Subject Pill Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
            Subject:
          </span>
          <select
            id="subject-select"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        {/* Thinking Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            id="thinking-mode-toggle-btn"
            onClick={() => setThinkingMode(!thinkingMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              thinkingMode
                ? "bg-violet-50 text-violet-700 border-violet-300 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-700 shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
            title="Toggle High Thinking mode for deep mathematical and conceptual derivations"
          >
            {thinkingMode ? (
              <>
                <BrainCircuit className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 animate-pulse" />
                <span>Deep Thinking ON</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-violet-200/70 dark:bg-violet-800 text-violet-800 dark:text-violet-200 font-mono">
                  gemini-3.1-pro
                </span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Fast Mode</span>
                <span className="text-[10px] text-slate-400 font-mono">gemini-3.8-flash</span>
              </>
            )}
          </button>

          {/* Bilingual Indicator */}
          <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-200/60 dark:border-slate-800">
            <Globe className="w-3 h-3 text-sky-500" />
            <span>বাংলা ও English সমর্থিত</span>
          </div>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 sm:px-2 py-2 custom-scrollbar">
        {session.messages.map((msg, index) => {
          const isUser = msg.role === "user";
          const bookmarkKey = `chat-${msg.id}`;
          const bookmarked = isBookmarked(bookmarkKey);

          return (
            <div
              key={msg.id || index}
              className={`flex gap-3 max-w-3xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm ${
                  isUser
                    ? "bg-slate-800 dark:bg-slate-700"
                    : "bg-gradient-to-tr from-indigo-600 to-sky-500"
                }`}
              >
                {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`group relative rounded-2xl p-4 text-sm leading-relaxed transition-all shadow-sm ${
                  isUser
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/70 dark:border-slate-700/70"
                }`}
              >
                {/* Model badge if used thinking */}
                {!isUser && msg.modelUsed && (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-500 dark:text-indigo-400 mb-1.5">
                    <Sparkles className="w-3 h-3" />
                    <span>Answered by {msg.modelUsed}</span>
                  </div>
                )}

                {/* Content */}
                <div className="markdown-body prose dark:prose-invert max-w-none text-sm break-words">
                  <Markdown>{msg.content}</Markdown>
                </div>

                {/* Action Toolbar for AI responses */}
                {!isUser && (
                  <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-slate-400 dark:text-slate-400 text-xs">
                    <button
                      onClick={() => handleSpeak(msg.id, msg.content)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition ${
                        speakingId === msg.id ? "text-indigo-600 font-semibold" : ""
                      }`}
                      title={speakingId === msg.id ? "Stop Reading" : "Read Aloud (Accessibility)"}
                    >
                      {speakingId === msg.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      title="Copy to clipboard"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleToggleBookmark(msg)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition ${
                        bookmarked ? "text-amber-500 font-semibold" : ""
                      }`}
                      title="Save to Bookmarks"
                    >
                      {bookmarked ? (
                        <>
                          <BookmarkCheck className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>Saved</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>Bookmark</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-3 max-w-3xl mr-auto">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="rounded-2xl rounded-tl-none p-4 bg-white dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 shadow-sm flex items-center gap-3">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {thinkingMode ? "Deeply analyzing & deriving step-by-step concepts..." : "EduNova AI is formulating your explanation..."}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starters (Only when conversation is short) */}
      {session.messages.length <= 1 && (
        <div className="pt-2 pb-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Popular Student Prompts (Try asking in Bengali or English):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.bn)}
                className="text-left p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-slate-200/70 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition group"
              >
                <div className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 truncate">
                  {p.bn}
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">{p.en}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Box */}
      <div className="pt-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-500 transition p-1.5 sm:p-2"
        >
          <textarea
            id="chat-input-textarea"
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask any concept in Bengali or English (e.g. সালোকসংশ্লেষণ কী? / Explain limit theorems)..."
            className="flex-1 max-h-32 min-h-[38px] resize-none bg-transparent px-3 py-1.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />

          <button
            type="submit"
            id="send-chat-btn"
            disabled={!inputText.trim() || loading}
            className={`p-2.5 rounded-xl transition flex items-center justify-center text-white ${
              inputText.trim() && !loading
                ? "bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20"
                : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60"
            }`}
            title="Send question"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 px-2 pt-1.5">
          <span>Press Enter to send, Shift + Enter for new line</span>
          <span className="hidden sm:inline">AI provides simple explanations, examples & practice questions</span>
        </div>
      </div>
    </div>
  );
}

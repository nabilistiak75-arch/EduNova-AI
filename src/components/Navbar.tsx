import { useState, useEffect } from "react";
import {
  GraduationCap,
  Moon,
  Sun,
  Globe,
  Wifi,
  WifiOff,
  Type,
  User,
  Flame,
  Clock,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { StudentLevel, LanguageMode, UserProfile } from "../types";

interface NavbarProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onOpenAuth: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  fontScale: number; // 1, 1.1, 1.2
  onChangeFontScale: (scale: number) => void;
  onOpenBookmarks: () => void;
}

export default function Navbar({
  user,
  onUpdateUser,
  onOpenAuth,
  darkMode,
  onToggleDarkMode,
  fontScale,
  onChangeFontScale,
  onOpenBookmarks,
}: NavbarProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showLevelMenu, setShowLevelMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const levelLabels: Record<StudentLevel, { en: string; bn: string; tag: string }> = {
    school: { en: "School (Grades 6-10)", bn: "স্কুল পর্যায়", tag: "School" },
    college: { en: "College / Higher Sec", bn: "কলেজ / একাদশ-দ্বাদশ", tag: "College" },
    university: { en: "University / Undergrad", bn: "বিশ্ববিদ্যালয়", tag: "University" },
  };

  const languageLabels: Record<LanguageMode, { label: string; sub: string }> = {
    both: { label: "Bilingual (বাংলা + En)", sub: "Auto-detect" },
    bn: { label: "বাংলা (Bengali)", sub: "Primary Bengali" },
    en: { label: "English", sub: "Global English" },
  };

  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-500 dark:from-indigo-400 dark:via-sky-400 dark:to-indigo-300 bg-clip-text text-transparent">
                EduNova AI
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50">
                SaaS v2.4
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              AI Study Assistant for Students
            </p>
          </div>
        </div>

        {/* Center: Student Level & Language Switchers */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Level Switcher */}
          <div className="relative">
            <button
              id="level-selector-btn"
              onClick={() => {
                setShowLevelMenu(!showLevelMenu);
                setShowLangMenu(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
              title="Change Academic Level"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Level: {levelLabels[user.level].tag}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showLevelMenu && (
              <div
                id="level-dropdown-menu"
                className="absolute left-0 mt-1.5 w-60 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-2 py-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Target Academic Stage
                </div>
                {(["school", "college", "university"] as StudentLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      onUpdateUser({ level: lvl });
                      setShowLevelMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex flex-col transition ${
                      user.level === lvl
                        ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-semibold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{levelLabels[lvl].en}</span>
                    <span className="text-[11px] opacity-75 font-normal">{levelLabels[lvl].bn}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <div className="relative">
            <button
              id="lang-selector-btn"
              onClick={() => {
                setShowLangMenu(!showLangMenu);
                setShowLevelMenu(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
              title="Change Language Preference"
            >
              <Globe className="w-3.5 h-3.5 text-sky-500" />
              <span>{user.preferredLanguage === "bn" ? "বাংলা" : user.preferredLanguage === "en" ? "English" : "বাংলা + En"}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showLangMenu && (
              <div
                id="lang-dropdown-menu"
                className="absolute left-0 mt-1.5 w-52 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-2 py-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Tutor Language Mode
                </div>
                {(["both", "bn", "en"] as LanguageMode[]).map((lng) => (
                  <button
                    key={lng}
                    onClick={() => {
                      onUpdateUser({ preferredLanguage: lng });
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex flex-col transition ${
                      user.preferredLanguage === lng
                        ? "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 font-semibold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{languageLabels[lng].label}</span>
                    <span className="text-[11px] opacity-75 font-normal">{languageLabels[lng].sub}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Tools: Offline Status, Font Resizer, Dark Mode, Profile */}
        <div className="flex items-center gap-2">
          {/* Offline / Online indicator */}
          <div
            id="network-status-badge"
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              isOnline
                ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40"
                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40"
            }`}
            title={isOnline ? "Online: Connected to cloud sync" : "Offline: Cached storage active"}
          >
            {isOnline ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <Wifi className="w-3 h-3" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span>Offline Cache</span>
              </>
            )}
          </div>

          {/* Accessibility Font Size Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onChangeFontScale(fontScale === 1 ? 1.1 : fontScale === 1.1 ? 1.2 : 1)}
              className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
              title="Adjust Text Size for Accessibility"
            >
              <Type className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-mono">{fontScale === 1 ? "A" : fontScale === 1.1 ? "A+" : "A++"}</span>
            </button>
          </div>

          {/* Dark / Light Mode Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
            aria-label="Toggle Theme"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Student Profile & Quick Stats */}
          <div className="relative">
            <button
              id="user-profile-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                  {user.name.split(" ")[0]}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 flex items-center gap-1">
                  <Flame className="w-2.5 h-2.5 text-orange-500 fill-orange-500" />
                  {user.streakDays}d streak
                </span>
              </div>
            </button>

            {showUserMenu && (
              <div
                id="user-dropdown-menu"
                className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-base font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{user.name}</div>
                    <div className="text-xs text-slate-400 truncate">{user.email}</div>
                  </div>
                </div>

                <div className="py-2.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" /> Study Streak
                    </span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">{user.streakDays} Days</span>
                  </div>
                  <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-sky-500" /> Daily Target
                    </span>
                    <span className="font-semibold">{user.dailyGoalMinutes} mins</span>
                  </div>
                  <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400">Academic Stage</span>
                    <span className="font-semibold capitalize">{user.level}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenAuth();
                    }}
                    className="w-full text-center py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm shadow-indigo-600/20"
                  >
                    Edit Profile / Switch Account
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenBookmarks();
                    }}
                    className="w-full text-center py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    View Saved Bookmarks
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

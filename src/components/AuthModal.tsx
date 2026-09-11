import { useState } from "react";
import { User, Mail, Lock, GraduationCap, X, Check, ArrowRight } from "lucide-react";
import { UserProfile, StudentLevel, LanguageMode } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
}: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [level, setLevel] = useState<StudentLevel>(currentUser.level);
  const [preferredLang, setPreferredLang] = useState<LanguageMode>(currentUser.preferredLanguage);
  const [dailyGoal, setDailyGoal] = useState(currentUser.dailyGoalMinutes);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...currentUser,
      name: name.trim() || "Student",
      email: email.trim() || "student@edunova.ai",
      level,
      preferredLanguage: preferredLang,
      dailyGoalMinutes: dailyGoal,
    };
    onUpdateUser(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-900 to-sky-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-sky-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold">
                {isSignUp ? "Create Student Profile" : "Student Account Settings"}
              </h2>
              <p className="text-xs text-sky-200">
                School, College & University AI Learning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">
              Student Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ananya Roy / Tanvir Ahmed"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">
              Academic Stage
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["school", "college", "university"] as StudentLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`p-2 rounded-xl border font-semibold text-center capitalize transition ${
                    level === lvl
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">
                Preferred Language
              </label>
              <select
                value={preferredLang}
                onChange={(e) => setPreferredLang(e.target.value as LanguageMode)}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              >
                <option value="both">Bilingual (বাংলা + English)</option>
                <option value="bn">Bengali (বাংলা)</option>
                <option value="en">English Only</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">
                Daily Target
              </label>
              <select
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              >
                <option value={30}>30 mins</option>
                <option value={45}>45 mins</option>
                <option value={60}>60 mins</option>
                <option value={90}>90 mins</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition"
            >
              <span>Save & Continue Studying</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

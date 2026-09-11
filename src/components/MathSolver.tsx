import { useState, useRef } from "react";
import Markdown from "react-markdown";
import {
  Calculator,
  Upload,
  Camera,
  Edit3,
  Image as ImageIcon,
  Sparkles,
  Check,
  Copy,
  Download,
  Printer,
  Bookmark,
  BookmarkCheck,
  Volume2,
  Trash2,
  HelpCircle,
  RotateCcw,
  Sigma,
  Pi,
  Divide,
  Activity,
  Box,
} from "lucide-react";
import { MathBranch, MathRecord, StudentLevel, LanguageMode } from "../types";
import { exportAsFile, printContent } from "../lib/storage";
import { speechService } from "../lib/speech";

interface MathSolverProps {
  studentLevel: StudentLevel;
  languageMode: LanguageMode;
  onSaveRecord: (rec: MathRecord) => void;
  recentRecords: MathRecord[];
  onAddBookmark: (title: string, content: string, source: string) => void;
  onRemoveBookmark: (title: string) => void;
  isBookmarked: (id: string) => boolean;
}

export default function MathSolver({
  studentLevel,
  languageMode,
  onSaveRecord,
  recentRecords,
  onAddBookmark,
  onRemoveBookmark,
  isBookmarked,
}: MathSolverProps) {
  const [branch, setBranch] = useState<MathBranch>("algebra");
  const [problemText, setProblemText] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentSolution, setCurrentSolution] = useState<string | null>(null);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  const branches: { id: MathBranch; label: string; icon: any; color: string }[] = [
    { id: "algebra", label: "Algebra", icon: Sigma, color: "text-indigo-600 dark:text-indigo-400" },
    { id: "calculus", label: "Calculus", icon: Activity, color: "text-sky-600 dark:text-sky-400" },
    { id: "geometry", label: "Geometry", icon: Box, color: "text-emerald-600 dark:text-emerald-400" },
    { id: "statistics", label: "Statistics", icon: Pi, color: "text-violet-600 dark:text-violet-400" },
    { id: "arithmetic", label: "Arithmetic", icon: Divide, color: "text-amber-600 dark:text-amber-400" },
  ];

  const presets: Record<MathBranch, { title: string; prompt: string }[]> = {
    algebra: [
      {
        title: "Quadratic Equation",
        prompt: "Solve for x: 3x^2 - 14x + 8 = 0 using both factoring and quadratic formula.",
      },
      {
        title: "System of Linear Equations",
        prompt: "Solve the system: 2x + 3y = 12 and 5x - 2y = 11 by substitution and elimination.",
      },
      {
        title: "Logarithmic Equation",
        prompt: "Solve for x: log_2(x + 3) + log_2(x - 1) = 5.",
      },
    ],
    calculus: [
      {
        title: "Derivative by Chain Rule",
        prompt: "Find the first and second derivative of f(x) = ln(x^2 + 4) * e^(3x).",
      },
      {
        title: "Definite Integral",
        prompt: "Evaluate the integral: ∫ from 0 to π/2 of (sin(x) / (1 + cos^2(x))) dx.",
      },
      {
        title: "Limits & L'Hôpital's Rule",
        prompt: "Evaluate limit as x -> 0 of (e^x - 1 - x) / x^2.",
      },
    ],
    geometry: [
      {
        title: "Circle Theorems",
        prompt: "A tangent is drawn from external point P to a circle of radius 6 cm. If OP = 10 cm, find tangent length and angle.",
      },
      {
        title: "Triangle Trigonometry",
        prompt: "In triangle ABC, side a = 8 cm, b = 10 cm, and angle C = 60°. Find side c and the area using Sine and Cosine laws.",
      },
      {
        title: "3D Sphere & Cylinder",
        prompt: "Find the ratio of volumes of a cylinder and inscribed sphere when height of cylinder equals diameter.",
      },
    ],
    statistics: [
      {
        title: "Standard Deviation & Variance",
        prompt: "Calculate mean, variance, and standard deviation for the dataset: [12, 18, 15, 20, 25, 22, 16].",
      },
      {
        title: "Binomial Probability",
        prompt: "A fair die is rolled 5 times. What is the probability of getting exactly 3 sixes? Show binomial formula.",
      },
      {
        title: "Normal Distribution z-score",
        prompt: "A test score is normally distributed with mean 75 and SD 8. Find probability of a student scoring above 87.",
      },
    ],
    arithmetic: [
      {
        title: "Fractions & Order of Operations",
        prompt: "Simplify: (3/4 + 2/5) ÷ (1/2 - 1/8) * 5/3 step by step.",
      },
      {
        title: "Percentages & Profit-Loss",
        prompt: "A shopkeeper marks an article 25% above cost price and allows a 10% discount. Find the profit percentage.",
      },
      {
        title: "Ratio & Proportion",
        prompt: "Divide $1,200 among A, B, and C in the ratio 2 : 3 : 5. Calculate each share.",
      },
    ],
  };

  // Image Upload Handler
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, WEBP)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Drawing Canvas logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    isDrawingRef.current = true;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const saveCanvasAsImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setImageBase64(dataUrl);
    setShowCanvas(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Solve Math Handler
  const handleSolve = async () => {
    if (!problemText.trim() && !imageBase64) return;

    setLoading(true);
    setCurrentSolution(null);

    try {
      const response = await fetch("/api/math-solver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemText: problemText.trim(),
          imageBase64: imageBase64,
          branch,
          level: studentLevel,
          language: languageMode,
          thinking: true, // Uses ThinkingLevel.HIGH with gemini-3.1-pro-preview
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to solve problem");
      }

      const data = await response.json();
      setCurrentSolution(data.solution);

      const record: MathRecord = {
        id: `math-${Date.now()}`,
        problem: problemText || (imageBase64 ? "Handwritten / Image Problem" : "Math Problem"),
        branch,
        solution: data.solution,
        hasImage: Boolean(imageBase64),
        timestamp: Date.now(),
      };

      setActiveRecordId(record.id);
      onSaveRecord(record);
    } catch (err: any) {
      console.error("Math solve error:", err);
      setCurrentSolution(
        `### Error Solving Problem\n\nCould not process the math query: ${err.message}. Please check your question or try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!currentSolution) return;
    navigator.clipboard.writeText(currentSolution);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    if (!currentSolution) return;
    exportAsFile(
      `# Mathematics Solution (${branch.toUpperCase()})\n\nProblem: ${problemText}\n\n${currentSolution}`,
      `math-solution-${branch}-${Date.now()}.md`
    );
  };

  const handlePrint = () => {
    if (!currentSolution) return;
    printContent(`Math Solution: ${branch.toUpperCase()}`, currentSolution);
  };

  const toggleSpeak = () => {
    if (!currentSolution) return;
    if (speaking) {
      speechService.stop();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      speechService.speak(currentSolution);
    }
  };

  const handleBookmarkCurrent = () => {
    if (!currentSolution || !activeRecordId) return;
    if (isBookmarked(activeRecordId)) {
      onRemoveBookmark(activeRecordId);
    } else {
      onAddBookmark(
        `Math: ${branch.toUpperCase()} - ${problemText.slice(0, 30) || "Image Problem"}`,
        currentSolution,
        branch
      );
    }
  };

  return (
    <div id="math-solver-container" className="flex-1 overflow-y-auto max-w-6xl mx-auto w-full p-3 sm:p-6 space-y-6 custom-scrollbar">
      {/* Title & Introduction */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Mathematics Problem Solver
          </h1>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold border border-sky-200 dark:border-sky-800">
            Step-by-Step & Method Driven
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Solves Algebra, Calculus, Geometry, Statistics, and Arithmetic. Explains the underlying theorems, derivation steps, and handles handwritten problem photos.
        </p>
      </div>

      {/* Branch Tabs */}
      <div className="flex flex-wrap gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
        {branches.map((b) => {
          const Icon = b.icon;
          const isSelected = branch === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setBranch(b.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                isSelected
                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/20 dark:bg-sky-500"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{b.label}</span>
            </button>
          );
        })}
      </div>

      {/* Input Area: Text, Image Upload, or Scratchpad Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Problem Input & Image Upload */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Problem Statement ({branch.toUpperCase()})
              </label>
              <span className="text-[11px] text-slate-400">LaTeX, equations, or plain text</span>
            </div>

            <textarea
              id="math-problem-textarea"
              rows={4}
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
              placeholder={`Enter your ${branch} problem here... e.g. Solve 2x^2 + 5x - 3 = 0, or calculate the integral...`}
              className="w-full p-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />

            {/* Image Attachment Preview */}
            {imageBase64 && (
              <div className="relative rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/30 p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={imageBase64}
                    alt="Math Problem"
                    className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700 bg-white"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Math Image Attached
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Handwritten OCR recognition active
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setImageBase64(null)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Upload Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
                }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <Upload className="w-3.5 h-3.5 text-sky-500" />
                <span>Upload Image / Photo</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCanvas(!showCanvas)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                <span>{showCanvas ? "Close Drawing Pad" : "Draw Equation"}</span>
              </button>
            </div>

            {/* Scratchpad Drawing Canvas */}
            {showCanvas && (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-900/80 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Draw or write equations by hand:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={clearCanvas}
                      className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Clear
                    </button>
                    <button
                      onClick={saveCanvasAsImage}
                      className="px-2.5 py-1 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                    >
                      Use Drawing
                    </button>
                  </div>
                </div>
                <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden bg-white">
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full touch-none cursor-crosshair block"
                  />
                </div>
              </div>
            )}

            {/* Solve Action Button */}
            <button
              id="solve-math-btn"
              onClick={handleSolve}
              disabled={loading || (!problemText.trim() && !imageBase64)}
              className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 text-white transition-all shadow-md ${
                loading || (!problemText.trim() && !imageBase64)
                  ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60"
                  : "bg-sky-600 hover:bg-sky-700 shadow-sky-600/20"
              }`}
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Deriving Step-by-Step Method & Formulas...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Solve with Step-by-Step Explanation</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Presets for Selected Branch */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              <HelpCircle className="w-3.5 h-3.5 text-sky-500" />
              <span>Example {branch.toUpperCase()} Problems</span>
            </div>
            <div className="space-y-2">
              {presets[branch].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setProblemText(item.prompt)}
                  className="w-full text-left p-2.5 rounded-xl text-xs bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200/70 dark:border-slate-700 transition group"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{item.prompt}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Step-by-Step Solution Viewer */}
        <div className="lg:col-span-6">
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm min-h-[460px] flex flex-col">
            {/* Header & Tooling */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Step-by-Step Solution
                </span>
                {currentSolution && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                    Complete Derivation
                  </span>
                )}
              </div>

              {currentSolution && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleSpeak}
                    className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition ${
                      speaking ? "text-sky-600" : "text-slate-400"
                    }`}
                    title="Read Aloud"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    title="Copy Solution"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleBookmarkCurrent}
                    className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition ${
                      activeRecordId && isBookmarked(activeRecordId) ? "text-amber-500" : "text-slate-400"
                    }`}
                    title="Bookmark Solution"
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
                    title="Print Solution"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Solution Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center gap-3 text-center p-6">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center animate-pulse">
                    <Calculator className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Analyzing Mathematical Structure...
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Applying core theorems, verifying steps, and preparing practice questions.
                    </p>
                  </div>
                </div>
              ) : currentSolution ? (
                <div className="markdown-body prose dark:prose-invert max-w-none text-sm space-y-3">
                  <Markdown>{currentSolution}</Markdown>
                </div>
              ) : (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                    <Sigma className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    No Solution Yet
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Enter a math problem on the left, choose an example preset, or upload an image of handwritten math to see the complete derivation.
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

import { useState } from "react";
import Markdown from "react-markdown";
import {
  Bookmark,
  Search,
  Trash2,
  Download,
  Printer,
  Volume2,
  ExternalLink,
  X,
  FileText,
} from "lucide-react";
import { BookmarkItem } from "../types";
import { exportAsFile, printContent } from "../lib/storage";
import { speechService } from "../lib/speech";

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkItem[];
  onRemoveBookmark: (id: string) => void;
}

export default function BookmarksModal({
  isOpen,
  onClose,
  bookmarks,
  onRemoveBookmark,
}: BookmarksModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkItem | null>(
    bookmarks[0] || null
  );

  if (!isOpen) return null;

  const filtered = bookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[85vh] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Bookmark className="w-4 h-4 fill-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                Bookmarked Answers & Study Notes
              </h2>
              <p className="text-xs text-slate-400">
                {bookmarks.length} saved reference items
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split view of bookmark list and reader */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left Column: List with search */}
          <div className="md:col-span-5 border-r border-slate-200 dark:border-slate-800 flex flex-col p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search bookmarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {filtered.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  No bookmarks found. Click the bookmark icon on any answer to save it here!
                </div>
              ) : (
                filtered.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBookmark(b)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-start justify-between gap-2 ${
                      selectedBookmark?.id === b.id
                        ? "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 font-semibold"
                        : "bg-white dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{b.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono">
                          {b.source}
                        </span>
                        <span>{new Date(b.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveBookmark(b.id);
                        if (selectedBookmark?.id === b.id) setSelectedBookmark(null);
                      }}
                      className="text-slate-400 hover:text-red-500 p-1"
                      title="Delete bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Full Reader */}
          <div className="md:col-span-7 flex flex-col p-4 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
            {selectedBookmark ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                  <div className="min-w-0 pr-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {selectedBookmark.title}
                    </h3>
                    <div className="text-[10px] text-slate-400">
                      From {selectedBookmark.source}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => speechService.speak(selectedBookmark.content)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-white dark:hover:bg-slate-800"
                      title="Read aloud"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        exportAsFile(
                          `# ${selectedBookmark.title}\n\n${selectedBookmark.content}`,
                          `bookmark-${selectedBookmark.id}.md`
                        )
                      }
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-white dark:hover:bg-slate-800"
                      title="Download Markdown"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        printContent(selectedBookmark.title, selectedBookmark.content)
                      }
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-white dark:hover:bg-slate-800"
                      title="Print"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="markdown-body prose dark:prose-invert max-w-none text-xs leading-relaxed">
                    <Markdown>{selectedBookmark.content}</Markdown>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <FileText className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-xs">Select a bookmark on the left to read full notes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

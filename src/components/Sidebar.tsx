import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, FileText } from 'lucide-react';
import { AnswerRecord, ThemeDocument } from '../types/quiz';
import { computeSubtopicStats, computeThemeStats } from '../utils/storage';

interface SidebarProps {
  themes: ThemeDocument[];
  activeThemeId: string;
  activeSubtopicId: string;
  answers: Record<string, AnswerRecord>;
  onSelectSubtopic: (themeId: string, subtopicId: string) => void;
  onOpenPdf: (theme: ThemeDocument) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  themes,
  activeThemeId,
  activeSubtopicId,
  answers,
  onSelectSubtopic,
  onOpenPdf,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const [expandedThemes, setExpandedThemes] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const t of themes) {
      initial[t.id] = t.id === activeThemeId;
    }
    return initial;
  });

  useEffect(() => {
    setExpandedThemes((prev) => ({
      ...prev,
      [activeThemeId]: true,
    }));
  }, [activeThemeId]);

  const toggleTheme = (themeId: string) => {
    setExpandedThemes((prev) => ({
      ...prev,
      [themeId]: !prev[themeId],
    }));
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Раздел 1 · 7 документов
        </span>
        <span className="text-xs font-mono tabular-nums text-slate-500">
          44 вопроса
        </span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {themes.map((theme) => {
          const isExpanded = Boolean(expandedThemes[theme.id]);
          const tStats = computeThemeStats(theme, answers);

          return (
            <div key={theme.id} className="py-1.5">
              <div className="px-3 flex items-start gap-1">
                <button
                  type="button"
                  onClick={() => toggleTheme(theme.id)}
                  className="flex-1 flex items-start gap-2 py-2 px-1.5 rounded-lg text-left hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span className="mt-0.5 text-slate-400 shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        {theme.code}
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-slate-500">
                        {tStats.answered}/{tStats.total}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                      {theme.shortTitle}
                    </p>
                    <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900 transition-all duration-300"
                        style={{ width: `${tStats.completionPercent}%` }}
                      />
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenPdf(theme)}
                  title={`Открыть PDF: ${theme.code}`}
                  aria-label={`Открыть PDF-документ ${theme.code}`}
                  className="mt-2 p-1.5 rounded-md text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
              </div>

              {isExpanded && (
                <div className="mt-1 px-3 pl-7 space-y-0.5 pb-1.5">
                  {theme.subtopics.map((sub) => {
                    const st = computeSubtopicStats(sub, answers);
                    const isActive = sub.id === activeSubtopicId;
                    const isComplete = st.total > 0 && st.answered === st.total;

                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          onSelectSubtopic(theme.id, sub.id);
                          onCloseMobile();
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-red-50 text-slate-900'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs leading-snug">
                            <span
                              className={`font-semibold ${
                                isActive ? 'text-red-700' : 'text-red-700/85'
                              }`}
                            >
                              {sub.numberLabel}.
                            </span>{' '}
                            <span className={isActive ? 'font-medium text-slate-900' : ''}>
                              {sub.title}
                            </span>
                          </span>
                          {isComplete && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                          )}
                        </div>
                        <div className="mt-1 text-[11px] font-mono tabular-nums text-slate-500">
                          {st.answered}/{st.total}
                          {st.checked > 0 && ` · ${st.accuracyPercent}% верно`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-[320px] shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 w-[310px] max-w-[85vw] h-full shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

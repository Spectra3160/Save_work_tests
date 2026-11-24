import { useState, useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Search,
} from 'lucide-react';
import { AnswerRecord, Subtopic, ThemeDocument } from '../types/quiz';
import {
  computeGlobalStats,
  computeSubtopicStats,
  computeThemeStats,
} from '../utils/storage';

interface CatalogViewProps {
  themes: ThemeDocument[];
  answers: Record<string, AnswerRecord>;
  bookmarks: Record<string, boolean>;
  historyCount: number;
  activeTheme: ThemeDocument;
  activeSubtopic: Subtopic;
  activeQuestionIndex: number;
  onOpenSubtopic: (themeId: string, subtopicId: string) => void;
  onResumeActive: () => void;
  onOpenPdf: (theme: ThemeDocument) => void;
}

export function CatalogView({
  themes,
  answers,
  bookmarks,
  historyCount,
  activeTheme,
  activeSubtopic,
  activeQuestionIndex,
  onOpenSubtopic,
  onResumeActive,
  onOpenPdf,
}: CatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedThemeIds, setExpandedThemeIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const t of themes) {
      initial[t.id] = true;
    }
    return initial;
  });

  const globalStats = useMemo(
    () => computeGlobalStats(themes, answers, bookmarks),
    [themes, answers, bookmarks]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredThemes = useMemo(() => {
    if (!normalizedQuery) return themes;
    return themes
      .map((theme) => {
        const themeMatches =
          theme.code.toLowerCase().includes(normalizedQuery) ||
          theme.title.toLowerCase().includes(normalizedQuery);
        const matchingSubtopics = theme.subtopics.filter(
          (sub) =>
            sub.title.toLowerCase().includes(normalizedQuery) ||
            sub.numberLabel.toLowerCase().includes(normalizedQuery) ||
            sub.questions.some((q) => q.question.toLowerCase().includes(normalizedQuery))
        );
        if (themeMatches) return theme;
        if (matchingSubtopics.length > 0) {
          return { ...theme, subtopics: matchingSubtopics };
        }
        return null;
      })
      .filter((item): item is ThemeDocument => item !== null);
  }, [themes, normalizedQuery]);

  const toggleTheme = (themeId: string) => {
    setExpandedThemeIds((prev) => ({
      ...prev,
      [themeId]: !prev[themeId],
    }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Global Metrics */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-700">
              Раздел 1 · Общие вопросы охраны труда
            </p>
            <h1 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Каталог документов и экзаменационных вопросов
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              Выберите учебный документ и конкретный вопрос программы. Все выбранные ответы,
              закладки и история попыток сохраняются автоматически после выхода из приложения.
            </p>
          </div>
        </div>

        {/* Clean Unboxed KPI Strip */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="pt-2 sm:pt-0">
            <div className="text-xs font-medium text-slate-500">Отвечено вопросов</div>
            <div className="mt-1 font-display text-2xl font-bold text-slate-900 tabular-nums">
              {globalStats.answered}
              <span className="text-sm font-normal text-slate-400"> / {globalStats.total}</span>
            </div>
            <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 transition-all duration-300"
                style={{ width: `${globalStats.completionPercent}%` }}
              />
            </div>
          </div>

          <div className="pt-4 sm:pt-0 sm:pl-6">
            <div className="text-xs font-medium text-slate-500">Точность ответов</div>
            <div className="mt-1 font-display text-2xl font-bold text-slate-900 tabular-nums">
              {globalStats.checked > 0 ? `${globalStats.accuracyPercent}%` : '—'}
            </div>
            <div className="mt-1 text-xs text-slate-500 tabular-nums">
              {globalStats.checked > 0
                ? `${globalStats.correct} верно · ${globalStats.wrong} ошибок`
                : 'Нет проверенных ответов'}
            </div>
          </div>

          <div className="pt-4 sm:pt-0 sm:pl-6">
            <div className="text-xs font-medium text-slate-500">Завершено тем-вопросов</div>
            <div className="mt-1 font-display text-2xl font-bold text-slate-900 tabular-nums">
              {globalStats.completedSubtopics}
              <span className="text-sm font-normal text-slate-400">
                {' '}
                / {globalStats.totalSubtopics}
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              По 7 обучающим документам
            </div>
          </div>

          <div className="pt-4 sm:pt-0 sm:pl-6">
            <div className="text-xs font-medium text-slate-500">История и закладки</div>
            <div className="mt-1 font-display text-2xl font-bold text-slate-900 tabular-nums">
              {historyCount}
              <span className="text-sm font-normal text-slate-400"> попыт.</span>
            </div>
            <div className="mt-1 text-xs text-slate-500 tabular-nums">
              В закладках: {globalStats.bookmarkCount}
            </div>
          </div>
        </div>

        {/* Resume Banner */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500">
              {globalStats.answered > 0 ? 'Последняя позиция' : 'Рекомендуемый старт'} ·{' '}
              {activeTheme.code}
            </div>
            <div className="mt-1 text-sm sm:text-base font-semibold text-slate-900">
              <span className="text-red-700">{activeSubtopic.numberLabel}.</span>{' '}
              {activeSubtopic.title}
            </div>
            <div className="mt-0.5 text-xs text-slate-500 tabular-nums">
              Тестовый вопрос {activeQuestionIndex + 1} из {activeSubtopic.questions.length}
            </div>
          </div>
          <button
            type="button"
            onClick={onResumeActive}
            className="h-10 px-4 rounded-lg bg-red-700 hover:bg-red-800 text-white text-sm font-medium inline-flex items-center justify-center gap-2 shrink-0 transition-colors cursor-pointer"
          >
            <span>{globalStats.answered > 0 ? 'Продолжить прохождение' : 'Начать тестирование'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Search Bar */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Учебные документы и вопросы ({filteredThemes.length})
          </h2>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по теме, вопросу или термину..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
            />
          </div>
        </div>

        {/* Themes List */}
        {filteredThemes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-sm font-medium text-slate-700">
              По запросу «{searchQuery}» ничего не найдено.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-3 text-sm font-medium text-red-700 hover:text-red-800 cursor-pointer"
            >
              Сбросить поиск
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredThemes.map((theme) => {
              const tStats = computeThemeStats(theme, answers);
              const isExpanded = normalizedQuery.length > 0 || Boolean(expandedThemeIds[theme.id]);

              return (
                <article
                  key={theme.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                >
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
                    <button
                      type="button"
                      onClick={() => toggleTheme(theme.id)}
                      className="flex items-start gap-3 text-left min-w-0 flex-1 cursor-pointer group"
                    >
                      <span className="mt-1 text-slate-400 group-hover:text-slate-700 shrink-0">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-500">
                          {theme.code} · {theme.dateLabel} · {theme.subtopics.length} тем-вопросов
                        </div>
                        <h3 className="mt-0.5 font-display text-base sm:text-lg font-bold text-slate-900 group-hover:text-red-700 transition-colors">
                          {theme.title}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 tabular-nums">
                          <span>
                            Отвечено: <strong className="text-slate-800">{tStats.answered}</strong> из{' '}
                            {tStats.total}
                          </span>
                          <span>·</span>
                          <span>
                            Точность:{' '}
                            <strong className="text-slate-800">
                              {tStats.checked > 0 ? `${tStats.accuracyPercent}%` : '—'}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0 pl-7 sm:pl-0">
                      <button
                        type="button"
                        onClick={() => onOpenPdf(theme)}
                        className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-red-700" />
                        <span>PDF документа</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenSubtopic(theme.id, theme.subtopics[0].id)}
                        className="h-9 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Открыть тест</span>
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="divide-y divide-slate-100">
                      {theme.subtopics.map((sub) => {
                        const st = computeSubtopicStats(sub, answers);
                        const isDone = st.total > 0 && st.answered === st.total;
                        const isCurrent = sub.id === activeSubtopic.id;

                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => onOpenSubtopic(theme.id, sub.id)}
                            className={`w-full px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                              isCurrent ? 'bg-red-50/60' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                              ) : (
                                <span className="w-4 h-4 shrink-0 mt-0.5 inline-flex items-center justify-center text-[11px] font-mono text-slate-400">
                                  •
                                </span>
                              )}
                              <div className="min-w-0">
                                <span className="text-sm font-semibold text-red-700">
                                  {sub.numberLabel}.
                                </span>{' '}
                                <span className="text-sm font-medium text-slate-900">
                                  {sub.title}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 pl-6 sm:pl-0 shrink-0">
                              <span className="text-xs font-mono tabular-nums text-slate-600">
                                {st.answered}/{st.total} вопр.
                                {st.checked > 0 && ` · ${st.accuracyPercent}% верно`}
                              </span>
                              <ArrowRight className="w-4 h-4 text-slate-400" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

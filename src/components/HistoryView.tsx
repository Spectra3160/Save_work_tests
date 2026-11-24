import { useState, useMemo } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  AnswerRecord,
  TestAttemptRecord,
  ThemeDocument,
} from '../types/quiz';
import { ALL_QUESTIONS_FLAT, QUESTION_LOOKUP } from '../data';
import { formatRussianDateTime } from '../utils/storage';
import { ConfirmModal } from './ConfirmModal';

const OPTION_LETTERS = ['А', 'Б', 'В', 'Г'] as const;

interface HistoryViewProps {
  themes: ThemeDocument[];
  history: TestAttemptRecord[];
  answers: Record<string, AnswerRecord>;
  bookmarks: Record<string, boolean>;
  onJumpToQuestion: (themeId: string, subtopicId: string, questionIndex: number) => void;
  onToggleBookmark: (questionId: string) => void;
  onClearHistory: () => void;
}

export function HistoryView({
  themes,
  history,
  answers,
  bookmarks,
  onJumpToQuestion,
  onToggleBookmark,
  onClearHistory,
}: HistoryViewProps) {
  const [activeTab, setActiveTab] = useState<'attempts' | 'review'>('attempts');
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong' | 'bookmarked'>('all');
  const [expandedAttemptIds, setExpandedAttemptIds] = useState<Record<string, boolean>>({});
  const [clearModalOpen, setClearModalOpen] = useState(false);

  const reviewItems = useMemo(() => {
    return ALL_QUESTIONS_FLAT.filter((item) => {
      const rec = answers[item.question.id];
      const isWrong = Boolean(
        rec && rec.isChecked && rec.selectedIndex !== item.question.correctIndex
      );
      const isMarked = Boolean(bookmarks[item.question.id]);

      if (reviewFilter === 'wrong') return isWrong;
      if (reviewFilter === 'bookmarked') return isMarked;
      return isWrong || isMarked;
    });
  }, [answers, bookmarks, reviewFilter]);

  const filteredHistory = useMemo(() => {
    if (themeFilter === 'all') return history;
    return history.filter((h) => h.themeId === themeFilter);
  }, [history, themeFilter]);

  const toggleAttemptDetails = (attemptId: string) => {
    setExpandedAttemptIds((prev) => ({
      ...prev,
      [attemptId]: !prev[attemptId],
    }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-red-700">
            Анализ прохождения
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            История попыток и работа над ошибками
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Просматривайте сохранённые результаты тестов, разбирайте допущенные ошибки и возвращайтесь к сложным вопросам.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Разделы истории"
          className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shrink-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'attempts'}
            onClick={() => setActiveTab('attempts')}
            className={`h-8 px-3.5 rounded-md text-xs font-medium transition-colors cursor-pointer tabular-nums ${
              activeTab === 'attempts'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            История попыток ({history.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'review'}
            onClick={() => setActiveTab('review')}
            className={`h-8 px-3.5 rounded-md text-xs font-medium transition-colors cursor-pointer tabular-nums ${
              activeTab === 'review'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ошибки и закладки ({reviewItems.length})
          </button>
        </div>
      </header>

      {activeTab === 'attempts' ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <select
              value={themeFilter}
              onChange={(e) => setThemeFilter(e.target.value)}
              aria-label="Фильтр по документу"
              className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-400"
            >
              <option value="all">Все документы (7 тем)</option>
              {themes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} · {t.shortTitle}
                </option>
              ))}
            </select>

            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setClearModalOpen(true)}
                className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-xs font-medium text-slate-600 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Очистить историю</span>
              </button>
            )}
          </div>

          {filteredHistory.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-900">
                Сохранённых попыток пока нет
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Пройдите тест по любому вопросу и нажмите «Завершить и проверить» (в режиме проверки)
                или «Зафиксировать попытку в истории» (в режиме обучения).
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((attempt) => {
                const isPassed = attempt.percentage >= 80;
                const isExpanded = Boolean(expandedAttemptIds[attempt.id]);

                return (
                  <article
                    key={attempt.id}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                  >
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 tabular-nums">
                          <span className="font-semibold text-slate-700">{attempt.themeCode}</span>
                          <span>·</span>
                          <span>{attempt.mode === 'exam' ? 'Проверка' : 'Обучение'}</span>
                          <span>·</span>
                          <span>{formatRussianDateTime(attempt.completedAt)}</span>
                        </div>
                        <h3 className="font-display text-sm sm:text-base font-bold text-slate-900">
                          {attempt.subtopicTitle}
                        </h3>
                        <div className="flex items-center gap-3 pt-0.5">
                          <span className="text-sm font-mono font-bold text-slate-900 tabular-nums">
                            {attempt.correctCount} / {attempt.totalCount} ({attempt.percentage}%)
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold ${
                              isPassed ? 'text-emerald-700' : 'text-red-700'
                            }`}
                          >
                            {isPassed ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Зачёт</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Требует повторения</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleAttemptDetails(attempt.id)}
                          className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Разбор ({attempt.details.length})</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onJumpToQuestion(attempt.themeId, attempt.subtopicId, 0)}
                          className="h-9 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Открыть</span>
                        </button>
                      </div>
                    </div>

                    {isExpanded && attempt.details.length > 0 && (
                      <div className="border-t border-slate-100 bg-slate-50/70 divide-y divide-slate-200/70">
                        {attempt.details.map((detail, idx) => {
                          const found = QUESTION_LOOKUP.get(detail.questionId);
                          if (!found) return null;
                          const isOk = detail.selectedIndex === detail.correctIndex;

                          return (
                            <div
                              key={`${attempt.id}_${detail.questionId}_${idx}`}
                              className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                            >
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-start gap-2">
                                  {isOk ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                                  )}
                                  <p className="text-xs sm:text-sm font-medium text-slate-900">
                                    {found.question.question}
                                  </p>
                                </div>
                                <div className="pl-6 text-xs text-slate-600 space-y-0.5">
                                  <div>
                                    Ваш ответ ({OPTION_LETTERS[detail.selectedIndex]}):{' '}
                                    <span className={isOk ? 'text-emerald-800 font-medium' : 'text-red-800 font-medium'}>
                                      {found.question.options[detail.selectedIndex]}
                                    </span>
                                  </div>
                                  {!isOk && (
                                    <div>
                                      Верный ответ ({OPTION_LETTERS[detail.correctIndex]}):{' '}
                                      <span className="text-emerald-800 font-medium">
                                        {found.question.options[detail.correctIndex]}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  onJumpToQuestion(
                                    found.theme.id,
                                    found.subtopic.id,
                                    found.indexInSubtopic
                                  )
                                }
                                className="text-xs font-medium text-slate-600 hover:text-red-700 inline-flex items-center gap-1 shrink-0 pl-6 sm:pl-0 cursor-pointer"
                              >
                                <span>К вопросу</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'Все (ошибки и закладки)' },
                { id: 'wrong', label: 'Только ошибки' },
                { id: 'bookmarked', label: 'Только закладки' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setReviewFilter(tab.id)}
                className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  reviewFilter === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {reviewItems.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-900">
                Список пуст
              </p>
              <p className="text-xs text-slate-500">
                Здесь автоматически собираются вопросы с неверными ответами и вопросы, отмеченные закладкой.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviewItems.map((item) => {
                const rec = answers[item.question.id];
                const isWrong = Boolean(
                  rec && rec.isChecked && rec.selectedIndex !== item.question.correctIndex
                );
                const isMarked = Boolean(bookmarks[item.question.id]);

                return (
                  <article
                    key={item.question.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{item.theme.code}</span> ·{' '}
                        <span className="font-semibold text-red-700">{item.subtopic.numberLabel}.</span>{' '}
                        {item.subtopic.title}
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        {isWrong && (
                          <span className="inline-flex items-center gap-1 font-semibold text-red-700">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Ошибка</span>
                          </span>
                        )}
                        {isMarked && (
                          <button
                            type="button"
                            onClick={() => onToggleBookmark(item.question.id)}
                            className="inline-flex items-center gap-1 font-semibold text-amber-700 hover:text-amber-900 cursor-pointer"
                          >
                            <Bookmark className="w-3.5 h-3.5 fill-amber-500" />
                            <span>Убрать закладку</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="font-display text-sm sm:text-base font-bold text-slate-900">
                      {item.question.question}
                    </h3>

                    <div className="text-xs sm:text-sm space-y-1.5 bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                      {isWrong && rec && (
                        <div className="text-red-800">
                          <strong>Ваш ответ ({OPTION_LETTERS[rec.selectedIndex]}):</strong>{' '}
                          {item.question.options[rec.selectedIndex]}
                        </div>
                      )}
                      <div className="text-emerald-800">
                        <strong>Верный ответ ({OPTION_LETTERS[item.question.correctIndex]}):</strong>{' '}
                        {item.question.options[item.question.correctIndex]}
                      </div>
                      <p className="text-slate-600 pt-1 leading-relaxed">
                        {item.question.explanation}
                      </p>
                      <div className="text-xs text-slate-500">
                        Основание: {item.question.reference}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          onJumpToQuestion(
                            item.theme.id,
                            item.subtopic.id,
                            item.indexInSubtopic
                          )
                        }
                        className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Перейти к вопросу</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      <ConfirmModal
        open={clearModalOpen}
        title="Очистить всю историю попыток?"
        description="Список завершённых попыток будет удалён. Текущие выбранные ответы в вопросах и закладки останутся нетронутыми."
        confirmLabel="Очистить историю"
        destructive
        onConfirm={() => {
          onClearHistory();
          setClearModalOpen(false);
        }}
        onCancel={() => setClearModalOpen(false)}
      />
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  RotateCcw,
  Save,
  XCircle,
} from 'lucide-react';
import {
  AnswerRecord,
  QuizQuestion,
  Subtopic,
  TestMode,
  ThemeDocument,
} from '../types/quiz';
import { computeSubtopicStats } from '../utils/storage';
import { getNextSubtopic } from '../data';
import { ConfirmModal } from './ConfirmModal';

type QuestionFilter = 'all' | 'unanswered' | 'wrong' | 'bookmarked';

const OPTION_LETTERS = ['А', 'Б', 'В', 'Г'] as const;

interface QuizStageProps {
  theme: ThemeDocument;
  subtopic: Subtopic;
  questionIndex: number;
  mode: TestMode;
  answers: Record<string, AnswerRecord>;
  bookmarks: Record<string, boolean>;
  onChangeMode: (mode: TestMode) => void;
  onSelectQuestionIndex: (index: number) => void;
  onSelectAnswer: (questionId: string, optionIndex: number) => void;
  onToggleBookmark: (questionId: string) => void;
  onCompleteSubtopicAttempt: () => { correct: number; total: number; percentage: number };
  onResetSubtopic: () => void;
  onNavigateSubtopic: (themeId: string, subtopicId: string) => void;
  onOpenPdf: (theme: ThemeDocument) => void;
}

export function QuizStage({
  theme,
  subtopic,
  questionIndex,
  mode,
  answers,
  bookmarks,
  onChangeMode,
  onSelectQuestionIndex,
  onSelectAnswer,
  onToggleBookmark,
  onCompleteSubtopicAttempt,
  onResetSubtopic,
  onNavigateSubtopic,
  onOpenPdf,
}: QuizStageProps) {
  const [filter, setFilter] = useState<QuestionFilter>('all');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [attemptBanner, setAttemptBanner] = useState<{
    correct: number;
    total: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    setFilter('all');
    setAttemptBanner(null);
  }, [subtopic.id]);

  const stats = useMemo(
    () => computeSubtopicStats(subtopic, answers),
    [subtopic, answers]
  );

  const visibleIndices = useMemo(() => {
    const indices: number[] = [];
    subtopic.questions.forEach((q, idx) => {
      const rec = answers[q.id];
      if (filter === 'all') {
        indices.push(idx);
      } else if (filter === 'unanswered') {
        if (!rec) indices.push(idx);
      } else if (filter === 'wrong') {
        if (rec && rec.isChecked && rec.selectedIndex !== q.correctIndex) {
          indices.push(idx);
        }
      } else if (filter === 'bookmarked') {
        if (bookmarks[q.id]) indices.push(idx);
      }
    });
    return indices;
  }, [subtopic.questions, answers, bookmarks, filter]);

  const safeIndex = Math.min(
    Math.max(0, questionIndex),
    subtopic.questions.length - 1
  );
  const currentQuestion: QuizQuestion = subtopic.questions[safeIndex];
  const currentAnswer = answers[currentQuestion.id];
  const isBookmarked = Boolean(bookmarks[currentQuestion.id]);
  const nextSub = getNextSubtopic(theme.id, subtopic.id);

  // Keyboard navigation: 1-4 to select option, Left/Right arrows to navigate questions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (resetModalOpen) return;

      if (e.key >= '1' && e.key <= '4') {
        const optIdx = Number(e.key) - 1;
        onSelectAnswer(currentQuestion.id, optIdx);
      } else if (e.key === 'ArrowLeft') {
        if (safeIndex > 0) onSelectQuestionIndex(safeIndex - 1);
      } else if (e.key === 'ArrowRight') {
        if (safeIndex < subtopic.questions.length - 1) {
          onSelectQuestionIndex(safeIndex + 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentQuestion.id,
    safeIndex,
    subtopic.questions.length,
    onSelectAnswer,
    onSelectQuestionIndex,
    resetModalOpen,
  ]);

  const handleFinishAttempt = () => {
    const result = onCompleteSubtopicAttempt();
    setAttemptBanner(result);
  };

  const countByFilter = useMemo(() => {
    let unanswered = 0;
    let wrong = 0;
    let bookmarked = 0;
    for (const q of subtopic.questions) {
      const rec = answers[q.id];
      if (!rec) unanswered++;
      if (rec && rec.isChecked && rec.selectedIndex !== q.correctIndex) wrong++;
      if (bookmarks[q.id]) bookmarked++;
    }
    return {
      all: subtopic.questions.length,
      unanswered,
      wrong,
      bookmarked,
    };
  }, [subtopic.questions, answers, bookmarks]);

  const allCheckedInSubtopic = stats.total > 0 && stats.checked === stats.total;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Subtopic Context Header */}
      <header className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500">
              {theme.code} · {theme.shortTitle}
            </div>
            <h1 className="mt-1 font-display text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              <span className="text-red-700">{subtopic.numberLabel}.</span>{' '}
              {subtopic.title}
            </h1>
            <div className="mt-1.5 text-xs font-mono tabular-nums text-slate-500">
              Отвечено {stats.answered}/{stats.total}
              {stats.checked > 0 && ` · Верно ${stats.correct}/${stats.checked} (${stats.accuracyPercent}%)`}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Mode Switcher */}
            <div
              role="group"
              aria-label="Режим тестирования"
              className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5"
            >
              <button
                type="button"
                onClick={() => onChangeMode('training')}
                className={`h-8 px-3 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  mode === 'training'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Обучение
              </button>
              <button
                type="button"
                onClick={() => onChangeMode('exam')}
                className={`h-8 px-3 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  mode === 'exam'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Проверка
              </button>
            </div>

            <button
              type="button"
              onClick={() => onOpenPdf(theme)}
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-red-700" />
              <span>Конспект PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              disabled={stats.answered === 0}
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сбросить</span>
            </button>
          </div>
        </div>

        {/* Mode explanation */}
        <p className="text-xs text-slate-500">
          {mode === 'training'
            ? 'Режим «Обучение»: ответ проверяется сразу после выбора с подробным разбором и ссылкой на нормативную норму.'
            : 'Режим «Проверка»: ответы запоминаются без подсказок. Нажмите «Завершить и проверить», чтобы увидеть итоговый балл и разбор.'}
        </p>
      </header>

      {/* Filter Row & Interactive Question Map */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: `Все (${countByFilter.all})` },
                { id: 'unanswered', label: `Без ответа (${countByFilter.unanswered})` },
                { id: 'wrong', label: `Ошибки (${countByFilter.wrong})` },
                { id: 'bookmarked', label: `Закладки (${countByFilter.bookmarked})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFilter(tab.id);
                  const matching = subtopic.questions.findIndex((q) => {
                    const r = answers[q.id];
                    if (tab.id === 'all') return true;
                    if (tab.id === 'unanswered') return !r;
                    if (tab.id === 'wrong')
                      return Boolean(r && r.isChecked && r.selectedIndex !== q.correctIndex);
                    return Boolean(bookmarks[q.id]);
                  });
                  if (matching >= 0) onSelectQuestionIndex(matching);
                }}
                className={`h-7 px-2.5 rounded-md text-xs font-medium transition-colors cursor-pointer tabular-nums ${
                  filter === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Клавиши 1–4 для выбора · ← → для перехода
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {visibleIndices.length === 0 ? (
            <span className="text-xs text-slate-500 py-1">
              По выбранному фильтру вопросов нет.
            </span>
          ) : (
            visibleIndices.map((idx) => {
              const q = subtopic.questions[idx];
              const rec = answers[q.id];
              const isCurrent = idx === safeIndex;
              const isMarked = Boolean(bookmarks[q.id]);

              let stateClasses = 'bg-white border-slate-200 text-slate-700 hover:border-slate-400';
              if (rec) {
                if (rec.isChecked) {
                  stateClasses =
                    rec.selectedIndex === q.correctIndex
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                      : 'bg-red-50 border-red-600 text-red-800';
                } else {
                  stateClasses = 'bg-slate-100 border-slate-500 text-slate-900';
                }
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => onSelectQuestionIndex(idx)}
                  aria-label={`Перейти к вопросу ${idx + 1}`}
                  className={`relative w-9 h-9 rounded-lg border text-xs font-mono font-semibold tabular-nums inline-flex items-center justify-center transition-all cursor-pointer ${stateClasses} ${
                    isCurrent ? 'ring-2 ring-slate-900 ring-offset-1' : ''
                  }`}
                >
                  {idx + 1}
                  {isMarked && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white"
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Attempt Saved / Completed Summary Banner */}
      {(attemptBanner || allCheckedInSubtopic) && (
        <section className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            {(attemptBanner?.percentage ?? stats.accuracyPercent) >= 80 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <ClipboardCheck className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-sm font-bold text-slate-900 tabular-nums">
                {attemptBanner
                  ? `Результат сохранён в историю: ${attemptBanner.correct} из ${attemptBanner.total} (${attemptBanner.percentage}%)`
                  : `Все вопросы темы проверены: ${stats.correct} из ${stats.total} (${stats.accuracyPercent}%)`}
              </div>
              <p className="mt-0.5 text-xs text-slate-600">
                {(attemptBanner?.percentage ?? stats.accuracyPercent) >= 80
                  ? 'Отличный уровень усвоения материала. Можно переходить к следующему вопросу.'
                  : 'Рекомендуется повторить ошибочные вопросы и заглянуть в конспект PDF.'}
              </p>
            </div>
          </div>

          {nextSub && (
            <button
              type="button"
              onClick={() => onNavigateSubtopic(nextSub.theme.id, nextSub.subtopic.id)}
              className="h-9 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Следующий вопрос</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </section>
      )}

      {/* Main Question Card */}
      <article className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-mono font-medium uppercase tracking-wider text-slate-500 tabular-nums">
            Тестовый вопрос {safeIndex + 1} из {subtopic.questions.length}
          </span>
          <button
            type="button"
            onClick={() => onToggleBookmark(currentQuestion.id)}
            className={`h-8 px-2.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              isBookmarked
                ? 'border-amber-300 bg-amber-50 text-amber-900'
                : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {isBookmarked ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>В закладках</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>В закладки</span>
              </>
            )}
          </button>
        </div>

        <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 leading-snug">
          {currentQuestion.question}
        </h2>

        {/* 4 Answer Options */}
        <div className="space-y-3" role="radiogroup" aria-label="Варианты ответа">
          {currentQuestion.options.map((optionText, idx) => {
            const isSelected = currentAnswer?.selectedIndex === idx;
            const isChecked = Boolean(currentAnswer?.isChecked);
            const isCorrectOption = idx === currentQuestion.correctIndex;

            let cardStyle =
              'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50/70 text-slate-800';
            let letterStyle = 'border-slate-200 bg-slate-50 text-slate-600';
            let statusNode: React.ReactNode = null;

            if (isChecked) {
              if (isCorrectOption) {
                cardStyle = 'border-emerald-600 bg-emerald-50/70 text-slate-900';
                letterStyle = 'border-emerald-600 bg-emerald-700 text-white';
                statusNode = (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Верно</span>
                  </span>
                );
              } else if (isSelected) {
                cardStyle = 'border-red-600 bg-red-50/70 text-slate-900';
                letterStyle = 'border-red-600 bg-red-700 text-white';
                statusNode = (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-800 shrink-0">
                    <XCircle className="w-4 h-4" />
                    <span>Ошибка</span>
                  </span>
                );
              } else {
                cardStyle = 'border-slate-200 bg-white text-slate-500';
              }
            } else if (isSelected) {
              cardStyle = 'border-slate-900 bg-slate-50 text-slate-900 ring-1 ring-slate-900';
              letterStyle = 'border-slate-900 bg-slate-900 text-white';
              statusNode = (
                <span className="text-xs font-semibold text-slate-700 shrink-0">
                  Выбрано
                </span>
              );
            }

            return (
              <button
                key={idx}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelectAnswer(currentQuestion.id, idx)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${cardStyle}`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-md border text-xs font-mono font-bold inline-flex items-center justify-center shrink-0 mt-0.5 ${letterStyle}`}
                  >
                    {OPTION_LETTERS[idx]}
                  </span>
                  <span className="text-sm sm:text-[15px] leading-relaxed">
                    {optionText}
                  </span>
                </div>
                {statusNode}
              </button>
            );
          })}
        </div>

        {/* Checked Feedback & Explanation */}
        {currentAnswer?.isChecked && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-2">
            <div className="flex items-center gap-2">
              {currentAnswer.selectedIndex === currentQuestion.correctIndex ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="text-sm font-bold text-emerald-800">
                    Ответ верный
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-700 shrink-0" />
                  <span className="text-sm font-bold text-red-800">
                    Неверный ответ · Правильный вариант: {OPTION_LETTERS[currentQuestion.correctIndex]}
                  </span>
                </>
              )}
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {currentQuestion.explanation}
            </p>
            <div className="pt-1 text-xs font-medium text-slate-500">
              Основание: {currentQuestion.reference}
            </div>
          </div>
        )}

        {/* Footer Controls */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectQuestionIndex(safeIndex - 1)}
              disabled={safeIndex === 0}
              className="h-10 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-sm font-medium text-slate-700 inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Назад</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectQuestionIndex(safeIndex + 1)}
              disabled={safeIndex >= subtopic.questions.length - 1}
              className="h-10 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Далее</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleFinishAttempt}
            disabled={stats.answered === 0}
            className="h-10 px-4 rounded-lg bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white text-sm font-medium inline-flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {mode === 'exam' ? (
              <>
                <ClipboardCheck className="w-4 h-4" />
                <span>Завершить и проверить ({stats.answered}/{stats.total})</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Зафиксировать попытку в истории</span>
              </>
            )}
          </button>
        </div>
      </article>

      <ConfirmModal
        open={resetModalOpen}
        title="Сбросить ответы по этому вопросу?"
        description={`Выбранные ответы по теме «${subtopic.numberLabel}. ${subtopic.title}» будут очищены, чтобы вы могли пройти тест заново. Сохранённые попытки в истории останутся.`}
        confirmLabel="Сбросить ответы"
        destructive
        onConfirm={() => {
          onResetSubtopic();
          setAttemptBanner(null);
          setResetModalOpen(false);
        }}
        onCancel={() => setResetModalOpen(false)}
      />
    </div>
  );
}

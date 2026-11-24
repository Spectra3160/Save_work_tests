import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  NavSection,
  PersistedProgress,
  TestAttemptAnswer,
  TestAttemptRecord,
  TestMode,
  ThemeDocument,
} from './types/quiz';
import { ALL_THEMES, findThemeAndSubtopic } from './data';
import {
  createDefaultProgress,
  loadProgressFromDesktopIfNewer,
  loadProgressSync,
  saveProgress,
} from './utils/storage';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { CatalogView } from './components/CatalogView';
import { QuizStage } from './components/QuizStage';
import { HistoryView } from './components/HistoryView';
import { DesktopBuildView } from './components/DesktopBuildView';
import { PdfModal } from './components/PdfModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [progress, setProgress] = useState<PersistedProgress>(() => loadProgressSync());
  const [activeSection, setActiveSection] = useState<NavSection>(() => {
    const initial = loadProgressSync();
    return Object.keys(initial.answers).length > 0 ? 'quiz' : 'catalog';
  });
  const [pdfModalTheme, setPdfModalTheme] = useState<ThemeDocument | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync from Electron disk file on startup if running in desktop .exe wrapper
  useEffect(() => {
    let active = true;
    void loadProgressFromDesktopIfNewer(progress).then((diskProgress) => {
      if (active && diskProgress) {
        setProgress(diskProgress);
      }
    });
    return () => {
      active = false;
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist every progress change immediately
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const { theme: activeTheme, subtopic: activeSubtopic } = useMemo(
    () => findThemeAndSubtopic(progress.activeThemeId, progress.activeSubtopicId),
    [progress.activeThemeId, progress.activeSubtopicId]
  );

  const activeQuestionIndex = useMemo(() => {
    const stored = progress.activeQuestionIndexBySubtopic[activeSubtopic.id] ?? 0;
    return Math.min(Math.max(0, stored), Math.max(0, activeSubtopic.questions.length - 1));
  }, [progress.activeQuestionIndexBySubtopic, activeSubtopic]);

  const hasStarted = Object.keys(progress.answers).length > 0;

  const updateProgress = useCallback(
    (updater: (prev: PersistedProgress) => PersistedProgress) => {
      setProgress((prev) => ({
        ...updater(prev),
        lastSavedAt: Date.now(),
      }));
    },
    []
  );

  const handleOpenSubtopic = useCallback(
    (themeId: string, subtopicId: string, questionIndex?: number) => {
      updateProgress((prev) => ({
        ...prev,
        activeThemeId: themeId,
        activeSubtopicId: subtopicId,
        activeQuestionIndexBySubtopic:
          typeof questionIndex === 'number'
            ? { ...prev.activeQuestionIndexBySubtopic, [subtopicId]: questionIndex }
            : prev.activeQuestionIndexBySubtopic,
      }));
      setActiveSection('quiz');
      setMobileMenuOpen(false);
    },
    [updateProgress]
  );

  const handleSelectQuestionIndex = useCallback(
    (index: number) => {
      updateProgress((prev) => ({
        ...prev,
        activeQuestionIndexBySubtopic: {
          ...prev.activeQuestionIndexBySubtopic,
          [activeSubtopic.id]: index,
        },
      }));
    },
    [activeSubtopic.id, updateProgress]
  );

  const handleChangeMode = useCallback(
    (mode: TestMode) => {
      updateProgress((prev) => ({
        ...prev,
        mode,
      }));
    },
    [updateProgress]
  );

  const handleSelectAnswer = useCallback(
    (questionId: string, optionIndex: number) => {
      updateProgress((prev) => ({
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: {
            selectedIndex: optionIndex,
            isChecked: prev.mode === 'training',
            updatedAt: Date.now(),
          },
        },
      }));
    },
    [updateProgress]
  );

  const handleToggleBookmark = useCallback(
    (questionId: string) => {
      updateProgress((prev) => {
        const nextBookmarks = { ...prev.bookmarks };
        if (nextBookmarks[questionId]) {
          delete nextBookmarks[questionId];
        } else {
          nextBookmarks[questionId] = true;
        }
        return {
          ...prev,
          bookmarks: nextBookmarks,
        };
      });
    },
    [updateProgress]
  );

  const handleCompleteSubtopicAttempt = useCallback(() => {
    const now = Date.now();
    let correct = 0;
    const total = activeSubtopic.questions.length;
    const details: TestAttemptAnswer[] = [];

    const nextAnswers = { ...progress.answers };
    for (const q of activeSubtopic.questions) {
      const rec = nextAnswers[q.id];
      if (rec) {
        nextAnswers[q.id] = { ...rec, isChecked: true, updatedAt: now };
        if (rec.selectedIndex === q.correctIndex) {
          correct++;
        }
        details.push({
          questionId: q.id,
          selectedIndex: rec.selectedIndex,
          correctIndex: q.correctIndex,
        });
      }
    }

    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    const record: TestAttemptRecord = {
      id: `att_${now}_${Math.random().toString(36).slice(2, 7)}`,
      themeId: activeTheme.id,
      themeCode: activeTheme.code,
      subtopicId: activeSubtopic.id,
      subtopicTitle: `${activeSubtopic.numberLabel}. ${activeSubtopic.title}`,
      mode: progress.mode,
      correctCount: correct,
      totalCount: total,
      percentage,
      completedAt: now,
      details,
    };

    updateProgress((prev) => ({
      ...prev,
      answers: nextAnswers,
      history: [record, ...prev.history].slice(0, 200),
    }));

    return { correct, total, percentage };
  }, [activeTheme, activeSubtopic, progress.answers, progress.mode, updateProgress]);

  const handleResetSubtopic = useCallback(() => {
    updateProgress((prev) => {
      const nextAnswers = { ...prev.answers };
      for (const q of activeSubtopic.questions) {
        delete nextAnswers[q.id];
      }
      return {
        ...prev,
        answers: nextAnswers,
        activeQuestionIndexBySubtopic: {
          ...prev.activeQuestionIndexBySubtopic,
          [activeSubtopic.id]: 0,
        },
      };
    });
  }, [activeSubtopic, updateProgress]);

  const handleClearHistory = useCallback(() => {
    updateProgress((prev) => ({
      ...prev,
      history: [],
    }));
  }, [updateProgress]);

  const handleImportProgress = useCallback((imported: PersistedProgress) => {
    setProgress(imported);
  }, []);

  const handleResetAllProgress = useCallback(() => {
    setProgress(createDefaultProgress());
    setActiveSection('catalog');
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900 flex flex-col">
      <TopBar
        activeSection={activeSection}
        onSelectSection={(sec) => {
          setActiveSection(sec);
          setMobileMenuOpen(false);
        }}
        onResumeTest={() => setActiveSection('quiz')}
        hasStarted={hasStarted}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((v) => !v)}
      />

      <div className="flex-1 flex max-w-[1440px] w-full mx-auto">
        <Sidebar
          themes={ALL_THEMES}
          activeThemeId={activeTheme.id}
          activeSubtopicId={activeSubtopic.id}
          answers={progress.answers}
          onSelectSubtopic={(themeId, subtopicId) => handleOpenSubtopic(themeId, subtopicId)}
          onOpenPdf={setPdfModalTheme}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <main className="flex-1 min-w-0 pb-12">
          {activeSection === 'catalog' && (
            <CatalogView
              themes={ALL_THEMES}
              answers={progress.answers}
              bookmarks={progress.bookmarks}
              historyCount={progress.history.length}
              activeTheme={activeTheme}
              activeSubtopic={activeSubtopic}
              activeQuestionIndex={activeQuestionIndex}
              onOpenSubtopic={(themeId, subtopicId) => handleOpenSubtopic(themeId, subtopicId)}
              onResumeActive={() => setActiveSection('quiz')}
              onOpenPdf={setPdfModalTheme}
            />
          )}

          {activeSection === 'quiz' && (
            <QuizStage
              theme={activeTheme}
              subtopic={activeSubtopic}
              questionIndex={activeQuestionIndex}
              mode={progress.mode}
              answers={progress.answers}
              bookmarks={progress.bookmarks}
              onChangeMode={handleChangeMode}
              onSelectQuestionIndex={handleSelectQuestionIndex}
              onSelectAnswer={handleSelectAnswer}
              onToggleBookmark={handleToggleBookmark}
              onCompleteSubtopicAttempt={handleCompleteSubtopicAttempt}
              onResetSubtopic={handleResetSubtopic}
              onNavigateSubtopic={(themeId, subtopicId) =>
                handleOpenSubtopic(themeId, subtopicId, 0)
              }
              onOpenPdf={setPdfModalTheme}
            />
          )}

          {activeSection === 'history' && (
            <HistoryView
              themes={ALL_THEMES}
              history={progress.history}
              answers={progress.answers}
              bookmarks={progress.bookmarks}
              onJumpToQuestion={(themeId, subtopicId, qIdx) =>
                handleOpenSubtopic(themeId, subtopicId, qIdx)
              }
              onToggleBookmark={handleToggleBookmark}
              onClearHistory={handleClearHistory}
            />
          )}

          {activeSection === 'desktop' && (
            <DesktopBuildView
              progress={progress}
              onImportProgress={handleImportProgress}
              onResetAllProgress={handleResetAllProgress}
            />
          )}
        </main>
      </div>

      <PdfModal theme={pdfModalTheme} onClose={() => setPdfModalTheme(null)} />
      <OfflineIndicator />
    </div>
  );
}

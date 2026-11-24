import {
  AnswerRecord,
  PersistedProgress,
  Subtopic,
  TestAttemptRecord,
  ThemeDocument,
} from '../types/quiz';
import { ALL_THEMES, QUESTION_LOOKUP } from '../data';

export const STORAGE_KEY = 'ot_trainer_progress_v1';
const SCHEMA_VERSION = 1;

export interface ElectronStorageBridge {
  isElectron: boolean;
  loadProgress: () => Promise<PersistedProgress | null>;
  saveProgress: (progress: PersistedProgress) => Promise<{ ok: boolean; path?: string }>;
  getStoragePath?: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: ElectronStorageBridge;
  }
}

export function createDefaultProgress(): PersistedProgress {
  const firstTheme = ALL_THEMES[0];
  const firstSubtopic = firstTheme.subtopics[0];
  return {
    version: SCHEMA_VERSION,
    answers: {},
    bookmarks: {},
    history: [],
    mode: 'training',
    activeThemeId: firstTheme.id,
    activeSubtopicId: firstSubtopic.id,
    activeQuestionIndexBySubtopic: {},
    lastSavedAt: Date.now(),
  };
}

export function sanitizeProgress(raw: unknown): PersistedProgress {
  const fallback = createDefaultProgress();
  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const obj = raw as Record<string, unknown>;

  const answers: Record<string, AnswerRecord> = {};
  if (obj.answers && typeof obj.answers === 'object') {
    for (const [qId, val] of Object.entries(obj.answers as Record<string, unknown>)) {
      if (!QUESTION_LOOKUP.has(qId) || !val || typeof val !== 'object') continue;
      const rec = val as Record<string, unknown>;
      if (
        typeof rec.selectedIndex === 'number' &&
        rec.selectedIndex >= 0 &&
        rec.selectedIndex <= 3
      ) {
        answers[qId] = {
          selectedIndex: rec.selectedIndex,
          isChecked: Boolean(rec.isChecked),
          updatedAt: typeof rec.updatedAt === 'number' ? rec.updatedAt : Date.now(),
        };
      }
    }
  }

  const bookmarks: Record<string, boolean> = {};
  if (obj.bookmarks && typeof obj.bookmarks === 'object') {
    for (const [qId, flag] of Object.entries(obj.bookmarks as Record<string, unknown>)) {
      if (QUESTION_LOOKUP.has(qId) && flag === true) {
        bookmarks[qId] = true;
      }
    }
  }

  const history: TestAttemptRecord[] = [];
  if (Array.isArray(obj.history)) {
    for (const item of obj.history) {
      if (!item || typeof item !== 'object') continue;
      const rec = item as Record<string, unknown>;
      if (
        typeof rec.id === 'string' &&
        typeof rec.themeId === 'string' &&
        typeof rec.subtopicId === 'string' &&
        typeof rec.correctCount === 'number' &&
        typeof rec.totalCount === 'number' &&
        typeof rec.completedAt === 'number'
      ) {
        history.push({
          id: rec.id,
          themeId: rec.themeId,
          themeCode: typeof rec.themeCode === 'string' ? rec.themeCode : '',
          subtopicId: rec.subtopicId,
          subtopicTitle: typeof rec.subtopicTitle === 'string' ? rec.subtopicTitle : '',
          mode: rec.mode === 'exam' ? 'exam' : 'training',
          correctCount: rec.correctCount,
          totalCount: rec.totalCount,
          percentage:
            typeof rec.percentage === 'number'
              ? rec.percentage
              : rec.totalCount > 0
                ? Math.round((rec.correctCount / rec.totalCount) * 100)
                : 0,
          completedAt: rec.completedAt,
          details: Array.isArray(rec.details)
            ? rec.details
                .filter(
                  (d): d is { questionId: string; selectedIndex: number; correctIndex: number } =>
                    Boolean(d) &&
                    typeof d === 'object' &&
                    typeof (d as Record<string, unknown>).questionId === 'string' &&
                    typeof (d as Record<string, unknown>).selectedIndex === 'number' &&
                    typeof (d as Record<string, unknown>).correctIndex === 'number'
                )
            : [],
        });
      }
    }
  }

  const activeTheme =
    ALL_THEMES.find((t) => t.id === obj.activeThemeId) ?? ALL_THEMES[0];
  const activeSubtopic =
    activeTheme.subtopics.find((s) => s.id === obj.activeSubtopicId) ??
    activeTheme.subtopics[0];

  const activeQuestionIndexBySubtopic: Record<string, number> = {};
  if (
    obj.activeQuestionIndexBySubtopic &&
    typeof obj.activeQuestionIndexBySubtopic === 'object'
  ) {
    for (const [subId, idx] of Object.entries(
      obj.activeQuestionIndexBySubtopic as Record<string, unknown>
    )) {
      if (typeof idx === 'number' && idx >= 0 && Number.isFinite(idx)) {
        activeQuestionIndexBySubtopic[subId] = Math.floor(idx);
      }
    }
  }

  return {
    version: SCHEMA_VERSION,
    answers,
    bookmarks,
    history: history.sort((a, b) => b.completedAt - a.completedAt).slice(0, 200),
    mode: obj.mode === 'exam' ? 'exam' : 'training',
    activeThemeId: activeTheme.id,
    activeSubtopicId: activeSubtopic.id,
    activeQuestionIndexBySubtopic,
    lastSavedAt: typeof obj.lastSavedAt === 'number' ? obj.lastSavedAt : Date.now(),
  };
}

export function loadProgressSync(): PersistedProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultProgress();
    const parsed = JSON.parse(raw);
    return sanitizeProgress(parsed);
  } catch {
    return createDefaultProgress();
  }
}

export async function loadProgressFromDesktopIfNewer(
  current: PersistedProgress
): Promise<PersistedProgress | null> {
  if (!window.electronAPI?.loadProgress) return null;
  try {
    const diskData = await window.electronAPI.loadProgress();
    if (!diskData) return null;
    const sanitized = sanitizeProgress(diskData);
    if (
      sanitized.lastSavedAt > current.lastSavedAt ||
      (Object.keys(current.answers).length === 0 && Object.keys(sanitized.answers).length > 0)
    ) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      return sanitized;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveProgress(progress: PersistedProgress): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore quota errors in restricted iframe environments
  }

  if (window.electronAPI?.saveProgress) {
    void window.electronAPI.saveProgress(progress).catch(() => {});
  }
}

export function downloadProgressJson(progress: PersistedProgress): void {
  const blob = new Blob([JSON.stringify(progress, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const datePart = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `ohrana-truda-progress-${datePart}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseImportedProgress(text: string): PersistedProgress | null {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!('answers' in parsed) && !('history' in parsed)) return null;
    const sanitized = sanitizeProgress(parsed);
    return {
      ...sanitized,
      lastSavedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

export interface ProgressStats {
  total: number;
  answered: number;
  checked: number;
  correct: number;
  wrong: number;
  accuracyPercent: number;
  completionPercent: number;
}

export function computeSubtopicStats(
  subtopic: Subtopic,
  answers: Record<string, AnswerRecord>
): ProgressStats {
  const total = subtopic.questions.length;
  let answered = 0;
  let checked = 0;
  let correct = 0;
  let wrong = 0;

  for (const q of subtopic.questions) {
    const rec = answers[q.id];
    if (!rec) continue;
    answered++;
    if (rec.isChecked) {
      checked++;
      if (rec.selectedIndex === q.correctIndex) {
        correct++;
      } else {
        wrong++;
      }
    }
  }

  return {
    total,
    answered,
    checked,
    correct,
    wrong,
    accuracyPercent: checked > 0 ? Math.round((correct / checked) * 100) : 0,
    completionPercent: total > 0 ? Math.round((answered / total) * 100) : 0,
  };
}

export function computeThemeStats(
  theme: ThemeDocument,
  answers: Record<string, AnswerRecord>
): ProgressStats & { completedSubtopics: number; totalSubtopics: number } {
  let total = 0;
  let answered = 0;
  let checked = 0;
  let correct = 0;
  let wrong = 0;
  let completedSubtopics = 0;

  for (const sub of theme.subtopics) {
    const st = computeSubtopicStats(sub, answers);
    total += st.total;
    answered += st.answered;
    checked += st.checked;
    correct += st.correct;
    wrong += st.wrong;
    if (st.total > 0 && st.answered === st.total) {
      completedSubtopics++;
    }
  }

  return {
    total,
    answered,
    checked,
    correct,
    wrong,
    accuracyPercent: checked > 0 ? Math.round((correct / checked) * 100) : 0,
    completionPercent: total > 0 ? Math.round((answered / total) * 100) : 0,
    completedSubtopics,
    totalSubtopics: theme.subtopics.length,
  };
}

export function computeGlobalStats(
  themes: ThemeDocument[],
  answers: Record<string, AnswerRecord>,
  bookmarks: Record<string, boolean>
): ProgressStats & {
  completedSubtopics: number;
  totalSubtopics: number;
  bookmarkCount: number;
} {
  let total = 0;
  let answered = 0;
  let checked = 0;
  let correct = 0;
  let wrong = 0;
  let completedSubtopics = 0;
  let totalSubtopics = 0;

  for (const theme of themes) {
    const ts = computeThemeStats(theme, answers);
    total += ts.total;
    answered += ts.answered;
    checked += ts.checked;
    correct += ts.correct;
    wrong += ts.wrong;
    completedSubtopics += ts.completedSubtopics;
    totalSubtopics += ts.totalSubtopics;
  }

  const bookmarkCount = Object.values(bookmarks).filter(Boolean).length;

  return {
    total,
    answered,
    checked,
    correct,
    wrong,
    accuracyPercent: checked > 0 ? Math.round((correct / checked) * 100) : 0,
    completionPercent: total > 0 ? Math.round((answered / total) * 100) : 0,
    completedSubtopics,
    totalSubtopics,
    bookmarkCount,
  };
}

export function formatRussianDateTime(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleString();
  }
}

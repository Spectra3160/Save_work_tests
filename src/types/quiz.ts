export interface QuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  reference: string;
}

export interface Subtopic {
  id: string;
  numberLabel: string;
  title: string;
  questions: QuizQuestion[];
}

export interface ThemeDocument {
  id: string;
  code: string;
  title: string;
  shortTitle: string;
  pdfPath: string;
  dateLabel: string;
  subtopics: Subtopic[];
}

export interface AnswerRecord {
  selectedIndex: number;
  isChecked: boolean;
  updatedAt: number;
}

export interface TestAttemptAnswer {
  questionId: string;
  selectedIndex: number;
  correctIndex: number;
}

export interface TestAttemptRecord {
  id: string;
  themeId: string;
  themeCode: string;
  subtopicId: string;
  subtopicTitle: string;
  mode: TestMode;
  correctCount: number;
  totalCount: number;
  percentage: number;
  completedAt: number;
  details: TestAttemptAnswer[];
}

export type TestMode = 'training' | 'exam';
export type NavSection = 'catalog' | 'quiz' | 'history' | 'desktop';

export interface PersistedProgress {
  version: number;
  answers: Record<string, AnswerRecord>;
  bookmarks: Record<string, boolean>;
  history: TestAttemptRecord[];
  mode: TestMode;
  activeThemeId: string;
  activeSubtopicId: string;
  activeQuestionIndexBySubtopic: Record<string, number>;
  lastSavedAt: number;
}

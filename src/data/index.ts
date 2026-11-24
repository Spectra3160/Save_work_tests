import { ThemeDocument, Subtopic, QuizQuestion } from '../types/quiz';
import { theme1_1 } from './theme1_1';
import { theme1_2 } from './theme1_2';
import { theme1_3 } from './theme1_3';
import { theme1_4 } from './theme1_4';
import { theme1_5 } from './theme1_5';
import { theme1_6 } from './theme1_6';
import { theme1_7 } from './theme1_7';

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function permuteQuestionDeterministically(q: QuizQuestion): QuizQuestion {
  const order = [0, 1, 2, 3];
  let seed = hashString(q.id + '_v1_order');
  for (let i = order.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }

  const newOptions: [string, string, string, string] = [
    q.options[order[0]],
    q.options[order[1]],
    q.options[order[2]],
    q.options[order[3]],
  ];
  const newCorrectIndex = order.indexOf(q.correctIndex);

  return {
    ...q,
    options: newOptions,
    correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0,
  };
}

function normalizeTheme(theme: ThemeDocument): ThemeDocument {
  return {
    ...theme,
    subtopics: theme.subtopics.map((subtopic) => ({
      ...subtopic,
      questions: subtopic.questions.map(permuteQuestionDeterministically),
    })),
  };
}

const RAW_THEMES: ThemeDocument[] = [
  theme1_1,
  theme1_2,
  theme1_3,
  theme1_4,
  theme1_5,
  theme1_6,
  theme1_7,
];

export const ALL_THEMES: ThemeDocument[] = RAW_THEMES.map(normalizeTheme);

export interface FlattenedQuestion {
  theme: ThemeDocument;
  subtopic: Subtopic;
  question: QuizQuestion;
  indexInSubtopic: number;
}

export const ALL_QUESTIONS_FLAT: FlattenedQuestion[] = ALL_THEMES.flatMap((theme) =>
  theme.subtopics.flatMap((subtopic) =>
    subtopic.questions.map((question, indexInSubtopic) => ({
      theme,
      subtopic,
      question,
      indexInSubtopic,
    }))
  )
);

export const QUESTION_LOOKUP: Map<string, FlattenedQuestion> = new Map(
  ALL_QUESTIONS_FLAT.map((item) => [item.question.id, item])
);

export const TOTAL_THEMES = ALL_THEMES.length;
export const TOTAL_SUBTOPICS = ALL_THEMES.reduce((sum, t) => sum + t.subtopics.length, 0);
export const TOTAL_QUESTIONS = ALL_QUESTIONS_FLAT.length;

export function findThemeAndSubtopic(themeId: string, subtopicId: string): {
  theme: ThemeDocument;
  subtopic: Subtopic;
} {
  const theme = ALL_THEMES.find((t) => t.id === themeId) ?? ALL_THEMES[0];
  const subtopic = theme.subtopics.find((s) => s.id === subtopicId) ?? theme.subtopics[0];
  return { theme, subtopic };
}

export function getNextSubtopic(
  themeId: string,
  subtopicId: string
): { theme: ThemeDocument; subtopic: Subtopic } | null {
  const themeIdx = ALL_THEMES.findIndex((t) => t.id === themeId);
  if (themeIdx < 0) return null;
  const currentTheme = ALL_THEMES[themeIdx];
  const subIdx = currentTheme.subtopics.findIndex((s) => s.id === subtopicId);
  if (subIdx < 0) return null;

  if (subIdx + 1 < currentTheme.subtopics.length) {
    return { theme: currentTheme, subtopic: currentTheme.subtopics[subIdx + 1] };
  }
  if (themeIdx + 1 < ALL_THEMES.length) {
    const nextTheme = ALL_THEMES[themeIdx + 1];
    return { theme: nextTheme, subtopic: nextTheme.subtopics[0] };
  }
  return null;
}


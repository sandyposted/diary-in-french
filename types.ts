
export interface GrammarPoint {
  point: string;
  explanation: string;
  example: string;
}

export interface VerbConjugation {
  infinitive: string;
  tense: string;
  group: string; // e.g., "1st Group (-er)", "2nd Group (-ir)", "3rd Group"
  explanation: string;
}

export interface VocabularyItem {
  word: string;
  gender: string; // "masculine", "feminine", or "N/A"
  meaning: string;
  pos: string; // Part of speech: "noun", "verb", "adjective", "adverb", "preposition", "conjunction", "other"
}

export interface FixedExpression {
  expression: string;
  meaning: string;
  context: string;
}

export interface SentenceSegment {
  text: string;
  role: 'subject' | 'object' | 'predicate' | 'preposition' | 'modifier' | 'connective' | 'other';
  meaning_cn: string;
  meaning_en: string;
  grammar_info: string;
}

export interface DiaryAnalysis {
  translatedText: string;
  segmentedText: SentenceSegment[];
  grammarPoints: GrammarPoint[];
  verbConjugations: VerbConjugation[];
  vocabulary: VocabularyItem[];
  fixedExpressions: FixedExpression[];
  culturalNote?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  originalText: string;
  analysis: DiaryAnalysis;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

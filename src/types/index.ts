export interface Word {
  id?: string;
  word?: string;  // English word
  english?: string; // Backwards compatibility
  meaning: string;
  type?: string; // word type (noun, verb, etc.)
}

export interface WordCollection {
  id: string;
  name: string;
  description?: string;
  words: Word[];
  createdAt: Date;
  userId: string;
  username: string;
  visibility: 'public' | 'private';
  rating: number;
  usageCount: number;
  tags?: string[];
}

export type QuizMode = 'english-to-meaning' | 'meaning-to-english' | 'mixed';

export interface QuizQuestion {
  word: Word;
  options: string[];
  correctIndex: number;
  mode: QuizMode; // Which direction this specific question is
}

export interface QuizResult {
  correct: number;
  total: number;
  percentage: number;
}
export interface AppSettings {
  autoAdvance: boolean;
  quizMode: QuizMode;
}

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
}

export interface ExamSettings {
  selectedCollections: string[];
  variantCount: number;
  wordCount: number;
  timeLimit: number; // in minutes
  isPublic?: boolean;
  name?: string;
  description?: string;
  publicExamId?: string; // ID of saved public exam
}

export interface PublicExam {
  id: string;
  name: string;
  description?: string;
  userId: string;
  username: string;
  settings: ExamSettings;
  createdAt: Date;
  totalAttempts: number;
  averageScore: number;
  rating: number;
  // Embedded words make exam independent of original collections
  embeddedWords?: Word[];
  // Collection metadata for reference
  collectionsMetadata?: {
    id: string;
    name: string;
    wordCount: number;
  }[];
}

export interface ExamResult {
  id: string;
  userId: string;
  examSettings: ExamSettings;
  score: number;
  totalQuestions: number;
  completedAt: Date;
  timeSpent: number; // in seconds
}

export interface LearnedCollection {
  id: string;
  userId: string;
  collectionId: string;
  learnedAt: Date;
  perfectScoreCount: number;
  // Embedded collection data to preserve even if original is deleted
  embeddedData?: WordCollection;
}

export interface SavedCollection {
  id: string;
  userId: string;
  collectionId: string;
  savedAt: Date;
}

export interface CollectionStats {
  totalCollections: number;
  publicCollections: number;
  privateCollections: number;
  learnedCollections: number;
  savedCollections: number;
  totalWords: number;
  learnedWords: number;
}

export interface LeaderboardUser {
  id: string;
  username: string;
  totalCollections: number;
  publicCollections: number;
  totalWords: number;
  learnedWords: number;
  totalUsage: number; // How many times others used their collections
  totalExams: number; // Total exams taken
  averageExamScore: number; // Average exam score percentage
  perfectExams: number; // Number of 100% exam scores
  joinedAt: Date;
  rank?: number;
}
import { Word, QuizQuestion, QuizMode } from '../types';

// Shuffle array function
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const generateQuizQuestions = (words: Word[], mode: QuizMode = 'english-to-meaning'): QuizQuestion[] => {
  if (words.length < 4) {
    throw new Error('Minimum 4 söz lazımdır quiz üçün');
  }

  // Shuffle words for random order
  const shuffledWords = shuffleArray(words);
  
  return shuffledWords.map((word, index) => {
    let questionMode: QuizMode;
    
    // Determine question mode based on overall mode
    if (mode === 'mixed') {
      // For mixed mode, use weighted random selection
      // 40% english-to-meaning, 40% meaning-to-english, 20% random
      const rand = Math.random();
      if (rand < 0.4) {
        questionMode = 'english-to-meaning';
      } else if (rand < 0.8) {
        questionMode = 'meaning-to-english';
      } else {
        questionMode = Math.random() < 0.5 ? 'english-to-meaning' : 'meaning-to-english';
      }
    } else {
      questionMode = mode;
    }

    // Generate options based on question mode
    let wrongOptions: string[];
    let correctAnswer: string;
    
    if (questionMode === 'english-to-meaning') {
      // Show English word, ask for meaning
      wrongOptions = words
        .filter(w => w.id !== word.id)
        .map(w => w.meaning)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      correctAnswer = word.meaning;
    } else {
      // Show meaning, ask for English word
      wrongOptions = words
        .filter(w => w.id !== word.id)
        .map(w => w.word || w.english || '')
        .filter(w => w.trim() !== '')
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      correctAnswer = word.word || word.english || '';
    }

    const allOptions = shuffleArray([correctAnswer, ...wrongOptions]);
    const correctIndex = allOptions.indexOf(correctAnswer);

    return {
      word,
      options: allOptions,
      correctIndex,
      mode: questionMode
    };
  });
};
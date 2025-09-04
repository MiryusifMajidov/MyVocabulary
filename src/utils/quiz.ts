import { Word, QuizQuestion } from '../types';

export const generateQuizQuestions = (words: Word[]): QuizQuestion[] => {
  if (words.length < 4) {
    throw new Error('Minimum 4 söz lazımdır quiz üçün');
  }

  return words.map(word => {
    const wrongOptions = words
      .filter(w => w.id !== word.id)
      .map(w => w.meaning)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const allOptions = [word.meaning, ...wrongOptions].sort(() => Math.random() - 0.5);
    const correctIndex = allOptions.indexOf(word.meaning);

    return {
      word,
      options: allOptions,
      correctIndex
    };
  });
};
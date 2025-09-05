import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Flag, AlertTriangle, CheckCircle } from 'lucide-react';
import { WordCollection, ExamSettings, QuizQuestion, Word } from '../../types';
import { generateQuizQuestions } from '../../utils/quiz';

interface ProfessionalExamProps {
  collections: WordCollection[];
  examSettings: ExamSettings;
  onFinish: (score: number, totalQuestions: number, timeSpent: number) => void;
  onBack: () => void;
}

export const ProfessionalExam: React.FC<ProfessionalExamProps> = ({
  collections,
  examSettings,
  onFinish,
  onBack
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [timeLeft, setTimeLeft] = useState(examSettings.timeLimit * 60); // Convert to seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Generate questions on component mount - optimized version
  useEffect(() => {
    const generateQuestions = () => {
      // Early return if no collections or settings
      if (!collections.length || !examSettings.selectedCollections.length) {
        return [];
      }

      // Filter selected collections once
      const selectedCollections = collections.filter(c => 
        examSettings.selectedCollections.includes(c.id)
      );
      
      if (!selectedCollections.length) {
        return [];
      }

      // Combine all words from selected collections with Set for deduplication
      const wordMap = new Map<string, Word>();
      selectedCollections.forEach(collection => {
        if (collection.words && Array.isArray(collection.words)) {
          collection.words.forEach(word => {
            wordMap.set(word.id, word);
          });
        }
      });
      
      const allWords = Array.from(wordMap.values());
      
      // Early return if not enough words
      if (allWords.length < examSettings.wordCount) {
        console.warn('Not enough unique words for exam. Available:', allWords.length, 'Required:', examSettings.wordCount);
        return [];
      }

      // Fisher-Yates shuffle for better randomization
      const shuffleArray = <T,>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      // Select required number of words
      const shuffledWords = shuffleArray(allWords);
      const selectedWords = shuffledWords.slice(0, examSettings.wordCount);

      // Pre-calculate all meanings for incorrect options
      const allMeanings = allWords.map(w => w.meaning);

      // Generate questions with optimized option selection
      const examQuestions = selectedWords.map(word => {
        // Filter out correct meaning and get unique incorrect options
        const incorrectMeanings = allMeanings.filter(meaning => meaning !== word.meaning);
        
        // Shuffle and select required number of incorrect options
        const shuffledIncorrect = shuffleArray(incorrectMeanings);
        const incorrectOptions = shuffledIncorrect.slice(0, examSettings.variantCount - 1);

        // Create final options array and shuffle
        const options = shuffleArray([word.meaning, ...incorrectOptions]);
        const correctIndex = options.indexOf(word.meaning);

        return {
          word,
          options,
          correctIndex
        };
      });

      return examQuestions;
    };

    const questions = generateQuestions();
    setQuestions(questions);
  }, [collections, examSettings]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isSubmitted) {
      handleSubmit(true); // Auto-submit when time runs out
    }
  }, [timeLeft, isSubmitted]);

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const handleSubmit = useCallback((isAutoSubmit = false) => {
    if (isSubmitted) return;
    
    setIsSubmitted(true);
    
    // Calculate score
    let correct = 0;
    questions.forEach((question, index) => {
      if (answers[index] === question.correctIndex) {
        correct++;
      }
    });

    const timeSpent = (examSettings.timeLimit * 60) - timeLeft;
    onFinish(correct, questions.length, timeSpent);
  }, [isSubmitted, questions, answers, examSettings.timeLimit, timeLeft, onFinish]);

  const handleSubmitClick = () => {
    const unansweredQuestions = questions.length - Object.keys(answers).length;
    
    if (unansweredQuestions > 0) {
      setShowConfirmDialog(true);
    } else {
      handleSubmit();
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => Object.keys(answers).length;
  const getUnansweredCount = () => questions.length - getAnsweredCount();

  if (questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">İmtahan yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-blue-600">
              <Flag className="w-5 h-5" />
              <span className="font-semibold">
                Sual {currentQuestionIndex + 1} / {questions.length}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">
                Cavablanmış: {getAnsweredCount()}
              </span>
            </div>
          </div>
          
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold ${
            timeLeft <= 60 ? 'bg-red-100 text-red-700' : 
            timeLeft <= 300 ? 'bg-orange-100 text-orange-700' : 
            'bg-blue-100 text-blue-700'
          }`}>
            <Clock className="w-5 h-5" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            "{questions[currentQuestionIndex].word.english}" sözünün mənası nədir?
          </h2>
        </div>

        <div className="space-y-3">
          {questions[currentQuestionIndex].options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(currentQuestionIndex, index)}
              className={`w-full p-4 text-left border-2 rounded-xl transition-all duration-200 ${
                answers[currentQuestionIndex] === index
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                  answers[currentQuestionIndex] === index
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-300'
                }`}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-lg">{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Əvvəlki
          </button>
          
          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Növbəti
            </button>
          ) : (
            <button
              onClick={handleSubmitClick}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              İmtahanı Bitir
            </button>
          )}
        </div>

        <div className="text-sm text-gray-600">
          {getUnansweredCount() > 0 && (
            <span className="text-orange-600">
              {getUnansweredCount()} sual cavabsızdır
            </span>
          )}
        </div>
      </div>

      {/* Question Navigation */}
      <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Suallar</h3>
        <div className="grid grid-cols-10 gap-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                index === currentQuestionIndex
                  ? 'bg-blue-600 text-white'
                  : answers[index] !== undefined
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <h3 className="text-xl font-bold text-gray-800">Diqqət!</h3>
            </div>
            <p className="text-gray-600 mb-6">
              {getUnansweredCount()} sual hələ cavablanmayıb. İmtahanı bitirmək istədiyinizə əminsiniz?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Davam et
              </button>
              <button
                onClick={() => handleSubmit()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Bitir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
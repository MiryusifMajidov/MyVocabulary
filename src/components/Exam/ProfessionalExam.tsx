import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Flag, AlertTriangle, CheckCircle } from 'lucide-react';
import { WordCollection, ExamSettings, QuizQuestion, Word, PublicExam } from '../../types';
import { generateQuizQuestions } from '../../utils/quiz';

interface ProfessionalExamProps {
  collections: WordCollection[];
  examSettings: ExamSettings;
  publicExam?: PublicExam; // For public exams taken by other users
  onFinish: (score: number, totalQuestions: number, timeSpent: number) => void;
  onBack: () => void;
}

export const ProfessionalExam: React.FC<ProfessionalExamProps> = ({
  collections,
  examSettings,
  publicExam,
  onFinish,
  onBack
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [timeLeft, setTimeLeft] = useState(examSettings.timeLimit * 60); // Convert to seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate questions on component mount - optimized version
  useEffect(() => {
    const generateQuestions = () => {
      setLoading(true);
      setError(null);
      
      // Determine which words to use - INDEPENDENT approach
      let allWords: Word[] = [];
      
      if (publicExam && publicExam.embeddedWords && publicExam.embeddedWords.length > 0) {
        // For public exams, use the embedded words directly (INDEPENDENT)
        console.log('🌐 Using public exam embedded words:', publicExam.embeddedWords.length, 'words');
        console.log('🔍 Sample embedded words:', publicExam.embeddedWords.slice(0, 3));
        allWords = publicExam.embeddedWords;
      } else if (publicExam) {
        // LEGACY: Old public exams without embedded words - try to use collections
        console.log('⚠️ Legacy public exam detected without embedded words');
        console.log('🔄 Falling back to collection-based approach for public exam');
        
        if (!collections.length || !examSettings.selectedCollections.length) {
          setError('Köhnə imtahan formatı - kolleksiya məlumatları tapılmadı');
          setLoading(false);
          return [];
        }

        const selectedCollections = collections.filter(c => 
          examSettings.selectedCollections.includes(c.id)
        );
        
        if (!selectedCollections.length) {
          setError('Seçilmiş kolleksiya tapılmadı - köhnə imtahan formatı');
          setLoading(false);
          return [];
        }
        
        // Use collection words for legacy public exams
        const wordMap = new Map<string, Word>();
        selectedCollections.forEach(collection => {
          if (collection.words && Array.isArray(collection.words)) {
            collection.words.forEach(word => {
              const wordKey = word.id || word.word || word.english || '';
              if (wordKey) {
                wordMap.set(wordKey, word);
              }
            });
          }
        });
        
        allWords = Array.from(wordMap.values());
      } else {
        // For own exams, combine words from selected collections
        console.log('👤 Using own collections:', collections.length, 'available collections');
        
        if (!collections.length || !examSettings.selectedCollections.length) {
          setError('Heç bir kolleksiya seçilməyib');
          setLoading(false);
          return [];
        }

        const selectedCollections = collections.filter(c => 
          examSettings.selectedCollections.includes(c.id)
        );
        
        if (!selectedCollections.length) {
          setError('Seçilmiş kolleksiya tapılmadı');
          setLoading(false);
          return [];
        }
        
        console.log('✅ Final selected collections:', selectedCollections.length, 'collections');
        selectedCollections.forEach((col, index) => {
          console.log(`   ${index + 1}. ${col.name} (${col.words.length} words)`);
        });

        // Combine all words from selected collections with Set for deduplication
        const wordMap = new Map<string, Word>();
        selectedCollections.forEach(collection => {
          if (collection.words && Array.isArray(collection.words)) {
            collection.words.forEach(word => {
              // Handle both old and new word formats
              const wordKey = word.id || word.word || word.english || '';
              if (wordKey) {
                wordMap.set(wordKey, word);
              }
            });
          }
        });
        
        allWords = Array.from(wordMap.values());
      }
      
      // Check if not enough words and adjust
      if (allWords.length === 0) {
        setError('Seçilmiş kolleksiyalarda söz tapılmadı');
        setLoading(false);
        return [];
      }
      
      if (allWords.length < examSettings.wordCount) {
        console.warn('Not enough unique words for exam. Available:', allWords.length, 'Required:', examSettings.wordCount);
        // Use available words and continue with exam
        console.log(`Using ${allWords.length} words instead of ${examSettings.wordCount}`);
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

      // Select available number of words (limited by what we have)
      const shuffledWords = shuffleArray(allWords);
      const actualWordCount = Math.min(examSettings.wordCount, allWords.length);
      const selectedWords = shuffledWords.slice(0, actualWordCount);

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

      setLoading(false);
      return examQuestions;
    };

    const questions = generateQuestions();
    setQuestions(questions);
  }, [collections, examSettings, publicExam]);

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
    const correctAnswers = questions.filter((q, index) => 
      answers[index] === q.correctIndex
    ).length;
    
    const timeSpent = (examSettings.timeLimit * 60) - timeLeft;
    onFinish(correctAnswers, questions.length, Math.floor(timeSpent / 60));
  }, [questions, answers, timeLeft, examSettings.timeLimit, onFinish, isSubmitted]);

  const handleConfirmSubmit = () => {
    setShowConfirmDialog(false);
    handleSubmit();
  };

  const handleSubmitClick = () => {
    const unansweredCount = getUnansweredCount();
    if (unansweredCount > 0) {
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

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">İmtahan yüklənir...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">İmtahan başladıla bilmədi</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Geri qayıt
          </button>
        </div>
      </div>
    );
  }

  // No questions state
  if (questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Sual tapılmadı</h3>
          <p className="text-gray-600 mb-6">Seçilmiş kolleksiyalarda kifayət qədər söz yoxdur.</p>
          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Geri qayıt
          </button>
        </div>
      </div>
    );
  }

  // Additional check for valid question data
  if (questions.length === 0 || !questions[currentQuestionIndex]) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">İmtahan hazırlanır...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header - Mobile Optimized */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
        {/* Mobile: Two Rows */}
        <div className="sm:hidden">
          {/* Top Row - Question Number and Time */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-blue-600">
              <Flag className="w-4 h-4" />
              <span className="font-semibold text-sm">
                Sual {currentQuestionIndex + 1}/{questions.length}
              </span>
            </div>
            
            <div className={`flex items-center space-x-2 ${timeLeft < 300 ? 'text-red-600' : 'text-blue-600'}`}>
              <Clock className="w-4 h-4" />
              <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
            </div>
          </div>
          
          {/* Bottom Row - Progress and Exit */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="font-semibold text-sm">
                {getAnsweredCount()} cavab
              </span>
            </div>
            
            <button
              onClick={onBack}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              Çıx
            </button>
          </div>
        </div>

        {/* Desktop: Single Row */}
        <div className="hidden sm:flex items-center justify-between">
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
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${timeLeft < 300 ? 'text-red-600' : 'text-blue-600'}`}>
              <Clock className="w-5 h-5" />
              <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Çıx
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">İrəliləmə</span>
          <span className="text-sm text-gray-600">
            {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            {questions[currentQuestionIndex].word.word || questions[currentQuestionIndex].word.english}
          </h2>
          <p className="text-lg text-gray-600">Bu sözün mənası nədir?</p>
        </div>

        <div className="grid gap-4">
          {questions[currentQuestionIndex].options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(currentQuestionIndex, index)}
              className={`p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                answers[currentQuestionIndex] === index
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                  answers[currentQuestionIndex] === index
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {answers[currentQuestionIndex] === index && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <span className="text-lg">{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation - Mobile Optimized */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        {/* Mobile: Stacked Layout */}
        <div className="sm:hidden space-y-4">
          {/* Unanswered Questions Warning */}
          {getUnansweredCount() > 0 && (
            <div className="flex items-center justify-center space-x-2 text-orange-600 bg-orange-50 p-3 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {getUnansweredCount()} cavabsız sual
              </span>
            </div>
          )}
          
          {/* Submit Button */}
          <button
            onClick={handleSubmitClick}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow-lg"
          >
            İmtahanı Bitir
          </button>
          
          {/* Navigation Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className={`py-3 rounded-lg font-medium ${
                currentQuestionIndex === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ← Əvvəlki
            </button>
            
            <button
              onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              disabled={currentQuestionIndex === questions.length - 1}
              className={`py-3 rounded-lg font-medium ${
                currentQuestionIndex === questions.length - 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Növbəti →
            </button>
          </div>
        </div>

        {/* Desktop: Original Layout */}
        <div className="hidden sm:flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className={`px-6 py-2 rounded-lg font-medium ${
              currentQuestionIndex === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Əvvəlki
          </button>

          <div className="flex items-center space-x-4">
            {getUnansweredCount() > 0 && (
              <div className="flex items-center space-x-2 text-orange-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {getUnansweredCount()} cavabsız sual
                </span>
              </div>
            )}
            
            <button
              onClick={handleSubmitClick}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-200"
            >
              İmtahanı Bitir
            </button>
          </div>

          <button
            onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
            disabled={currentQuestionIndex === questions.length - 1}
            className={`px-6 py-2 rounded-lg font-medium ${
              currentQuestionIndex === questions.length - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Növbəti
          </button>
        </div>
      </div>

      {/* Question Grid */}
      <div className="mt-4 sm:mt-6 bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Suallar</h3>
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`aspect-square rounded-lg font-medium text-sm transition-all duration-200 ${
                index === currentQuestionIndex
                  ? 'bg-blue-600 text-white'
                  : answers[index] !== undefined
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">İmtahanı bitirmək istəyirsiniz?</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              {getUnansweredCount()} sual cavabsız qalıb. İmtahanı indi bitirməyə əminsizmi?
            </p>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Davam et
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
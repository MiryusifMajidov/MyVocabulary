import React, { useState, useEffect } from 'react';
import { WordCollection, QuizQuestion, QuizResult, QuizMode } from '../types';
import { generateQuizQuestions } from '../utils/quiz';
import { ArrowLeft, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface QuizProps {
  collection: WordCollection;
  autoAdvance: boolean;
  quizMode: QuizMode;
  onBack: () => void;
  onFinish: (result: QuizResult) => void;
}

export const Quiz: React.FC<QuizProps> = ({
  collection,
  autoAdvance,
  quizMode,
  onBack,
  onFinish
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [canAdvance, setCanAdvance] = useState(false);

  useEffect(() => {
    setQuestions(generateQuizQuestions(collection.words, quizMode));
  }, [collection, quizMode]);

  const currentQuestion = questions[currentQuestionIndex];

  const advanceToNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowResult(false);
      setCanAdvance(false);
    } else {
      const result: QuizResult = {
        correct: correctAnswers,
        total: questions.length,
        percentage: Math.round((correctAnswers / questions.length) * 100)
      };
      onFinish(result);
    }
  };
  const handleOptionSelect = (optionIndex: number) => {
    if (selectedOption !== null) return;
    
    setSelectedOption(optionIndex);
    setCanAdvance(true);
    
    if (optionIndex === currentQuestion.correctIndex) {
      setCorrectAnswers(prev => prev + 1);
    }

    if (autoAdvance) {
      setTimeout(() => {
        advanceToNext();
      }, 1500);
    }
  };

  const getOptionStyle = (optionIndex: number) => {
    if (selectedOption === null) {
      return 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-800';
    }
    
    if (optionIndex === currentQuestion.correctIndex) {
      return 'bg-green-500 border-green-500 text-white';
    }
    
    if (optionIndex === selectedOption) {
      return 'bg-red-500 border-red-500 text-white';
    }
    
    return 'bg-gray-100 border-gray-200 text-gray-500';
  };

  if (!currentQuestion) {
    return <div>Yüklənir...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Geri</span>
        </button>
        <div className="text-sm text-gray-600">
          {currentQuestionIndex + 1} / {questions.length}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            {currentQuestion.mode === 'english-to-meaning' 
              ? 'Bu sözün mənası nədir?' 
              : 'Bu mənanın ingilis dilindəki qarşılığı nədir?'
            }
          </h2>
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl inline-block">
            <span className="text-3xl font-bold">
              {currentQuestion.mode === 'english-to-meaning' 
                ? (currentQuestion.word.word || currentQuestion.word.english)
                : currentQuestion.word.meaning
              }
            </span>
          </div>
        </div>

        <div className="grid gap-4">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionSelect(index)}
              disabled={selectedOption !== null}
              className={`p-4 rounded-xl text-left font-medium transition-all duration-300 transform hover:scale-102 ${getOptionStyle(index)}`}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {selectedOption !== null && (
                  <div>
                    {index === currentQuestion.correctIndex ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : index === selectedOption ? (
                      <XCircle className="w-5 h-5 text-white" />
                    ) : null}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {!autoAdvance && canAdvance && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={advanceToNext}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <span>
                {currentQuestionIndex < questions.length - 1 ? 'Növbəti sual' : 'Nəticəni gör'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="mt-8">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
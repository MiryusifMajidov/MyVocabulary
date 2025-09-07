import React from 'react';
import { ArrowLeft, ArrowRight, Shuffle, BookOpen, Languages } from 'lucide-react';
import { QuizMode } from '../types';

interface QuizModeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: QuizMode) => void;
  currentMode: QuizMode;
}

export const QuizModeSelector: React.FC<QuizModeSelectorProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  currentMode
}) => {
  if (!isOpen) return null;

  const modes = [
    {
      id: 'english-to-meaning' as QuizMode,
      title: 'İngilis → Azərbaycan',
      description: 'İngilis sözü göstərilir, Azərbaycan mənasını seç',
      icon: <ArrowRight className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-600',
      example: 'apple → alma'
    },
    {
      id: 'meaning-to-english' as QuizMode,
      title: 'Azərbaycan → İngilis',
      description: 'Azərbaycan mənası göstərilir, İngilis sözünü seç',
      icon: <ArrowLeft className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-600',
      example: 'alma → apple'
    },
    {
      id: 'mixed' as QuizMode,
      title: 'Qarışıq Rejim',
      description: 'Həm ingilis → azərbaycan, həm də azərbaycan → ingilis',
      icon: <Shuffle className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-600',
      example: 'Random seçim'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white  rounded-2xl shadow-2xl max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-2xl p-4 sm:p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 rounded-full p-2 sm:p-3">
              <Languages className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Quiz Rejimini Seç</h2>
              <p className="text-blue-100 opacity-90 text-sm sm:text-base">Hansı istiqamətdə test etmək istəyirsiniz?</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => onSelectMode(mode.id)}
                className={`w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 ${
                  currentMode === mode.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className={`bg-gradient-to-r ${mode.color} rounded-lg p-2 text-white flex-shrink-0`}>
                    <div className="w-5 h-5 sm:w-6 sm:h-6">
                      {mode.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800  text-base sm:text-lg mb-1">
                      {mode.title}
                    </h3>
                    <p className="text-gray-600  text-xs sm:text-sm mb-2 leading-relaxed">
                      {mode.description}
                    </p>
                    <div className="text-xs text-gray-500  font-mono bg-gray-100  rounded px-2 py-1 inline-block">
                      {mode.example}
                    </div>
                  </div>
                  {currentMode === mode.id && (
                    <div className="text-blue-500 flex-shrink-0">
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 sm:mt-6 bg-blue-50   rounded-lg p-3 sm:p-4">
            <h4 className="font-semibold text-blue-800  mb-2 text-sm sm:text-base">
              💡 Məsləhət:
            </h4>
            <p className="text-xs sm:text-sm text-blue-700  leading-relaxed">
              Qarışıq rejim sözləri daha yaxşı yadda saxlamağa kömək edir. Həm oxumaq, həm də yazmaq bacarığınızı inkişaf etdirir.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 p-4 sm:p-6 sm:pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200  text-gray-800  rounded-xl font-semibold hover:bg-gray-300  transition-all duration-200 text-sm sm:text-base"
          >
            Ləğv et
          </button>
          <button
            onClick={() => onSelectMode(currentMode)}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg text-sm sm:text-base"
          >
            Başla
          </button>
        </div>
      </div>
    </div>
  );
};
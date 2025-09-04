import React, { useState } from 'react';
import { QuizResult as QuizResultType, WordCollection } from '../types';
import { Trophy, RotateCcw, Home, Award, Target, CheckCircle } from 'lucide-react';

interface QuizResultProps {
  result: QuizResultType;
  collection: WordCollection;
  onPlayAgain: () => void;
  onBackHome: () => void;
  onMarkAsLearned?: (collectionId: string) => Promise<void>;
}

export const QuizResult: React.FC<QuizResultProps> = ({
  result,
  collection,
  onPlayAgain,
  onBackHome,
  onMarkAsLearned
}) => {
  const [marking, setMarking] = useState(false);
  
  const getResultMessage = () => {
    if (result.percentage >= 90) return { text: 'Əla nəticə!', icon: Trophy, color: 'from-yellow-400 to-orange-500' };
    if (result.percentage >= 75) return { text: 'Çox yaxşı!', icon: Award, color: 'from-green-400 to-emerald-500' };
    if (result.percentage >= 60) return { text: 'Yaxşı!', icon: Target, color: 'from-blue-400 to-cyan-500' };
    return { text: 'Daha çox məşq lazım', icon: Target, color: 'from-gray-400 to-gray-500' };
  };

  const { text, icon: Icon, color } = getResultMessage();

  const handleMarkAsLearned = async () => {
    if (onMarkAsLearned && !marking) {
      setMarking(true);
      try {
        await onMarkAsLearned(collection.id);
        onBackHome(); // Navigate back after marking as learned
      } catch (error) {
        console.error('Failed to mark as learned:', error);
        setMarking(false);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${color} rounded-full flex items-center justify-center mb-4`}>
            <Icon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{text}</h1>
          <p className="text-gray-600">"{collection.name}" kolleksiyasını bitirdiniz</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{result.correct}</div>
              <div className="text-sm text-gray-600">Doğru</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{result.total - result.correct}</div>
              <div className="text-sm text-gray-600">Yanlış</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{result.percentage}%</div>
              <div className="text-sm text-gray-600">Nəticə</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Perfect Score Achievement */}
          {result.percentage === 100 && onMarkAsLearned && !collection.isLearned && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Trophy className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-green-800 mb-2">Mükəmməl Nəticə! 🎉</h3>
              <p className="text-green-700 mb-4">
                100% nəticə əldə etdiniz! Bu kolleksiyanı tamamilə öyrəndiniz.
              </p>
              <button
                onClick={handleMarkAsLearned}
                disabled={marking}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                <span>{marking ? 'Saxlanır...' : 'Öyrəndim! ✨'}</span>
              </button>
            </div>
          )}

          {/* Regular Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onPlayAgain}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Yenidən oyna</span>
            </button>
            <button
              onClick={onBackHome}
              className="flex items-center justify-center space-x-2 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
            >
              <Home className="w-4 h-4" />
              <span>Ana səhifə</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
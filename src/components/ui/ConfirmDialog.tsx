import React from 'react';
import { X, Trophy, RotateCcw, CheckCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  bestScore?: number;
  totalAttempts?: number;
  recentResults?: Array<{
    scorePercentage: number;
    participatedAt: Date | string;
    score: number;
    totalQuestions: number;
  }>;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  bestScore,
  totalAttempts,
  recentResults = []
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-2xl p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-blue-100 opacity-90">Əvvəlki nəticələriniz</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-4">{message}</p>

          {/* Best Score */}
          {bestScore !== undefined && totalAttempts !== undefined && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-500 rounded-full p-2">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">Ən yaxşı nəticə</p>
                    <p className="text-sm text-green-600">{totalAttempts} cəhddən</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{bestScore}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Results */}
          {recentResults.length > 0 && (
            <div className="space-y-3 mb-6">
              <h3 className="font-semibold text-gray-800 flex items-center space-x-2">
                <RotateCcw className="w-4 h-4" />
                <span>Son nəticələr</span>
              </h3>
              
              <div className="space-y-2">
                {recentResults.slice(0, 3).map((result, index) => {
                  const date = new Date(result.participatedAt).toLocaleDateString('az-AZ', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  
                  const scoreColor = result.scorePercentage >= 80 ? 'text-green-600' :
                                   result.scorePercentage >= 60 ? 'text-yellow-600' :
                                   'text-red-600';
                  
                  return (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <div>
                          <p className={`font-semibold ${scoreColor}`}>
                            {result.scorePercentage.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500">
                            {result.score}/{result.totalQuestions} doğru
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">{date}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200"
          >
            Ləğv et
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
          >
            Yenidən cəhd et
          </button>
        </div>
      </div>
    </div>
  );
};
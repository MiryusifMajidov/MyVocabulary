import React, { useState, useEffect } from 'react';
import { ArrowLeft, GraduationCap, Clock, Users, Star, Play, BookOpen, Trophy } from 'lucide-react';
import { PublicExam } from '../types';
import { loadAllPublicExams } from '../utils/storage';

interface AllExamsProps {
  onBack: () => void;
  onTakeExam: (exam: PublicExam) => void;
}

export const AllExams: React.FC<AllExamsProps> = ({ onBack, onTakeExam }) => {
  const [exams, setExams] = useState<PublicExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'rating'>('newest');

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const allExams = await loadAllPublicExams(50);
      setExams(allExams);
    } catch (error) {
      console.error('Error loading exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedExams = exams.sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'popular':
        return b.totalAttempts - a.totalAttempts;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <span className="text-gray-600 dark:text-gray-300">İmtahanlar yüklənir...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Bütün İmtahanlar</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-blue-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                <Trophy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>{exams.length}</strong> İmtahan
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Sort Options */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Sıralama</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setSortBy('newest')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  sortBy === 'newest'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Ən Yeni
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  sortBy === 'popular'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Ən Populyar
              </button>
              <button
                onClick={() => setSortBy('rating')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  sortBy === 'rating'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Ən Yüksək Reytinq
              </button>
            </div>
          </div>
        </div>

        {/* Exams Grid */}
        {sortedExams.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mb-4">
              <GraduationCap className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">Hələ public imtahan yoxdur</h3>
            <p className="text-gray-500 dark:text-gray-400">
              İlk public imtahanınızı yaradın və community ilə paylaşın!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 line-clamp-2">
                      {exam.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      @{exam.username}
                    </p>
                    {exam.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                        {exam.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Exam Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-center mb-1">
                      <BookOpen className="w-4 h-4 text-blue-500 mr-1" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">Suallar</span>
                    </div>
                    <div className="text-lg font-bold text-gray-800 dark:text-white">
                      {exam.settings.wordCount}
                    </div>
                  </div>
                  <div className="text-center bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">Vaxt</span>
                    </div>
                    <div className="text-lg font-bold text-gray-800 dark:text-white">
                      {exam.settings.timeLimit}m
                    </div>
                  </div>
                </div>

                {/* Bottom Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      <span>{exam.totalAttempts}</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-3 h-3 mr-1 text-yellow-500" />
                      <span>{exam.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="text-xs">
                    {new Date(exam.createdAt).toLocaleDateString('az-AZ')}
                  </div>
                </div>

                {/* Take Exam Button */}
                <button
                  onClick={() => onTakeExam(exam)}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-indigo-700 transition-all"
                >
                  <Play className="w-4 h-4" />
                  <span>İmtahan Ver</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { ArrowLeft, GraduationCap, Clock, Users, Star, Play, BookOpen, Trophy, CheckCircle } from 'lucide-react';
import { PublicExam } from '../types';
import { loadAllPublicExams, hasUserParticipatedInExam, getUserBestExamResult } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';

interface AllExamsProps {
  onBack: () => void;
  onTakeExam: (exam: PublicExam) => void;
}

export const AllExams: React.FC<AllExamsProps> = ({ onBack, onTakeExam }) => {
  const { currentUser } = useAuth();
  const [exams, setExams] = useState<PublicExam[]>([]);
  const [userParticipations, setUserParticipations] = useState<{[examId: string]: boolean}>({});
  const [userBestResults, setUserBestResults] = useState<{[examId: string]: any}>({});
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

      // Load participation data for current user
      if (currentUser && allExams.length > 0) {
        const participationPromises = allExams.map(async (exam) => {
          const hasParticipated = await hasUserParticipatedInExam(currentUser.id, exam.id);
          return { examId: exam.id, hasParticipated };
        });

        const bestResultPromises = allExams.map(async (exam) => {
          const bestResult = await getUserBestExamResult(currentUser.id, exam.id);
          return { examId: exam.id, bestResult };
        });

        const [participationData, bestResultData] = await Promise.all([
          Promise.all(participationPromises),
          Promise.all(bestResultPromises)
        ]);

        const participationMap = participationData.reduce((acc, { examId, hasParticipated }) => {
          acc[examId] = hasParticipated;
          return acc;
        }, {} as {[examId: string]: boolean});

        const bestResultMap = bestResultData.reduce((acc, { examId, bestResult }) => {
          if (bestResult) {
            acc[examId] = bestResult;
          }
          return acc;
        }, {} as {[examId: string]: any});

        setUserParticipations(participationMap);
        setUserBestResults(bestResultMap);
      }
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

  const formatTime = (minutes: number) => {
    return `${minutes} dəqiqə`;
  };

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <span className="text-gray-600">İmtahanlar yüklənir...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header - Mobile Optimized */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          {/* Top Row - Title and Back Button */}
          <div className="flex items-center justify-between mb-4 sm:mb-0">
            <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex-shrink-0">
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">Bütün İmtahanlar</h1>
              </div>
            </div>
          </div>
          
          {/* Bottom Row - Stats */}
          <div className="flex justify-center sm:justify-end">
            <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
              <Trophy className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                <strong>{exams.length}</strong> İmtahan
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Sort Options - Mobile Optimized */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          {/* Mobile: Vertical Layout */}
          <div className="sm:hidden">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">Sıralama</h2>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setSortBy('newest')}
                className={`px-4 py-3 rounded-lg transition-colors font-medium ${
                  sortBy === 'newest'
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📅 Ən Yeni İmtahanlar
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`px-4 py-3 rounded-lg transition-colors font-medium ${
                  sortBy === 'popular'
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🔥 Ən Populyar İmtahanlar
              </button>
              <button
                onClick={() => setSortBy('rating')}
                className={`px-4 py-3 rounded-lg transition-colors font-medium ${
                  sortBy === 'rating'
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ⭐ Ən Yüksək Reytinqli
              </button>
            </div>
          </div>

          {/* Desktop: Horizontal Layout */}
          <div className="hidden sm:flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Sıralama</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setSortBy('newest')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  sortBy === 'newest'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Ən Yeni
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  sortBy === 'popular'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Ən Populyar
              </button>
              <button
                onClick={() => setSortBy('rating')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  sortBy === 'rating'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
              <GraduationCap className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Hələ public imtahan yoxdur</h3>
            <p className="text-gray-500">
              İlk public imtahanınızı yaradın və community ilə paylaşın!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                      {exam.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      @{exam.username}
                    </p>
                    {exam.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {exam.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Exam Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-center mb-1">
                      <BookOpen className="w-4 h-4 text-blue-500 mr-1" />
                      <span className="text-sm text-gray-600">Sözlər</span>
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      {exam.settings.wordCount}
                    </div>
                  </div>
                  <div className="text-center bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-gray-600">Vaxt</span>
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      {exam.settings.timeLimit}m
                    </div>
                  </div>
                </div>

                {/* Bottom Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
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

                {/* User Participation Status */}
                {currentUser && userParticipations[exam.id] && userBestResults[exam.id] && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-800">
                          İştirak etmisiniz
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${getGradeColor(userBestResults[exam.id].scorePercentage)}`}>
                          {userBestResults[exam.id].scorePercentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">
                          {userBestResults[exam.id].score}/{userBestResults[exam.id].totalQuestions}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Take Exam Button */}
                <button
                  onClick={() => onTakeExam(exam)}
                  className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all ${
                    currentUser && userParticipations[exam.id]
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700'
                      : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700'
                  } text-white`}
                >
                  <Play className="w-4 h-4" />
                  <span>
                    {currentUser && userParticipations[exam.id] ? 'Yenidən Cəhd Et' : 'İmtahan Ver'}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
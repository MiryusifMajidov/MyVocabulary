import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Crown, Award, Medal, TrendingUp, BookOpen, Brain, Users, Star, GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getTopCreators, getTopLearners, migrateOldCollections, debugAllCollections } from '../utils/storage';
import { LeaderboardUser } from '../types';

interface LeaderboardProps {
  onBack: () => void;
}

type LeaderboardTab = 'creators' | 'learners' | 'exams';

export const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('creators');
  const [topCreators, setTopCreators] = useState<LeaderboardUser[]>([]);
  const [topLearners, setTopLearners] = useState<LeaderboardUser[]>([]);
  const [topExamTakers, setTopExamTakers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboardData();
  }, []);

  const loadLeaderboardData = async () => {
    try {
      setLoading(true);
      console.log('🚀 Starting to load leaderboard data...');
      
      const [creators, learners] = await Promise.all([
        getTopCreators(50), // Load top 50 for each category
        getTopLearners(50)
      ]);

      // Sort exam takers by average score and total exams
      const examTakers = [...creators].sort((a, b) => {
        // First by average exam score, then by total exams
        if (a.averageExamScore !== b.averageExamScore) {
          return b.averageExamScore - a.averageExamScore;
        }
        return b.totalExams - a.totalExams;
      }).filter(user => user.totalExams > 0); // Only show users who have taken exams
      
      console.log('🏆 Creators loaded:', creators.length);
      console.log('🎓 Learners loaded:', learners.length);
      console.log('🎓 Exam takers loaded:', examTakers.length);
      
      setTopCreators(creators);
      setTopLearners(learners);
      setTopExamTakers(examTakers);
    } catch (error) {
      console.error('❌ Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Award className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-orange-600" />;
      default:
        return (
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-blue-600">{rank}</span>
          </div>
        );
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-50 to-yellow-100 border-yellow-200';
      case 2:
        return 'from-gray-50 to-gray-100 border-gray-200';
      case 3:
        return 'from-orange-50 to-orange-100 border-orange-200';
      default:
        return 'from-white to-gray-50 border-gray-200';
    }
  };

  const currentData = activeTab === 'creators' ? topCreators : activeTab === 'learners' ? topLearners : topExamTakers;
  const currentUserRank = currentData.findIndex(user => user.id === currentUser?.id) + 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <span className="text-gray-600 dark:text-gray-300">Liderlik cədvəli yüklənir...</span>
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
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Liderlik Cədvəli</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                <Star className="w-4 h-4 text-blue-600" />
                <span>Sizin yeriniiz: <strong>#{currentUserRank || 'N/A'}</strong></span>
              </div>
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
                <Users className="w-4 h-4 text-green-600" />
                <span>Cəmi İstifadəçi: <strong>{activeTab === 'creators' ? topCreators.length : topLearners.length}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-2 mb-8 flex">
          <button
            onClick={() => setActiveTab('creators')}
            className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'creators'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Ən Çox Yaradan</span>
          </button>
          
          <button
            onClick={() => setActiveTab('learners')}
            className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'learners'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Brain className="w-5 h-5" />
            <span>Ən Çox Öyrənən</span>
          </button>
          
          <button
            onClick={() => setActiveTab('exams')}
            className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'exams'
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <GraduationCap className="w-5 h-5" />
            <span>Ən Yaxşı İmtahan</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-800 dark:text-white">{currentData.length}</div>
                <div className="text-gray-600 dark:text-gray-300">Aktiv İstifadəçi</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-800 dark:text-white">
                  {activeTab === 'exams' 
                    ? currentData.reduce((total, user) => total + user.totalExams, 0).toLocaleString()
                    : currentData.reduce((total, user) => total + user.totalWords, 0).toLocaleString()
                  }
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {activeTab === 'creators' ? 'Yaradılan Söz' : activeTab === 'learners' ? 'Öyrənilən Söz' : 'İmtahan Sayı'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-800 dark:text-white">
                  {activeTab === 'exams' 
                    ? Math.round(currentData.reduce((total, user) => total + user.averageExamScore, 0) / Math.max(currentData.length, 1))
                    : currentData.reduce((total, user) => total + user.totalCollections, 0)
                  }
                  {activeTab === 'exams' && '%'}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {activeTab === 'exams' ? 'Ortalama Bal' : 'Cəmi Kolleksiya'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Trophy className="w-6 h-6 mr-3" />
              {activeTab === 'creators' 
                ? 'Ən Çox Kolleksiya Yaradanlar' 
                : activeTab === 'learners' 
                  ? 'Ən Çox Söz Öyrənənlər'
                  : 'Ən Yaxşı İmtahan Nəticələri'
              }
            </h2>
            <p className="text-purple-100 mt-2">
              {activeTab === 'creators' 
                ? 'Ən çox söz və kolleksiya yaradıb community ilə paylaşanlar' 
                : activeTab === 'learners'
                  ? 'Ən çox söz öyrənib bilik qazananlar'
                  : 'Ən yüksək ortalama imtahan nəticəsi əldə edənlər'
              }
            </p>
          </div>

          {currentData.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">Hələ məlumat yoxdur</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {activeTab === 'creators' 
                  ? 'İlk public kolleksiyanı yaradın və liderlik cədvəlində yerinizi alın!'
                  : activeTab === 'learners'
                    ? 'İlk quiz-lərinizi tamamlayın və liderlik cədvəlində yerinizi alın!'
                    : 'İlk imtahanınızı verin və liderlik cədvəlində yerinizi alın!'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {currentData.map((user, index) => {
                const isCurrentUser = user.id === currentUser?.id;
                const rank = user.rank || (index + 1);
                
                return (
                  <div
                    key={user.id}
                    className={`px-8 py-6 transition-all duration-200 ${
                      isCurrentUser 
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500' 
                        : rank <= 3 
                          ? `bg-gradient-to-r ${getRankColor(rank)} border-l-4 border-transparent`
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center">
                          {getRankIcon(rank)}
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                            isCurrentUser 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                              : 'bg-gradient-to-r from-gray-400 to-gray-600'
                          }`}>
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className={`text-lg font-bold ${isCurrentUser ? 'text-blue-700' : 'text-gray-800 dark:text-white'}`}>
                                @{user.username}
                              </h3>
                              {isCurrentUser && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                  Siz
                                </span>
                              )}
                              {rank <= 3 && (
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                                  rank === 2 ? 'bg-gray-100 text-gray-800' :
                                  'bg-orange-100 text-orange-800'
                                }`}>
                                  {rank === 1 ? 'Birinci' : rank === 2 ? 'İkinci' : 'Üçüncü'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-8 text-center">
                        <div>
                          <div className="text-2xl font-bold text-gray-800 dark:text-white">
                            {activeTab === 'creators' 
                              ? user.totalWords 
                              : activeTab === 'learners' 
                                ? user.learnedWords
                                : `${Math.round(user.averageExamScore)}%`
                            }
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {activeTab === 'creators' 
                              ? 'Yaradılan Söz' 
                              : activeTab === 'learners' 
                                ? 'Öyrənilən Söz'
                                : 'Ortalama Bal'
                            }
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                            {activeTab === 'exams' ? user.totalExams : user.totalCollections}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {activeTab === 'exams' ? 'İmtahan Sayı' : 'Kolleksiya'}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                            {activeTab === 'creators' 
                              ? user.totalUsage 
                              : activeTab === 'learners' 
                                ? user.publicCollections
                                : user.perfectExams
                            }
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {activeTab === 'creators' 
                              ? 'İstifadə' 
                              : activeTab === 'learners' 
                                ? 'Public'
                                : '100% Bal'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Motivational Footer */}
        <div className="mt-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-8 text-center text-white">
          <Trophy className="w-16 h-16 mx-auto mb-4 opacity-80" />
          <h3 className="text-2xl font-bold mb-4">Səndə liderlərdən olabilərsən!</h3>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            {activeTab === 'creators' 
              ? 'Yeni kolleksiyalar yaradıb community ilə paylaş. Hər söz sayılır!' 
              : activeTab === 'learners'
                ? 'Yeni sözlər öyrən və quiz-ləri 100% nəticə ilə tamamla!'
                : 'İmtahanlar ver və yüksək nəticələrlə liderlik cədvəlində yerin qorumağa çalış!'
            }
          </p>
        </div>
      </div>
    </div>
  );
};
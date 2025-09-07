import React, { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, Settings, LogOut, User, BarChart3, TrendingUp, Play, Star, Users, Trophy, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { loadTopRatedCollections, loadAllPublicExams, getGlobalStatistics, isCollectionLearned, getLearnedCollections } from '../utils/storage';
import { WordCollection, PublicExam } from '../types';

interface HomeProps {
  onNavigateToCollections: () => void;
  onNavigateToAllCollections: () => void;
  onNavigateToLeaderboard: () => void;
  onNavigateToExam: () => void;
  onNavigateToAllExams: () => void;
  onNavigateToMyExams: () => void;
  onNavigateToSettings: () => void;
  onTakeExam: (exam: PublicExam) => void;
  onPlayQuiz: (collection: WordCollection) => void;
}

export const Home: React.FC<HomeProps> = ({
  onNavigateToCollections,
  onNavigateToAllCollections,
  onNavigateToLeaderboard,
  onNavigateToExam,
  onNavigateToAllExams,
  onNavigateToMyExams,
  onNavigateToSettings,
  onTakeExam,
  onPlayQuiz
}) => {
  const { currentUser, logout } = useAuth();
  const [topCollections, setTopCollections] = useState<WordCollection[]>([]);
  const [loadingTopCollections, setLoadingTopCollections] = useState(true);
  const [topExams, setTopExams] = useState<PublicExam[]>([]);
  const [loadingTopExams, setLoadingTopExams] = useState(true);
  const [globalStats, setGlobalStats] = useState({
    totalCollections: 0,
    totalExams: 0,
    totalUsers: 0,
    totalWords: 0,
    totalLearnedWords: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [learnedCollectionIds, setLearnedCollectionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTopCollections();
    loadTopExams();
    loadGlobalStats();
    loadLearnedCollections();
    
    // TEMPORARY: Run migration for old exams (only once)
    if (window.location.search.includes('migrate=true')) {
      import('../utils/storage').then(({ migrateOldExamsToEmbedWords }) => {
        console.log('🔄 Running one-time migration...');
        migrateOldExamsToEmbedWords().then(result => {
          console.log('Migration result:', result);
          alert(`Migration tamamlandı! ${result.migratedCount || 0} imtahan yeniləndi.`);
        });
      });
    }
  }, [currentUser]);

  const loadTopCollections = async () => {
    try {
      setLoadingTopCollections(true);
      const collections = await loadTopRatedCollections(10);
      setTopCollections(collections);
    } catch (error) {
      console.error('Error loading top collections:', error);
    } finally {
      setLoadingTopCollections(false);
    }
  };

  const loadTopExams = async () => {
    try {
      setLoadingTopExams(true);
      const exams = await loadAllPublicExams(6);
      setTopExams(exams);
    } catch (error) {
      console.error('Error loading top exams:', error);
    } finally {
      setLoadingTopExams(false);
    }
  };

  const loadGlobalStats = async () => {
    try {
      setLoadingStats(true);
      const stats = await getGlobalStatistics();
      setGlobalStats(stats);
    } catch (error) {
      console.error('Error loading global statistics:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadLearnedCollections = async () => {
    if (currentUser) {
      try {
        const learnedCollections = await getLearnedCollections(currentUser.id);
        const learnedIds = new Set(learnedCollections.map(learned => learned.collectionId));
        setLearnedCollectionIds(learnedIds);
      } catch (error) {
        console.error('Error loading learned collections:', error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Learning App</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="w-4 h-4" />
                <span className="font-medium">{currentUser?.username}</span>
              </div>
              <button
                onClick={onNavigateToSettings}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Xoş gəldin, {currentUser?.username}!
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            İngilis dili öyrənmə səfərində sənə kömək edəcək alətlər. 
            Yeni sözlər öyrən, kolleksiyalar yarat və biliklərinizi imtahanlarda sınayın.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Collections Card */}
          <div 
            onClick={onNavigateToCollections}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 cursor-pointer group transform hover:scale-105"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-6 group-hover:from-blue-600 group-hover:to-indigo-700 transition-all">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Kolleksiyalarım</h3>
            <p className="text-gray-600 mb-6">
              Söz kolleksiyalarınızı yaradın, idarə edin və öyrənin.
            </p>
            <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
              <span>Kolleksiyalara get</span>
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Leaderboard Card */}
          <div 
            onClick={onNavigateToLeaderboard}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 cursor-pointer group transform hover:scale-105"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full mb-6 group-hover:from-yellow-600 group-hover:to-orange-700 transition-all">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Liderlik Cədvəli</h3>
            <p className="text-gray-600 mb-6">
              Ən çox yaradan və öyrənən istifadəçiləri görün, rəqabət edin.
            </p>
            <div className="flex items-center text-yellow-600 font-semibold group-hover:text-yellow-700">
              <span>Liderlərə bax</span>
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Professional Exam Card */}
          <div 
            onClick={onNavigateToExam}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 cursor-pointer group transform hover:scale-105"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full mb-6 group-hover:from-green-600 group-hover:to-teal-700 transition-all">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Peşəkar İmtahan</h3>
            <p className="text-gray-600 mb-6">
              Comprehensive imtahan verin, bilik səviyyənizi ölçün.
            </p>
            <div className="flex items-center text-green-600 font-semibold group-hover:text-green-700">
              <span>İmtahan ver</span>
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* My Exams Card */}
          <div 
            onClick={onNavigateToMyExams}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 cursor-pointer group transform hover:scale-105"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-6 group-hover:from-purple-600 group-hover:to-pink-700 transition-all">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Mənim İmtahanlarım</h3>
            <p className="text-gray-600 mb-6">
              Yaratdığınız və iştirak etdiyiniz imtahanlara baxın.
            </p>
            <div className="flex items-center text-purple-600 font-semibold group-hover:text-purple-700">
              <span>İmtahanlarıma get</span>
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Top Rated Collections */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Ən Populyar Kolleksiyalar</h3>
            </div>
            <button
              onClick={onNavigateToAllCollections}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              <span>Hamısını gör</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {loadingTopCollections ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <span className="text-gray-600">Populyar kolleksiyalar yüklənir...</span>
            </div>
          ) : !topCollections || topCollections.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">Hələ public kolleksiya yoxdur.</p>
              <p className="text-sm text-gray-500 mt-2">İlk kolleksiyanızı yaradıb community ilə paylaşın!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(topCollections || []).slice(0, 6).map((collection, index) => (
                <div
                  key={collection.id}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  {index < 3 && (
                    <div className="flex items-center mb-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="ml-2 text-xs font-medium text-gray-500">
                        {index === 0 ? 'Ən Populyar' : index === 1 ? '2-ci' : '3-cü'}
                      </span>
                    </div>
                  )}
                  
                  <h4 className="font-bold text-gray-800 mb-2 line-clamp-2">{collection.name}</h4>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <span>@{collection.username}</span>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-500 mr-1" />
                        <span>{collection.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="w-3 h-3 text-blue-500 mr-1" />
                        <span>{collection.usageCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mb-4">
                    {collection.words.length} söz • {collection.tags?.slice(0, 2).map(tag => `#${tag}`).join(' ')}
                  </div>

                  {learnedCollectionIds.has(collection.id) && (
                    <div className="flex items-center space-x-2 mb-3 p-2 bg-green-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">Artıq öyrəndiniz</span>
                    </div>
                  )}

                  <button 
                    onClick={() => onPlayQuiz(collection)}
                    className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      learnedCollectionIds.has(collection.id) 
                        ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                    }`}
                  >
                    <Play className="w-3 h-3" />
                    <span>{learnedCollectionIds.has(collection.id) ? 'Yenidən Oyna' : 'Quiz Oyna'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {topCollections && topCollections.length > 6 && (
            <div className="text-center mt-6">
              <button
                onClick={onNavigateToAllCollections}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span>Bütün Kolleksiyalara Bax</span>
              </button>
            </div>
          )}
        </div>

        {/* Top Exams */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Ən Yaxşı İmtahanlar</h3>
            </div>
            <button
              onClick={onNavigateToMyExams}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              <span>Hamısını gör</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {loadingTopExams ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <span className="text-gray-600">Top imtahanlar yüklənir...</span>
            </div>
          ) : !topExams || topExams.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">Hələ public imtahan yoxdur.</p>
              <p className="text-sm text-gray-500 mt-2">İlk imtahanınızı yaradıb community ilə paylaşın!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(topExams || []).slice(0, 6).map((exam, index) => (
                <div
                  key={exam.id}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  {index < 3 && (
                    <div className="flex items-center mb-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="ml-2 text-xs font-medium text-gray-500">
                        {index === 0 ? 'Ən Populyar' : index === 1 ? '2-ci' : '3-cü'}
                      </span>
                    </div>
                  )}
                  
                  <h4 className="font-bold text-gray-800 mb-2 line-clamp-2">{exam.name}</h4>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <span>@{exam.username}</span>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <Users className="w-3 h-3 text-blue-500 mr-1" />
                        <span>{exam.totalAttempts}</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-500 mr-1" />
                        <span>{exam.averageScore.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mb-4">
                    {exam.settings.wordCount} sual • {exam.settings.timeLimit} dəqiqə
                  </div>

                  <button 
                    onClick={() => onTakeExam(exam)}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-green-600 hover:to-blue-700 transition-all"
                  >
                    <Play className="w-3 h-3" />
                    <span>İmtahan Ver</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global Statistics */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Global Statistikalar</h3>
          </div>
          
          {loadingStats ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <span className="text-gray-600">Statistikalar yüklənir...</span>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-1">{globalStats.totalCollections}</div>
                <div className="text-sm text-gray-600">Kolleksiya</div>
              </div>
              
              <div className="text-center bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-full mx-auto mb-3">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-green-600 mb-1">{globalStats.totalExams}</div>
                <div className="text-sm text-gray-600">İmtahan</div>
              </div>
              
              <div className="text-center bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-500 rounded-full mx-auto mb-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-purple-600 mb-1">{globalStats.totalUsers}</div>
                <div className="text-sm text-gray-600">İstifadəçi</div>
              </div>
              
              <div className="text-center bg-gradient-to-br from-yellow-50 to-orange-100 rounded-xl p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-500 rounded-full mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="text-xl font-bold text-yellow-600 mb-1">
                  {globalStats.totalLearnedWords}/{globalStats.totalWords}
                </div>
                <div className="text-sm text-gray-600">Öyrənilən/Cəmi Sözlər</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Clock, Users, Target, Eye, Play, Edit, Trash2, BookOpen } from 'lucide-react';
import { PublicExam } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { loadUserPublicExams, loadUserParticipatedExams, getUserBestExamResult } from '../utils/storage';

interface MyExamsProps {
  onBack: () => void;
  onTakeExam: (exam: PublicExam) => void;
  onNavigateToAllExams: () => void;
  onNavigateToCreateExam: () => void;
}

export const MyExams: React.FC<MyExamsProps> = ({
  onBack,
  onTakeExam,
  onNavigateToAllExams,
  onNavigateToCreateExam
}) => {
  const { currentUser } = useAuth();
  const [myExams, setMyExams] = useState<PublicExam[]>([]);
  const [participatedExams, setParticipatedExams] = useState<PublicExam[]>([]);
  const [userBestResults, setUserBestResults] = useState<{[examId: string]: any}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExams();
  }, [currentUser]);

  const loadExams = async () => {
    if (!currentUser) {
      console.log('❌ No current user in MyExams loadExams');
      return;
    }
    
    console.log('🔥 MyExams loadExams called for user:', currentUser.id, currentUser.username);
    
    setLoading(true);
    try {
      // Load user's created exams
      console.log('📞 Calling loadUserPublicExams...');
      const userExams = await loadUserPublicExams(currentUser.id);
      console.log('✅ loadUserPublicExams result:', userExams.length, 'exams');
      setMyExams(userExams);

      // Load participated exams
      console.log('📞 Calling loadUserParticipatedExams...');
      const participatedExams = await loadUserParticipatedExams(currentUser.id);
      console.log('✅ loadUserParticipatedExams result:', participatedExams.length, 'exams');
      setParticipatedExams(participatedExams);

      // Load best results for participated exams
      if (participatedExams.length > 0) {
        const bestResultsPromises = participatedExams.map(async (exam) => {
          const bestResult = await getUserBestExamResult(currentUser.id, exam.id);
          return { examId: exam.id, bestResult };
        });
        
        const bestResultsArray = await Promise.all(bestResultsPromises);
        const bestResultsMap = bestResultsArray.reduce((acc, { examId, bestResult }) => {
          if (bestResult) {
            acc[examId] = bestResult;
          }
          return acc;
        }, {} as {[examId: string]: any});
        
        setUserBestResults(bestResultsMap);
        console.log('✅ Best results loaded for', Object.keys(bestResultsMap).length, 'participated exams');
      }
    } catch (error) {
      console.error('❌ Error loading exams:', error);
    } finally {
      setLoading(false);
      console.log('🏁 MyExams loadExams completed');
    }
  };

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">İmtahanlar yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header - Mobile Optimized */}
      <div className="bg-white shadow-lg">
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
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">Mənim İmtahanlarım</h1>
              </div>
            </div>
          </div>
          
          {/* Bottom Row - Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Mobile: Full width buttons */}
            <div className="grid grid-cols-2 gap-3 sm:hidden">
              <button
                onClick={onNavigateToCreateExam}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-3 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">Yarat</span>
              </button>
              
              <button
                onClick={onNavigateToAllExams}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Eye className="w-4 h-4" />
                <span className="font-medium">Hamısı</span>
              </button>
            </div>

            {/* Desktop: Side by side buttons */}
            <div className="hidden sm:flex sm:items-center sm:space-x-4">
              <button
                onClick={onNavigateToCreateExam}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni İmtahan</span>
              </button>
              
              <button
                onClick={onNavigateToAllExams}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Eye className="w-4 h-4" />
                <span>Bütün İmtahanlar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* My Created Exams */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Edit className="w-5 h-5 text-purple-600" />
              </div>
              <span>Yaratdığım İmtahanlar</span>
              <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-sm font-medium">
                {myExams.length}
              </span>
            </h2>
          </div>

          {myExams.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Hələ imtahan yaratmamısınız</h3>
              <p className="text-gray-500 mb-6">
                İlk imtahanınızı yaradın və digər istifadəçilərlə paylaşın!
              </p>
              <button
                onClick={onNavigateToCreateExam}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>İmtahan Yarat</span>
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myExams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                        {exam.name}
                      </h3>
                      {exam.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {exam.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Söz sayı</span>
                      <span className="font-semibold text-gray-800">{exam.settings.wordCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Vaxt limiti</span>
                      <span className="font-semibold text-gray-800">{exam.settings.timeLimit}m</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Söz sayı</span>
                      <span className="font-semibold text-gray-800">{exam.settings.wordCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Ortalama bal</span>
                      <span className={`font-semibold ${getGradeColor(exam.averageScore)}`}>
                        {exam.averageScore.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => onTakeExam(exam)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-sm font-medium"
                    >
                      <Play className="w-4 h-4" />
                      <span>Test Et</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Participated Exams */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span>Digər İmtahanlar</span>
            </h2>
            
            <button
              onClick={onNavigateToAllExams}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
            >
              Hamısına bax →
            </button>
          </div>

          {participatedExams.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Hələ imtahanda iştirak etməmisiniz</h3>
              <p className="text-gray-500">
                Digər istifadəçilərin yaratdığı imtahanlarda iştirak etdikləriniz burada görünəcək.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {participatedExams.slice(0, 6).map((exam) => (
                <div
                  key={exam.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                        {exam.name}
                      </h3>
                      <p className="text-sm text-gray-600  mb-2">
                        @{exam.username}
                      </p>
                      {exam.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {exam.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Söz sayı</span>
                      <span className="font-semibold text-gray-800">{exam.settings.wordCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Vaxt limiti</span>
                      <span className="font-semibold text-gray-800">{exam.settings.timeLimit}m</span>
                    </div>
                    {userBestResults[exam.id] && (
                      <>
                        <hr className="my-2 border-gray-200" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Ən yaxşı nəticə</span>
                          <span className={`font-bold ${getGradeColor(userBestResults[exam.id].scorePercentage)}`}>
                            {userBestResults[exam.id].scorePercentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Cavablar</span>
                          <span className="font-semibold text-gray-800">
                            {userBestResults[exam.id].score}/{userBestResults[exam.id].totalQuestions}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => onTakeExam(exam)}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-3 rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 font-medium"
                  >
                    <Play className="w-4 h-4" />
                    <span>Yenidən Cəhd Et</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
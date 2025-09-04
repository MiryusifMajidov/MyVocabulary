import React from 'react';
import { Trophy, Clock, Target, RotateCcw, Home, Star, AlertCircle, CheckCircle } from 'lucide-react';

interface ExamResultProps {
  score: number;
  totalQuestions: number;
  timeSpent: number; // in seconds
  timeLimit: number; // in minutes
  onRetakeExam: () => void;
  onBackToHome: () => void;
}

export const ExamResult: React.FC<ExamResultProps> = ({
  score,
  totalQuestions,
  timeSpent,
  timeLimit,
  onRetakeExam,
  onBackToHome
}) => {
  const percentage = Math.round((score / totalQuestions) * 100);
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getGrade = () => {
    if (percentage >= 90) return { grade: 'Əla', color: 'text-green-600', bg: 'bg-green-50', icon: Trophy };
    if (percentage >= 80) return { grade: 'Yaxşı', color: 'text-blue-600', bg: 'bg-blue-50', icon: CheckCircle };
    if (percentage >= 70) return { grade: 'Orta', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Star };
    if (percentage >= 60) return { grade: 'Kəmçalı', color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertCircle };
    return { grade: 'Zəif', color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle };
  };

  const gradeInfo = getGrade();
  const GradeIcon = gradeInfo.icon;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className={`p-4 ${gradeInfo.bg} rounded-full`}>
            <GradeIcon className={`w-12 h-12 ${gradeInfo.color}`} />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">İmtahan Nəticəsi</h1>
        <p className="text-gray-600 text-lg">
          Peşəkar imtahanınız tamamlandı!
        </p>
      </div>

      {/* Main Result Card */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center space-x-3 px-6 py-3 ${gradeInfo.bg} rounded-full mb-4`}>
            <GradeIcon className={`w-6 h-6 ${gradeInfo.color}`} />
            <span className={`text-2xl font-bold ${gradeInfo.color}`}>{gradeInfo.grade}</span>
          </div>
          
          <div className="mb-6">
            <div className="text-6xl font-bold text-gray-800 mb-2">{percentage}%</div>
            <p className="text-xl text-gray-600">
              {score} / {totalQuestions} doğru cavab
            </p>
          </div>

          {/* Progress Ring */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <svg className="transform -rotate-90 w-32 h-32" viewBox="0 0 36 36">
              <path
                d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
              <path
                d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                fill="none"
                stroke={percentage >= 80 ? "#10b981" : percentage >= 60 ? "#f59e0b" : "#ef4444"}
                strokeWidth="2"
                strokeDasharray={`${percentage}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-800">{percentage}%</span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 text-center">
            <Target className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 mb-1">Doğruluq</h3>
            <p className="text-2xl font-bold text-blue-600">{percentage}%</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 text-center">
            <Clock className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 mb-1">Vaxt</h3>
            <p className="text-2xl font-bold text-purple-600">{formatTime(timeSpent)}</p>
            <p className="text-sm text-gray-600">/ {timeLimit} dəqiqə</p>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 mb-1">Cavablar</h3>
            <p className="text-2xl font-bold text-green-600">{score} / {totalQuestions}</p>
          </div>
        </div>

        {/* Performance Message */}
        <div className={`${gradeInfo.bg} rounded-xl p-6 text-center mb-8`}>
          <h3 className={`text-lg font-semibold ${gradeInfo.color} mb-2`}>
            {percentage >= 90 && "Əla nəticə! Mükəmməl performans göstərdiniz!"}
            {percentage >= 80 && percentage < 90 && "Çox yaxşı! Bilikləriniz kifayət qədər yaxşıdır."}
            {percentage >= 70 && percentage < 80 && "Yaxşı nəticə, lakin daha da yaxşılaşdıra bilərsiniz."}
            {percentage >= 60 && percentage < 70 && "Orta nəticə. Daha çox məşq etməlisiniz."}
            {percentage < 60 && "Daha çox öyrənməyə ehtiyacınız var. Məşq etməyə davam edin!"}
          </h3>
          <p className={`${gradeInfo.color} opacity-80`}>
            {percentage >= 80 ? "Biliklərinizlə fəxr edə bilərsiniz!" : "Təkmilləşdirmək üçün daha çox məşq edin."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onRetakeExam}
            className="flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Yenidən Cəhd Et</span>
          </button>
          
          <button
            onClick={onBackToHome}
            className="flex items-center justify-center space-x-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Home className="w-5 h-5" />
            <span>Ana Səhifə</span>
          </button>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Təkmilləşdirmək üçün məsləhətlər:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-blue-600 text-sm font-semibold">1</span>
            </div>
            <p className="text-gray-600">Səhv etdiyiniz sözləri bir daha məşq edin</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-blue-600 text-sm font-semibold">2</span>
            </div>
            <p className="text-gray-600">Yeni söz kolleksiyaları yaradın</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-blue-600 text-sm font-semibold">3</span>
            </div>
            <p className="text-gray-600">Mütəmadi olaraq təkrar edin</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-blue-600 text-sm font-semibold">4</span>
            </div>
            <p className="text-gray-600">Müxtəlif kolleksiyalardan imtahan verin</p>
          </div>
        </div>
      </div>
    </div>
  );
};
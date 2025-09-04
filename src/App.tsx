import React, { useState, useEffect } from 'react';
import { WordCollection, QuizResult, AppSettings } from './types';
import { saveSettings, loadSettings } from './utils/storage';
import { Home } from './components/Home';
import { MyCollections } from './components/MyCollections';
import { AllCollections } from './components/AllCollections';
import { AllExams } from './components/AllExams';
import { Leaderboard } from './components/Leaderboard';
import { Quiz } from './components/Quiz';
import { QuizResult as QuizResultComponent } from './components/QuizResult';
import { Settings } from './components/Settings';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { ExamSetup } from './components/Exam/ExamSetup';
import { ProfessionalExam } from './components/Exam/ProfessionalExam';
import { ExamResult } from './components/Exam/ExamResult';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ExamSettings, PublicExam } from './types';

type AppState = 'home' | 'collections' | 'all-collections' | 'all-exams' | 'leaderboard' | 'quiz' | 'result' | 'settings' | 'exam' | 'exam-active' | 'exam-result';
type AuthState = 'login' | 'register';

const AppContent = () => {
  const { currentUser } = useAuth();
  const [authState, setAuthState] = useState<AuthState>('login');
  
  if (!currentUser) {
    return authState === 'login' ? 
      <Login onSwitchToRegister={() => setAuthState('register')} /> :
      <Register onSwitchToLogin={() => setAuthState('login')} />;
  }
  
  return <MainApp />;
};

const MainApp = () => {
  const { currentUser } = useAuth();
  const [collections, setCollections] = useState<WordCollection[]>([]);
  const [settings, setAppSettings] = useState<AppSettings>({ autoAdvance: true, darkMode: false });
  const [currentState, setCurrentState] = useState<AppState>('home');
  const [selectedCollection, setSelectedCollection] = useState<WordCollection | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [examSettings, setExamSettings] = useState<ExamSettings | null>(null);
  const [examResult, setExamResult] = useState<{score: number, total: number, timeSpent: number, timeLimit: number} | null>(null);

  useEffect(() => {
    loadUserCollections();
    setAppSettings(loadSettings());
  }, [currentUser]);

  const loadUserCollections = async () => {
    if (currentUser) {
      const { loadUserCollections: loadUserCollectionsUtil } = await import('./utils/storage');
      const userCollections = await loadUserCollectionsUtil(currentUser.id);
      setCollections(userCollections);
    }
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleSaveCollection = async (collection: Omit<WordCollection, 'id' | 'userId' | 'username' | 'rating' | 'usageCount'>) => {
    if (currentUser) {
      const { saveCollection } = await import('./utils/storage');
      const savedCollection = await saveCollection(currentUser.id, currentUser.username, collection);
      setCollections(prev => [savedCollection, ...prev]);
      setCurrentState('collections');
    }
  };

  const handlePlayQuiz = (collection: WordCollection) => {
    setSelectedCollection(collection);
    setCurrentState('quiz');
  };

  const handleDeleteCollection = async (id: string) => {
    const { deleteCollection } = await import('./utils/storage');
    await deleteCollection(id);
    setCollections(prev => prev.filter(c => c.id !== id));
  };

  const handleQuizFinish = (result: QuizResult) => {
    setQuizResult(result);
    setCurrentState('result');
  };

  const handlePlayAgain = () => {
    setCurrentState('quiz');
  };

  const handleBackToHome = () => {
    setCurrentState('home');
    setSelectedCollection(null);
    setQuizResult(null);
    setExamSettings(null);
    setExamResult(null);
  };

  const handleStartExam = async (settings: ExamSettings) => {
    // First, save public exam to database if it's marked as public
    let savedPublicExamId = null;
    if (settings.isPublic && currentUser && settings.name) {
      try {
        const { savePublicExam } = await import('./utils/storage');
        const savedExam = await savePublicExam(currentUser.id, currentUser.username, settings);
        savedPublicExamId = savedExam.id;
        console.log('✅ Public exam saved to database:', savedExam.id);
      } catch (error) {
        console.error('❌ Error saving public exam:', error);
        // Don't prevent exam start if saving fails
      }
    }
    
    // Add the saved exam ID to settings for tracking
    const settingsWithId = {
      ...settings,
      publicExamId: savedPublicExamId
    };
    
    setExamSettings(settingsWithId);
    setCurrentState('exam-active');
  };

  const handleExamFinish = async (score: number, totalQuestions: number, timeSpent: number) => {
    // Save exam result for leaderboard stats
    if (currentUser) {
      try {
        const { saveExamResult } = await import('./utils/storage');
        await saveExamResult(currentUser.id, score, totalQuestions, timeSpent, examSettings);
        console.log('✅ Exam result saved for user:', currentUser.id);
      } catch (error) {
        console.error('❌ Error saving exam result:', error);
      }
    }

    // Update public exam stats if this was a public exam attempt
    if (examSettings?.publicExamId) {
      try {
        const { updateExamStats } = await import('./utils/storage');
        await updateExamStats(examSettings.publicExamId, score, totalQuestions);
        console.log('✅ Public exam stats updated:', examSettings.publicExamId);
      } catch (error) {
        console.error('❌ Error updating exam stats:', error);
      }
    }

    setExamResult({ 
      score, 
      total: totalQuestions, 
      timeSpent,
      timeLimit: examSettings?.timeLimit || 10
    });
    setCurrentState('exam-result');
  };

  const handleRetakeExam = () => {
    // Keep exam settings but clear results to retake same exam
    setExamResult(null);
    
    // If this was a public exam, go back to exam-active with same settings
    // If this was a custom exam, go back to exam setup
    if (examSettings?.publicExamId || examSettings?.isPublic) {
      console.log('🔄 Retaking exam with same settings');
      setCurrentState('exam-active');
    } else {
      console.log('🔄 Going back to exam setup');
      setCurrentState('exam');
    }
  };

  const handleMarkAsLearned = async (collectionId: string) => {
    if (currentUser) {
      const { markCollectionAsLearned } = await import('./utils/storage');
      await markCollectionAsLearned(currentUser.id, collectionId);
      // Reload collections to reflect changes
      loadUserCollections();
    }
  };

  const handleNavigateToExam = async () => {
    if (currentUser) {
      const { loadUserCollections } = await import('./utils/storage');
      const userCollections = await loadUserCollections(currentUser.id);
      setCollections(userCollections);
    }
    setCurrentState('exam');
  };

  const handleTakeExam = async (publicExam: PublicExam) => {
    // Convert public exam to exam settings and start
    const examSettings: ExamSettings = {
      ...publicExam.settings,
      isPublic: false, // Mark as not public since we're taking it, not creating
      publicExamId: publicExam.id // Keep track of which public exam this is for stats
    };
    
    // Load collections used in this exam
    if (currentUser) {
      const { loadUserCollections } = await import('./utils/storage');
      const userCollections = await loadUserCollections(currentUser.id);
      setCollections(userCollections);
    }
    
    console.log('🚀 Starting public exam:', publicExam.name, 'ID:', publicExam.id);
    setExamSettings(examSettings);
    setCurrentState('exam-active');
  };

  return (
    <div className={`min-h-screen ${settings.darkMode ? 'dark bg-gray-900' : ''}`}>
      {currentState === 'home' && (
        <Home
          onNavigateToCollections={() => setCurrentState('collections')}
          onNavigateToAllCollections={() => setCurrentState('all-collections')}
          onNavigateToLeaderboard={() => setCurrentState('leaderboard')}
          onNavigateToExam={handleNavigateToExam}
          onNavigateToAllExams={() => setCurrentState('all-exams')}
          onNavigateToSettings={() => setCurrentState('settings')}
        />
      )}

      {currentState === 'collections' && (
        <MyCollections
          onBack={handleBackToHome}
          onNavigateToAllCollections={() => setCurrentState('all-collections')}
          onPlayQuiz={handlePlayQuiz}
          onSaveCollection={handleSaveCollection}
        />
      )}

      {currentState === 'all-collections' && (
        <AllCollections
          onBack={handleBackToHome}
          onPlayQuiz={handlePlayQuiz}
        />
      )}

      {currentState === 'all-exams' && (
        <AllExams
          onBack={handleBackToHome}
          onTakeExam={handleTakeExam}
        />
      )}

      {currentState === 'leaderboard' && (
        <Leaderboard
          onBack={handleBackToHome}
        />
      )}

      {currentState === 'quiz' && selectedCollection && (
        <Quiz
          collection={selectedCollection}
          autoAdvance={settings.autoAdvance}
          onBack={() => setCurrentState('collections')}
          onFinish={handleQuizFinish}
        />
      )}

      {currentState === 'result' && quizResult && selectedCollection && (
        <QuizResultComponent
          result={quizResult}
          collection={selectedCollection}
          onPlayAgain={handlePlayAgain}
          onBackHome={handleBackToHome}
          onMarkAsLearned={handleMarkAsLearned}
        />
      )}

      {currentState === 'settings' && (
        <Settings
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onBack={handleBackToHome}
        />
      )}

      {currentState === 'exam' && (
        <ExamSetup
          collections={collections}
          onBack={handleBackToHome}
          onStartExam={handleStartExam}
        />
      )}

      {currentState === 'exam-active' && examSettings && (
        <ProfessionalExam
          collections={collections}
          examSettings={examSettings}
          onFinish={handleExamFinish}
          onBack={() => setCurrentState('exam')}
        />
      )}

      {currentState === 'exam-result' && examResult && (
        <ExamResult
          score={examResult.score}
          totalQuestions={examResult.total}
          timeSpent={examResult.timeSpent}
          timeLimit={examResult.timeLimit}
          onRetakeExam={handleRetakeExam}
          onBackToHome={handleBackToHome}
        />
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
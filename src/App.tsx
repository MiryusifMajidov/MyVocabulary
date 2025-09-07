import React, { useState, useEffect } from 'react';
import { WordCollection, QuizResult, AppSettings, Word } from './types';
import { saveSettings, loadSettings } from './utils/storage';
import { Home } from './components/Home';
import { MyCollections } from './components/MyCollections';
import { AllCollections } from './components/AllCollections';
import { AllExams } from './components/AllExams';
import { MyExams } from './components/MyExams';
import { Leaderboard } from './components/Leaderboard';
import { Quiz } from './components/Quiz';
import { QuizResult as QuizResultComponent } from './components/QuizResult';
import { Settings } from './components/Settings';
import { AITeacher } from './components/AITeacher';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { ExamSetup } from './components/Exam/ExamSetup';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { QuizModeSelector } from './components/QuizModeSelector';
import { ProfessionalExam } from './components/Exam/ProfessionalExam';
import { ExamResult } from './components/Exam/ExamResult';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ExamSettings, PublicExam, QuizMode } from './types';

type AppState = 'home' | 'collections' | 'all-collections' | 'all-exams' | 'my-exams' | 'leaderboard' | 'quiz' | 'result' | 'settings' | 'ai-teacher' | 'exam' | 'exam-active' | 'exam-result';
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
  const [learnedWords, setLearnedWords] = useState<Word[]>([]);
  const [settings, setAppSettings] = useState<AppSettings>({ autoAdvance: true, quizMode: 'english-to-meaning' });
  const [currentState, setCurrentState] = useState<AppState>('home');
  const [selectedCollection, setSelectedCollection] = useState<WordCollection | null>(null);
  const [showQuizModeSelector, setShowQuizModeSelector] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [examSettings, setExamSettings] = useState<ExamSettings | null>(null);
  const [currentPublicExam, setCurrentPublicExam] = useState<PublicExam | null>(null);
  const [examResult, setExamResult] = useState<{score: number, total: number, timeSpent: number, timeLimit: number} | null>(null);
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    bestScore?: number;
    totalAttempts?: number;
    recentResults?: Array<{
      scorePercentage: number;
      participatedAt: Date | string;
      score: number;
      totalQuestions: number;
    }>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    loadUserCollections();
    setAppSettings(loadSettings());
  }, [currentUser]);

  const loadUserCollections = async () => {
    if (currentUser) {
      const { loadUserCollections: loadUserCollectionsUtil, getLearnedCollections } = await import('./utils/storage');
      const userCollections = await loadUserCollectionsUtil(currentUser.id);
      setCollections(userCollections);
      
      // Load learned words for AI Teacher context
      try {
        const learnedCollections = await getLearnedCollections(currentUser.id);
        const allLearnedWords = learnedCollections.flatMap(lc => 
          lc.embeddedData ? lc.embeddedData.words : []
        );
        setLearnedWords(allLearnedWords);
      } catch (error) {
        console.log('No learned words yet:', error);
        setLearnedWords([]);
      }
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
    setShowQuizModeSelector(true);
  };

  const handleSelectQuizMode = (mode: QuizMode) => {
    setAppSettings(prev => ({ ...prev, quizMode: mode }));
    setShowQuizModeSelector(false);
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
    setCurrentPublicExam(null);
    setExamResult(null);
  };

  const handleStartExam = async (settings: ExamSettings) => {
    // Save exam to database (both public and private exams should be saved)
    let savedPublicExamId = null;
    if (currentUser) {
      try {
        const { savePublicExam } = await import('./utils/storage');
        // Generate a name for private exams if not provided
        const examName = settings.name || `İmtahan ${new Date().toLocaleString('az-AZ')}`;
        const examSettings = {
          ...settings,
          name: examName
        };
        const savedExam = await savePublicExam(currentUser.id, currentUser.username, examSettings, collections);
        savedPublicExamId = savedExam.id;
        console.log('✅ Exam saved to database:', savedExam.id, settings.isPublic ? '(Public)' : '(Private)');
        console.log('🔍 DEBUG: Saved exam details:', {
          savedExamId: savedExam.id,
          embeddedWords: savedExam.embeddedWords?.length || 0,
          collectionsUsed: collections.length
        });
      } catch (error) {
        console.error('❌ Error saving exam:', error);
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
        const { saveExamResult, trackExamParticipation } = await import('./utils/storage');
        await saveExamResult(currentUser.id, score, totalQuestions, timeSpent, examSettings);
        console.log('✅ Exam result saved for user:', currentUser.id);
        
        // Track participation for ANY public exam (both created and taken by user)
        const examIdToTrack = examSettings?.publicExamId || currentPublicExam?.id;
        console.log('🔍 DEBUG: Tracking participation:', {
          publicExamId: examSettings?.publicExamId,
          currentPublicExamId: currentPublicExam?.id,
          examIdToTrack,
          userId: currentUser.id
        });
        
        if (examIdToTrack) {
          await trackExamParticipation(currentUser.id, examIdToTrack, score, totalQuestions, timeSpent);
          console.log('✅ Exam participation tracked for exam:', examIdToTrack);
        } else {
          console.log('⚠️ No exam ID to track participation for!');
        }
      } catch (error) {
        console.error('❌ Error saving exam result:', error);
      }
    }

    // Update public exam stats if this was a public exam attempt
    const examIdToUpdate = examSettings?.publicExamId || currentPublicExam?.id;
    if (examIdToUpdate) {
      try {
        const { updateExamStats } = await import('./utils/storage');
        await updateExamStats(examIdToUpdate, score, totalQuestions);
        console.log('✅ Public exam stats updated:', examIdToUpdate);
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
    // Check if user has previous results for this exam
    if (currentUser) {
      try {
        const { getUserExamResults } = await import('./utils/storage');
        const previousResults = await getUserExamResults(currentUser.id, publicExam.id);
        
        if (previousResults.length > 0) {
          // Show custom confirm dialog
          setConfirmDialog({
            isOpen: true,
            title: 'Bu imtahanda əvvəllər iştirak etmisiniz!',
            message: 'Yenidən cəhd etmək istəyirsiniz?',
            bestScore: previousResults[0].scorePercentage,
            totalAttempts: previousResults.length,
            recentResults: previousResults.slice(0, 3).map(result => ({
              scorePercentage: result.scorePercentage,
              participatedAt: result.participatedAt,
              score: result.score,
              totalQuestions: result.totalQuestions
            })),
            onConfirm: () => {
              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
              // Continue with exam
              continueWithExam(publicExam);
            }
          });
          return;
        }
      } catch (error) {
        console.error('❌ Error checking previous results:', error);
      }
    }

    continueWithExam(publicExam);
  };

  const continueWithExam = async (publicExam: PublicExam) => {

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
    console.log('🔍 DEBUG: Taking public exam:', {
      examId: publicExam.id,
      examName: publicExam.name,
      hasEmbeddedWords: !!publicExam.embeddedWords,
      embeddedWordsCount: publicExam.embeddedWords?.length || 0,
      examSettingsPublicExamId: examSettings.publicExamId
    });
    
    setExamSettings(examSettings);
    setCurrentPublicExam(publicExam); // Store public exam data for ProfessionalExam
    setCurrentState('exam-active');
  };

  return (
    <div className="min-h-screen">
      {currentState === 'home' && (
        <Home
          onNavigateToCollections={() => setCurrentState('collections')}
          onNavigateToAllCollections={() => setCurrentState('all-collections')}
          onNavigateToLeaderboard={() => setCurrentState('leaderboard')}
          onNavigateToExam={handleNavigateToExam}
          onNavigateToAllExams={() => setCurrentState('all-exams')}
          onNavigateToMyExams={() => setCurrentState('my-exams')}
          onNavigateToSettings={() => setCurrentState('settings')}
          onNavigateToAITeacher={() => setCurrentState('ai-teacher')}
          onTakeExam={handleTakeExam}
          onPlayQuiz={handlePlayQuiz}
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
          onBack={() => setCurrentState('my-exams')}
          onTakeExam={handleTakeExam}
        />
      )}

      {currentState === 'my-exams' && (
        <MyExams
          onBack={handleBackToHome}
          onTakeExam={handleTakeExam}
          onNavigateToAllExams={() => setCurrentState('all-exams')}
          onNavigateToCreateExam={handleNavigateToExam}
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
          quizMode={settings.quizMode}
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

      {currentState === 'ai-teacher' && (
        <AITeacher
          onBack={handleBackToHome}
          userCollections={collections}
          learnedWords={learnedWords}
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
          publicExam={currentPublicExam}
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

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        bestScore={confirmDialog.bestScore}
        totalAttempts={confirmDialog.totalAttempts}
        recentResults={confirmDialog.recentResults}
      />

      {/* Quiz Mode Selector */}
      <QuizModeSelector
        isOpen={showQuizModeSelector}
        onClose={() => setShowQuizModeSelector(false)}
        onSelectMode={handleSelectQuizMode}
        currentMode={settings.quizMode}
      />
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
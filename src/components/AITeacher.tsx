import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Bot, 
  User, 
  Lightbulb, 
  BookOpen, 
  MessageCircle,
  Sparkles,
  Volume2,
  Star,
  Brain,
  Zap,
  Mic,
  MicOff
} from 'lucide-react';
import { AIMessage, AIConversation, AITeacherContext, Word, WordCollection } from '../types';
import { geminiService } from '../services/gemini';
import { useAuth } from '../contexts/AuthContext';
import { generateId } from '../utils/storage';

interface AITeacherProps {
  onBack: () => void;
  userCollections: WordCollection[];
  learnedWords: Word[];
}

export const AITeacher: React.FC<AITeacherProps> = ({
  onBack,
  userCollections,
  learnedWords
}) => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<AIConversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userLevel, setUserLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [conversationGoals, setConversationGoals] = useState<string[]>(['general practice']);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    console.log('🎤 Checking speech recognition support...');
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();
        
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US';
        recognitionInstance.maxAlternatives = 1;
        
        recognitionInstance.onstart = () => {
          console.log('🎤 Speech recognition started');
          setIsListening(true);
        };
        
        recognitionInstance.onresult = (event) => {
          console.log('🎤 Speech recognition result:', event);
          if (event.results.length > 0) {
            const transcript = event.results[0][0].transcript;
            console.log('🎤 Transcript:', transcript);
            setMessageInput(prev => prev + (prev ? ' ' : '') + transcript);
          }
          setIsListening(false);
        };
        
        recognitionInstance.onerror = (event) => {
          console.error('🎤 Speech recognition error:', event.error);
          setIsListening(false);
        };
        
        recognitionInstance.onend = () => {
          console.log('🎤 Speech recognition ended');
          setIsListening(false);
        };
        
        setRecognition(recognitionInstance);
        console.log('✅ Speech recognition initialized');
      } catch (error) {
        console.error('❌ Failed to initialize speech recognition:', error);
      }
    } else {
      console.log('❌ Speech recognition not supported in this browser');
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  const createAITeacherContext = (): AITeacherContext => {
    // Get words from recent collections for focus
    const recentWords = userCollections
      .slice(0, 3)
      .flatMap(c => c.words)
      .map(w => w.english || w.word || '')
      .filter(Boolean);

    return {
      userLevel,
      learnedWords: learnedWords.slice(0, 50), // Limit for API efficiency
      recentCollections: userCollections.slice(0, 3),
      focusWords: recentWords.slice(0, 15),
      avoidWords: userLevel === 'beginner' ? ['sophisticated', 'magnificent', 'extraordinary'] : [],
      conversationGoals
    };
  };

  const startNewConversation = async () => {
    const newConversation: AIConversation = {
      id: generateId(),
      userId: currentUser?.id || '',
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      userLevel
    };

    setActiveConversation(newConversation);
    setConversations(prev => [newConversation, ...prev]);

    // Generate welcome message
    const context = createAITeacherContext();
    setIsLoading(true);
    
    try {
      const response = await geminiService.generateResponse([], context, currentUser?.username);
      
      const welcomeMessage: AIMessage = {
        id: generateId(),
        content: response.content,
        sender: 'ai',
        timestamp: new Date(),
        usedWords: response.usedWords,
        suggestedWords: response.suggestedWords,
        difficulty: response.difficulty
      };

      const updatedConversation = {
        ...newConversation,
        messages: [welcomeMessage],
        title: await geminiService.generateConversationTitle([welcomeMessage])
      };

      setActiveConversation(updatedConversation);
      setConversations(prev => prev.map(c => c.id === newConversation.id ? updatedConversation : c));
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !activeConversation || isLoading) return;

    const userMessage: AIMessage = {
      id: generateId(),
      content: messageInput.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    const updatedMessages = [...activeConversation.messages, userMessage];
    const updatedConversation = {
      ...activeConversation,
      messages: updatedMessages,
      updatedAt: new Date()
    };

    setActiveConversation(updatedConversation);
    setConversations(prev => prev.map(c => c.id === activeConversation.id ? updatedConversation : c));
    setMessageInput('');
    setIsLoading(true);

    try {
      const context = createAITeacherContext();
      const response = await geminiService.generateResponse(updatedMessages, context, currentUser?.username);
      
      const aiMessage: AIMessage = {
        id: generateId(),
        content: response.content,
        sender: 'ai',
        timestamp: new Date(),
        usedWords: response.usedWords,
        suggestedWords: response.suggestedWords,
        difficulty: response.difficulty
      };

      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedMessages, aiMessage]
      };

      setActiveConversation(finalConversation);
      setConversations(prev => prev.map(c => c.id === activeConversation.id ? finalConversation : c));
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onstart = () => console.log('🔊 Speech started');
      utterance.onend = () => console.log('🔊 Speech ended');
      utterance.onerror = (e) => console.error('🔊 Speech error:', e);
      
      setTimeout(() => {
        speechSynthesis.speak(utterance);
      }, 100);
    } else {
      console.error('🔊 Speech synthesis not supported');
    }
  };

  const startListening = () => {
    console.log('🎤 Starting listening...', { hasRecognition: !!recognition, isListening });
    if (recognition && !isListening) {
      try {
        recognition.start();
        console.log('🎤 Recognition.start() called');
      } catch (error) {
        console.error('🎤 Error starting recognition:', error);
        setIsListening(false);
      }
    } else {
      console.log('🎤 Cannot start listening:', { hasRecognition: !!recognition, isListening });
    }
  };

  const stopListening = () => {
    console.log('🎤 Stopping listening...', { hasRecognition: !!recognition, isListening });
    if (recognition && isListening) {
      try {
        recognition.stop();
        console.log('🎤 Recognition.stop() called');
      } catch (error) {
        console.error('🎤 Error stopping recognition:', error);
        setIsListening(false);
      }
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return 'text-green-600 bg-green-100';
    if (difficulty <= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getLevelIcon = () => {
    switch (userLevel) {
      case 'beginner': return <Zap className="w-4 h-4 text-green-600" />;
      case 'intermediate': return <Brain className="w-4 h-4 text-blue-600" />;
      case 'advanced': return <Star className="w-4 h-4 text-purple-600" />;
    }
  };

  if (!activeConversation) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 mr-4"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">AI Müəllim</h1>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Level and Goals Setup */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Səviyyənizi seçin</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setUserLevel(level)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    userLevel === level
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    {level === 'beginner' && <Zap className="w-6 h-6 text-green-600" />}
                    {level === 'intermediate' && <Brain className="w-6 h-6 text-blue-600" />}
                    {level === 'advanced' && <Star className="w-6 h-6 text-purple-600" />}
                  </div>
                  <div className="font-medium">
                    {level === 'beginner' && 'Başlayıcı'}
                    {level === 'intermediate' && 'Orta səviyyə'}
                    {level === 'advanced' && 'İrəliləmiş'}
                  </div>
                  <div className="text-sm opacity-70 mt-1">
                    {level === 'beginner' && 'Sadə sözlər və cümlələr'}
                    {level === 'intermediate' && 'Orta mürəkkəblik'}
                    {level === 'advanced' && 'Mürəkkəb mətnlər'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <h4 className="font-semibold text-blue-800">Öyrəndiyiniz sözlər</h4>
              </div>
              <p className="text-2xl font-bold text-blue-900">{learnedWords.length}</p>
              <p className="text-sm text-blue-600">
                {currentUser?.username}, AI müəllim bunları xatırlayacaq
              </p>
              {learnedWords.length > 0 && (
                <div className="mt-2 text-xs text-blue-500">
                  Son öyrənilənlər: {learnedWords.slice(0, 3).map(w => w.english || w.word).join(', ')}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Lightbulb className="w-6 h-6 text-green-600" />
                <h4 className="font-semibold text-green-800">Kolleksiyalar</h4>
              </div>
              <p className="text-2xl font-bold text-green-900">{userCollections.length}</p>
              <p className="text-sm text-green-600">
                {userCollections.reduce((sum, c) => sum + c.words.length, 0)} söz toplamı
              </p>
              {userCollections.length > 0 && (
                <div className="mt-2 text-xs text-green-500">
                  Son kolleksiya: {userCollections[0]?.name}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-2">
                <MessageCircle className="w-6 h-6 text-purple-600" />
                <h4 className="font-semibold text-purple-800">Söhbətlər</h4>
              </div>
              <p className="text-2xl font-bold text-purple-900">{conversations.length}</p>
              <p className="text-sm text-purple-600">
                AI müəllimlə təcrübə
              </p>
              <div className="mt-2 text-xs text-purple-500">
                Səviyyə: <span className="capitalize font-medium">{userLevel}</span>
              </div>
            </div>
          </div>

          {/* Previous Conversations */}
          {conversations.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Keçmiş Söhbətlər</h3>
              <div className="space-y-3">
                {conversations.slice(0, 3).map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversation(conv)}
                    className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-800">{conv.title}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        {getLevelIcon()}
                        <span>{conv.messages.length} mesaj</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {conv.updatedAt.toLocaleDateString('az-AZ')}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Start New Conversation */}
          <div className="text-center">
            <button
              onClick={startNewConversation}
              className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-3 mx-auto"
            >
              <Sparkles className="w-6 h-6" />
              <span>Yeni Söhbət Başla</span>
            </button>
            <p className="text-gray-600 mt-3">
              AI müəlliminizla ingilis dili məşq etməyə başlayın!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        {/* Header - Mobile Optimized */}
        <div className="bg-white shadow-sm border-b p-3 md:p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveConversation(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex-shrink-0">
              <Bot className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            
            <div className="min-w-0 flex-1">
              <h1 className="text-sm md:text-lg font-bold text-gray-800 truncate">
                AI Müəllim
              </h1>
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                {getLevelIcon()}
                <span className="capitalize">{userLevel}</span>
                <span>•</span>
                <span>{activeConversation.messages.length} mesaj</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-2 md:p-4">
          <div className="space-y-3">
            {activeConversation.messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] sm:max-w-[70%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-start gap-2 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`p-1.5 rounded-full flex-shrink-0 ${message.sender === 'user' ? 'bg-blue-500' : 'bg-gradient-to-br from-purple-500 to-blue-600'}`}>
                      {message.sender === 'user' ? (
                        <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      ) : (
                        <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={`rounded-2xl p-2 sm:p-3 ${
                      message.sender === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                    <p className="whitespace-pre-wrap text-sm md:text-base">{message.content}</p>
                    
                      {/* AI Message Metadata */}
                      {message.sender === 'ai' && (
                        <div className="mt-2 space-y-2">
                          {/* Used Words - Mobile Optimized */}
                          {message.usedWords && message.usedWords.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1">
                                <BookOpen className="w-3 h-3 text-purple-600 flex-shrink-0" />
                                <span className="text-xs text-gray-600">Öyrəndiyiniz sözlər:</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {message.usedWords.slice(0, 3).map((word, idx) => (
                                  <span key={idx} className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                    {word}
                                  </span>
                                ))}
                                {message.usedWords.length > 3 && (
                                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                                    +{message.usedWords.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Suggested Words - Mobile Optimized */}
                          {message.suggestedWords && message.suggestedWords.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1">
                                <Lightbulb className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                                <span className="text-xs text-gray-600">Yeni sözlər:</span>
                              </div>
                              <div className="space-y-1">
                                {message.suggestedWords.slice(0, 2).map((word, idx) => (
                                  <div key={idx} className="text-xs bg-yellow-50 border border-yellow-200 rounded p-1.5">
                                    <span className="font-medium text-yellow-800">{word.english}</span>
                                    <span className="text-yellow-600"> - {word.meaning}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions - Mobile Optimized */}
                          <div className="flex items-center justify-between pt-1">
                            {message.difficulty && (
                              <span className={`px-1.5 py-0.5 rounded-full text-xs ${getDifficultyColor(message.difficulty)}`}>
                                Çətinlik: {message.difficulty}/10
                              </span>
                            )}
                            <button
                              onClick={() => speakText(message.content)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors duration-200 flex-shrink-0"
                              title="Dinlə"
                            >
                              <Volume2 className="w-3 h-3 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex-shrink-0">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl p-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="bg-white border-t p-2 md:p-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isListening ? "Dinləyirəm..." : "Mesajınızı yazın..."}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 resize-none text-sm"
                rows={1}
                style={{ minHeight: '40px', maxHeight: '100px' }}
                disabled={isLoading}
              />
            </div>
            
            {/* Voice Input Button */}
            {recognition && (
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
                className={`p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
                title={isListening ? "Dinləməyi dayandır" : "Səsli mesaj"}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            )}
            
            <button
              onClick={sendMessage}
              disabled={!messageInput.trim() || isLoading}
              className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
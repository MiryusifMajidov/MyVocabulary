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
  Zap
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      const response = await geminiService.generateResponse([], context);
      
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
      const response = await geminiService.generateResponse(updatedMessages, context);
      
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
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
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
              <p className="text-sm text-blue-600">AI müəllim bunları xatırlayacaq</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Lightbulb className="w-6 h-6 text-green-600" />
                <h4 className="font-semibold text-green-800">Kolleksiyalar</h4>
              </div>
              <p className="text-2xl font-bold text-green-900">{userCollections.length}</p>
              <p className="text-sm text-green-600">Məşq üçün istifadə olunacaq</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-2">
                <MessageCircle className="w-6 h-6 text-purple-600" />
                <h4 className="font-semibold text-purple-800">Söhbətlər</h4>
              </div>
              <p className="text-2xl font-bold text-purple-900">{conversations.length}</p>
              <p className="text-sm text-purple-600">Keçmiş söhbətləriniz</p>
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
    <div className="max-w-4xl mx-auto p-6 h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-white rounded-xl shadow-lg p-4">
        <div className="flex items-center">
          <button
            onClick={() => setActiveConversation(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 mr-4"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{activeConversation.title}</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {getLevelIcon()}
                <span className="capitalize">{userLevel}</span>
                <span>•</span>
                <span>{activeConversation.messages.length} mesaj</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 bg-white rounded-xl shadow-lg p-6 overflow-y-auto mb-4">
        <div className="space-y-4">
          {activeConversation.messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3xl ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`flex items-start space-x-3 ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`p-2 rounded-full ${message.sender === 'user' ? 'bg-blue-500' : 'bg-gradient-to-br from-purple-500 to-blue-600'}`}>
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`rounded-2xl p-4 ${
                    message.sender === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    
                    {/* AI Message Metadata */}
                    {message.sender === 'ai' && (
                      <div className="mt-3 space-y-2">
                        {/* Used Words */}
                        {message.usedWords && message.usedWords.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <BookOpen className="w-4 h-4 text-purple-600" />
                            <span className="text-sm text-gray-600">Öyrəndiyiniz sözlər:</span>
                            <div className="flex flex-wrap gap-1">
                              {message.usedWords.map((word, idx) => (
                                <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                  {word}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Suggested Words */}
                        {message.suggestedWords && message.suggestedWords.length > 0 && (
                          <div className="flex items-start space-x-2">
                            <Lightbulb className="w-4 h-4 text-yellow-500 mt-1" />
                            <div>
                              <span className="text-sm text-gray-600">Yeni sözlər:</span>
                              <div className="mt-1 space-y-1">
                                {message.suggestedWords.map((word, idx) => (
                                  <div key={idx} className="text-sm bg-yellow-50 border border-yellow-200 rounded p-2">
                                    <span className="font-medium text-yellow-800">{word.english}</span>
                                    <span className="text-yellow-600"> - {word.meaning}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Difficulty & Actions */}
                        <div className="flex items-center justify-between">
                          {message.difficulty && (
                            <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(message.difficulty)}`}>
                              Çətinlik: {message.difficulty}/10
                            </span>
                          )}
                          <button
                            onClick={() => speakText(message.content)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors duration-200"
                            title="Dinlə"
                          >
                            <Volume2 className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl p-4">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Mesajınızı yazın... (Enter - göndər, Shift+Enter - yeni sətr)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 resize-none"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!messageInput.trim() || isLoading}
            className="p-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
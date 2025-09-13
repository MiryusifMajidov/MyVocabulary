import React, { useState, useEffect } from 'react';
import { WordCollection, QuizQuestion, QuizResult, QuizMode } from '../types';
import { generateQuizQuestions } from '../utils/quiz';
import { ArrowLeft, CheckCircle, XCircle, ArrowRight, Volume2, VolumeX, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface QuizProps {
  collection: WordCollection;
  autoAdvance: boolean;
  quizMode: QuizMode;
  onBack: () => void;
  onFinish: (result: QuizResult) => void;
}

export const Quiz: React.FC<QuizProps> = ({
                                            collection,
                                            autoAdvance,
                                            quizMode,
                                            onBack,
                                            onFinish
                                          }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [, setShowResult] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [canAdvance, setCanAdvance] = useState(false);
  const [clickedOption, setClickedOption] = useState<number | null>(null);
  const [speakingOption, setSpeakingOption] = useState<number | null>(null);
  const [generatingExample, setGeneratingExample] = useState<{[key: string]: boolean}>({});
  const [generatedExamples, setGeneratedExamples] = useState<{[key: string]: string}>({});
  const [speakingExample, setSpeakingExample] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    setQuestions(generateQuizQuestions(collection.words, quizMode));
  }, [collection, quizMode]);

  // Speech Synthesis setup
  useEffect(() => {
    // Load voices when component mounts
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        console.log('Available voices:', voices.length);
      };

      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const currentQuestion = questions[currentQuestionIndex];

  const advanceToNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowResult(false);
      setCanAdvance(false);
      setClickedOption(null);
      setSpeakingOption(null);
    } else {
      const result: QuizResult = {
        correct: correctAnswers,
        total: questions.length,
        percentage: Math.round((correctAnswers / questions.length) * 100)
      };
      onFinish(result);
    }
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (selectedOption !== null) return;

    setSelectedOption(optionIndex);
    setCanAdvance(true);

    if (optionIndex === currentQuestion.correctIndex) {
      setCorrectAnswers(prev => prev + 1);
    }

    if (autoAdvance) {
      setTimeout(() => {
        advanceToNext();
      }, 1500);
    }
  };

  const getOptionStyle = (optionIndex: number) => {
    if (selectedOption === null) {
      return 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-800';
    }

    if (optionIndex === currentQuestion.correctIndex) {
      return 'bg-green-500 border-green-500 text-white';
    }

    if (optionIndex === selectedOption) {
      return 'bg-red-500 border-red-500 text-white';
    }

    return 'bg-gray-100 border-gray-200 text-gray-500';
  };

  const handleOptionClick = (optionIndex: number) => {
    if (selectedOption !== null) {
      // If answer was already selected, and this is manual mode, show translation
      if (!autoAdvance) {
        setClickedOption(clickedOption === optionIndex ? null : optionIndex);
      }
      return;
    }

    // First time selecting an option
    handleOptionSelect(optionIndex);
  };

  const getTranslationForOption = (option: string) => {
    // Find the word that matches this option
    const word = collection.words.find(w => {
      if (currentQuestion.mode === 'english-to-meaning') {
        return w.meaning === option;
      } else {
        return (w.word || w.english) === option;
      }
    });

    if (!word) return null;

    // Return the opposite translation
    if (currentQuestion.mode === 'english-to-meaning') {
      return word.word || word.english;
    } else {
      return word.meaning;
    }
  };

  const getEnglishTextForOption = (option: string) => {
    const word = collection.words.find(w => {
      const meaningMatch = w.meaning === option;
      const wordMatch = (w.word || w.english) === option;
      return meaningMatch || wordMatch;
    });

    if (!word) {
      return null;
    }

    // Həmişə ingilis mətnini qaytar
    return word.word || word.english;
  };

  const speakText = (text: string, optionIndex: number) => {
    if (!text) return;

    if (!('speechSynthesis' in window)) {
      alert('Bu brauzer səsləndirməni dəstəkləmir');
      return;
    }

    // Stop any current speech
    speechSynthesis.cancel();
    setSpeakingOption(optionIndex);

    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Configure speech settings
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Find an English voice
      const voices = speechSynthesis.getVoices();
      const englishVoice = voices.find(voice =>
          voice.lang.startsWith('en') || voice.name.toLowerCase().includes('english')
      );

      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onend = () => {
        setSpeakingOption(null);
      };

      utterance.onerror = () => {
        setSpeakingOption(null);
        alert('Səsləndirmə xətası baş verdi');
      };

      try {
        speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Speech synthesis failed:', error);
        setSpeakingOption(null);
      }
    }, 100);
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setSpeakingOption(null);
    setSpeakingExample({});
  };

  // Sadə nümunə cümlə yaradıcısı
  const generateExampleSentence = async (word: string, optionKey: string) => {
    setGeneratingExample(prev => ({...prev, [optionKey]: true}));

    // Müxtəlif nümunə cümlə şablonları
    const templates = [
      `I use the word "${word}" in conversations.`,
      `The meaning of "${word}" is important.`,
      `Can you explain "${word}" to me?`,
      `I learned "${word}" today.`,
      `"${word}" is a useful English word.`,
      `Let me practice with "${word}".`,
      `I often hear "${word}" in movies.`,
      `The word "${word}" appears in many texts.`,
      `Students should know "${word}".`,
      `"${word}" helps express ideas clearly.`
    ];

    // Rastgele nümunə seç
    setTimeout(() => {
      const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
      setGeneratedExamples(prev => ({
        ...prev,
        [optionKey]: randomTemplate
      }));
      setGeneratingExample(prev => ({...prev, [optionKey]: false}));
    }, 1000); // 1 saniyə gözləmə (AI simulasiyası)
  };

  const speakExample = (text: string, optionKey: string) => {
    if (!text) return;

    if (!('speechSynthesis' in window)) {
      alert('Bu brauzer səsləndirməni dəstəkləmir');
      return;
    }

    // Stop any current speech
    speechSynthesis.cancel();
    setSpeakingExample(prev => ({...prev, [optionKey]: true}));

    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.lang = 'en-US';
      utterance.rate = 0.7;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const voices = speechSynthesis.getVoices();
      const englishVoice = voices.find(voice =>
          voice.lang.startsWith('en') || voice.name.toLowerCase().includes('english')
      );

      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onend = () => {
        setSpeakingExample(prev => ({...prev, [optionKey]: false}));
      };

      utterance.onerror = () => {
        setSpeakingExample(prev => ({...prev, [optionKey]: false}));
        alert('Səsləndirmə xətası baş verdi');
      };

      try {
        speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Speech synthesis failed:', error);
        setSpeakingExample(prev => ({...prev, [optionKey]: false}));
      }
    }, 100);
  };

  if (!currentQuestion) {
    return <div>Yüklənir...</div>;
  }

  return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Geri</span>
          </button>
          <div className="text-sm text-gray-600">
            {currentQuestionIndex + 1} / {questions.length}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              {currentQuestion.mode === 'english-to-meaning'
                  ? 'Bu sözün mənası nədir?'
                  : 'Bu mənanın ingilis dilindəki qarşılığı nədir?'
              }
            </h2>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl inline-block">
            <span className="text-3xl font-bold">
              {currentQuestion.mode === 'english-to-meaning'
                  ? (currentQuestion.word.word || currentQuestion.word.english)
                  : currentQuestion.word.meaning
              }
            </span>
            </div>
          </div>

          <div className="grid gap-4">
            {currentQuestion.options.map((option, index) => {
              const translation = selectedOption !== null && !autoAdvance ? getTranslationForOption(option) : null;
              const englishText = getEnglishTextForOption(option);
              const showTranslation = clickedOption === index && translation;
              const isCurrentlySpeaking = speakingOption === index;
              const optionKey = `${currentQuestionIndex}-${index}`;
              const isGeneratingExample = generatingExample[optionKey] || false;
              const isSpeakingExample = speakingExample[optionKey] || false;
              const generatedExample = generatedExamples[optionKey];

              return (
                  <div key={index} className="relative">
                    <div className="relative">
                      <button
                          onClick={() => handleOptionClick(index)}
                          disabled={false}
                          className={`w-full p-4 rounded-xl text-left font-medium transition-all duration-300 transform hover:scale-102 ${getOptionStyle(index)} ${selectedOption !== null && !autoAdvance ? 'cursor-pointer' : selectedOption !== null ? 'cursor-default' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex-1">{option}</span>
                          <div className="flex items-center space-x-2">
                            {/* Correct/Incorrect indicators */}
                            {selectedOption !== null && (
                                <div>
                                  {index === currentQuestion.correctIndex ? (
                                      <CheckCircle className="w-5 h-5 text-white" />
                                  ) : index === selectedOption ? (
                                      <XCircle className="w-5 h-5 text-white" />
                                  ) : null}
                                </div>
                            )}

                            {/* Translation toggle indicator - sadəcə icon */}
                            {selectedOption !== null && !autoAdvance && translation && (
                                <div className="text-sm opacity-70">
                                  {showTranslation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Translation panel */}
                    {showTranslation && (
                        <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                          <div className="space-y-3">
                            {/* Translation and original example */}
                            <div>
                              <div className="font-medium text-base">Tərcümə: {translation}</div>
                              {(() => {
                                const word = collection.words.find(w => {
                                  if (currentQuestion.mode === 'english-to-meaning') {
                                    return w.meaning === option;
                                  } else {
                                    return (w.word || w.english) === option;
                                  }
                                });
                                return word?.exampleSentence && (
                                    <div className="mt-2 p-2 bg-blue-100 rounded text-blue-700">
                                      <div className="font-medium text-xs uppercase tracking-wide text-blue-500 mb-1">Mövcud nümunə:</div>
                                      <div className="italic">"{word.exampleSentence}"</div>
                                    </div>
                                );
                              })()}
                            </div>

                            {/* Speech button for the word */}
                            <div className="flex items-center space-x-2">
                              <button
                                  onClick={() => {
                                    if (isCurrentlySpeaking) {
                                      stopSpeaking();
                                    } else {
                                      speakText(englishText, index);
                                    }
                                  }}
                                  className={`px-3 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 ${
                                      isCurrentlySpeaking
                                          ? 'bg-red-500 hover:bg-red-600 text-white'
                                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                                  }`}
                                  title={isCurrentlySpeaking ? 'Dayandır' : `"${englishText}" sözünü dinlə`}
                              >
                                {isCurrentlySpeaking ? (
                                    <VolumeX className="w-4 h-4" />
                                ) : (
                                    <Volume2 className="w-4 h-4" />
                                )}
                                <span className="text-sm font-medium">
                                  {isCurrentlySpeaking ? 'Dayandır' : 'Sözü dinlə'}
                                </span>
                              </button>
                            </div>

                            {/* AI Generated Example Section */}
                            <div className="border-t border-blue-200 pt-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-xs uppercase tracking-wide text-blue-500">
                                  Nümunə Cümləsi:
                                </div>
                                <button
                                    onClick={() => {
                                      if (generatedExample) {
                                        // Regenerate
                                        setGeneratedExamples(prev => {
                                          const newState = {...prev};
                                          delete newState[optionKey];
                                          return newState;
                                        });
                                      }
                                      generateExampleSentence(englishText, optionKey);
                                    }}
                                    disabled={isGeneratingExample}
                                    className={`p-1.5 rounded-full transition-colors duration-200 ${
                                        isGeneratingExample
                                            ? 'bg-gray-300 cursor-not-allowed'
                                            : 'bg-green-500 hover:bg-green-600 text-white'
                                    }`}
                                    title={generatedExample ? 'Yeni nümunə yarat' : 'Nümunə cümləsi yarat'}
                                >
                                  <RefreshCw className={`w-3 h-3 ${isGeneratingExample ? 'animate-spin' : ''}`} />
                                </button>
                              </div>

                              {generatedExample ? (
                                  <div className="bg-green-50 border border-green-200 rounded p-3 space-y-2">
                                    <div className="text-green-800 italic">"{generatedExample}"</div>
                                    <button
                                        onClick={() => {
                                          if (isSpeakingExample) {
                                            stopSpeaking();
                                          } else {
                                            speakExample(generatedExample, optionKey);
                                          }
                                        }}
                                        className={`px-3 py-1.5 rounded transition-colors duration-200 flex items-center space-x-2 text-sm ${
                                            isSpeakingExample
                                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                                : 'bg-green-500 hover:bg-green-600 text-white'
                                        }`}
                                    >
                                      {isSpeakingExample ? (
                                          <VolumeX className="w-3 h-3" />
                                      ) : (
                                          <Volume2 className="w-3 h-3" />
                                      )}
                                      <span>
                                        {isSpeakingExample ? 'Dayandır' : 'Cümləni dinlə'}
                                      </span>
                                    </button>
                                  </div>
                              ) : isGeneratingExample ? (
                                  <div className="bg-gray-50 border border-gray-200 rounded p-3 text-gray-600 text-center">
                                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                                    Nümunə yaradılır...
                                  </div>
                              ) : (
                                  <div className="bg-gray-50 border border-gray-200 rounded p-3 text-gray-500 text-center text-sm">
                                    Nümunə cümləsi yaratmaq üçün yuxarıdakı düyməyə basın
                                  </div>
                              )}
                            </div>
                          </div>
                        </div>
                    )}
                  </div>
              );
            })}
          </div>

          {!autoAdvance && canAdvance && (
              <div className="mt-6 flex justify-center">
                <button
                    onClick={advanceToNext}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
              <span>
                {currentQuestionIndex < questions.length - 1 ? 'Növbəti sual' : 'Nəticəni gör'}
              </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
          )}

          <div className="mt-8">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
  );
};
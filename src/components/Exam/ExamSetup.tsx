import React, { useState } from 'react';
import { ArrowLeft, GraduationCap, CheckCircle, Settings, Clock, Users, FileText, BookOpen } from 'lucide-react';
import { WordCollection, ExamSettings } from '../../types';

interface ExamSetupProps {
  collections: WordCollection[];
  onBack: () => void;
  onStartExam: (settings: ExamSettings) => void;
}

export const ExamSetup: React.FC<ExamSetupProps> = ({
  collections,
  onBack,
  onStartExam
}) => {
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [variantCount, setVariantCount] = useState<number>(4);
  const [wordCount, setWordCount] = useState<number>(20);
  const [timeLimit, setTimeLimit] = useState<number>(10);
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [examName, setExamName] = useState<string>('');
  const [examDescription, setExamDescription] = useState<string>('');

  const handleCollectionToggle = (collectionId: string) => {
    setSelectedCollections(prev => 
      prev.includes(collectionId)
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCollections.length === collections.length) {
      setSelectedCollections([]);
    } else {
      setSelectedCollections(collections.map(c => c.id));
    }
  };

  const getTotalWords = () => {
    return collections
      .filter(c => selectedCollections.includes(c.id))
      .reduce((total, collection) => total + (collection.words?.length || 0), 0);
  };

  const handleStartExam = () => {
    if (selectedCollections.length === 0) return;
    
    // Auto-generate name if not provided for public exams
    const finalName = isPublic && !examName.trim() 
      ? `İmtahan ${new Date().toLocaleString('az-AZ')}` 
      : examName;
    
    const examSettings: ExamSettings = {
      selectedCollections,
      variantCount,
      wordCount,
      timeLimit,
      isPublic,
      name: isPublic ? finalName : undefined,
      description: isPublic ? examDescription : undefined
    };
    
    onStartExam(examSettings);
  };

  const totalAvailableWords = getTotalWords();
  const maxWordCount = Math.min(totalAvailableWords, 100);

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
          <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Peşəkar İmtahan Ayarları</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Collection Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Kolleksiyalar</span>
            </h2>
            <button
              onClick={handleSelectAll}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {selectedCollections.length === collections.length ? 'Hamısını ləğv et' : 'Hamısını seç'}
            </button>
          </div>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {collections.map((collection) => {
              const isSelected = selectedCollections.includes(collection.id);
              return (
                <div
                  key={collection.id}
                  className={`flex items-center space-x-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleCollectionToggle(collection.id)}
                >
                  {/* Custom Checkbox */}
                  <div className="flex-shrink-0">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      isSelected 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-300 bg-white'
                    }`}>
                      {isSelected && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                  
                  {/* Collection Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate ${
                      isSelected ? 'text-blue-800' : 'text-gray-800'
                    }`}>
                      {collection.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <BookOpen className="w-3 h-3" />
                      <span>{collection.words?.length || 0} söz</span>
                      {collection.visibility === 'public' && (
                        <span className="text-green-600 text-xs">• Public</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Selection Status */}
                  {isSelected && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">{selectedCollections.length}</span> kolleksiya seçildi
              {totalAvailableWords > 0 && (
                <span> • Cəmi <span className="font-medium">{totalAvailableWords}</span> söz</span>
              )}
            </p>
          </div>
        </div>

        {/* Exam Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <Settings className="w-5 h-5 text-purple-600" />
            <span>İmtahan Ayarları</span>
          </h2>
          
          <div className="space-y-6">
            {/* Variant Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variant sayı
              </label>
              <select
                value={variantCount}
                onChange={(e) => setVariantCount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={3}>3 variant</option>
                <option value={4}>4 variant</option>
                <option value={5}>5 variant</option>
              </select>
            </div>

            {/* Word Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sual sayı
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="5"
                  max={maxWordCount}
                  step="1"
                  value={Math.min(wordCount, maxWordCount)}
                  onChange={(e) => setWordCount(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>5</span>
                  <span className="font-medium text-blue-600">{Math.min(wordCount, maxWordCount)}</span>
                  <span>{maxWordCount}</span>
                </div>
              </div>
              {totalAvailableWords < wordCount && totalAvailableWords > 0 && (
                <p className="text-sm text-orange-600 mt-1">
                  Maksimum {totalAvailableWords} sual edə bilərsiniz
                </p>
              )}
            </div>

            {/* Time Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vaxt limiti (dəqiqə)
              </label>
              <select
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5}>5 dəqiqə</option>
                <option value={10}>10 dəqiqə</option>
                <option value={15}>15 dəqiqə</option>
                <option value={20}>20 dəqiqə</option>
                <option value={30}>30 dəqiqə</option>
                <option value={45}>45 dəqiqə</option>
                <option value={60}>1 saat</option>
              </select>
            </div>

            {/* Public Exam Toggle */}
            <div className="border-t border-gray-200 pt-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <div>
                  <div className="font-medium text-gray-800">Public İmtahan</div>
                  <div className="text-sm text-gray-600">İmtahanınızı digər istifadəçilər də görsün</div>
                </div>
              </label>

              {/* Public Exam Details */}
              {isPublic && (
                <div className="mt-4 space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-1">
                      İmtahan Adı *
                    </label>
                    <input
                      type="text"
                      value={examName}
                      onChange={(e) => setExamName(e.target.value)}
                      placeholder="Məsələn: İngilis dili - Orta səviyyə"
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-1">
                      Təsvir (seçimlik)
                    </label>
                    <textarea
                      value={examDescription}
                      onChange={(e) => setExamDescription(e.target.value)}
                      placeholder="İmtahan haqqında qısa məlumat..."
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Exam Summary */}
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-800 mb-2 flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>İmtahan Xülasəsi</span>
            </h3>
            <div className="space-y-1 text-sm text-green-700">
              <p>• {selectedCollections.length} kolleksiya</p>
              <p>• {Math.min(wordCount, maxWordCount)} sual</p>
              <p>• {variantCount} variant</p>
              <p className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{timeLimit} dəqiqə</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={handleStartExam}
          disabled={selectedCollections.length === 0 || (isPublic && !examName.trim())}
          className="flex items-center space-x-3 bg-gradient-to-r from-green-500 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
        >
          <GraduationCap className="w-5 h-5" />
          <span>İmtahana Başla</span>
        </button>
      </div>

      {(selectedCollections.length === 0 || (isPublic && !examName.trim())) && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            {selectedCollections.length === 0 
              ? 'İmtahana başlamaq üçün ən azı bir kolleksiya seçin'
              : 'Public imtahan üçün ad məcburidir'
            }
          </p>
        </div>
      )}
    </div>
  );
};
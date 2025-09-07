import React, { useState } from 'react';
import { Plus, ArrowLeft, Eye, EyeOff, Hash } from 'lucide-react';
import { WordCollection, Word } from '../types';
import { generateId } from '../utils/storage';

interface CreateCollectionProps {
  onSave: (collection: Omit<WordCollection, 'id' | 'userId' | 'username' | 'rating' | 'usageCount'>) => Promise<void>;
  onBack: () => void;
}

export const CreateCollection: React.FC<CreateCollectionProps> = ({
  onSave,
  onBack
}) => {
  const [collectionName, setCollectionName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [words, setWords] = useState<Word[]>([]);
  const [currentEnglish, setCurrentEnglish] = useState('');
  const [currentMeaning, setCurrentMeaning] = useState('');
  const [currentExampleSentence, setCurrentExampleSentence] = useState('');

  const addWord = () => {
    if (currentEnglish.trim() && currentMeaning.trim() && words.length < 30) {
      const newWord: Word = {
        id: generateId(),
        english: currentEnglish.trim(),
        meaning: currentMeaning.trim(),
        exampleSentence: currentExampleSentence.trim() || undefined
      };
      setWords([...words, newWord]);
      setCurrentEnglish('');
      setCurrentMeaning('');
      setCurrentExampleSentence('');
    }
  };

  const removeWord = (id: string) => {
    setWords(words.filter(w => w.id !== id));
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim()) && tags.length < 5) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const [saving, setSaving] = useState(false);

  const saveCollection = async () => {
    if (collectionName.trim() && words.length >= 6 && !saving) {
      setSaving(true);
      try {
        const newCollection = {
          name: collectionName.trim(),
          description: description.trim() || undefined,
          words,
          visibility,
          tags: tags.length > 0 ? tags : undefined,
          createdAt: new Date()
        };
        await onSave(newCollection);
      } catch (error) {
        console.error('Collection save error:', error);
        alert('Kolleksiya saxlanmadı. Yenidən cəhd edin.');
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 mr-4"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Yeni Kolleksiya Yarat</h1>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kolleksiya Adı
            </label>
            <input
              type="text"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="Məsələn: Günlük sözlər"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Təsvir (isteğe bağlı)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bu kolleksiyanın təsviri..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 h-20 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Görünmə Ayarı
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${
                  visibility === 'private'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                }`}
              >
                <EyeOff className="w-4 h-4" />
                <span className="text-sm font-medium">Şəxsi</span>
              </button>
              
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${
                  visibility === 'public'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">Ümumi</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {visibility === 'private' ? 'Yalnız sizin üçün görünəcək' : 'Bütün istifadəçilər görəcək'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Etiketlər (isteğe bağlı)
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="etiket"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button
                type="button"
                onClick={addTag}
                disabled={!currentTag.trim() || tags.includes(currentTag.trim()) || tags.length >= 5}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
              >
                <Hash className="w-4 h-4" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <Plus className="w-3 h-3 rotate-45" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {tags.length}/5 etiket
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İngilis dili sözü
            </label>
            <input
              type="text"
              value={currentEnglish}
              onChange={(e) => setCurrentEnglish(e.target.value)}
              placeholder="Hello"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Azərbaycan dilində mənası
            </label>
            <input
              type="text"
              value={currentMeaning}
              onChange={(e) => setCurrentMeaning(e.target.value)}
              placeholder="Salam"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nümunə cümlə (isteğe bağlı)
          </label>
          <input
            type="text"
            value={currentExampleSentence}
            onChange={(e) => setCurrentExampleSentence(e.target.value)}
            placeholder="Hello, how are you?"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
          />
        </div>

        <button
          onClick={addWord}
          disabled={!currentEnglish.trim() || !currentMeaning.trim() || words.length >= 30}
          className="w-full md:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Söz əlavə et</span>
        </button>
      </div>

      {words.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Əlavə edilmiş sözlər ({words.length}/30)
            </h2>
            <div className="text-sm text-gray-600">
              {words.length >= 6 ? (
                <span className="text-green-600 font-medium">✓ Quiz üçün hazır</span>
              ) : (
                <span className="text-orange-600">Daha {6 - words.length} söz lazım</span>
              )}
            </div>
          </div>

          <div className="grid gap-3">
            {words.map((word) => (
              <div
                key={word.id}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">{word.english}</span>
                    <span className="text-gray-600 mx-3">→</span>
                    <span className="text-gray-700">{word.meaning}</span>
                  </div>
                  <button
                    onClick={() => removeWord(word.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4 transform rotate-45" />
                  </button>
                </div>
                {word.exampleSentence && (
                  <div className="text-sm text-gray-600 italic pl-2 border-l-2 border-blue-200">
                    "{word.exampleSentence}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={saveCollection}
          disabled={!collectionName.trim() || words.length < 6 || saving}
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {saving ? 'Saxlanılır...' : 'Kolleksiyanı Saxla'}
        </button>
      </div>
    </div>
  );
};
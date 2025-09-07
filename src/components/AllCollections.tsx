import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, BookOpen, Play, Bookmark, BookmarkCheck, Star, Users, TrendingUp, Filter } from 'lucide-react';
import { WordCollection } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { loadPublicCollections, saveCollectionForUser, removeSavedCollection, isCollectionSaved, updateCollectionRating } from '../utils/storage';

interface AllCollectionsProps {
  onBack: () => void;
  onPlayQuiz: (collection: WordCollection) => void;
}

export const AllCollections: React.FC<AllCollectionsProps> = ({
  onBack,
  onPlayQuiz
}) => {
  const { currentUser } = useAuth();
  const [collections, setCollections] = useState<WordCollection[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<WordCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'recent' | 'usage'>('rating');
  const [savedCollectionIds, setSavedCollectionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAllCollections();
  }, []);

  useEffect(() => {
    filterAndSortCollections();
  }, [collections, searchTerm, sortBy]);

  const loadAllCollections = async () => {
    try {
      setLoading(true);
      const publicCollections = await loadPublicCollections();
      setCollections(publicCollections);
      
      // Load saved status for each collection
      if (currentUser) {
        const savedStatuses = await Promise.all(
          publicCollections.map(async (collection) => {
            const isSaved = await isCollectionSaved(currentUser.id, collection.id);
            return { id: collection.id, isSaved };
          })
        );
        
        const savedIds = new Set(
          savedStatuses.filter(status => status.isSaved).map(status => status.id)
        );
        setSavedCollectionIds(savedIds);
      }
    } catch (error) {
      console.error('Error loading public collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCollections = () => {
    let filtered = collections;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(collection =>
        collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collection.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collection.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort collections
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          if (b.rating !== a.rating) return b.rating - a.rating;
          return b.usageCount - a.usageCount;
        case 'recent':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'usage':
          if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount;
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

    setFilteredCollections(filtered);
  };

  const handleSaveCollection = async (collectionId: string) => {
    if (!currentUser) return;

    try {
      const isSaved = savedCollectionIds.has(collectionId);
      
      if (isSaved) {
        await removeSavedCollection(currentUser.id, collectionId);
        setSavedCollectionIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(collectionId);
          return newSet;
        });
      } else {
        await saveCollectionForUser(currentUser.id, collectionId);
        setSavedCollectionIds(prev => new Set([...prev, collectionId]));
      }
    } catch (error) {
      console.error('Error saving/removing collection:', error);
    }
  };

  const handlePlayQuiz = async (collection: WordCollection) => {
    // Remove rating update due to permissions - only owner can update their collections
    // Usage tracking will be handled differently in the future
    onPlayQuiz(collection);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <span className="text-gray-600">Public kolleksiyalar yüklənir...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          {/* Top Row - Title and Back Button */}
          <div className="flex items-center justify-between mb-4 sm:mb-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Bütün Kolleksiyalar</h1>
              </div>
            </div>
          </div>
          
          {/* Bottom Row - Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Kolleksiya və ya müəllif axtar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rating' | 'recent' | 'usage')}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="rating">Reytinqə görə</option>
              <option value="recent">Yenilərə görə</option>
              <option value="usage">İstifadəyə görə</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-800">{filteredCollections.length}</div>
                <div className="text-gray-600">Mövcud Kolleksiya</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-800">
                  {new Set(filteredCollections.map(c => c.userId)).size}
                </div>
                <div className="text-gray-600">Aktiv Müəllif</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-800">
                  {filteredCollections.reduce((total, c) => total + c.usageCount, 0)}
                </div>
                <div className="text-gray-600">Ümumi İstifadə</div>
              </div>
            </div>
          </div>
        </div>

        {/* Collections Grid */}
        {filteredCollections.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-600 mb-4">
              {searchTerm ? 'Heç bir kolleksiya tapılmadı' : 'Hələ public kolleksiya yoxdur'}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchTerm 
                ? 'Axtarış kriteriyalarınızı dəyişdirərək yenidən cəhd edin.'
                : 'İlk public kolleksiya yaradın və başqaları ilə paylaşın.'
              }
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCollections.map((collection) => (
              <div
                key={collection.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800 line-clamp-2 flex-1">
                      {collection.name}
                    </h3>
                    <button
                      onClick={() => handleSaveCollection(collection.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        savedCollectionIds.has(collection.id)
                          ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={savedCollectionIds.has(collection.id) ? 'Saxlanılıbdan çıxar' : 'Saxla'}
                    >
                      {savedCollectionIds.has(collection.id) ? (
                        <BookmarkCheck className="w-4 h-4" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  
                  {/* Author and Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Müəllif</span>
                      <span className="font-semibold text-gray-800">@{collection.username}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Sözlər</span>
                      <span className="font-semibold text-gray-800">{collection.words.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Reytinq</span>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="font-semibold text-gray-800">{collection.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">İstifadə</span>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-blue-500 mr-1" />
                        <span className="font-semibold text-gray-800">{collection.usageCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {collection.description && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 line-clamp-2">{collection.description}</p>
                    </div>
                  )}

                  {/* Sample Words */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-2">Nümunə sözlər:</div>
                    <div className="space-y-1">
                      {collection.words.slice(0, 2).map((word, index) => (
                        <div key={index} className="text-sm bg-blue-50 rounded p-2">
                          <span className="font-medium">{word.english}</span>
                          <span className="text-gray-600 mx-2">→</span>
                          <span className="text-gray-700">{word.meaning}</span>
                        </div>
                      ))}
                      {collection.words.length > 2 && (
                        <div className="text-sm text-gray-500 text-center py-1">
                          ...və {collection.words.length - 2} söz daha
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  {collection.tags && collection.tags.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {collection.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <button
                    onClick={() => handlePlayQuiz(collection)}
                    disabled={collection.words.length < 6}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4" />
                    <span>{collection.words.length >= 6 ? 'Quiz Oyna' : 'Quiz üçün hazır deyil'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
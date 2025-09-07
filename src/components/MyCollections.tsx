import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, BookOpen, Play, Trash2, Edit3, CheckCircle, Clock, Bookmark } from 'lucide-react';
import { WordCollection } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { loadUserCollections, loadSavedCollections, deleteCollection, getLearnedCollections, getLearnedCollectionsWithData, isCollectionLearned, updateCollection } from '../utils/storage';
import { CreateCollection } from './CreateCollection';

interface MyCollectionsProps {
  onBack: () => void;
  onNavigateToAllCollections: () => void;
  onPlayQuiz: (collection: WordCollection) => void;
  onSaveCollection: (collection: Omit<WordCollection, 'id' | 'userId' | 'username' | 'rating' | 'usageCount'>) => Promise<void>;
}

export const MyCollections: React.FC<MyCollectionsProps> = ({
  onBack,
  onNavigateToAllCollections,
  onPlayQuiz,
  onSaveCollection
}) => {
  const { currentUser } = useAuth();
  const [ownCollections, setOwnCollections] = useState<WordCollection[]>([]);
  const [savedCollections, setSavedCollections] = useState<WordCollection[]>([]);
  const [learnedCollections, setLearnedCollections] = useState<WordCollection[]>([]);
  const [learnedCollectionIds, setLearnedCollectionIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<WordCollection | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    visibility: 'public' as 'public' | 'private'
  });

  // Load collections on component mount
  useEffect(() => {
    loadCollections();
  }, [currentUser]);

  const loadCollections = async () => {
    if (currentUser) {
      setLoading(true);
      try {
        // Load own collections, saved collections, and learned collections in parallel
        const [userCollections, userSavedCollections, learnedCollectionsWithData, learnedCollections] = await Promise.all([
          loadUserCollections(currentUser.id),
          loadSavedCollections(currentUser.id),
          getLearnedCollectionsWithData(currentUser.id),
          getLearnedCollections(currentUser.id)
        ]);

        console.log('📊 Loaded collections:', {
          own: userCollections.length,
          saved: userSavedCollections.length,
          learned: learnedCollectionsWithData.length,
          learnedRecords: learnedCollections.length
        });

        setOwnCollections(userCollections);
        setSavedCollections(userSavedCollections);
        setLearnedCollections(learnedCollectionsWithData);
        
        // Create set of learned collection IDs from learned records (not full collections)
        const learnedIds = new Set(learnedCollections.map(learned => learned.collectionId));
        setLearnedCollectionIds(learnedIds);
        
        console.log('🎯 Learned collection IDs:', Array.from(learnedIds));
        console.log('📚 Learned collections with data:', learnedCollectionsWithData.map(c => ({ id: c.id, name: c.name })));
      } catch (error) {
        console.error('Error loading collections:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveCollection = async (collection: Omit<WordCollection, 'id' | 'userId' | 'username' | 'rating' | 'usageCount'>) => {
    await onSaveCollection(collection);
    setShowCreateForm(false);
    await loadCollections(); // Reload collections after saving
  };

  const handleDeleteCollection = async (id: string) => {
    if (window.confirm('Bu kolleksiyanı silmək istədiyinizə əminsiniz?')) {
      try {
        await deleteCollection(id);
        setOwnCollections(prev => prev.filter(c => c.id !== id));
      } catch (error) {
        console.error('Error deleting collection:', error);
        alert('Kolleksiya silinə bilmədi. Yenidən cəhd edin.');
      }
    }
  };

  const handleEditCollection = (collection: WordCollection) => {
    setEditingCollection(collection);
    setEditForm({
      name: collection.name,
      visibility: collection.visibility || 'public'
    });
  };

  const handleUpdateCollection = async () => {
    if (!editingCollection || !editForm.name.trim()) return;
    
    try {
      await updateCollection(editingCollection.id, {
        name: editForm.name.trim(),
        visibility: editForm.visibility
      });
      
      // Update local state
      setOwnCollections(prev => prev.map(collection => 
        collection.id === editingCollection.id 
          ? { ...collection, name: editForm.name.trim(), visibility: editForm.visibility }
          : collection
      ));
      
      // Close edit form
      setEditingCollection(null);
      setEditForm({ name: '', visibility: 'public' });
      
    } catch (error) {
      console.error('Error updating collection:', error);
      alert('Kolleksiya yenilənə bilmədi. Yenidən cəhd edin.');
    }
  };

  const handleCancelEdit = () => {
    setEditingCollection(null);
    setEditForm({ name: '', visibility: 'public' });
  };

  if (showCreateForm) {
    return (
      <CreateCollection
        onSave={handleSaveCollection}
        onBack={() => setShowCreateForm(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          {/* Top row with back button and title */}
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Kolleksiyalarım</h1>
            </div>
          </div>
          
          {/* Action buttons - responsive layout */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={onNavigateToAllCollections}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <BookOpen className="w-4 h-4" />
              <span>Bütün Kolleksiyalar</span>
            </button>
            
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Kolleksiya</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-4 text-gray-600">Kolleksiyalar yüklənir...</span>
          </div>
        ) : (ownCollections.length === 0 && savedCollections.length === 0 && learnedCollections.length === 0) ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-600 mb-4">
              Hələ kolleksiya yoxdur
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              İlk kolleksiyanızı yaradın və söz öyrənməyə başlayın. 
              Hər kolleksiya minimum 6 söz içərməlidir.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>İlk Kolleksiyanı Yarat</span>
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-800">{ownCollections.length + savedCollections.length + learnedCollections.length}</div>
                    <div className="text-gray-600">Cəmi Kolleksiya</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-800">
                      {[...ownCollections, ...savedCollections]
                        .filter(c => learnedCollectionIds.has(c.id))
                        .reduce((total, c) => total + (c.words?.length || 0), 0)}
                    </div>
                    <div className="text-gray-600">Öyrənilən Söz</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Edit3 className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-800">
                      {[...ownCollections, ...savedCollections].reduce((total, c) => total + (c.words?.length || 0), 0)}
                    </div>
                    <div className="text-gray-600">Cəmi Söz</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Play className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-800">
                      {[...ownCollections, ...savedCollections]
                        .filter(c => (c.words?.length || 0) >= 6 && !learnedCollectionIds.has(c.id))
                        .length}
                    </div>
                    <div className="text-gray-600">Quiz Hazır</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Collections Sections */}
            {(() => {
              // Separate own collections by learned status
              const ownUnlearned = (ownCollections || []).filter(c => !learnedCollectionIds.has(c.id));
              const ownLearned = (ownCollections || []).filter(c => learnedCollectionIds.has(c.id));
              
              // Filter saved collections to exclude duplicates with own collections
              const uniqueSavedCollections = (savedCollections || []).filter(c => 
                !(ownCollections || []).some(own => own.id === c.id)
              );
              const savedUnlearned = uniqueSavedCollections.filter(c => !learnedCollectionIds.has(c.id));
              const savedLearned = uniqueSavedCollections.filter(c => learnedCollectionIds.has(c.id));
              
              // Show ALL learned collections - don't filter out own collections!
              const uniqueLearnedCollections = learnedCollections || [];
              
              // Combine for sections with null checks
              const unlearned = [...(ownUnlearned || []), ...(savedUnlearned || [])];
              
              // For learned section: use ALL learned collections from embedded data 
              // This includes both own learned collections and others' learned collections
              const learned = uniqueLearnedCollections || [];
              
              return (
                <>
                  {/* Öyrəniləsi Olanlar */}
                  {unlearned.length > 0 && (
                    <div className="mb-12">
                      <div className="flex items-center mb-6">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 ml-4">Öyrəniləsi Olanlar ({unlearned.length})</h2>
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {unlearned.map((collection) => (
                          <div
                            key={collection.id}
                            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-l-4 border-blue-500"
                          >
                            <div className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-800 line-clamp-2">
                                  {collection.name}
                                </h3>
                                {collection.userId === currentUser?.id && (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleEditCollection(collection)}
                                      className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCollection(collection.id)}
                                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Müəllif</span>
                                  <span className="font-semibold text-gray-800">
                                    {collection.userId === currentUser?.id ? 'Mən' : `@${collection.username}`}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Sözlər</span>
                                  <span className="font-semibold text-gray-800">{collection.words?.length || 0}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Yaradılma</span>
                                  <span className="text-gray-800">
                                    {collection.createdAt.toLocaleDateString('az-AZ')}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Status</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    (collection.words?.length || 0) >= 6 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-orange-100 text-orange-800'
                                  }`}>
                                    {(collection.words?.length || 0) >= 6 ? 'Quiz hazır' : `${6 - (collection.words?.length || 0)} söz lazım`}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Görünürlük</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    (collection.visibility || 'public') === 'public'
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {(collection.visibility || 'public') === 'public' ? 'Açıq' : 'Gizli'}
                                  </span>
                                </div>
                              </div>

                              {/* Sample Words */}
                              <div className="mb-4">
                                <div className="text-sm text-gray-600 mb-2">Nümunə sözlər:</div>
                                <div className="space-y-1">
                                  {(collection.words || []).slice(0, 2).map((word, index) => (
                                    <div key={index} className="text-sm bg-gray-50 rounded p-2">
                                      <span className="font-medium">{word.english}</span>
                                      <span className="text-gray-600 mx-2">→</span>
                                      <span className="text-gray-700">{word.meaning}</span>
                                    </div>
                                  ))}
                                  {(collection.words?.length || 0) > 2 && (
                                    <div className="text-sm text-gray-500 text-center py-1">
                                      ...və {(collection.words?.length || 0) - 2} söz daha
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <button
                                onClick={() => onPlayQuiz(collection)}
                                disabled={(collection.words?.length || 0) < 6}
                                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Play className="w-4 h-4" />
                                <span>{(collection.words?.length || 0) >= 6 ? 'Quiz Oyna' : 'Quiz üçün hazır deyil'}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Saxlanılan Kolleksiyalar */}
                  {uniqueSavedCollections.length > 0 && (
                    <div className="mb-12">
                      <div className="flex items-center mb-6">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Bookmark className="w-6 h-6 text-yellow-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 ml-4">Saxlanılan Kolleksiyalar ({uniqueSavedCollections.length})</h2>
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {uniqueSavedCollections.map((collection) => (
                          <div
                            key={`saved-${collection.id}`}
                            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-l-4 border-yellow-500"
                          >
                            <div className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-800 line-clamp-2">
                                  {collection.name}
                                </h3>
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                                  Saxlanılan
                                </span>
                              </div>
                              
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Müəllif</span>
                                  <span className="font-semibold text-gray-800">@{collection.username}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Sözlər</span>
                                  <span className="font-semibold text-gray-800">{collection.words?.length || 0}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Status</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    learnedCollectionIds.has(collection.id)
                                      ? 'bg-green-100 text-green-800' 
                                      : (collection.words?.length || 0) >= 6
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {learnedCollectionIds.has(collection.id)
                                      ? 'Öyrənildi' 
                                      : (collection.words?.length || 0) >= 6 
                                        ? 'Quiz hazır' 
                                        : 'Quiz yoxdur'
                                    }
                                  </span>
                                </div>
                              </div>

                              {/* Actions */}
                              {(collection.words?.length || 0) >= 6 && (
                                <button
                                  onClick={() => onPlayQuiz(collection)}
                                  disabled={learnedCollectionIds.has(collection.id)}
                                  className={`w-full flex items-center justify-center space-x-2 py-3 rounded-lg font-semibold transition-all ${
                                    learnedCollectionIds.has(collection.id)
                                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                      : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                                  }`}
                                >
                                  <Play className="w-4 h-4" />
                                  <span>{learnedCollectionIds.has(collection.id) ? 'Öyrənildi' : 'Quiz Oyna'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Öyrənilən Kolleksiyalar (yalnız başqalarından öyrənilənlər) */}
                  {uniqueLearnedCollections.length > 0 && (
                    <div className="mb-12">
                      <div className="flex items-center mb-6">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 ml-4">Öyrənilən Kolleksiyalar ({uniqueLearnedCollections.length})</h2>
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {uniqueLearnedCollections.map((collection) => (
                          <div
                            key={collection.id}
                            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-l-4 border-green-500 opacity-90"
                          >
                            <div className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center">
                                  <h3 className="text-xl font-bold text-gray-800 line-clamp-2">
                                    {collection.name}
                                  </h3>
                                  <CheckCircle className="w-5 h-5 text-green-600 ml-2 flex-shrink-0" />
                                </div>
                                {collection.userId === currentUser?.id && (
                                  <button
                                    onClick={() => handleDeleteCollection(collection.id)}
                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Müəllif</span>
                                  <span className="font-semibold text-gray-800">
                                    {collection.userId === currentUser?.id ? 'Mən' : `@${collection.username}`}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Sözlər</span>
                                  <span className="font-semibold text-gray-800">{collection.words?.length || 0}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Yaradılma</span>
                                  <span className="text-gray-800">
                                    {collection.createdAt.toLocaleDateString('az-AZ')}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Status</span>
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    ✨ Öyrənildi
                                  </span>
                                </div>
                              </div>

                              {/* Sample Words */}
                              <div className="mb-4">
                                <div className="text-sm text-gray-600 mb-2">Nümunə sözlər:</div>
                                <div className="space-y-1">
                                  {(collection.words || []).slice(0, 2).map((word, index) => (
                                    <div key={index} className="text-sm bg-green-50 rounded p-2">
                                      <span className="font-medium">{word.english}</span>
                                      <span className="text-gray-600 mx-2">→</span>
                                      <span className="text-gray-700">{word.meaning}</span>
                                    </div>
                                  ))}
                                  {(collection.words?.length || 0) > 2 && (
                                    <div className="text-sm text-gray-500 text-center py-1">
                                      ...və {(collection.words?.length || 0) - 2} söz daha
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <button
                                onClick={() => onPlayQuiz(collection)}
                                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all"
                              >
                                <Play className="w-4 h-4" />
                                <span>Yenidən Oyna</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}
      </div>

      {/* Edit Collection Modal */}
      {editingCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Kolleksiyanı Redaktə Et</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kolleksiya Adı
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Kolleksiya adını daxil edin"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Görünürlük
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        checked={editForm.visibility === 'public'}
                        onChange={(e) => setEditForm(prev => ({ ...prev, visibility: e.target.value as 'public' | 'private' }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Açıq (hər kəs görə bilər)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="visibility"
                        value="private"
                        checked={editForm.visibility === 'private'}
                        onChange={(e) => setEditForm(prev => ({ ...prev, visibility: e.target.value as 'public' | 'private' }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Gizli (yalnız mən)</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Ləğv Et
                </button>
                <button
                  onClick={handleUpdateCollection}
                  disabled={!editForm.name.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Yadda Saxla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
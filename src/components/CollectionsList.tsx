import React from 'react';
import { WordCollection } from '../types';
import { CollectionCard } from './CollectionCard';
import { Plus, BookOpen, Settings, GraduationCap, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface CollectionsListProps {
  collections: WordCollection[];
  onCreateNew: () => void;
  onPlayQuiz: (collection: WordCollection) => void;
  onDeleteCollection: (id: string) => void;
  onOpenSettings: () => void;
  onOpenExam: () => void;
}

export const CollectionsList: React.FC<CollectionsListProps> = ({
  collections,
  onCreateNew,
  onPlayQuiz,
  onDeleteCollection,
  onOpenSettings,
  onOpenExam
}) => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">Xoş gəldin,</span>
          <span className="font-semibold text-gray-800">{currentUser?.username}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-lg transition-all duration-200"
          >
            <Settings className="w-4 h-4" />
            <span>Ayarlar</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-red-600 hover:text-red-800 hover:bg-red-50 px-4 py-2 rounded-lg transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Çıxış</span>
          </button>
        </div>
      </div>

      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          İngilis Dili Öyrən
        </h1>
        <p className="text-gray-600 text-lg">
          Yeni sözlər öyrənin və quiz vasitəsilə biliklərinizi yoxlayın
        </p>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={onCreateNew}
          className="flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span>Yeni Kolleksiya</span>
        </button>
        
        {collections.length > 0 && (
          <button
            onClick={onOpenExam}
            className="flex items-center space-x-3 bg-gradient-to-r from-green-500 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <GraduationCap className="w-5 h-5" />
            <span>Peşəkar İmtahan</span>
          </button>
        )}
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Hələ kolleksiya yoxdur
          </h3>
          <p className="text-gray-500">
            İlk kolleksiyanızı yaradın və söz öyrənməyə başlayın
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onPlay={onPlayQuiz}
              onDelete={onDeleteCollection}
            />
          ))}
        </div>
      )}
    </div>
  );
};
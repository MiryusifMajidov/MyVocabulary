import React from 'react';
import { WordCollection } from '../types';
import { Book, Play, Trash2 } from 'lucide-react';

interface CollectionCardProps {
  collection: WordCollection;
  onPlay: (collection: WordCollection) => void;
  onDelete: (id: string) => void;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  onPlay,
  onDelete
}) => {
  const canPlay = collection.words.length >= 6;

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Book className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-semibold text-xl text-gray-800">{collection.name}</h3>
        </div>
        <button
          onClick={() => onDelete(collection.id)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="mb-4">
        <p className="text-gray-600 text-sm mb-2">
          Söz sayı: <span className="font-medium">{collection.words.length}/30</span>
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(collection.words.length / 30) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => canPlay && onPlay(collection)}
          disabled={!canPlay}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            canPlay
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>{canPlay ? 'Quiz başlat' : `${6 - collection.words.length} söz daha lazım`}</span>
        </button>
      </div>
      
      <p className="text-xs text-gray-500 mt-3">
        {new Date(collection.createdAt).toLocaleDateString('az-AZ')}
      </p>
    </div>
  );
};
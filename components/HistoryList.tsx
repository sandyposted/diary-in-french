
import React from 'react';
import { HistoryItem } from '../types';

interface HistoryListProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  activeId?: string;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onDelete, onClear, activeId }) => {
  if (history.length === 0) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-8 px-2">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-2xl">📜</span> Journal de Bord
          </h3>
          <p className="text-sm text-gray-400 mt-1 uppercase tracking-widest font-medium">Historique de vos pensées</p>
        </div>
        <button 
          onClick={onClear}
          className="px-4 py-2 text-xs text-gray-400 hover:text-red-500 transition-all uppercase font-bold tracking-widest border border-gray-100 hover:border-red-100 rounded-full bg-white shadow-sm"
        >
          Tout effacer
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pr-2">
        {history.map((item) => (
          <div 
            key={item.id}
            onClick={() => onSelect(item)}
            className={`group relative p-6 rounded-2xl border transition-all cursor-pointer bg-white flex flex-col justify-between h-48 ${
              activeId === item.id 
                ? 'border-indigo-500 shadow-xl ring-2 ring-indigo-50 ring-offset-0' 
                : 'border-gray-100 hover:border-gray-300 hover:shadow-lg'
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                  {new Date(item.timestamp).toLocaleDateString('fr-FR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 line-clamp-3 italic leading-relaxed font-light">
                "{item.originalText}"
              </p>
            </div>
            
            <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
              </div>
              <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                Ouvrir →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;

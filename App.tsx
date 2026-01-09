
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import DiaryInput from './components/DiaryInput';
import AnalysisDisplay from './components/AnalysisDisplay';
import LoadingSkeleton from './components/LoadingSkeleton';
import HistoryList from './components/HistoryList';
import { analyzeDiary } from './services/geminiService';
import { DiaryAnalysis, AppStatus, HistoryItem } from './types';

const STORAGE_KEY = 'latelier_history_v1';

const App: React.FC = () => {
  const [diaryText, setDiaryText] = useState('');
  const [analysis, setAnalysis] = useState<DiaryAnalysis | null>(null);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | undefined>();

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const handleSubmit = useCallback(async () => {
    if (!diaryText.trim()) return;

    setStatus(AppStatus.LOADING);
    setError(null);
    setActiveHistoryId(undefined);
    
    try {
      const result = await analyzeDiary(diaryText);
      
      const newHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        originalText: diaryText,
        analysis: result
      };

      setHistory(prev => [newHistoryItem, ...prev].slice(0, 20));
      setActiveHistoryId(newHistoryItem.id);
      setAnalysis(result);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Désolé, une erreur est survenue.');
      setStatus(AppStatus.ERROR);
    }
  }, [diaryText]);

  const handleSelectHistory = (item: HistoryItem) => {
    setDiaryText(item.originalText);
    setAnalysis(item.analysis);
    setActiveHistoryId(item.id);
    setStatus(AppStatus.SUCCESS);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (activeHistoryId === id) {
      setAnalysis(null);
      setDiaryText('');
      setStatus(AppStatus.IDLE);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Voulez-vous vraiment effacer tout votre historique ?")) {
      setHistory([]);
      setAnalysis(null);
      setDiaryText('');
      setStatus(AppStatus.IDLE);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <Header />
      
      <main className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-20">
          
          {/* Sidebar Section (Input) */}
          <div className="lg:col-span-5 lg:sticky lg:top-8">
            <DiaryInput 
              value={diaryText} 
              onChange={setDiaryText} 
              onSubmit={handleSubmit}
              disabled={status === AppStatus.LOADING}
            />

            {status === AppStatus.ERROR && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-bold">Oups !</p>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {status === AppStatus.IDLE && history.length === 0 && (
              <div className="mt-8 text-center text-gray-400">
                <p className="text-sm italic">"Chaque mot est un pas vers la maîtrise."</p>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="lg:col-span-7">
            {status === AppStatus.LOADING && <LoadingSkeleton />}
            
            {status === AppStatus.SUCCESS && analysis && (
              <AnalysisDisplay analysis={analysis} />
            )}

            {(status === AppStatus.IDLE || (status === AppStatus.ERROR && !analysis)) && (
              <div className="h-full flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <span className="text-4xl">✍️</span>
                </div>
                <h3 className="text-lg font-medium text-gray-500">Prêt à commencer ?</h3>
                <p className="text-sm max-w-xs text-center mt-2">
                  Écrivez votre journal en chinois ou en anglais à gauche pour voir la magie opérer.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* History Section moved to the bottom */}
        <div className="border-t border-gray-100 pt-16">
          <HistoryList 
            history={history}
            onSelect={handleSelectHistory}
            onDelete={handleDeleteHistory}
            onClear={handleClearHistory}
            activeId={activeHistoryId}
          />
        </div>
      </main>

      <footer className="mt-20 pt-10 border-t border-gray-100 text-center text-gray-400 text-xs">
        <p>&copy; {new Date().getFullYear()} L'Atelier du Journal. Fait avec passion pour les francophiles.</p>
      </footer>
    </div>
  );
};

export default App;

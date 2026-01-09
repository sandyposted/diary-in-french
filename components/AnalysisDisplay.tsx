
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DiaryAnalysis, SentenceSegment, VocabularyItem, GrammarPoint, VerbConjugation, FixedExpression } from '../types';
import { GoogleGenAI, Modality } from "@google/genai";

interface AnalysisDisplayProps {
  analysis: DiaryAnalysis;
}

const roleColors: Record<SentenceSegment['role'], string> = {
  subject: 'text-blue-700 border-blue-200 bg-blue-50/50',
  object: 'text-blue-700 border-blue-200 bg-blue-50/50',
  predicate: 'text-emerald-700 border-emerald-200 bg-emerald-50/50',
  preposition: 'text-orange-700 border-orange-200 bg-orange-50/50',
  modifier: 'text-purple-600 border-purple-100 bg-purple-50/20',
  connective: 'text-indigo-600 border-indigo-100 bg-indigo-50/20',
  other: 'text-gray-500 border-transparent',
};

const roleLabels: Record<SentenceSegment['role'], string> = {
  subject: 'Sujet (主语)',
  object: 'Complément (宾语)',
  predicate: 'Prédicat/Verbe (谓语)',
  preposition: 'Préposition (介词)',
  modifier: 'Modificateur',
  connective: 'Connecteur',
  other: 'Autre',
};

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis }) => {
  const [playingText, setPlayingText] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState<string | null>(null);
  const [selectedSegmentIdx, setSelectedSegmentIdx] = useState<number | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const playbackSpeeds = [0.5, 0.7, 1, 1.2, 1.5];

  // Group vocabulary by part of speech
  const groupedVocabulary = useMemo(() => {
    const groups: Record<string, VocabularyItem[]> = {};
    analysis.vocabulary.forEach(item => {
      const pos = item.pos || 'Autre';
      if (!groups[pos]) groups[pos] = [];
      groups[pos].push(item);
    });
    return groups;
  }, [analysis.vocabulary]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setSelectedSegmentIdx(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const handleSpeak = async (text: string) => {
    if (playingText === text) {
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch (e) {}
      }
      setPlayingText(null);
      return;
    }
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
    }

    setLoadingText(text);
    try {
      // Create a new GoogleGenAI instance right before making an API call to ensure it uses the latest API key.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say clearly in French: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });

      let base64Audio: string | undefined;
      const candidates = response.candidates || [];
      if (candidates.length > 0) {
        const parts = candidates[0].content?.parts || [];
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            base64Audio = part.inlineData.data;
            break;
          }
        }
      }

      if (!base64Audio) throw new Error("No audio data received from the AI model.");

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      const audioBytes = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      
      // Apply playback speed
      source.playbackRate.value = playbackSpeed;
      
      source.connect(ctx.destination);
      source.onended = () => {
        setPlayingText(null);
        sourceNodeRef.current = null;
      };
      sourceNodeRef.current = source;
      source.start();
      setPlayingText(text);
    } catch (error: any) {
      console.error("Speech error:", error.message || error);
      alert(`Erreur de synthèse vocale: ${error.message || "Une erreur inconnue est survenue."}`);
    } finally {
      setLoadingText(null);
    }
  };

  const SpeechButton = ({ text, size = "md" }: { text: string, size?: "sm" | "md" }) => {
    const isLoading = loadingText === text;
    const isPlaying = playingText === text;
    return (
      <button
        onClick={(e) => { e.stopPropagation(); handleSpeak(text); }}
        disabled={isLoading && loadingText !== text}
        className={`rounded-full transition-all flex items-center justify-center shrink-0 ${
          size === "sm" ? "p-1.5" : "p-3"
        } ${
          isPlaying 
            ? 'bg-red-50 text-red-500 hover:bg-red-100' 
            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
        } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
      >
        {isLoading ? (
          <svg className={`animate-spin ${size === "sm" ? "h-3 w-3" : "h-5 w-5"}`} viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" className={`${size === "sm" ? "h-3 w-3" : "h-5 w-5"}`} viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className={`${size === "sm" ? "h-3 w-3" : "h-5 w-5"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5L6 9H2V15H6L11 19V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        )}
      </button>
    );
  };

  const selectedSegment = selectedSegmentIdx !== null ? analysis.segmentedText[selectedSegmentIdx] : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Interactive Translated Text Section */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4 gap-4">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-blue-500 text-sm">◆</span> Version Française
          </h3>
          <div className="flex items-center gap-3">
            {/* Playback Speed Controls */}
            <div className="flex bg-gray-50 rounded-full p-1 border border-gray-200">
              {playbackSpeeds.map(speed => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${
                    playbackSpeed === speed 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
            <SpeechButton text={analysis.translatedText} />
          </div>
        </div>
        
        <div className="relative text-2xl leading-[2.2] font-light italic tracking-tight text-gray-800">
          <div className="flex flex-wrap items-baseline">
            {analysis.segmentedText.map((seg: SentenceSegment, idx: number) => (
              <span
                key={idx}
                onClick={() => setSelectedSegmentIdx(selectedSegmentIdx === idx ? null : idx)}
                className={`cursor-pointer rounded-lg px-1.5 py-0.5 transition-all border-b-2 hover:border-current inline-block ${roleColors[seg.role]} ${selectedSegmentIdx === idx ? 'ring-2 ring-indigo-400 ring-offset-2 scale-105 z-10' : ''}`}
              >
                {seg.text}
              </span>
            ))}
          </div>

          {/* Segment Detail Popover */}
          {selectedSegment && (
            <div 
              ref={popoverRef}
              className="absolute z-20 top-full mt-4 left-0 right-0 p-6 bg-white shadow-2xl rounded-2xl border border-gray-100 animate-in slide-in-from-top-2 duration-300 ring-1 ring-black/5"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    {selectedSegment.text.trim()}
                    <SpeechButton text={selectedSegment.text.trim()} size="sm" />
                  </h4>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${roleColors[selectedSegment.role].split(' ')[0]}`}>
                    {roleLabels[selectedSegment.role]}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedSegmentIdx(null)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mb-1">Traduction</p>
                    <p className="text-sm font-medium text-gray-700">🇨🇳 {selectedSegment.meaning_cn}</p>
                    <p className="text-sm font-medium text-gray-700">🇬🇧 {selectedSegment.meaning_en}</p>
                  </div>
                </div>
                <div className="bg-indigo-50/30 p-3 rounded-xl border border-indigo-100">
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-tighter mb-1">Note Grammaticale</p>
                  <p className="text-sm text-indigo-900 leading-relaxed italic">{selectedSegment.grammar_info}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Color Legend */}
        <div className="mt-8 flex flex-wrap gap-4 pt-6 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Sujet / Objet</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Prédicat</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Préposition</span>
          </div>
          <p className="text-[10px] text-gray-400 italic ml-auto">Cliquez sur un segment pour plus de détails</p>
        </div>

        {analysis.culturalNote && (
          <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
            <span className="text-xl">💡</span>
            <p className="text-sm text-amber-800 italic">{analysis.culturalNote}</p>
          </div>
        )}
      </section>

      {/* Grammar & Verbs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h4 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Grammaire
          </h4>
          <div className="space-y-4">
            {analysis.grammarPoints.map((gp: GrammarPoint, i: number) => (
              <div key={i} className="border-l-2 border-indigo-100 pl-4 py-1">
                <p className="font-semibold text-indigo-700 text-sm">{gp.point}</p>
                <p className="text-gray-600 text-xs mt-1 leading-relaxed">{gp.explanation}</p>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 text-xs bg-gray-50 p-2 rounded text-indigo-900 font-mono">
                    {gp.example}
                  </code>
                  <SpeechButton text={gp.example} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h4 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Conjugaison
          </h4>
          <div className="space-y-4">
            {analysis.verbConjugations.map((vc: VerbConjugation, i: number) => (
              <div key={i} className="bg-green-50/50 p-3 rounded-xl border border-green-100">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-green-800">{vc.infinitive}</span>
                    <SpeechButton text={vc.infinitive} size="sm" />
                  </div>
                  <span className="text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                    {vc.group}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-green-700 uppercase tracking-wide mb-1">{vc.tense}</p>
                <p className="text-xs text-gray-600 italic leading-snug">{vc.explanation}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Vocabulary Grouped by POS */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h4 className="text-xl font-bold text-gray-800 mb-6 uppercase tracking-widest flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
          Lexique Complet
        </h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {Object.entries(groupedVocabulary).map(([pos, items]) => (
            <div key={pos} className="space-y-3">
              <h5 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] border-b border-rose-50 pb-2">
                {pos}
              </h5>
              <div className="space-y-1">
                {items.map((vocab: VocabularyItem, i: number) => (
                  <div key={i} className="py-2 flex justify-between items-center group border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-800 group-hover:text-rose-600 transition-colors">
                        {vocab.word}
                      </span>
                      <SpeechButton text={vocab.word} size="sm" />
                      {vocab.gender !== 'N/A' && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter ${
                          vocab.gender === 'feminine' ? 'bg-rose-50 text-rose-500 border border-rose-100' : 
                          'bg-blue-50 text-blue-500 border border-blue-100'
                        }`}>
                          {vocab.gender === 'feminine' ? 'f' : 'm'}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 font-medium italic">{vocab.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Expressions Fixes */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h4 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> Expressions Idiomatiques
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analysis.fixedExpressions.map((expr: FixedExpression, i: number) => (
            <div key={i} className="group p-4 rounded-2xl bg-amber-50/20 hover:bg-amber-50 transition-all border border-transparent hover:border-amber-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="font-bold text-amber-900 group-hover:text-amber-700 leading-tight">{expr.expression}</p>
                <SpeechButton text={expr.expression} size="sm" />
              </div>
              <p className="text-sm text-gray-700 font-medium mb-2">{expr.meaning}</p>
              <div className="bg-white/50 p-2 rounded-lg">
                <p className="text-[10px] text-gray-400 uppercase font-black mb-1">Contexte</p>
                <p className="text-[11px] text-gray-500 italic leading-relaxed">{expr.context}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AnalysisDisplay;

import React, { useMemo } from 'react';
import { Check, X, Timer, Trophy, PlusCircle } from 'lucide-react';
import { Balise } from '../types';
import { LEVEL_COLORS, getTimeLimitSeconds } from '../constants';

interface RacerCardProps {
  entityId: string;
  name: string;
  type: 'group' | 'student';
  activeBalises: Balise[];
  availableBalises: Balise[];
  history: Balise[];
  currentTime: number;
  onStart: (baliseId: string) => void;
  onValidate: (baliseId: string) => void;
  onInvalidate: (baliseId: string) => void;
}

export const RacerCard: React.FC<RacerCardProps> = ({
  name,
  activeBalises,
  availableBalises,
  history,
  currentTime,
  onStart,
  onValidate,
  onInvalidate
}) => {

  // SINGLE TIMER LOGIC
  // We assume all active balises share the same startTime (enforced by useOrientation)
  // We use the startTime of the first one we find.
  const startTime = activeBalises.length > 0 ? activeBalises[0].startTime : null;
  
  // Batch size includes searching + any found/timeout that share this startTime
  // However, for pure UI "limit" display, we can just use the active count + maybe history logic?
  // Simplification: The limit is determined by activeBalises.length. 
  // Wait, if I validate one, length drops, limit drops? 
  // We should ideally pass the "batch count" but purely in UI:
  // Let's rely on activeBalises.length for now, or assume the user validates all at once.
  // Better: Count how many balises in history share this exact startTime?
  const sharedHistoryCount = useMemo(() => {
     if (!startTime) return 0;
     return history.filter(h => h.startTime === startTime).length;
  }, [history, startTime]);

  const currentBatchSize = activeBalises.length + sharedHistoryCount;
  const currentMaxTimeSeconds = useMemo(() => getTimeLimitSeconds(currentBatchSize), [currentBatchSize]);

  const elapsedTime = useMemo(() => {
    if (startTime) {
      return Math.floor((currentTime - startTime) / 1000);
    }
    return 0;
  }, [startTime, currentTime]);

  const progressPercentage = useMemo(() => {
    if (!startTime) return 0;
    const p = (elapsedTime / currentMaxTimeSeconds) * 100;
    return Math.min(p, 100);
  }, [startTime, elapsedTime, currentMaxTimeSeconds]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const points = useMemo(() => {
    return history.reduce((acc, b) => {
       if (b.status !== 'found') return acc;
       const p = b.level === 'N1' ? 10 : b.level === 'N2' ? 20 : 30;
       return acc + p;
    }, 0);
  }, [history]);

  return (
    <div className={`relative flex flex-col bg-white rounded-xl border-2 transition-all duration-300 shadow-sm ${activeBalises.length > 0 ? 'border-blue-500 shadow-blue-100' : 'border-slate-200'}`}>
      
      {/* Header: Name and Total Points */}
      <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
        <h3 className="font-bold text-lg text-slate-800 truncate pr-2">{name}</h3>
        <div className="flex items-center gap-1.5 text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <Trophy className="w-3 h-3 text-yellow-500" />
          {points} pts
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 flex-1 flex flex-col gap-4">
        
        {/* Active List */}
        {activeBalises.length > 0 ? (
           <div className="space-y-4">
              
              {/* Single Global Timer */}
              <div className="text-center pb-2 border-b border-slate-100">
                <span className={`text-4xl font-mono font-bold tracking-tight ${elapsedTime > currentMaxTimeSeconds ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
                   {formatTime(elapsedTime)}
                </span>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                   <span>Limite: {Math.floor(currentMaxTimeSeconds / 60)} min ({currentBatchSize} balises)</span>
                   <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ease-linear ${progressPercentage > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${progressPercentage}%` }} 
                  />
                </div>
              </div>

              {/* List of Balises without individual timers */}
              <div className="space-y-2">
                {activeBalises.map(balise => (
                   <div key={balise.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-mono font-bold text-slate-900">{balise.number}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${LEVEL_COLORS[balise.level]}`}>{balise.level}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => onValidate(balise.id)}
                          className="flex items-center justify-center gap-1 bg-emerald-600 text-white px-2 py-1.5 rounded hover:bg-emerald-700 transition font-medium text-xs shadow-sm active:scale-95"
                          title="Valider"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => onInvalidate(balise.id)}
                          className="flex items-center justify-center gap-1 bg-white border border-slate-300 text-slate-700 px-2 py-1.5 rounded hover:bg-slate-50 transition font-medium text-xs shadow-sm active:scale-95"
                          title="Echec"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                   </div>
                ))}
              </div>
           </div>
        ) : (
          <div className="text-center text-slate-400 py-4 border-2 border-dashed border-slate-100 rounded-lg">
             <Timer className="w-6 h-6 mx-auto mb-1 opacity-20" />
             <span className="text-xs">Aucune course en cours</span>
          </div>
        )}

        {/* Add Balise Selector (Always visible to allow multiple selection) */}
        <div className="relative group mt-auto pt-2">
           <select 
             className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none pl-9"
             onChange={(e) => {
               if (e.target.value) onStart(e.target.value);
             }}
             value=""
           >
             <option value="" disabled>
                {activeBalises.length > 0 ? "Ajouter une balise..." : "Démarrer une balise..."}
             </option>
             {availableBalises.map(b => (
               <option key={b.id} value={b.id}>
                 Balise {b.number} ({b.level})
               </option>
             ))}
           </select>
           <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 mt-1">
              <PlusCircle className="w-4 h-4" />
           </div>
        </div>
      </div>

      {/* History Footer */}
      {history.length > 0 && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 rounded-b-xl">
           <p className="text-[10px] uppercase text-slate-400 font-bold mb-1.5">Historique</p>
           <div className="flex flex-wrap gap-1.5">
             {history.map(b => (
               <div 
                 key={b.id} 
                 className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${b.status === 'found' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}
                 title={b.status === 'found' ? 'Trouvée' : 'Non trouvée'}
               >
                 {b.number}
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};
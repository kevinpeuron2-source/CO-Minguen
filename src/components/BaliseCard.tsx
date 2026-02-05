import React, { useMemo } from 'react';
import { Play, Check, X, RefreshCw, Timer, Users, User } from 'lucide-react';
import { Balise, Group, Student } from '../types';
import { STATUS_COLORS, LEVEL_COLORS } from '../constants';

interface BaliseCardProps {
  balise: Balise;
  groups: Group[];
  students: Student[];
  currentMaxTimeSeconds: number;
  currentTime: number;
  onStart: (id: string) => void;
  onValidate: (id: string) => void;
  onInvalidate: (id: string) => void;
  onReset: (id: string) => void;
  onAssignEntity: (baliseId: string, entityId: string, type: 'group' | 'student') => void;
}

export const BaliseCard: React.FC<BaliseCardProps> = ({
  balise,
  groups,
  students,
  currentMaxTimeSeconds,
  currentTime,
  onStart,
  onValidate,
  onInvalidate,
  onReset,
  onAssignEntity
}) => {
  const isSearching = balise.status === 'searching';
  
  const elapsedTime = useMemo(() => {
    if (balise.status === 'searching' && balise.startTime) {
      return Math.floor((currentTime - balise.startTime) / 1000);
    }
    if ((balise.status === 'found' || balise.status === 'timeout') && balise.duration) {
      return Math.floor(balise.duration);
    }
    return 0;
  }, [balise.status, balise.startTime, balise.duration, currentTime]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercentage = useMemo(() => {
    if (!isSearching) return 0;
    const p = (elapsedTime / currentMaxTimeSeconds) * 100;
    return Math.min(p, 100);
  }, [isSearching, elapsedTime, currentMaxTimeSeconds]);

  // Handle select change
  const handleAssignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) return;
    
    // Value format: "group:ID" or "student:ID"
    const [type, id] = value.split(':');
    if (type && id) {
      onAssignEntity(balise.id, id, type as 'group' | 'student');
    }
  };

  const currentSelectValue = balise.assignedEntityId 
    ? `${balise.assignedEntityType}:${balise.assignedEntityId}` 
    : '';

  return (
    <div className={`relative flex flex-col p-4 rounded-xl border-2 transition-all duration-300 shadow-sm ${STATUS_COLORS[balise.status]}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold uppercase opacity-70 tracking-wider">Balise</span>
          <span className="text-3xl font-bold font-mono">{balise.number}</span>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-bold border ${LEVEL_COLORS[balise.level]}`}>
          {balise.level}
        </div>
      </div>

      {/* Assignment Section (Visible if we have students) */}
      {(students.length > 0 || groups.length > 0) && (
        <div className="mb-4 min-h-[40px]">
          {balise.status === 'inactive' ? (
             <div className="relative">
               <Users className="w-4 h-4 absolute left-2 top-2.5 text-slate-400 pointer-events-none" />
               <select 
                 className="w-full pl-8 pr-2 py-1.5 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                 value={currentSelectValue}
                 onChange={handleAssignChange}
               >
                 <option value="">-- Qui part ? --</option>
                 
                 {groups.length > 0 && (
                   <optgroup label="Groupes">
                     {groups.map(g => (
                       <option key={g.id} value={`group:${g.id}`}>{g.name}</option>
                     ))}
                   </optgroup>
                 )}

                 {students.length > 0 && (
                   <optgroup label="Élèves">
                     {students.map(s => (
                       <option key={s.id} value={`student:${s.id}`}>{s.name}</option>
                     ))}
                   </optgroup>
                 )}
               </select>
             </div>
          ) : (
             <div className="flex items-center gap-2 bg-white/50 px-2 py-1.5 rounded-lg border border-black/5">
                {balise.assignedEntityType === 'group' ? <Users className="w-4 h-4 text-slate-500" /> : <User className="w-4 h-4 text-slate-500" />}
                <span className="text-sm font-bold text-slate-800 truncate">
                   {balise.assignedEntityName || <span className="text-slate-400 italic font-normal">Inconnu</span>}
                </span>
             </div>
          )}
        </div>
      )}

      {/* Timer Display */}
      <div className="flex-1 flex flex-col justify-center items-center py-4 space-y-2">
        {balise.status === 'inactive' && (
          <div className="text-slate-400">
            <Timer className="w-8 h-8 mx-auto mb-1 opacity-50" />
            <span className="text-sm">En attente</span>
          </div>
        )}

        {(isSearching || balise.status === 'found' || balise.status === 'timeout') && (
          <div className="text-center w-full">
            <span className={`text-4xl font-mono font-bold tracking-tight ${balise.status === 'timeout' ? 'text-red-700' : ''}`}>
              {formatTime(elapsedTime)}
            </span>
            {isSearching && (
              <div className="text-xs opacity-70 mt-1">
                Limite: {Math.floor(currentMaxTimeSeconds / 60)} min
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar for Searching */}
      {isSearching && (
        <div className="w-full bg-yellow-200/50 rounded-full h-2 mb-4 overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-linear ${progressPercentage > 80 ? 'bg-red-500' : 'bg-yellow-500'}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 mt-auto">
        {balise.status === 'inactive' && (
          <button 
            onClick={() => onStart(balise.id)}
            className="col-span-2 flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800 transition-colors font-medium active:scale-95"
          >
            <Play className="w-4 h-4" /> Démarrer
          </button>
        )}

        {isSearching && (
          <>
            <button 
              onClick={() => onValidate(balise.id)}
              className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium active:scale-95"
            >
              <Check className="w-4 h-4" /> Trouvé
            </button>
            <button 
              onClick={() => onInvalidate(balise.id)}
              className="flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium active:scale-95"
            >
              <X className="w-4 h-4" /> Échec
            </button>
          </>
        )}

        {(balise.status === 'found' || balise.status === 'timeout') && (
          <button 
            onClick={() => onReset(balise.id)}
            className="col-span-2 flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-600 py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-3 h-3" /> Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
};
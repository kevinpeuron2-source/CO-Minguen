import React, { useState, useEffect } from 'react';
import { useOrientation, getTimeLimit } from './useOrientation';
import { ActiveRun, Beacon, RunMode, StudentGroup } from './types';
import { 
  Users, 
  Flag, 
  Timer, 
  Trophy, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  School,
  Plus,
  Trash2,
  UserPlus,
  FileSpreadsheet,
  Upload,
  ArrowRight,
  Pencil,
  Save,
  MapPin,
  TableProperties,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  Wand2,
  Eraser,
  Layers,
  Cloud,
  CloudOff,
  CloudUpload,
  Loader2,
  Check,
  StopCircle,
  Play,
  ClipboardCheck,
  Target
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- UTILITY COMPONENTS ---

const Badge = ({ children, className }: { children?: React.ReactNode, className?: string }) => (
  <span className={twMerge("px-2 py-1 rounded text-xs font-bold", className)}>
    {children}
  </span>
);

const PunchGrid = ({ 
  pattern, 
  onChange, 
  readonly = false, 
  size = 'md' 
}: { 
  pattern: string; 
  onChange?: (newPattern: string) => void; 
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const safePattern = (pattern && pattern.length === 25) ? pattern : "0".repeat(25);
  const cells = safePattern.split('');

  const handleToggle = (index: number) => {
    if (readonly || !onChange) return;
    const newCells = [...cells];
    newCells[index] = newCells[index] === '1' ? '0' : '1';
    onChange(newCells.join(''));
  };

  const cellSize = size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-3 h-3' : 'w-8 h-8';
  const gapSize = size === 'sm' ? 'gap-0.5' : 'gap-1';

  return (
    <div className={clsx("grid grid-cols-5", gapSize, "bg-slate-100 p-1 rounded border border-slate-300 inline-block")}>
      {cells.map((cell, idx) => (
        <div
          key={idx}
          onClick={() => handleToggle(idx)}
          className={clsx(
            "rounded-full transition-all border",
            cellSize,
            cell === '1' ? "bg-red-600 border-red-700" : "bg-white border-slate-300",
            !readonly && "cursor-pointer hover:bg-red-100 hover:border-red-300"
          )}
        />
      ))}
    </div>
  );
};

// --- CSV IMPORTER COMPONENT ---

const CsvImporter = ({ 
  onImport, 
  onCancel,
  targetClassName 
}: { 
  onImport: (className: string, students: string[]) => void, 
  onCancel: () => void,
  targetClassName?: string
}) => {
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [step, setStep] = useState<'upload' | 'mapping'>('upload');
  
  const [className, setClassName] = useState(targetClassName || '');
  const [colFirstName, setColFirstName] = useState<string>('');
  const [colLastName, setColLastName] = useState<string>('');

  useEffect(() => {
    if (targetClassName) setClassName(targetClassName);
  }, [targetClassName]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!targetClassName) {
        setClassName(selectedFile.name.replace('.csv', ''));
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;
        
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length > 0) {
          const separator = lines[0].includes(';') ? ';' : ',';
          const parsedRows = lines.map(line => line.split(separator).map(cell => cell.trim().replace(/^"|"$/g, '')));
          
          setHeaders(parsedRows[0]);
          setRawRows(parsedRows.slice(1));
          
          const headerLower = parsedRows[0].map(h => h.toLowerCase());
          const fnIndex = headerLower.findIndex(h => h.includes('prenom') || h.includes('first'));
          const lnIndex = headerLower.findIndex(h => h.includes('nom') || h.includes('last'));
          
          if (fnIndex !== -1) setColFirstName(parsedRows[0][fnIndex]);
          else if (parsedRows[0].length > 0) setColFirstName(parsedRows[0][0]);

          if (lnIndex !== -1) setColLastName(parsedRows[0][lnIndex]);
          else if (parsedRows[0].length > 1) setColLastName(parsedRows[0][1]);
          
          setStep('mapping');
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const getPreviewStudents = () => {
    return rawRows.slice(0, 3).map(row => {
      const fnIndex = headers.indexOf(colFirstName);
      const lnIndex = headers.indexOf(colLastName);
      const fn = fnIndex !== -1 ? row[fnIndex] : '';
      const ln = lnIndex !== -1 ? row[lnIndex] : '';
      return `${fn} ${ln}`.trim();
    });
  };

  const handleFinalImport = () => {
    const students = rawRows.map(row => {
      const fnIndex = headers.indexOf(colFirstName);
      const lnIndex = headers.indexOf(colLastName);
      const fn = fnIndex !== -1 ? row[fnIndex] : '';
      const ln = lnIndex !== -1 ? row[lnIndex] : '';
      return `${fn} ${ln}`.trim();
    }).filter(s => s !== ''); 

    onImport(className, students);
  };

  if (step === 'upload') {
    return (
      <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
          <Upload size={24} />
        </div>
        <div>
          <h4 className="font-bold text-slate-700">Importer un fichier CSV</h4>
          <p className="text-sm text-slate-500 mt-1">Sélectionnez un fichier contenant votre liste d'élèves (Export Pronote, Excel...)</p>
        </div>
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileChange}
          className="hidden" 
          id="csv-upload"
        />
        <div className="flex justify-center gap-3">
           <button onClick={onCancel} className="px-4 py-2 text-slate-500 font-medium hover:bg-slate-200 rounded-lg">
             Annuler
           </button>
           <label 
            htmlFor="csv-upload" 
            className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2"
          >
            Choisir un fichier
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h4 className="font-bold text-slate-700 flex items-center gap-2">
          <FileSpreadsheet className="text-green-600" size={20} />
          Configuration de l'import
        </h4>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <XCircle size={20} />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Nom de la classe</label>
            <input 
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              disabled={!!targetClassName}
              className={clsx(
                "w-full p-2 border rounded-lg",
                targetClassName ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white"
              )}
            />
          </div>
          
          <div className="p-4 bg-white rounded-lg border border-blue-100 shadow-sm">
             <div className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
               Mapping des colonnes
             </div>
             <div className="space-y-3">
               <div>
                 <label className="block text-xs text-slate-500 mb-1">Colonne Prénom</label>
                 <select 
                   value={colFirstName}
                   onChange={(e) => setColFirstName(e.target.value)}
                   className="w-full p-2 border rounded bg-slate-50 text-sm"
                 >
                   <option value="">-- Ignorer --</option>
                   {headers.map(h => <option key={h} value={h}>{h}</option>)}
                 </select>
               </div>
               <div>
                 <label className="block text-xs text-slate-500 mb-1">Colonne Nom</label>
                 <select 
                   value={colLastName}
                   onChange={(e) => setColLastName(e.target.value)}
                   className="w-full p-2 border rounded bg-slate-50 text-sm"
                 >
                   <option value="">-- Ignorer --</option>
                   {headers.map(h => <option key={h} value={h}>{h}</option>)}
                 </select>
               </div>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Aperçu du résultat</label>
          <div className="space-y-2 mb-4">
             {getPreviewStudents().map((name, i) => (
               <div key={i} className="flex items-center gap-2 text-sm p-2 bg-slate-50 rounded border border-slate-100 text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">{i+1}</div>
                  {name || <span className="text-slate-400 italic">(Vide)</span>}
               </div>
             ))}
          </div>
          <button 
            onClick={handleFinalImport}
            disabled={!className || (!colFirstName && !colLastName)}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg font-bold shadow-sm flex items-center justify-center gap-2"
          >
            Importer {rawRows.length} élèves <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- SUB-VIEWS ---

type OrientationActions = ReturnType<typeof useOrientation>['actions'];
type OrientationState = ReturnType<typeof useOrientation>['state'];

interface RunCardProps {
  run: ActiveRun;
  groups: StudentGroup[];
  beacons: Beacon[];
  actions: OrientationActions;
}

const RunCard: React.FC<RunCardProps> = ({ run, groups, beacons, actions }) => {
  const group = groups.find(g => g.id === run.groupId);
  
  const beaconsToShow = run.mode === 'star' 
      ? beacons.filter(b => run.beaconIds.includes(b.id))
      : beacons; 
  
  const now = run.endTime || Date.now();
  const elapsedSeconds = Math.floor((now - run.startTime) / 1000);
  const remainingSeconds = run.durationLimit - elapsedSeconds;
  const isOvertime = remainingSeconds < 0;

  const formatTime = (secs: number) => {
    const abs = Math.abs(secs);
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    return `${secs < 0 ? '-' : ''}${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentValidatedPoints = beaconsToShow
      .filter(b => run.validatedBeaconIds?.includes(b.id))
      .reduce((sum, b) => sum + b.points, 0);
  
  const penaltyPoints = (run.mode === 'score' && isOvertime) 
      ? Math.ceil(Math.abs(remainingSeconds) / 60) * 5 
      : 0;

  const isChecking = run.status === 'checking';

  return (
    <div className={clsx(
      "bg-white rounded-xl shadow-sm border p-4 flex flex-col justify-between transition-all",
      isOvertime ? "border-red-500 ring-1 ring-red-500" : (isChecking ? "border-blue-400 ring-1 ring-blue-200" : "border-slate-200")
    )}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
             <h3 className="font-bold text-lg text-slate-800">{group?.name}</h3>
             {run.mode === 'score' && <Badge className="bg-purple-100 text-purple-700 border border-purple-200">Score</Badge>}
          </div>
          
          {(run.mode === 'score' || isChecking) && (
               <div className="mt-1 flex gap-2 text-xs">
                  <span className="text-slate-500">Points: <strong className="text-green-600">{currentValidatedPoints}</strong></span>
                  {penaltyPoints > 0 && <span className="text-slate-500">Pénalité: <strong className="text-red-600">-{penaltyPoints}</strong></span>}
                  {penaltyPoints > 0 && <span className="font-bold text-slate-800">= {Math.max(0, currentValidatedPoints - penaltyPoints)}</span>}
               </div>
          )}
          
          {(run.mode !== 'score' || isChecking) && (
            <div className="flex gap-1 mt-2 flex-wrap max-h-32 overflow-y-auto pr-1">
              {beaconsToShow.map(b => {
                const isValidated = run.validatedBeaconIds?.includes(b.id);
                return (
                  <button
                    key={b.id}
                    onClick={() => actions.toggleBeaconStatus(run.id, b.id)}
                    className={clsx(
                      "flex items-center gap-1 px-1.5 py-0.5 rounded border transition-all hover:scale-105 active:scale-95",
                      isValidated 
                        ? "bg-green-100 border-green-300 text-green-700 shadow-sm" 
                        : "bg-slate-50 border-slate-200 text-slate-400 opacity-80"
                    )}
                  >
                    <span className="font-bold text-xs">{b.code}</span>
                    <span className={clsx("text-[10px]", isValidated ? "opacity-100" : "opacity-50")}>
                      ({b.level}-{b.points})
                    </span>
                    {isValidated && <Check size={10} strokeWidth={4} />}
                  </button>
                );
              })}
            </div>
          )}
          {run.mode === 'score' && !isChecking && (
              <p className="text-xs text-slate-400 mt-2 italic flex items-center gap-1">
                  <Clock size={12} /> Course en cours... Validation à l'arrivée.
              </p>
          )}
        </div>
        
        <div className="text-right">
           <div className={clsx(
              "text-2xl font-mono font-bold",
              isOvertime ? "text-red-600 animate-pulse" : (isChecking ? "text-blue-600" : "text-slate-700")
            )}>
              {formatTime(remainingSeconds)}
            </div>
            {isChecking && <div className="text-[10px] font-bold uppercase text-blue-500 tracking-wider">Chrono Arrêté</div>}
        </div>
      </div>
      
      <div className="flex gap-2 mt-2">
          {run.mode === 'score' && !isChecking ? (
              <button 
                onClick={() => actions.stopRunTimer(run.id)}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                  <StopCircle size={18} /> Arrivée (Stop Chrono)
              </button>
          ) : (
              <>
                <button 
                  onClick={() => actions.completeRun(run.id, true)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckCircle2 size={18} /> {run.mode === 'score' ? 'Valider' : 'Terminer'}
                </button>
                <button 
                  onClick={() => actions.completeRun(run.id, false)}
                  className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <XCircle size={18} /> Abandon
                </button>
              </>
          )}
      </div>
    </div>
  );
};

const RaceControl = ({ 
  state, 
  actions 
}: { 
  state: OrientationState, 
  actions: OrientationActions 
}) => {
  const [raceMode, setRaceMode] = useState<RunMode>('star');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedBeacons, setSelectedBeacons] = useState<string[]>([]);
  const [scoreDuration, setScoreDuration] = useState<number>(20);

  const [, setTimeUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTimeUpdate(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    if (!selectedGroup) return;
    
    if (raceMode === 'star') {
      if (selectedBeacons.length === 0) return;
      actions.startRun(selectedGroup, selectedBeacons, 'star');
      setSelectedBeacons([]);
    } else {
      actions.startRun(selectedGroup, [], 'score', scoreDuration);
    }
    
    setSelectedGroup('');
  };

  const toggleBeacon = (id: string) => {
    if (selectedBeacons.includes(id)) {
      setSelectedBeacons(selectedBeacons.filter(b => b !== id));
    } else {
      setSelectedBeacons([...selectedBeacons, id]);
    }
  };

  const activeRuns = state.runs.filter(r => r.status === 'running' || r.status === 'checking');
  const availableGroups = state.groups.filter(g => !activeRuns.find(r => r.groupId === g.id));

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <Flag className="text-blue-600" /> Nouveau Départ
            </h2>
            
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                    onClick={() => setRaceMode('star')}
                    className={clsx(
                        "px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all",
                        raceMode === 'star' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    <Target size={16} /> En Étoile
                </button>
                <button
                    onClick={() => setRaceMode('score')}
                    className={clsx(
                        "px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all",
                        raceMode === 'score' ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    <ClipboardCheck size={16} /> Au Score
                </button>
            </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Groupe</label>
            <select 
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
            >
              <option value="">Sélectionner un groupe...</option>
              {availableGroups.length > 0 ? (
                availableGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))
              ) : (
                <option value="" disabled>Aucun groupe disponible</option>
              )}
            </select>
          </div>

          <div>
             {raceMode === 'star' ? (
                 <>
                    <label className="block text-sm font-medium text-slate-600 mb-2">
                    Balises cibles (Temps auto: {getTimeLimit(selectedBeacons.length) / 60} min)
                    </label>
                    <div className="flex flex-wrap gap-2">
                    {state.beacons.map(b => (
                        <button
                        key={b.id}
                        onClick={() => toggleBeacon(b.id)}
                        className={clsx(
                            "px-3 py-1.5 rounded-full text-sm font-bold border transition-all flex items-center gap-1",
                            selectedBeacons.includes(b.id) 
                            ? "bg-blue-600 text-white border-blue-600 shadow-md transform scale-105" 
                            : "bg-white text-slate-600 border-slate-300 hover:border-blue-400"
                        )}
                        >
                        {b.code} 
                        <span className="opacity-70 text-xs font-normal">({b.level})</span>
                        </button>
                    ))}
                    </div>
                </>
             ) : (
                 <>
                    <label className="block text-sm font-medium text-slate-600 mb-2">
                        Durée de l'épreuve (minutes)
                    </label>
                    <div className="flex items-center gap-4">
                        <input 
                            type="range" 
                            min="5" 
                            max="60" 
                            step="5" 
                            value={scoreDuration}
                            onChange={(e) => setScoreDuration(Number(e.target.value))}
                            className="flex-1"
                        />
                        <div className="w-24 p-3 bg-slate-50 border rounded-lg text-center font-bold text-slate-800">
                            {scoreDuration} min
                        </div>
                    </div>
                 </>
             )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            disabled={!selectedGroup || (raceMode === 'star' && selectedBeacons.length === 0)}
            onClick={handleStart}
            className={clsx(
                "disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2",
                raceMode === 'star' ? "bg-blue-600 hover:bg-blue-700" : "bg-purple-600 hover:bg-purple-700"
            )}
          >
            <Play size={20} fill="currentColor" /> Lancer {raceMode === 'star' ? 'la course' : 'le chrono'}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Courses en cours ({activeRuns.length})
        </h2>
        {activeRuns.length === 0 ? (
          <div className="text-center py-12 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 text-slate-400">
            Aucune course en cours
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRuns.map(run => (
              <RunCard key={run.id} run={run} groups={state.groups} beacons={state.beacons} actions={actions} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface BeaconStat {
  code: string;
  level: string;
  attempts: number;
  success: number;
  totalTime: number; 
  countForTime: number; 
}

const calculateStudentStats = (
  studentName: string, 
  state: ReturnType<typeof useOrientation>['state']
) => {
    const studentGroupIds = state.groups
      .filter(g => g.members.includes(studentName))
      .map(g => g.id);

    const studentRuns = state.runs.filter(r => 
      studentGroupIds.includes(r.groupId) && (r.status === 'completed' || r.status === 'failed')
    );

    let totalPoints = 0;
    let totalTime = 0;
    const stats = {
      N1: { attempts: 0, found: 0 },
      N2: { attempts: 0, found: 0 },
      N3: { attempts: 0, found: 0 },
    };
    
    const beaconStats: Record<string, BeaconStat> = {};

    studentRuns.forEach(run => {
      const isSuccess = run.status === 'completed';
      
      const relevantBeaconIds = (run.mode === 'score') 
        ? (run.validatedBeaconIds || []) 
        : run.beaconIds;

      const runBeacons = state.beacons.filter(b => relevantBeaconIds.includes(b.id));

      let timePerBeacon = 0;
      if (run.startTime && run.endTime) {
        const duration = (run.endTime - run.startTime) / 1000;
        totalTime += duration;
        if (runBeacons.length > 0) {
           timePerBeacon = duration / runBeacons.length;
        }
      }

      if (run.mode === 'score' && isSuccess) {
          runBeacons.forEach(b => {
             if (!beaconStats[b.id]) {
                beaconStats[b.id] = { code: b.code, level: b.level, attempts: 0, success: 0, totalTime: 0, countForTime: 0 };
             }
             beaconStats[b.id].attempts += 1;
             beaconStats[b.id].success += 1;
             beaconStats[b.id].totalTime += timePerBeacon;
             beaconStats[b.id].countForTime += 1;
             
             if (b.level) {
                 stats[b.level as keyof typeof stats].attempts += 1;
                 stats[b.level as keyof typeof stats].found += 1;
             }
             totalPoints += b.points;
          });
          
          const durationSec = ((run.endTime || 0) - run.startTime) / 1000;
          const overtimeSec = durationSec - run.durationLimit;
          if (overtimeSec > 0) {
              const penalty = Math.ceil(overtimeSec / 60) * 5;
              totalPoints = Math.max(0, totalPoints - penalty);
          }
      } else {
        runBeacons.forEach(b => {
            if (!beaconStats[b.id]) {
            beaconStats[b.id] = { 
                code: b.code, 
                level: b.level, 
                attempts: 0, 
                success: 0, 
                totalTime: 0, 
                countForTime: 0 
            };
            }

            beaconStats[b.id].attempts += 1;
            if (b.level) {
                stats[b.level as keyof typeof stats].attempts += 1;
                
                let wasFound = false;
                if (run.validatedBeaconIds) {
                    wasFound = run.validatedBeaconIds.includes(b.id);
                } else {
                    wasFound = isSuccess;
                }

                if (wasFound) {
                    stats[b.level as keyof typeof stats].found += 1;
                    totalPoints += b.points;
                    
                    beaconStats[b.id].success += 1;
                    beaconStats[b.id].totalTime += timePerBeacon;
                    beaconStats[b.id].countForTime += 1;
                }
            }
        });
      }
    });

    const totalFound = stats.N1.found + stats.N2.found + stats.N3.found;
    const avgTimePerBeacon = totalFound > 0 ? Math.round(totalTime / totalFound) : 0;

    return {
      totalPoints,
      avgTimePerBeacon,
      stats,
      beaconStats,
      totalRuns: studentRuns.length
    };
};

const StudentDetailRow = ({ 
  stats, 
  studentName 
}: { 
  stats: ReturnType<typeof calculateStudentStats>, 
  studentName: string 
}) => {
  return (
    <div className="bg-slate-50 p-4 border-t border-slate-200">
       <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
         <BarChart3 size={16} /> Détail par balise pour {studentName}
       </h4>
       
       {Object.keys(stats.beaconStats).length === 0 ? (
         <p className="text-sm text-slate-400 italic">Aucune donnée détaillée disponible.</p>
       ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
           {Object.values(stats.beaconStats).sort((a,b) => a.code.localeCompare(b.code, undefined, {numeric: true})).map((bs) => (
             <div key={bs.code} className="bg-white p-2 rounded-lg border border-slate-200 text-sm shadow-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className={clsx(
                    "font-bold px-1.5 rounded text-xs",
                    bs.level === 'N1' ? "bg-green-100 text-green-700" :
                    bs.level === 'N2' ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                  )}>
                    Balise {bs.code}
                  </span>
                  <span className="text-xs text-slate-400">
                    {bs.success} / {bs.attempts} réussi(s)
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-xs mt-2">
                   <div className="text-slate-500">Erreurs: <strong className="text-red-600">{bs.attempts - bs.success}</strong></div>
                   {bs.countForTime > 0 && (
                     <div className="flex items-center gap-1 text-slate-600" title="Temps moyen estimé">
                       <Clock size={10} />
                       {Math.round(bs.totalTime / bs.countForTime)}s
                     </div>
                   )}
                </div>
             </div>
           ))}
         </div>
       )}
    </div>
  );
};

const Dashboard = ({ state }: { state: ReturnType<typeof useOrientation>['state'] }) => {
  const [viewMode, setViewMode] = useState<'groups' | 'students'>('groups');
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  
  const sortedGroups = [...state.groups].sort((a, b) => b.totalPoints - a.totalPoints);
  
  const toggleStudent = (name: string) => {
    if (expandedStudent === name) setExpandedStudent(null);
    else setExpandedStudent(name);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center mb-6">
         <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex">
           <button 
             onClick={() => setViewMode('groups')}
             className={clsx(
               "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
               viewMode === 'groups' ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:bg-slate-50"
             )}
           >
             <Users size={16} /> Classement Groupes
           </button>
           <button 
             onClick={() => setViewMode('students')}
             className={clsx(
               "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
               viewMode === 'students' ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:bg-slate-50"
             )}
           >
             <TableProperties size={16} /> Synthèse Élèves
           </button>
         </div>
      </div>

      {viewMode === 'groups' ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Trophy className="text-yellow-500" /> Classement
            </h2>
            {sortedGroups.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Aucun groupe enregistré</p>
            ) : (
              <div className="space-y-3">
                {sortedGroups.map((g, idx) => (
                  <div key={g.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className={clsx(
                        "w-8 h-8 flex items-center justify-center rounded-full font-bold",
                        idx === 0 ? "bg-yellow-100 text-yellow-700" : 
                        idx === 1 ? "bg-slate-200 text-slate-700" :
                        idx === 2 ? "bg-orange-100 text-orange-700" : "text-slate-500"
                      )}>
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-800">{g.name}</div>
                        <div className="text-xs text-slate-500">{g.members.join(', ')}</div>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-xl text-blue-600">
                      {g.totalPoints} pts
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-4">Statistiques Globales</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="text-blue-600 text-sm font-bold uppercase tracking-wide">Courses Totales</div>
                <div className="text-3xl font-bold text-slate-800">{state.runs.length}</div>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <div className="text-green-600 text-sm font-bold uppercase tracking-wide">Taux de réussite</div>
                <div className="text-3xl font-bold text-slate-800">
                  {state.runs.length > 0 
                    ? Math.round((state.runs.filter(r => r.status === 'completed').length / state.runs.length) * 100) 
                    : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="text-xs text-slate-500 uppercase bg-slate-100">
                 <tr>
                   <th className="px-6 py-3">Élève / Classe</th>
                   <th className="px-6 py-3 text-center">Courses</th>
                   <th className="px-6 py-3 text-center">Points Totaux</th>
                   <th className="px-6 py-3 text-center text-green-700">N1</th>
                   <th className="px-6 py-3 text-center text-yellow-700">N2</th>
                   <th className="px-6 py-3 text-center text-red-700">N3</th>
                   <th className="px-6 py-3 text-center">Détail</th>
                 </tr>
               </thead>
               <tbody>
                 {state.classes.map(cls => (
                    cls.students.length > 0 ? (
                      cls.students.map((student, sIdx) => {
                        const stats = calculateStudentStats(student, state);
                        const isExpanded = expandedStudent === student;
                        
                        return (
                          <React.Fragment key={`${cls.id}-${sIdx}`}>
                            <tr className={clsx("border-b hover:bg-slate-50 transition-colors", isExpanded ? "bg-slate-50" : "bg-white")}>
                              <td className="px-6 py-4 font-medium text-slate-900">
                                <div className="font-bold">{student}</div>
                                <div className="text-xs text-slate-500">{cls.name}</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="font-bold">{stats.totalRuns}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-blue-600 font-bold">{stats.totalPoints} pts</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {stats.stats.N1.attempts > 0 ? (
                                    <span className={stats.stats.N1.found === stats.stats.N1.attempts ? "text-green-600 font-bold" : "text-slate-600"}>
                                      {stats.stats.N1.found} / {stats.stats.N1.attempts}
                                    </span>
                                ) : <span className="text-slate-300">-</span>}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {stats.stats.N2.attempts > 0 ? (
                                    <span className={stats.stats.N2.found === stats.stats.N2.attempts ? "text-yellow-600 font-bold" : "text-slate-600"}>
                                      {stats.stats.N2.found} / {stats.stats.N2.attempts}
                                    </span>
                                ) : <span className="text-slate-300">-</span>}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {stats.stats.N3.attempts > 0 ? (
                                    <span className={stats.stats.N3.found === stats.stats.N3.attempts ? "text-red-600 font-bold" : "text-slate-600"}>
                                      {stats.stats.N3.found} / {stats.stats.N3.attempts}
                                    </span>
                                ) : <span className="text-slate-300">-</span>}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button 
                                  onClick={() => toggleStudent(student)}
                                  className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                                >
                                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan={7} className="p-0">
                                   <StudentDetailRow stats={stats} studentName={student} />
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : null
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};

const AdminPanel = ({ 
  state, 
  actions 
}: { 
  state: ReturnType<typeof useOrientation>['state'], 
  actions: ReturnType<typeof useOrientation>['actions'] 
}) => {
  const [adminTab, setAdminTab] = useState<'classes' | 'beacons'>('classes');
  
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [newClass, setNewClass] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [studentsInput, setStudentsInput] = useState('');
  
  const [selectedStudentsForGroup, setSelectedStudentsForGroup] = useState<string[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupAssignments, setGroupAssignments] = useState<Record<string, number>>({});
  const [autoGroupSize, setAutoGroupSize] = useState(2);

  const [beaconCode, setBeaconCode] = useState('');
  const [beaconLevel, setBeaconLevel] = useState('N1');
  const [beaconPunch, setBeaconPunch] = useState('0000000000000000000000000');
  const [beaconDistance, setBeaconDistance] = useState('');
  const [editingBeaconId, setEditingBeaconId] = useState<string | null>(null);

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if(newClass.trim()) {
      actions.addClass(newClass.trim());
      setNewClass('');
    }
  };

  const handleCsvImport = (importedClassName: string, students: string[]) => {
    if (selectedClassId) {
      actions.addStudentsToClass(selectedClassId, students);
    } else {
      actions.addClassWithStudents(importedClassName, students);
    }
    setShowCsvImport(false);
  };

  const handleAddStudents = () => {
    if(selectedClassId && studentsInput.trim()) {
      const students = studentsInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      actions.addStudentsToClass(selectedClassId, students);
      setStudentsInput('');
    }
  };

  const toggleStudentSelection = (student: string) => {
    if (selectedStudentsForGroup.includes(student)) {
      setSelectedStudentsForGroup(prev => prev.filter(s => s !== student));
    } else {
      setSelectedStudentsForGroup(prev => [...prev, student]);
    }
  };

  const handleCreateGroupFromSelection = () => {
    if (newGroupName && selectedStudentsForGroup.length > 0) {
      actions.addGroup(newGroupName, selectedStudentsForGroup);
      setNewGroupName('');
      setSelectedStudentsForGroup([]);
    }
  };

  const handleAutoAssign = () => {
    if (!selectedClass) return;
    const newAssignments: Record<string, number> = {};
    let currentGroup = 1;
    let count = 0;
    
    selectedClass.students.forEach(student => {
      newAssignments[student] = currentGroup;
      count++;
      if (count >= autoGroupSize) {
        count = 0;
        currentGroup++;
      }
    });
    setGroupAssignments(newAssignments);
  };

  const handleBulkCreateGroups = () => {
    if (Object.keys(groupAssignments).length === 0) return;

    const groupsToCreate: Record<number, string[]> = {};
    (Object.entries(groupAssignments) as [string, number][]).forEach(([student, groupNum]) => {
       if (groupNum > 0) {
         if (!groupsToCreate[groupNum]) groupsToCreate[groupNum] = [];
         groupsToCreate[groupNum].push(student);
       }
    });

    Object.entries(groupsToCreate).forEach(([groupNum, members]) => {
      actions.addGroup(`Groupe ${groupNum}`, members);
    });

    setGroupAssignments({});
    alert(`${Object.keys(groupsToCreate).length} groupes ont été créés !`);
  };

  const updateStudentGroup = (student: string, val: string) => {
    const num = parseInt(val);
    if (!isNaN(num)) {
       setGroupAssignments(prev => ({...prev, [student]: num}));
    } else {
       const newAss = {...groupAssignments};
       delete newAss[student];
       setGroupAssignments(newAss);
    }
  };

  const handleBeaconSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(beaconCode && beaconPunch) {
      const points = beaconLevel === 'N1' ? 10 : beaconLevel === 'N2' ? 20 : 30;
      const distance = beaconDistance ? parseInt(beaconDistance) : undefined;
      
      if (editingBeaconId) {
        actions.updateBeacon(editingBeaconId, beaconCode, beaconLevel as any, points, beaconPunch, distance);
        setEditingBeaconId(null);
      } else {
        actions.addBeacon(beaconCode, beaconLevel as any, points, beaconPunch, distance);
      }
      
      setBeaconCode('');
      setBeaconLevel('N1');
      setBeaconPunch('0000000000000000000000000');
      setBeaconDistance('');
    }
  };

  const handleEditBeacon = (b: Beacon) => {
    setEditingBeaconId(b.id);
    setBeaconCode(b.code);
    setBeaconLevel(b.level);
    setBeaconPunch(b.punchCode || '0000000000000000000000000');
    setBeaconDistance(b.distance ? b.distance.toString() : '');
  };

  const handleCancelEdit = () => {
    setEditingBeaconId(null);
    setBeaconCode('');
    setBeaconLevel('N1');
    setBeaconPunch('0000000000000000000000000');
    setBeaconDistance('');
  };

  const selectedClass = state.classes.find(c => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setAdminTab('classes')}
          className={clsx(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            adminTab === 'classes' ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100"
          )}
        >
          Classes & Élèves
        </button>
        <button
          onClick={() => setAdminTab('beacons')}
          className={clsx(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            adminTab === 'beacons' ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100"
          )}
        >
          Balises (Terrain)
        </button>
      </div>

      {adminTab === 'classes' && (
        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-4 space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold mb-3 flex items-center gap-2"><School size={18} /> Mes Classes</h3>
              
              <form onSubmit={handleAddClass} className="flex gap-2 mb-4">
                <input 
                  className="flex-1 p-2 border rounded-lg text-sm" 
                  value={newClass} 
                  onChange={e => setNewClass(e.target.value)} 
                  placeholder="Ex: 6ème A"
                />
                <button className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
                  <Plus size={18} />
                </button>
              </form>

              <div className="space-y-2">
                {state.classes.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedClassId(c.id);
                      setSelectedStudentsForGroup([]);
                      setGroupAssignments({});
                      setShowCsvImport(false);
                    }}
                    className={clsx(
                      "w-full text-left p-3 rounded-lg border transition-all flex justify-between items-center",
                      selectedClassId === c.id 
                        ? "bg-blue-50 border-blue-200 text-blue-800 font-medium" 
                        : "hover:bg-slate-50 border-slate-100"
                    )}
                  >
                    <span>{c.name}</span>
                    <span className="text-xs bg-white px-2 py-1 rounded-full border text-slate-500">
                      {c.students.length} élèves
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold mb-3 flex items-center gap-2"><Users size={18} /> Groupes formés</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {state.groups.map(g => (
                   <div key={g.id} className="text-sm p-2 bg-slate-50 rounded border flex justify-between items-center">
                     <div>
                       <div className="font-medium text-slate-700">{g.name}</div>
                       <div className="text-xs text-slate-500 truncate max-w-[150px]">{g.members.join(', ')}</div>
                     </div>
                     <button 
                       onClick={() => actions.removeGroup(g.id)}
                       className="text-red-400 hover:text-red-600 p-1"
                     >
                       <Trash2 size={14} />
                     </button>
                   </div>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-8">
            {showCsvImport ? (
              <CsvImporter 
                onImport={handleCsvImport} 
                onCancel={() => setShowCsvImport(false)} 
                targetClassName={selectedClass?.name}
              />
            ) : selectedClass ? (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-800">Gestion de la {selectedClass.name}</h3>
                    <div className="flex gap-2">
                       <button 
                          onClick={() => setShowCsvImport(true)}
                          className="flex items-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-slate-200"
                        >
                          <FileSpreadsheet size={16} className="text-green-600" /> Importer CSV
                        </button>
                        <button 
                          onClick={() => actions.removeClass(selectedClass.id)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        >
                          <Trash2 size={18} />
                        </button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 text-slate-600">Ajouter des élèves</label>
                    <div className="flex gap-2">
                      <textarea 
                        className="flex-1 p-2 border rounded-lg text-sm h-20" 
                        value={studentsInput} 
                        onChange={e => setStudentsInput(e.target.value)} 
                        placeholder="Jean Dupont, Marie Curie..."
                      />
                      <button 
                        onClick={handleAddStudents}
                        className="bg-slate-800 text-white px-4 rounded-lg font-medium hover:bg-slate-900 flex flex-col items-center justify-center gap-1"
                      >
                        <UserPlus size={18} /> Ajouter
                      </button>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                     <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg mb-4 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                           <Wand2 size={16} className="text-blue-600" />
                           <span className="text-sm font-medium text-slate-700">Groupe Rapide:</span>
                           <select 
                             value={autoGroupSize}
                             onChange={(e) => setAutoGroupSize(Number(e.target.value))}
                             className="text-sm border border-slate-300 rounded p-1"
                           >
                             <option value={2}>Par 2</option>
                             <option value={3}>Par 3</option>
                             <option value={4}>Par 4</option>
                             <option value={5}>Par 5</option>
                           </select>
                           <button 
                             onClick={handleAutoAssign}
                             className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded font-bold hover:bg-blue-700"
                           >
                             Distribuer
                           </button>
                        </div>
                        <div className="h-6 w-px bg-blue-200 mx-1 hidden sm:block"></div>
                        <div className="flex items-center gap-2">
                           <button 
                              onClick={handleBulkCreateGroups}
                              disabled={Object.keys(groupAssignments).length === 0}
                              className="bg-green-600 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded font-bold hover:bg-green-700 flex items-center gap-1"
                           >
                             <Layers size={14} /> Créer {Object.keys(groupAssignments).length > 0 ? (Object.values(groupAssignments) as number[]).reduce((max, curr) => Math.max(max, curr), 0) : 0} groupes
                           </button>
                           {Object.keys(groupAssignments).length > 0 && (
                             <button 
                               onClick={() => setGroupAssignments({})}
                               className="text-slate-400 hover:text-red-500"
                             >
                               <Eraser size={16} />
                             </button>
                           )}
                        </div>
                     </div>

                     <div className="flex justify-between items-end mb-3">
                        <h4 className="font-medium text-slate-700">Liste des élèves ({selectedClass.students.length})</h4>
                        {selectedStudentsForGroup.length > 0 && (
                          <div className="flex items-center gap-2 bg-yellow-50 p-2 rounded-lg border border-yellow-100">
                            <input 
                              placeholder="Nom du groupe manuel" 
                              className="text-sm p-1.5 rounded border border-yellow-200 outline-none w-48"
                              value={newGroupName}
                              onChange={e => setNewGroupName(e.target.value)}
                            />
                            <button 
                              onClick={handleCreateGroupFromSelection}
                              disabled={!newGroupName}
                              className="text-xs bg-yellow-600 text-white px-3 py-1.5 rounded font-bold hover:bg-yellow-700 disabled:opacity-50"
                            >
                              Créer
                            </button>
                          </div>
                        )}
                     </div>

                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                       {selectedClass.students.map((student, idx) => (
                         <div 
                           key={idx}
                           onClick={() => toggleStudentSelection(student)}
                           className={clsx(
                             "relative text-sm p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2 group",
                             selectedStudentsForGroup.includes(student)
                              ? "bg-yellow-100 border-yellow-400 text-yellow-900"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300"
                           )}
                         >
                           <span className="truncate">{student}</span>
                           <input 
                             type="number" 
                             min="1"
                             className={clsx(
                               "w-10 h-6 text-center text-xs border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none",
                               groupAssignments[student] ? "border-blue-500 font-bold text-blue-600" : "border-slate-200 text-slate-400"
                             )}
                             placeholder="#"
                             value={groupAssignments[student] || ''}
                             onClick={(e) => e.stopPropagation()} 
                             onChange={(e) => updateStudentGroup(student, e.target.value)}
                           />
                         </div>
                       ))}
                     </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-12">
                <School size={48} className="mb-4 opacity-20" />
                <p>Sélectionnez une classe à gauche pour gérer les élèves</p>
              </div>
            )}
          </div>
        </div>
      )}

      {adminTab === 'beacons' && (
        <div className="grid md:grid-cols-2 gap-8">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Flag size={20} className={editingBeaconId ? "text-orange-500" : "text-slate-800"} /> 
              {editingBeaconId ? "Modifier la balise" : "Ajouter une balise"}
            </h3>
            
            <form onSubmit={handleBeaconSubmit} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 text-slate-600">Numéro</label>
                  <input 
                    className="w-full p-2 border rounded-lg bg-slate-50 focus:bg-white transition-colors" 
                    value={beaconCode} 
                    onChange={e => setBeaconCode(e.target.value)} 
                    placeholder="Ex: 42"
                    required
                  />
                </div>
                <div className="w-1/3">
                  <label className="block text-sm font-medium mb-1 text-slate-600">Niveau</label>
                  <select 
                    className="w-full p-2 border rounded-lg bg-slate-50 focus:bg-white" 
                    value={beaconLevel} 
                    onChange={e => setBeaconLevel(e.target.value)}
                  >
                    <option value="N1">N1</option>
                    <option value="N2">N2</option>
                    <option value="N3">N3</option>
                  </select>
                </div>
              </div>

               <div>
                 <label className="block text-sm font-medium mb-1 text-slate-600">Distance (m)</label>
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <MapPin size={16} className="text-slate-400" />
                   </div>
                   <input 
                      type="number"
                      className="w-full pl-10 p-2 border rounded-lg bg-slate-50 focus:bg-white transition-colors" 
                      value={beaconDistance} 
                      onChange={e => setBeaconDistance(e.target.value)} 
                      placeholder="Ex: 150"
                   />
                 </div>
               </div>
              
              <div>
                 <label className="block text-sm font-medium mb-1 text-slate-600">Poinçon</label>
                 <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-center">
                    <PunchGrid 
                      pattern={beaconPunch} 
                      onChange={setBeaconPunch} 
                      size="lg" 
                    />
                 </div>
              </div>

              <div className="flex gap-2 pt-2">
                {editingBeaconId && (
                  <button 
                    type="button" 
                    onClick={handleCancelEdit}
                    className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg font-medium hover:bg-slate-200"
                  >
                    Annuler
                  </button>
                )}
                <button 
                  type="submit"
                  className={clsx(
                    "flex-1 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2",
                    editingBeaconId ? "bg-orange-500 hover:bg-orange-600" : "bg-slate-800 hover:bg-slate-900"
                  )}
                >
                  {editingBeaconId ? <><Save size={18} /> Mettre à jour</> : <><Plus size={18} /> Ajouter</>}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-lg mb-4 text-slate-800">Balises existantes ({state.beacons.length})</h4>
            <div className="grid grid-cols-1 gap-2 max-h-[500px] overflow-y-auto content-start pr-1">
              {state.beacons.map(b => (
                <div key={b.id} className={clsx(
                  "flex items-center justify-between p-3 rounded-lg border transition-all",
                  editingBeaconId === b.id ? "bg-orange-50 border-orange-200 ring-1 ring-orange-200" : "bg-white border-slate-100 hover:border-blue-200"
                )}>
                  <div className="flex items-center gap-3">
                    <span className={clsx(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border",
                      b.level === 'N1' ? "bg-green-50 text-green-700 border-green-200" :
                      b.level === 'N2' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                      "bg-red-50 text-red-700 border-red-200"
                    )}>
                      {b.code}
                    </span>
                    <div>
                       <div className="flex items-center gap-2">
                         <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{b.level}</div>
                         {b.distance && (
                           <div className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 flex items-center gap-1">
                             <MapPin size={10} /> {b.distance}m
                           </div>
                         )}
                       </div>
                       <div className="mt-1">
                          <PunchGrid pattern={b.punchCode} readonly size="sm" />
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEditBeacon(b)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={() => actions.removeBeacon(b.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN APP ---

function App() {
  const { state, actions, loading, syncStatus } = useOrientation();
  const [activeTab, setActiveTab] = useState<'race' | 'stats' | 'admin'>('race');

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusIndicator = () => {
    switch(syncStatus) {
      case 'connecting':
        return (
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
            <Loader2 size={14} className="animate-spin" /> Connexion...
          </div>
        );
      case 'saving':
        return (
          <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
            <CloudUpload size={14} className="animate-pulse" /> Sauvegarde...
          </div>
        );
      case 'connected':
        return (
          <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
            <Cloud size={14} /> Connecté
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
            <CloudOff size={14} /> Hors ligne
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <Flag size={20} fill="currentColor" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
              Minguen Orientation
            </h1>
          </div>
          
          {getStatusIndicator()}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 mb-20">
        {activeTab === 'race' && <RaceControl state={state} actions={actions} />}
        {activeTab === 'stats' && <Dashboard state={state} />}
        {activeTab === 'admin' && <AdminPanel state={state} actions={actions} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 pb-6 shadow-lg z-20">
        <div className="max-w-md mx-auto flex justify-around">
          <button 
            onClick={() => setActiveTab('race')}
            className={clsx(
              "flex flex-col items-center py-3 px-6 transition-colors",
              activeTab === 'race' ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Timer size={24} strokeWidth={activeTab === 'race' ? 2.5 : 2} />
            <span className="text-xs font-medium mt-1">Course</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('stats')}
            className={clsx(
              "flex flex-col items-center py-3 px-6 transition-colors",
              activeTab === 'stats' ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Trophy size={24} strokeWidth={activeTab === 'stats' ? 2.5 : 2} />
            <span className="text-xs font-medium mt-1">Résultats</span>
          </button>

          <button 
            onClick={() => setActiveTab('admin')}
            className={clsx(
              "flex flex-col items-center py-3 px-6 transition-colors",
              activeTab === 'admin' ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Settings size={24} strokeWidth={activeTab === 'admin' ? 2.5 : 2} />
            <span className="text-xs font-medium mt-1">Config</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;
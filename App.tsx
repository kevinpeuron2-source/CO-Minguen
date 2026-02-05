import React, { useState, useEffect } from 'react';
import { useOrientation, getTimeLimit } from './useOrientation';
import { ActiveRun } from './types';
import { 
  Users, 
  Flag, 
  Timer, 
  Trophy, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  School,
  Plus,
  Trash2,
  UserPlus
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- UTILITY COMPONENTS ---

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={twMerge("px-2 py-1 rounded text-xs font-bold", className)}>
    {children}
  </span>
);

const LevelBadge = ({ level }: { level: string }) => {
  const colors = {
    N1: 'bg-n1/20 text-n1 border-n1/50 border',
    N2: 'bg-n2/20 text-n2 border-n2/50 border',
    N3: 'bg-n3/20 text-n3 border-n3/50 border',
  };
  return <Badge className={colors[level as keyof typeof colors] || 'bg-slate-100'}>{level}</Badge>;
};

// --- SUB-VIEWS ---

const RaceControl = ({ 
  state, 
  actions 
}: { 
  state: ReturnType<typeof useOrientation>['state'], 
  actions: ReturnType<typeof useOrientation>['actions'] 
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedBeacons, setSelectedBeacons] = useState<string[]>([]);
  // UseEffect pour forcer le rafraîchissement du timer UI chaque seconde
  const [, setTimeUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTimeUpdate(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    if (!selectedGroup || selectedBeacons.length === 0) return;
    actions.startRun(selectedGroup, selectedBeacons);
    setSelectedGroup('');
    setSelectedBeacons([]);
  };

  const toggleBeacon = (id: string) => {
    if (selectedBeacons.includes(id)) {
      setSelectedBeacons(selectedBeacons.filter(b => b !== id));
    } else {
      setSelectedBeacons([...selectedBeacons, id]);
    }
  };

  const activeRuns = state.runs.filter(r => r.status === 'running');
  const availableGroups = state.groups.filter(g => !activeRuns.find(r => r.groupId === g.id));

  // --- Run Card Component ---
  const RunCard = ({ run }: { run: ActiveRun }) => {
    const group = state.groups.find(g => g.id === run.groupId);
    const beacons = state.beacons.filter(b => run.beaconIds.includes(b.id));
    
    const elapsedSeconds = Math.floor((Date.now() - run.startTime) / 1000);
    const remainingSeconds = run.durationLimit - elapsedSeconds;
    const isOvertime = remainingSeconds < 0;

    const formatTime = (secs: number) => {
      const abs = Math.abs(secs);
      const m = Math.floor(abs / 60);
      const s = abs % 60;
      return `${isOvertime ? '-' : ''}${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
      <div className={clsx(
        "bg-white rounded-xl shadow-sm border p-4 flex flex-col justify-between transition-all",
        isOvertime ? "border-red-500 ring-1 ring-red-500" : "border-slate-200"
      )}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-lg text-slate-800">{group?.name}</h3>
            <div className="flex gap-1 mt-1">
              {beacons.map(b => (
                <LevelBadge key={b.id} level={b.level} />
              ))}
            </div>
          </div>
          <div className={clsx(
            "text-2xl font-mono font-bold",
            isOvertime ? "text-red-600 animate-pulse" : "text-slate-700"
          )}>
            {formatTime(remainingSeconds)}
          </div>
        </div>
        
        <div className="flex gap-2 mt-2">
          <button 
            onClick={() => actions.completeRun(run.id, true)}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <CheckCircle2 size={18} /> Trouvé
          </button>
          <button 
            onClick={() => actions.completeRun(run.id, false)}
            className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <XCircle size={18} /> Échec
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* New Run Creator */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
          <Flag className="text-blue-600" /> Nouveau Départ
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Groupe</label>
            <select 
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50"
            >
              <option value="">Sélectionner un groupe...</option>
              {availableGroups.length > 0 ? (
                availableGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))
              ) : (
                <option value="" disabled>Aucun groupe disponible (Créer dans Config)</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Balises (Temps estimé: {getTimeLimit(selectedBeacons.length) / 60} min)
            </label>
            <div className="flex flex-wrap gap-2">
              {state.beacons.map(b => (
                <button
                  key={b.id}
                  onClick={() => toggleBeacon(b.id)}
                  className={clsx(
                    "px-3 py-1.5 rounded-full text-sm font-bold border transition-all",
                    selectedBeacons.includes(b.id) 
                      ? "bg-blue-600 text-white border-blue-600 shadow-md transform scale-105" 
                      : "bg-white text-slate-600 border-slate-300 hover:border-blue-400"
                  )}
                >
                  {b.code} ({b.level})
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            disabled={!selectedGroup || selectedBeacons.length === 0}
            onClick={handleStart}
            className="bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
          >
            <Timer size={20} /> Lancer le chrono
          </button>
        </div>
      </div>

      {/* Active Runs Grid */}
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
              <RunCard key={run.id} run={run} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = ({ state }: { state: ReturnType<typeof useOrientation>['state'] }) => {
  const sortedGroups = [...state.groups].sort((a, b) => b.totalPoints - a.totalPoints);
  
  return (
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
          <div className="p-4 bg-purple-50 rounded-xl col-span-2">
             <div className="text-purple-600 text-sm font-bold uppercase tracking-wide">Mode de fonctionnement</div>
             <div className="text-sm font-medium text-slate-600 mt-1">
                L'application calcule les temps et les points localement et tente de synchroniser avec le serveur si disponible.
             </div>
          </div>
        </div>
      </div>
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

  // State pour les formulaires
  const [newClass, setNewClass] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [studentsInput, setStudentsInput] = useState('');
  
  // State pour la création de groupe
  const [selectedStudentsForGroup, setSelectedStudentsForGroup] = useState<string[]>([]);
  const [newGroupName, setNewGroupName] = useState('');

  const [beaconCode, setBeaconCode] = useState('');
  const [beaconLevel, setBeaconLevel] = useState('N1');

  // -- CLASSES HANDLERS --
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if(newClass.trim()) {
      actions.addClass(newClass.trim());
      setNewClass('');
    }
  };

  const handleAddStudents = () => {
    if(selectedClassId && studentsInput.trim()) {
      // Sépare par saut de ligne ou virgule
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

  // -- BEACONS HANDLERS --
  const handleAddBeacon = (e: React.FormEvent) => {
    e.preventDefault();
    if(beaconCode) {
      const points = beaconLevel === 'N1' ? 10 : beaconLevel === 'N2' ? 20 : 30;
      actions.addBeacon(beaconCode, beaconLevel as any, points);
      setBeaconCode('');
    }
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
          {/* COLONNE GAUCHE: Liste des Classes */}
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
                {state.classes.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">Ajoutez une classe pour commencer</p>
                )}
              </div>
            </div>

            {/* Liste des Groupes Actuels */}
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
                {state.groups.length === 0 && <p className="text-xs text-slate-400">Aucun groupe formé.</p>}
              </div>
            </div>
          </div>

          {/* COLONNE DROITE: Gestion de la classe sélectionnée */}
          <div className="md:col-span-8">
            {selectedClass ? (
              <div className="space-y-6">
                {/* Ajout d'élèves */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-lg mb-4 text-slate-800">Gestion de la {selectedClass.name}</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 text-slate-600">Ajouter des élèves (copier/coller liste)</label>
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

                  {/* Liste des élèves & Création de groupe */}
                  <div className="border-t pt-4 mt-4">
                     <div className="flex justify-between items-end mb-3">
                        <h4 className="font-medium text-slate-700">Liste des élèves ({selectedClass.students.length})</h4>
                        {selectedStudentsForGroup.length > 0 && (
                          <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-bottom-2">
                            <input 
                              placeholder="Nom du groupe (ex: Groupe 1)" 
                              className="text-sm p-1.5 rounded border border-blue-200 outline-none w-48"
                              value={newGroupName}
                              onChange={e => setNewGroupName(e.target.value)}
                            />
                            <button 
                              onClick={handleCreateGroupFromSelection}
                              disabled={!newGroupName}
                              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded font-bold hover:bg-blue-700 disabled:opacity-50"
                            >
                              Créer le groupe ({selectedStudentsForGroup.length})
                            </button>
                          </div>
                        )}
                     </div>

                     {selectedClass.students.length === 0 ? (
                       <p className="text-sm text-slate-400 italic">Aucun élève dans cette classe.</p>
                     ) : (
                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                         {selectedClass.students.map((student, idx) => (
                           <button
                             key={idx}
                             onClick={() => toggleStudentSelection(student)}
                             className={clsx(
                               "text-sm p-2 rounded-lg border text-left transition-all",
                               selectedStudentsForGroup.includes(student)
                                ? "bg-blue-600 text-white border-blue-600 shadow-md transform scale-105"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300"
                             )}
                           >
                             {student}
                           </button>
                         ))}
                       </div>
                     )}
                     <p className="text-xs text-slate-400 mt-2 text-right">
                       Sélectionnez plusieurs élèves pour créer un groupe rapidement.
                     </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-12">
                <School size={48} className="mb-4 opacity-20" />
                <p>Sélectionnez une classe à gauche pour gérer les élèves et les groupes</p>
              </div>
            )}
          </div>
        </div>
      )}

      {adminTab === 'beacons' && (
        <div className="grid md:grid-cols-2 gap-8">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Flag size={20} /> Ajouter une balise</h3>
            <form onSubmit={handleAddBeacon} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Numéro</label>
                  <input 
                    className="w-full p-2 border rounded-lg" 
                    value={beaconCode} 
                    onChange={e => setBeaconCode(e.target.value)} 
                    placeholder="42"
                  />
                </div>
                <div className="w-1/3">
                  <label className="block text-sm font-medium mb-1">Niveau</label>
                  <select 
                    className="w-full p-2 border rounded-lg" 
                    value={beaconLevel} 
                    onChange={e => setBeaconLevel(e.target.value)}
                  >
                    <option value="N1">N1</option>
                    <option value="N2">N2</option>
                    <option value="N3">N3</option>
                  </select>
                </div>
              </div>
              <button className="w-full bg-slate-800 text-white py-2 rounded-lg font-medium hover:bg-slate-900">
                Ajouter la balise
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-lg mb-4 text-slate-800">Balises existantes</h4>
            <div className="flex flex-wrap gap-2 max-h-[400px] overflow-y-auto content-start">
              {state.beacons.map(b => (
                <div key={b.id} className="relative group">
                  <span className="bg-slate-50 border px-3 py-1.5 rounded text-sm font-mono font-bold flex items-center gap-2">
                    {b.code} 
                    <span className={clsx(
                      "text-[10px] px-1 rounded border",
                      b.level === 'N1' ? "text-green-600 border-green-200 bg-green-50" :
                      b.level === 'N2' ? "text-yellow-600 border-yellow-200 bg-yellow-50" :
                      "text-red-600 border-red-200 bg-red-50"
                    )}>{b.level}</span>
                  </span>
                  <button 
                    onClick={() => actions.removeBeacon(b.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <XCircle size={12} fill="white" className="text-red-500" />
                  </button>
                </div>
              ))}
              {state.beacons.length === 0 && <p className="text-slate-400 italic">Aucune balise configurée.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN APP ---

function App() {
  const { state, actions, loading, isOfflineMode } = useOrientation();
  const [activeTab, setActiveTab] = useState<'race' | 'stats' | 'admin'>('race');

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
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
          
          {isOfflineMode && (
             <div className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
               <AlertTriangle size={12} /> Mode Hors-ligne (Demo)
             </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 mb-20">
        {activeTab === 'race' && <RaceControl state={state} actions={actions} />}
        {activeTab === 'stats' && <Dashboard state={state} />}
        {activeTab === 'admin' && <AdminPanel state={state} actions={actions} />}
      </main>

      {/* Bottom Navigation */}
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
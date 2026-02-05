import React, { useState, useEffect } from 'react';
import { useOrientation, getTimeLimit } from './useOrientation';
import { Beacon, StudentGroup, ActiveRun } from './types';
import { 
  Users, 
  Flag, 
  Timer, 
  Plus, 
  Trophy, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle 
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
  return <Badge className={colors[level as keyof typeof colors]}>{level}</Badge>;
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
  const [timeUpdate, setTimeUpdate] = useState(0);

  // Timer tick for UI updates
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
              {availableGroups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
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
             <div className="text-purple-600 text-sm font-bold uppercase tracking-wide">Balise la plus trouvée</div>
             <div className="text-xl font-bold text-slate-800 mt-1">
                {/* Simple logic for most found */}
                {state.runs.length === 0 ? '-' : 'N/A (Calcul en cours)'}
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
  const [newGroup, setNewGroup] = useState('');
  const [members, setMembers] = useState('');
  const [beaconCode, setBeaconCode] = useState('');
  const [beaconLevel, setBeaconLevel] = useState('N1');

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if(newGroup && members) {
      actions.addGroup(newGroup, members.split(',').map(s => s.trim()));
      setNewGroup('');
      setMembers('');
    }
  };

  const handleAddBeacon = (e: React.FormEvent) => {
    e.preventDefault();
    if(beaconCode) {
      const points = beaconLevel === 'N1' ? 10 : beaconLevel === 'N2' ? 20 : 30;
      actions.addBeacon(beaconCode, beaconLevel as any, points);
      setBeaconCode('');
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Users size={20} /> Ajouter un groupe</h3>
        <form onSubmit={handleAddGroup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom du groupe</label>
            <input 
              className="w-full p-2 border rounded-lg" 
              value={newGroup} 
              onChange={e => setNewGroup(e.target.value)} 
              placeholder="Ex: Les Rapides"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Élèves (séparés par virgule)</label>
            <input 
              className="w-full p-2 border rounded-lg" 
              value={members} 
              onChange={e => setMembers(e.target.value)} 
              placeholder="Léo, Tom..."
            />
          </div>
          <button className="w-full bg-slate-800 text-white py-2 rounded-lg font-medium hover:bg-slate-900">
            Créer le groupe
          </button>
        </form>
      </div>

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

        <div className="mt-6">
          <h4 className="font-medium text-sm text-slate-500 mb-2">Balises existantes</h4>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {state.beacons.map(b => (
              <span key={b.id} className="bg-slate-100 border px-2 py-1 rounded text-xs font-mono">
                {b.code} ({b.level})
              </span>
            ))}
          </div>
        </div>
      </div>
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
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 pb-safe shadow-lg">
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
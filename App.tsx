import React, { useState } from 'react';
import { useOrientation } from './hooks/useOrientation';
import { RacerCard } from './components/RacerCard';
import { StatsDashboard } from './components/StatsDashboard';
import { AdminPanel } from './components/AdminPanel';
import { StudentManager } from './components/StudentManager';
import { Map, BarChart3, Settings, Compass, Timer, Users } from 'lucide-react';

type Tab = 'race' | 'students' | 'stats' | 'admin';

const App: React.FC = () => {
  const { 
    balises, 
    searchingCount, 
    currentTime, 
    students,
    groups,
    savedClasses,
    actions 
  } = useOrientation();
  
  const [currentTab, setCurrentTab] = useState<Tab>('race');

  // Derived state for Header info
  const foundCount = balises.filter(b => b.status === 'found').length;
  const timeoutCount = balises.filter(b => b.status === 'timeout').length;

  // Determining active racers (Groups take precedence if they exist)
  const isRacingGroups = groups.length > 0;
  const racers = isRacingGroups ? groups : students;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      
      {/* Top Navigation / Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Compass className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 hidden sm:block">Minguen Orientation</h1>
            <h1 className="text-xl font-bold text-slate-900 sm:hidden">Minguen</h1>
          </div>
          
          <div className="flex items-center gap-6 text-sm font-medium">
             {/* Status Indicators */}
             <div className="hidden md:flex items-center gap-6">
                <div className="flex flex-col items-center">
                   <span className="text-slate-400 text-xs uppercase tracking-wider">Trouvées</span>
                   <span className="text-emerald-600 font-bold">{foundCount}</span>
                </div>
                <div className="flex flex-col items-center">
                   <span className="text-slate-400 text-xs uppercase tracking-wider">Erreurs</span>
                   <span className="text-red-600 font-bold">{timeoutCount}</span>
                </div>
             </div>

             {/* Timer Logic Display */}
             {searchingCount > 0 && (
               <div className="bg-yellow-50 border border-yellow-200 px-4 py-1.5 rounded-full flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                 <div className="flex items-center gap-2 text-yellow-800">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                    </span>
                    <span className="font-bold">{searchingCount}</span>
                    <span className="text-xs opacity-80">en cours</span>
                 </div>
               </div>
             )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'race' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {isRacingGroups ? 'Suivi des Groupes' : 'Suivi des Élèves'}
                </h2>
                <span className="text-sm text-slate-500">Affectez les balises aux participants</span>
              </div>
              <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-600">
                {racers.length} participants
              </span>
            </div>
            
            {racers.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
                 <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                 <p className="text-slate-500 font-medium">Aucun participant détecté.</p>
                 <p className="text-slate-400 text-sm mb-4">Veuillez d'abord importer une liste d'élèves ou créer des groupes.</p>
                 <button onClick={() => setCurrentTab('students')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium">
                    Aller à la gestion des élèves
                 </button>
               </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {racers.map(racer => {
                  const activeBalises = balises.filter(b => b.assignedEntityId === racer.id && b.status === 'searching');
                  const history = balises.filter(b => b.assignedEntityId === racer.id && (b.status === 'found' || b.status === 'timeout'));
                  // Available balises are those that are 'inactive'
                  const availableBalises = balises.filter(b => b.status === 'inactive');

                  return (
                    <RacerCard
                      key={racer.id}
                      entityId={racer.id}
                      name={racer.name}
                      type={isRacingGroups ? 'group' : 'student'}
                      activeBalises={activeBalises}
                      availableBalises={availableBalises}
                      history={history}
                      currentTime={currentTime}
                      onStart={(baliseId) => actions.startBaliseForEntity(baliseId, racer.id, isRacingGroups ? 'group' : 'student')}
                      onValidate={actions.validateBalise}
                      onInvalidate={actions.invalidateBalise}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {currentTab === 'students' && (
           <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">Gestion des Élèves & Classes</h2>
              <StudentManager 
                 students={students}
                 groups={groups}
                 savedClasses={savedClasses}
                 onImport={actions.importStudents}
                 onCreateGroups={actions.createGroups}
                 onUpdateGroupName={actions.updateGroupName}
                 onSaveClass={actions.saveClass}
                 onLoadClass={actions.loadClass}
                 onDeleteClass={actions.deleteClass}
                 onAddEmptyGroup={actions.addEmptyGroup}
                 onRemoveGroup={actions.removeGroup}
                 onMoveStudent={actions.moveStudentToGroup}
              />
           </div>
        )}

        {currentTab === 'stats' && (
          <div className="space-y-6">
             <h2 className="text-2xl font-bold text-slate-800">Statistiques & Performance</h2>
             <StatsDashboard balises={balises} />
          </div>
        )}

        {currentTab === 'admin' && (
          <div className="space-y-6">
             <h2 className="text-2xl font-bold text-slate-800">Administration</h2>
             <AdminPanel 
                balises={balises}
                onAdd={actions.addBalise}
                onRemove={actions.removeBalise}
                onResetAll={actions.resetAll}
             />
          </div>
        )}
      </main>

      {/* Mobile/Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden z-50">
        <div className="flex justify-around items-center h-16">
          <button 
            onClick={() => setCurrentTab('race')}
            className={`flex flex-col items-center justify-center w-full h-full ${currentTab === 'race' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Map className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium uppercase tracking-wide">Course</span>
          </button>

          <button 
            onClick={() => setCurrentTab('students')}
            className={`flex flex-col items-center justify-center w-full h-full ${currentTab === 'students' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Users className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium uppercase tracking-wide">Élèves</span>
          </button>
          
          <button 
            onClick={() => setCurrentTab('stats')}
            className={`flex flex-col items-center justify-center w-full h-full ${currentTab === 'stats' ? 'text-blue-600' : 'text-slate-400 hover:text-
import React, { useState, useMemo } from 'react';
import { Users, UserPlus, Shuffle, Save, FolderOpen, Trash2, Plus, UserMinus, ArrowRightLeft } from 'lucide-react';
import { Student, Group, ClassRoom } from '../types';

interface StudentManagerProps {
  students: Student[];
  groups: Group[];
  savedClasses: ClassRoom[];
  onImport: (names: string[]) => void;
  onCreateGroups: (count: number, method: 'count' | 'size') => void;
  onUpdateGroupName: (id: string, name: string) => void;
  onSaveClass: (name: string) => void;
  onLoadClass: (id: string) => void;
  onDeleteClass: (id: string) => void;
  // New props for manual management
  onAddEmptyGroup?: () => void;
  onRemoveGroup?: (id: string) => void;
  onMoveStudent?: (studentId: string, targetGroupId: string | null) => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({ 
  students, 
  groups, 
  savedClasses,
  onImport, 
  onCreateGroups, 
  onUpdateGroupName,
  onSaveClass,
  onLoadClass,
  onDeleteClass,
  onAddEmptyGroup,
  onRemoveGroup,
  onMoveStudent
}) => {
  const [inputText, setInputText] = useState('');
  const [groupConfig, setGroupConfig] = useState({ count: 4, method: 'size' as 'count' | 'size' });
  const [classNameToSave, setClassNameToSave] = useState('');

  // Calculate unassigned students
  const unassignedStudents = useMemo(() => {
    const assignedIds = new Set(groups.flatMap(g => g.studentIds));
    return students.filter(s => !assignedIds.has(s.id));
  }, [students, groups]);

  const handleImport = () => {
    const names = inputText.split('\n').filter(n => n.trim() !== '');
    onImport(names);
  };

  const handleCreateGroups = () => {
    onCreateGroups(groupConfig.count, groupConfig.method);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (classNameToSave.trim()) {
      onSaveClass(classNameToSave.trim());
      setClassNameToSave('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Saved Classes Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
           <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
             <FolderOpen className="w-5 h-5" />
           </div>
           <h3 className="text-lg font-bold text-slate-800">Mes Classes Sauvegardées</h3>
        </div>
        
        {savedClasses.length === 0 ? (
          <p className="text-slate-400 text-sm italic">Aucune classe sauvegardée pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
             {savedClasses.map(cls => (
               <div key={cls.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-blue-300 transition bg-slate-50">
                  <div>
                    <h4 className="font-bold text-slate-800">{cls.name}</h4>
                    <p className="text-xs text-slate-500">{cls.students.length} élèves • {cls.groups.length} groupes</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onLoadClass(cls.id)}
                      className="text-xs bg-white border border-slate-300 px-3 py-1.5 rounded-md font-medium text-slate-700 hover:text-blue-600 hover:border-blue-300 transition"
                    >
                      Charger
                    </button>
                    <button 
                      onClick={() => onDeleteClass(cls.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Import Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">1. Liste des Élèves</h3>
          </div>
          <p className="text-sm text-slate-500 mb-2">Copiez-collez votre liste (un nom par ligne)</p>
          <textarea 
            className="w-full h-40 border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-3"
            placeholder="Jean Dupont&#10;Marie Curie&#10;Albert Einstein..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button 
            onClick={handleImport}
            disabled={!inputText.trim()}
            className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Importer la liste ({inputText.split('\n').filter(n => n.trim()).length})
          </button>
        </div>

        {/* Group Configuration */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
              <Shuffle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">2. Génération Automatique</h3>
          </div>
          
          {students.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic border-2 border-dashed border-slate-100 rounded-lg">
              Veuillez d'abord importer des élèves
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Méthode</label>
                  <select 
                    className="w-full border border-slate-300 rounded p-2 text-sm"
                    value={groupConfig.method}
                    onChange={(e) => setGroupConfig({...groupConfig, method: e.target.value as 'count' | 'size'})}
                  >
                    <option value="size">Élèves par groupe</option>
                    <option value="count">Nombre total de groupes</option>
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Valeur</label>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full border border-slate-300 rounded p-2 text-sm"
                    value={groupConfig.count}
                    onChange={(e) => setGroupConfig({...groupConfig, count: parseInt(e.target.value) || 1})}
                  />
                </div>
              </div>
              
              <button 
                onClick={handleCreateGroups}
                className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-medium"
              >
                Générer les groupes
              </button>

              {/* Save Class Form */}
              <form onSubmit={handleSaveClass} className="border-t border-slate-100 pt-4 mt-2">
                 <h4 className="text-sm font-semibold text-slate-700 mb-2">Sauvegarder cette configuration</h4>
                 <div className="flex gap-2">
                   <input 
                      type="text" 
                      placeholder="Nom de la classe (ex: 6eme B)"
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                      value={classNameToSave}
                      onChange={(e) => setClassNameToSave(e.target.value)}
                      required
                   />
                   <button 
                      type="submit"
                      className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition"
                      title="Sauvegarder"
                   >
                     <Save className="w-4 h-4" />
                   </button>
                 </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* MANUAL MANAGEMENT & RESULTS */}
      {(groups.length > 0 || unassignedStudents.length > 0) && (
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-6 h-6 text-slate-500" />
                Gestion des Groupes
              </h3>
              {onAddEmptyGroup && (
                <button 
                  onClick={onAddEmptyGroup}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" /> Ajouter un groupe
                </button>
              )}
           </div>
           
           <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Unassigned Students Column */}
              <div className="w-full lg:w-1/4 flex flex-col gap-3">
                 <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                       <h4 className="font-bold text-slate-700 text-sm uppercase">Sans Groupe</h4>
                       <span className="bg-white px-2 py-0.5 rounded text-xs font-bold border border-slate-200">{unassignedStudents.length}</span>
                    </div>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                       {unassignedStudents.map(student => (
                         <div key={student.id} className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between gap-2">
                            <span className="text-sm font-medium truncate flex-1">{student.name}</span>
                            {onMoveStudent && (
                              <select 
                                className="w-6 h-6 opacity-50 hover:opacity-100 cursor-pointer text-transparent bg-transparent absolute right-4" 
                                style={{backgroundImage: 'none'}}
                                onChange={(e) => {
                                  if (e.target.value) onMoveStudent(student.id, e.target.value);
                                }}
                                value=""
                              >
                                <option value="" disabled>Déplacer...</option>
                                {groups.map(g => (
                                  <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                              </select>
                            )}
                            {/* Visual Fake Button for UI */}
                            {onMoveStudent && (
                               <div className="pointer-events-none text-slate-400">
                                  <ArrowRightLeft className="w-4 h-4" />
                               </div>
                            )}
                         </div>
                       ))}
                       {unassignedStudents.length === 0 && (
                          <div className="text-center py-4 text-xs text-slate-400 italic">Tous les élèves sont affectés</div>
                       )}
                    </div>
                 </div>
              </div>

              {/* Groups Grid */}
              <div className="w-full lg:w-3/4">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {groups.map((group) => (
                     <div key={group.id} className="border border-slate-200 rounded-lg p-3 hover:shadow-md transition bg-slate-50/50 flex flex-col">
                       <div className="flex items-center gap-2 mb-2">
                         <input 
                            value={group.name}
                            onChange={(e) => onUpdateGroupName(group.id, e.target.value)}
                            className="flex-1 font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none text-sm"
                         />
                         {onRemoveGroup && (
                           <button 
                             onClick={() => onRemoveGroup(group.id)}
                             className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50"
                             title="Supprimer le groupe"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         )}
                       </div>
                       
                       <ul className="text-sm text-slate-600 space-y-1.5 flex-1">
                         {group.studentIds.map(sid => {
                           const student = students.find(s => s.id === sid);
                           return student ? (
                             <li key={sid} className="flex items-center justify-between group/item bg-white px-2 py-1 rounded border border-slate-100">
                               <div className="flex items-center gap-2 truncate">
                                 <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></div>
                                 <span className="truncate">{student.name}</span>
                               </div>
                               {onMoveStudent && (
                                 <button 
                                   onClick={() => onMoveStudent(student.id, null)}
                                   className="text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition"
                                   title="Retirer du groupe"
                                 >
                                   <UserMinus className="w-3.5 h-3.5" />
                                 </button>
                               )}
                             </li>
                           ) : null;
                         })}
                         {group.studentIds.length === 0 && (
                            <li className="text-xs text-slate-400 italic py-2 text-center">Groupe vide</li>
                         )}
                       </ul>

                       {/* Add Student to group dropdown */}
                       {onMoveStudent && unassignedStudents.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-slate-100">
                             <select 
                               className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-600 outline-none focus:border-blue-400"
                               onChange={(e) => {
                                  if (e.target.value) onMoveStudent(e.target.value, group.id);
                               }}
                               value=""
                             >
                                <option value="" disabled>+ Ajouter un élève...</option>
                                {unassignedStudents.map(s => (
                                   <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                             </select>
                          </div>
                       )}
                     </div>
                   ))}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
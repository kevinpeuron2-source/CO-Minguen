import React, { useState, useMemo, useRef } from 'react';
import { Users, UserPlus, Shuffle, Save, FolderOpen, Trash2, Plus, UserMinus, ArrowRightLeft, CheckSquare, X, Users as UsersIcon, Upload } from 'lucide-react';
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
  onMoveStudents?: (studentIds: string[], targetGroupId: string | null) => void;
  onCreateGroupWithStudents?: (studentIds: string[]) => void;
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
  onMoveStudent,
  onMoveStudents,
  onCreateGroupWithStudents
}) => {
  const [inputText, setInputText] = useState('');
  const [groupConfig, setGroupConfig] = useState({ count: 4, method: 'size' as 'count' | 'size' });
  const [classNameToSave, setClassNameToSave] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate unassigned students
  const unassignedStudents = useMemo(() => {
    const assignedIds = new Set(groups.flatMap(g => g.studentIds));
    return students.filter(s => !assignedIds.has(s.id));
  }, [students, groups]);

  const handleImport = () => {
    const names = inputText.split('\n').filter(n => n.trim() !== '');
    onImport(names);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      // Basic CSV parsing logic
      // 1. Split by new lines
      const lines = text.split(/\r\n|\n/);
      
      const names = lines.map(line => {
         // 2. Remove quotes often found in CSVs
         let cleanLine = line.replace(/['"]+/g, '');
         // 3. Replace common CSV delimiters (semicolon for Excel FR, comma for standard) with spaces
         // This turns "Dupont;Jean" into "Dupont Jean"
         cleanLine = cleanLine.replace(/[;,]/g, ' ');
         return cleanLine.trim();
      }).filter(line => line.length > 0); // Remove empty lines

      // Update the textarea so the user can review before confirming import
      setInputText(prev => {
        const prefix = prev.trim() ? prev.trim() + '\n' : '';
        return prefix + names.join('\n');
      });
      
      // Reset input value to allow re-uploading the same file if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleCreateGroups = () => {
    onCreateGroups(groupConfig.count, groupConfig.method);
    setSelectedStudentIds(new Set()); // Clear selection on re-gen
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (classNameToSave.trim()) {
      onSaveClass(classNameToSave.trim());
      setClassNameToSave('');
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedStudentIds(newSet);
  };

  const toggleSelectAllUnassigned = () => {
    const newSet = new Set(selectedStudentIds);
    const allUnassignedSelected = unassignedStudents.every(s => newSet.has(s.id));
    
    if (allUnassignedSelected) {
      unassignedStudents.forEach(s => newSet.delete(s.id));
    } else {
      unassignedStudents.forEach(s => newSet.add(s.id));
    }
    setSelectedStudentIds(newSet);
  };

  const handleBulkMove = (targetGroupId: string | null) => {
    if (onMoveStudents) {
      onMoveStudents(Array.from(selectedStudentIds), targetGroupId);
      setSelectedStudentIds(new Set());
    }
  };

  const handleBulkCreateGroup = () => {
    if (onCreateGroupWithStudents) {
      onCreateGroupWithStudents(Array.from(selectedStudentIds));
      setSelectedStudentIds(new Set());
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <UserPlus className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">1. Liste des Élèves</h3>
            </div>
            
            {/* CSV Import Button */}
            <div>
              <input 
                type="file" 
                ref={fileInputRef}
                accept=".csv,.txt" 
                className="hidden" 
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                title="Importer un fichier CSV ou Texte"
              >
                <Upload className="w-3.5 h-3.5" />
                Import CSV
              </button>
            </div>
          </div>

          <p className="text-sm text-slate-500 mb-2">Copiez-collez votre liste ou importez un fichier.</p>
          <textarea 
            className="w-full h-40 border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-3 font-mono"
            placeholder="Jean Dupont&#10;Marie Curie&#10;Albert Einstein..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button 
            onClick={handleImport}
            disabled={!inputText.trim()}
            className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Valider la liste ({inputText.split('\n').filter(n => n.trim()).length})
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
              Veuillez d'abord valider une liste d'élèves
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
           
           <div className="flex flex-col lg:flex-row gap-6 relative">
              
              {/* Unassigned Students Column */}
              <div className="w-full lg:w-1/4 flex flex-col gap-3">
                 <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 shadow-inner">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200">
                       <div className="flex items-center gap-2">
                         <h4 className="font-bold text-slate-700 text-sm uppercase">Sans Groupe</h4>
                         <span className="bg-white px-2 py-0.5 rounded text-xs font-bold border border-slate-200">{unassignedStudents.length}</span>
                       </div>
                       <button onClick={toggleSelectAllUnassigned} className="text-xs text-blue-600 font-medium hover:underline">
                          Tout
                       </button>
                    </div>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                       {unassignedStudents.map(student => (
                         <div key={student.id} className={`bg-white p-2 rounded-lg border flex items-center justify-between gap-2 transition ${selectedStudentIds.has(student.id) ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-200' : 'border-slate-200 hover:border-slate-300'}`}>
                            <div className="flex items-center gap-3 flex-1 overflow-hidden">
                               <input 
                                 type="checkbox" 
                                 className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                                 checked={selectedStudentIds.has(student.id)}
                                 onChange={() => toggleSelection(student.id)}
                               />
                               <span className="text-sm font-medium truncate cursor-pointer" onClick={() => toggleSelection(student.id)}>{student.name}</span>
                            </div>
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
                             <li key={sid} className={`flex items-center justify-between group/item px-2 py-1.5 rounded border transition ${selectedStudentIds.has(student.id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100'}`}>
                               <div className="flex items-center gap-2 truncate flex-1">
                                 <input 
                                   type="checkbox" 
                                   className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                                   checked={selectedStudentIds.has(student.id)}
                                   onChange={() => toggleSelection(student.id)}
                                 />
                                 <span className="truncate cursor-pointer" onClick={() => toggleSelection(student.id)}>{student.name}</span>
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

      {/* Floating Action Bar for Selections */}
      {selectedStudentIds.size > 0 && (
         <div className="fixed bottom-16 md:bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-4 z-50 animate-in slide-in-from-bottom-6 fade-in duration-300">
            <div className="flex items-center gap-2 border-r border-slate-700 pr-4">
               <span className="font-bold text-lg">{selectedStudentIds.size}</span>
               <span className="text-sm font-light text-slate-300">sélectionnés</span>
               <button onClick={() => setSelectedStudentIds(new Set())} className="ml-2 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
               </button>
            </div>
            
            <div className="flex items-center gap-2">
               {onCreateGroupWithStudents && (
                 <button 
                    onClick={handleBulkCreateGroup}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold transition"
                 >
                    <UsersIcon className="w-4 h-4" />
                    Créer Groupe
                 </button>
               )}

               {onMoveStudents && (
                 <div className="relative">
                    <select 
                       className="appearance-none pl-3 pr-8 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm hover:border-slate-500 cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none"
                       onChange={(e) => handleBulkMove(e.target.value || null)}
                       value=""
                    >
                       <option value="" disabled>Déplacer vers...</option>
                       {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                       ))}
                       <option value="">(Dégrouper)</option>
                    </select>
                    <ArrowRightLeft className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                 </div>
               )}
            </div>
         </div>
      )}

    </div>
  );
};
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Balise, Level, BaliseStatus, Student, Group, ClassRoom } from '../types';
import { getTimeLimitSeconds } from '../constants';

const INITIAL_BALISES: Balise[] = [
  { id: '1', number: '31', level: 'N1', status: 'inactive', startTime: null, endTime: null, duration: 0 },
  { id: '2', number: '32', level: 'N1', status: 'inactive', startTime: null, endTime: null, duration: 0 },
  { id: '3', number: '45', level: 'N2', status: 'inactive', startTime: null, endTime: null, duration: 0 },
  { id: '4', number: '46', level: 'N2', status: 'inactive', startTime: null, endTime: null, duration: 0 },
  { id: '5', number: '55', level: 'N3', status: 'inactive', startTime: null, endTime: null, duration: 0 },
  { id: '6', number: '56', level: 'N3', status: 'inactive', startTime: null, endTime: null, duration: 0 },
];

export const useOrientation = () => {
  // --- STATE ---
  const [balises, setBalises] = useState<Balise[]>(() => {
    const saved = localStorage.getItem('minguen-orientation-data');
    return saved ? JSON.parse(saved) : INITIAL_BALISES;
  });

  // Current working session
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('minguen-orientation-students');
    return saved ? JSON.parse(saved) : [];
  });

  const [groups, setGroups] = useState<Group[]>(() => {
    const saved = localStorage.getItem('minguen-orientation-groups');
    return saved ? JSON.parse(saved) : [];
  });

  // Saved classes library
  const [savedClasses, setSavedClasses] = useState<ClassRoom[]>(() => {
    const saved = localStorage.getItem('minguen-orientation-classes');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentTime, setCurrentTime] = useState(Date.now());

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('minguen-orientation-data', JSON.stringify(balises));
  }, [balises]);

  useEffect(() => {
    localStorage.setItem('minguen-orientation-students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('minguen-orientation-groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('minguen-orientation-classes', JSON.stringify(savedClasses));
  }, [savedClasses]);

  // --- TIMER LOGIC ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);
      
      setBalises((currentBalises) => {
        let hasUpdates = false;
        
        const updated = currentBalises.map(b => {
          if (b.status === 'searching' && b.startTime) {
             // Calculate batch size: count all balises for this entity that share the same startTime
             // This includes ones that might have just been found/timeout (to keep consistency of the "trip")
             // or just searching ones. To be safe against "shrinking limit" bug when validating one,
             // we count all balises assigned to this entity with this startTime.
             const batchCount = currentBalises.filter(other => 
                other.assignedEntityId === b.assignedEntityId && 
                other.startTime === b.startTime
             ).length;
             
             const limitSeconds = getTimeLimitSeconds(batchCount);
             const limitMs = limitSeconds * 1000;
             const elapsed = now - b.startTime;
             
             if (elapsed > limitMs) {
                hasUpdates = true;
                return { 
                  ...b, 
                  status: 'timeout' as BaliseStatus, 
                  endTime: now,
                  duration: elapsed / 1000 
                };
             }
          }
          return b;
        });
        return hasUpdates ? updated : currentBalises;
      });

    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // --- DERIVED STATE ---
  const searchingCount = useMemo(() => 
    balises.filter(b => b.status === 'searching').length
  , [balises]);

  // --- ACTIONS: BALISES ---
  const startSearch = useCallback((id: string) => {
    setBalises(prev => prev.map(b => 
      b.id === id ? { ...b, status: 'searching', startTime: Date.now(), endTime: null, duration: 0 } : b
    ));
  }, []);

  const validateBalise = useCallback((id: string) => {
    setBalises(prev => prev.map(b => {
      if (b.id !== id) return b;
      const endTime = Date.now();
      const duration = b.startTime ? (endTime - b.startTime) / 1000 : 0;
      return { ...b, status: 'found', endTime, duration };
    }));
  }, []);

  const invalidateBalise = useCallback((id: string) => {
    setBalises(prev => prev.map(b => {
      if (b.id !== id) return b;
      const endTime = Date.now();
      const duration = b.startTime ? (endTime - b.startTime) / 1000 : 0;
      return { ...b, status: 'timeout', endTime, duration };
    }));
  }, []);

  const resetBalise = useCallback((id: string) => {
    setBalises(prev => prev.map(b => 
      b.id === id ? { ...b, status: 'inactive', startTime: null, endTime: null, duration: 0, assignedEntityId: undefined, assignedEntityName: undefined, assignedEntityType: undefined } : b
    ));
  }, []);

  const addBalise = useCallback((number: string, level: Level) => {
    const newBalise: Balise = {
      id: crypto.randomUUID(),
      number,
      level,
      status: 'inactive',
      startTime: null,
      endTime: null,
      duration: 0
    };
    setBalises(prev => [...prev, newBalise]);
  }, []);

  const removeBalise = useCallback((id: string) => {
    setBalises(prev => prev.filter(b => b.id !== id));
  }, []);

  const resetAll = useCallback(() => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser toute la course ?")) {
      setBalises(prev => prev.map(b => ({
        ...b,
        status: 'inactive',
        startTime: null,
        endTime: null,
        duration: 0,
        assignedEntityId: undefined,
        assignedEntityName: undefined,
        assignedEntityType: undefined
      })));
    }
  }, []);

  const assignEntityToBalise = useCallback((baliseId: string, entityId: string, entityType: 'group' | 'student') => {
    let name = '';
    if (entityType === 'group') {
      name = groups.find(g => g.id === entityId)?.name || 'Groupe';
    } else {
      name = students.find(s => s.id === entityId)?.name || 'Élève';
    }

    setBalises(prev => prev.map(b => 
      b.id === baliseId ? { ...b, assignedEntityId: entityId, assignedEntityType: entityType, assignedEntityName: name } : b
    ));
  }, [groups, students]);

  // New Action: Start race for a specific entity
  const startBaliseForEntity = useCallback((baliseId: string, entityId: string, entityType: 'group' | 'student') => {
    let name = '';
    if (entityType === 'group') {
      name = groups.find(g => g.id === entityId)?.name || 'Groupe';
    } else {
      name = students.find(s => s.id === entityId)?.name || 'Élève';
    }

    setBalises(prev => {
        // Check if entity is already searching to sync start times
        const existingActive = prev.filter(b => b.assignedEntityId === entityId && b.status === 'searching');
        // Use existing start time if available, otherwise start new timer
        const startTime = (existingActive.length > 0 && existingActive[0].startTime) 
            ? existingActive[0].startTime 
            : Date.now();

        return prev.map(b => 
          b.id === baliseId ? { 
            ...b, 
            status: 'searching', 
            startTime: startTime, 
            endTime: null, 
            duration: 0,
            assignedEntityId: entityId, 
            assignedEntityType: entityType, 
            assignedEntityName: name 
          } : b
        );
    });
  }, [groups, students]);


  // --- ACTIONS: STUDENTS & GROUPS ---
  const importStudents = useCallback((names: string[]) => {
    const newStudents = names.map(name => ({
      id: crypto.randomUUID(),
      name: name.trim()
    })).filter(s => s.name.length > 0);
    setStudents(newStudents);
    setGroups([]); // Reset groups on new import
  }, []);

  const createGroups = useCallback((count: number, method: 'count' | 'size') => {
    if (students.length === 0) return;

    // Shuffle students
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    const newGroups: Group[] = [];
    
    let numberOfGroups = 0;
    if (method === 'count') {
      numberOfGroups = count;
    } else {
      numberOfGroups = Math.ceil(students.length / count);
    }

    // Initialize groups
    for (let i = 0; i < numberOfGroups; i++) {
      newGroups.push({
        id: crypto.randomUUID(),
        name: `Groupe ${i + 1}`,
        studentIds: []
      });
    }

    // Distribute students
    shuffled.forEach((student, index) => {
      const groupIndex = index % numberOfGroups;
      newGroups[groupIndex].studentIds.push(student.id);
    });

    // Remove empty groups if any
    setGroups(newGroups.filter(g => g.studentIds.length > 0));
  }, [students]);

  const updateGroupName = useCallback((id: string, name: string) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, name } : g));
  }, []);

  // -- NEW ACTIONS FOR MANUAL GROUP MANAGEMENT --
  
  const addEmptyGroup = useCallback(() => {
    setGroups(prev => [
      ...prev, 
      { 
        id: crypto.randomUUID(), 
        name: `Groupe ${prev.length + 1}`, 
        studentIds: [] 
      }
    ]);
  }, []);

  const removeGroup = useCallback((id: string) => {
    if (window.confirm("Supprimer ce groupe ? Les élèves seront remis dans la liste d'attente.")) {
      setGroups(prev => prev.filter(g => g.id !== id));
    }
  }, []);

  const moveStudentToGroup = useCallback((studentId: string, targetGroupId: string | null) => {
    setGroups(prevGroups => {
      // 1. Remove student from any existing group
      const cleanedGroups = prevGroups.map(g => ({
        ...g,
        studentIds: g.studentIds.filter(sid => sid !== studentId)
      }));

      // 2. If target is null, we just wanted to remove (unassign)
      if (!targetGroupId) return cleanedGroups;

      // 3. Add to target group
      return cleanedGroups.map(g => 
        g.id === targetGroupId 
          ? { ...g, studentIds: [...g.studentIds, studentId] } 
          : g
      );
    });
  }, []);

  const moveStudentsToGroup = useCallback((studentIds: string[], targetGroupId: string | null) => {
    setGroups(prevGroups => {
      // 1. Remove all selected students from their current groups (if any)
      const cleanedGroups = prevGroups.map(g => ({
        ...g,
        studentIds: g.studentIds.filter(sid => !studentIds.includes(sid))
      }));

      if (!targetGroupId) return cleanedGroups;

      // 2. Add them to target
      return cleanedGroups.map(g => 
        g.id === targetGroupId 
          ? { ...g, studentIds: [...g.studentIds, ...studentIds] } 
          : g
      );
    });
  }, []);

  const createGroupWithStudents = useCallback((studentIds: string[]) => {
    setGroups(prevGroups => {
      // 1. Remove students from existing groups
       const cleanedGroups = prevGroups.map(g => ({
        ...g,
        studentIds: g.studentIds.filter(sid => !studentIds.includes(sid))
      }));
      
      // 2. Create new group
      const newGroup: Group = {
        id: crypto.randomUUID(),
        name: `Groupe ${cleanedGroups.length + 1}`,
        studentIds: studentIds
      };

      return [...cleanedGroups, newGroup];
    });
  }, []);

  // --- ACTIONS: CLASS MANAGEMENT ---
  const saveClass = useCallback((name: string) => {
    const newClass: ClassRoom = {
      id: crypto.randomUUID(),
      name,
      students,
      groups
    };
    setSavedClasses(prev => [...prev, newClass]);
    alert(`Classe "${name}" sauvegardée !`);
  }, [students, groups]);

  const loadClass = useCallback((id: string) => {
    const cls = savedClasses.find(c => c.id === id);
    if (cls) {
      if (window.confirm(`Charger la classe "${cls.name}" ? Cela remplacera la liste actuelle.`)) {
        setStudents(cls.students);
        setGroups(cls.groups);
      }
    }
  }, [savedClasses]);

  const deleteClass = useCallback((id: string) => {
    if (window.confirm("Supprimer cette classe définitivement ?")) {
      setSavedClasses(prev => prev.filter(c => c.id !== id));
    }
  }, []);

  return {
    balises,
    searchingCount,
    currentTime,
    students,
    groups,
    savedClasses,
    actions: {
      startSearch,
      validateBalise,
      invalidateBalise,
      resetBalise,
      addBalise,
      removeBalise,
      resetAll,
      assignEntityToBalise,
      startBaliseForEntity,
      importStudents,
      createGroups,
      updateGroupName,
      addEmptyGroup,
      removeGroup,
      moveStudentToGroup,
      moveStudentsToGroup,
      createGroupWithStudents,
      saveClass,
      loadClass,
      deleteClass
    }
  };
};
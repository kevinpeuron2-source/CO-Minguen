import { useState, useEffect } from 'react';
import { 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { GameState, Beacon, StudentGroup, ActiveRun, Level, ClassRoom } from './types';

// Fonction utilitaire pour générer des IDs uniques (compatible vieux navigateurs)
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// État initial par défaut avec des motifs de poinçons (X, Carré, Ligne, etc.)
const INITIAL_STATE: GameState = {
  beacons: [
    { id: 'b1', code: '31', level: 'N1', points: 10, punchCode: '1000101010001000101010001', distance: 50 }, // X pattern
    { id: 'b2', code: '32', level: 'N1', points: 10, punchCode: '1111110001100011000111111', distance: 100 }, // Square
    { id: 'b3', code: '45', level: 'N2', points: 20, punchCode: '0010000100111110010000100', distance: 200 }, // Cross
    { id: 'b4', code: '46', level: 'N2', points: 20, punchCode: '1111100000000000000011111', distance: 250 }, // Top/Bottom lines
    { id: 'b5', code: '60', level: 'N3', points: 30, punchCode: '1000001000001000001000001', distance: 400 }, // Diagonal
  ],
  classes: [], 
  groups: [],
  runs: []
};

// Helper pour calculer les limites de temps
export const getTimeLimit = (beaconCount: number): number => {
  if (beaconCount <= 1) return 360; // 6 min
  if (beaconCount === 2) return 480; // 8 min
  return 600; // 10 min pour 3+
};

export const useOrientation = () => {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Initialisation et Écoute Firebase
  useEffect(() => {
    let unsubscribe: () => void;

    const initFirestore = async () => {
      try {
        const docRef = doc(db, 'sessions', 'current-race');
        
        // Tentative d'abonnement aux changements
        unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as GameState;
            // Migration douce : si 'classes' n'existe pas dans la DB existante, on met un tableau vide
            if (!data.classes) data.classes = [];
            // Migration douce : ajout punchCode par défaut si absent (Chaîne vide ou ?)
            data.beacons = data.beacons.map(b => ({
                ...b,
                punchCode: b.punchCode || '0000000000000000000000000',
                distance: b.distance || 0
            }));
            setState(data);
            setIsOfflineMode(false);
          } else {
            // Si le document n'existe pas, on l'initialise
            setDoc(docRef, INITIAL_STATE).catch(() => {
              // Si l'écriture échoue (ex: droits ou config invalide), on passe en offline
              console.warn("Écriture initiale échouée, passage en mode hors-ligne.");
              setIsOfflineMode(true);
            });
          }
          setLoading(false);
        }, (error) => {
          // Callback d'erreur Firestore (ex: pas de réseau, mauvaise config)
          console.warn("Connexion Firebase impossible, passage en mode hors-ligne.", error.code);
          setIsOfflineMode(true);
          setLoading(false);
        });

      } catch (err) {
        // Erreur synchrone d'initialisation
        console.warn("Erreur d'initialisation Firestore, passage en mode hors-ligne.");
        setIsOfflineMode(true);
        setLoading(false);
      }
    };

    initFirestore();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Helper de synchronisation (gère le mode hors-ligne)
  const syncState = (newState: GameState) => {
    setState(newState);
    if (!isOfflineMode) {
      const docRef = doc(db, 'sessions', 'current-race');
      updateDoc(docRef, newState as any).catch(e => {
        console.error("Échec de la synchronisation", e);
      });
    }
  };

  // --- ACTIONS ---

  // Gestion des classes
  const addClass = (name: string) => {
    const newClass: ClassRoom = {
      id: generateId(),
      name,
      students: []
    };
    const newState = { ...state, classes: [...state.classes, newClass] };
    syncState(newState);
  };

  // Nouvelle action pour l'import CSV
  const addClassWithStudents = (name: string, students: string[]) => {
    const newClass: ClassRoom = {
      id: generateId(),
      name,
      students: students
    };
    const newState = { ...state, classes: [...state.classes, newClass] };
    syncState(newState);
  };

  const addStudentsToClass = (classId: string, studentNames: string[]) => {
    const classIndex = state.classes.findIndex(c => c.id === classId);
    if (classIndex === -1) return;

    const updatedClasses = [...state.classes];
    // On ajoute les étudiants sans doublons
    const currentStudents = new Set(updatedClasses[classIndex].students);
    studentNames.forEach(name => {
      if (name.trim()) currentStudents.add(name.trim());
    });
    
    updatedClasses[classIndex] = {
      ...updatedClasses[classIndex],
      students: Array.from(currentStudents)
    };
    
    syncState({ ...state, classes: updatedClasses });
  };

  const removeClass = (classId: string) => {
     const newState = { ...state, classes: state.classes.filter(c => c.id !== classId) };
     syncState(newState);
  };

  // Gestion des groupes et courses

  const addGroup = (name: string, members: string[]) => {
    const newGroup: StudentGroup = {
      id: generateId(),
      name,
      members,
      totalPoints: 0
    };
    const newState = { ...state, groups: [...state.groups, newGroup] };
    syncState(newState);
  };

  const removeGroup = (groupId: string) => {
    const newState = { ...state, groups: state.groups.filter(g => g.id !== groupId) };
    syncState(newState);
  };

  const startRun = (groupId: string, beaconIds: string[]) => {
    const duration = getTimeLimit(beaconIds.length);
    const newRun: ActiveRun = {
      id: generateId(),
      groupId,
      beaconIds,
      startTime: Date.now(),
      durationLimit: duration,
      status: 'running'
    };

    // Nettoyer les courses précédentes
    const filteredRuns = state.runs.filter(r => 
      r.groupId !== groupId || r.status === 'completed' || r.status === 'failed'
    );
    
    const newState = { ...state, runs: [...filteredRuns, newRun] };
    syncState(newState);
  };

  const completeRun = (runId: string, success: boolean) => {
    const runIndex = state.runs.findIndex(r => r.id === runId);
    if (runIndex === -1) return;

    const run = state.runs[runIndex];
    const newStatus = success ? 'completed' : 'failed';
    
    // Calcul des points
    let pointsToAdd = 0;
    if (success) {
      const runBeacons = state.beacons.filter(b => run.beaconIds.includes(b.id));
      pointsToAdd = runBeacons.reduce((acc, b) => acc + b.points, 0);
    }

    // Mise à jour du groupe
    const groupIndex = state.groups.findIndex(g => g.id === run.groupId);
    const updatedGroups = [...state.groups];
    if (groupIndex !== -1) {
      updatedGroups[groupIndex] = {
        ...updatedGroups[groupIndex],
        totalPoints: updatedGroups[groupIndex].totalPoints + pointsToAdd
      };
    }

    // Mise à jour de la course
    const updatedRuns = [...state.runs];
    updatedRuns[runIndex] = { ...run, status: newStatus, endTime: Date.now() };

    const newState = { ...state, groups: updatedGroups, runs: updatedRuns };
    syncState(newState);
  };

  const addBeacon = (code: string, level: Level, points: number, punchCode: string, distance?: number) => {
    const newBeacon: Beacon = {
      id: generateId(),
      code,
      level,
      points,
      punchCode,
      distance
    };
    const newState = { ...state, beacons: [...state.beacons, newBeacon] };
    syncState(newState);
  };

  const updateBeacon = (id: string, code: string, level: Level, points: number, punchCode: string, distance?: number) => {
    const updatedBeacons = state.beacons.map(b => 
      b.id === id ? { ...b, code, level, points, punchCode, distance } : b
    );
    const newState = { ...state, beacons: updatedBeacons };
    syncState(newState);
  };

  const removeBeacon = (beaconId: string) => {
    const newState = { ...state, beacons: state.beacons.filter(b => b.id !== beaconId) };
    syncState(newState);
  };

  return {
    state,
    loading,
    isOfflineMode,
    actions: {
      addClass,
      addClassWithStudents,
      addStudentsToClass,
      removeClass,
      addGroup,
      removeGroup,
      startRun,
      completeRun,
      addBeacon,
      updateBeacon,
      removeBeacon
    }
  };
};
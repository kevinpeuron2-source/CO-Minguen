import { useState, useEffect } from 'react';
import { 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { GameState, Beacon, StudentGroup, ActiveRun, Level, ClassRoom, RunMode } from './types';

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

export type SyncStatus = 'connecting' | 'connected' | 'saving' | 'offline';

export const useOrientation = () => {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting');

  // Initialisation et Écoute Firebase
  useEffect(() => {
    let unsubscribe: () => void;

    const initFirestore = async () => {
      setSyncStatus('connecting');
      try {
        const docRef = doc(db, 'sessions', 'session_minguen');
        
        // Tentative d'abonnement aux changements
        unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            console.log("🔥 Données reçues de Firebase");
            const data = docSnap.data() as GameState;
            // Migration douce : si 'classes' n'existe pas dans la DB existante, on met un tableau vide
            if (!data.classes) data.classes = [];
            // Migration douce : ajout punchCode par défaut si absent (Chaîne vide ou ?)
            data.beacons = data.beacons.map(b => ({
                ...b,
                punchCode: b.punchCode || '0000000000000000000000000',
                distance: b.distance || 0
            }));
            // Migration douce : mode par défaut 'star'
            if (data.runs) {
                data.runs = data.runs.map(r => ({
                    ...r,
                    mode: r.mode || 'star',
                    status: (r.status === 'running' && r.endTime) ? 'checking' : r.status // Migration old running with endtime
                }));
            }
            setState(data);
            setIsOfflineMode(false);
            setSyncStatus('connected');
          } else {
            console.log("🔥 Création du document initial");
            setSyncStatus('saving');
            // Si le document n'existe pas, on l'initialise
            setDoc(docRef, INITIAL_STATE)
              .then(() => {
                setSyncStatus('connected');
              })
              .catch((err) => {
                // Si l'écriture échoue (ex: droits ou config invalide), on passe en offline
                console.warn("Écriture initiale échouée, passage en mode hors-ligne.", err);
                setIsOfflineMode(true);
                setSyncStatus('offline');
              });
          }
          setLoading(false);
        }, (error) => {
          // Callback d'erreur Firestore (ex: pas de réseau, mauvaise config)
          console.warn("Connexion Firebase impossible, passage en mode hors-ligne.", error.code);
          setIsOfflineMode(true);
          setLoading(false);
          setSyncStatus('offline');
        });

      } catch (err) {
        // Erreur synchrone d'initialisation
        console.warn("Erreur d'initialisation Firestore, passage en mode hors-ligne.");
        setIsOfflineMode(true);
        setLoading(false);
        setSyncStatus('offline');
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
      console.log("☁️ Envoi des modifications vers Firebase...");
      setSyncStatus('saving');
      const docRef = doc(db, 'sessions', 'session_minguen');
      updateDoc(docRef, newState as any)
        .then(() => {
          setSyncStatus('connected');
        })
        .catch(e => {
          console.error("Échec de la synchronisation", e);
          setSyncStatus('offline');
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

  const startRun = (groupId: string, beaconIds: string[], mode: RunMode = 'star', customDuration?: number) => {
    // Si mode 'star', beaconIds est la liste à trouver.
    // Si mode 'score', beaconIds est vide au départ (on ajoutera celles trouvées).
    
    const duration = customDuration ? customDuration * 60 : getTimeLimit(beaconIds.length);
    const newRun: ActiveRun = {
      id: generateId(),
      groupId,
      mode,
      beaconIds: mode === 'star' ? beaconIds : [],
      validatedBeaconIds: [], 
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

  // Nouvelle action pour arrêter le chrono (Arrivée élève) sans valider les points tout de suite
  const stopRunTimer = (runId: string) => {
    const runIndex = state.runs.findIndex(r => r.id === runId);
    if (runIndex === -1) return;

    const updatedRuns = [...state.runs];
    updatedRuns[runIndex] = { 
        ...updatedRuns[runIndex], 
        status: 'checking', // Nouveau status: chrono arrêté, en attente de vérification
        endTime: Date.now() 
    };
    syncState({ ...state, runs: updatedRuns });
  };

  // Nouvelle action pour basculer l'état validé d'une balise
  const toggleBeaconStatus = (runId: string, beaconId: string) => {
    const runIndex = state.runs.findIndex(r => r.id === runId);
    if (runIndex === -1) return;

    const run = state.runs[runIndex];
    let newValidatedIds = run.validatedBeaconIds ? [...run.validatedBeaconIds] : [];

    if (newValidatedIds.includes(beaconId)) {
      newValidatedIds = newValidatedIds.filter(id => id !== beaconId);
    } else {
      newValidatedIds.push(beaconId);
    }

    const updatedRuns = [...state.runs];
    updatedRuns[runIndex] = { 
        ...run, 
        validatedBeaconIds: newValidatedIds,
        // En mode score, on met aussi à jour beaconIds pour garder la trace de ce qui a été tenté/trouvé
        beaconIds: run.mode === 'score' ? newValidatedIds : run.beaconIds 
    };

    syncState({ ...state, runs: updatedRuns });
  };

  const completeRun = (runId: string, success: boolean) => {
    const runIndex = state.runs.findIndex(r => r.id === runId);
    if (runIndex === -1) return;

    const run = state.runs[runIndex];
    const newStatus = success ? 'completed' : 'failed';
    const endTime = run.endTime || Date.now(); // Utiliser l'heure d'arrêt si déjà arrêté

    // Calcul des points
    let pointsToAdd = 0;
    
    if (success) {
      // Liste des balises validées
      const idsToCount = (run.validatedBeaconIds && run.validatedBeaconIds.length > 0) 
        ? run.validatedBeaconIds 
        : (run.validatedBeaconIds ? [] : run.beaconIds);

      const runBeacons = state.beacons.filter(b => idsToCount.includes(b.id));
      const basePoints = runBeacons.reduce((acc, b) => acc + b.points, 0);

      pointsToAdd = basePoints;

      // PÉNALITÉS pour le mode SCORE
      if (run.mode === 'score') {
         const durationSec = (endTime - run.startTime) / 1000;
         const overtimeSec = durationSec - run.durationLimit;
         
         if (overtimeSec > 0) {
            // Pénalité : 5 points par minute entamée (exemple standard)
            const penaltyMinutes = Math.ceil(overtimeSec / 60);
            const penalty = penaltyMinutes * 5; 
            pointsToAdd = Math.max(0, pointsToAdd - penalty); // Pas de points négatifs totaux ? Ou si ?
            console.log(`Pénalité de temps: -${penalty} pts (${Math.round(overtimeSec)}s dépassement)`);
         }
      }
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
    updatedRuns[runIndex] = { 
        ...run, 
        status: newStatus, 
        endTime: endTime 
    };

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
    syncStatus,
    actions: {
      addClass,
      addClassWithStudents,
      addStudentsToClass,
      removeClass,
      addGroup,
      removeGroup,
      startRun,
      stopRunTimer,
      toggleBeaconStatus,
      completeRun,
      addBeacon,
      updateBeacon,
      removeBeacon
    }
  };
};
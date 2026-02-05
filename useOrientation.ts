import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import { db } from './firebase';
import { GameState, Beacon, StudentGroup, ActiveRun, Level } from './types';

// Default initial state
const INITIAL_STATE: GameState = {
  beacons: [
    { id: 'b1', code: '31', level: 'N1', points: 10 },
    { id: 'b2', code: '32', level: 'N1', points: 10 },
    { id: 'b3', code: '45', level: 'N2', points: 20 },
    { id: 'b4', code: '46', level: 'N2', points: 20 },
    { id: 'b5', code: '60', level: 'N3', points: 30 },
  ],
  groups: [
    { id: 'g1', name: 'Équipe Alpha', members: ['Léo', 'Tom'], totalPoints: 0 },
    { id: 'g2', name: 'Équipe Beta', members: ['Sarah', 'Mia'], totalPoints: 0 },
  ],
  runs: []
};

// Helper to calculate time limits
export const getTimeLimit = (beaconCount: number): number => {
  if (beaconCount <= 1) return 360; // 6 min
  if (beaconCount === 2) return 480; // 8 min
  return 600; // 10 min for 3+
};

export const useOrientation = () => {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Initialize Firebase Listener
  useEffect(() => {
    try {
      const docRef = doc(db, 'sessions', 'current-race');
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setState(docSnap.data() as GameState);
          setIsOfflineMode(false);
        } else {
          // Initialize if empty
          setDoc(docRef, INITIAL_STATE);
        }
        setLoading(false);
      }, (error) => {
        console.warn("Firebase connection failed (likely config), falling back to local state.", error);
        setIsOfflineMode(true);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Firebase init error, using offline mode.");
      setIsOfflineMode(true);
      setLoading(false);
    }
  }, []);

  // Sync state helper (for offline mode)
  const syncState = (newState: GameState) => {
    setState(newState);
    if (!isOfflineMode) {
      const docRef = doc(db, 'sessions', 'current-race');
      updateDoc(docRef, newState as any).catch(e => console.error("Sync failed", e));
    }
  };

  // --- ACTIONS ---

  const addGroup = (name: string, members: string[]) => {
    const newGroup: StudentGroup = {
      id: crypto.randomUUID(),
      name,
      members,
      totalPoints: 0
    };
    const newState = { ...state, groups: [...state.groups, newGroup] };
    syncState(newState);
  };

  const startRun = (groupId: string, beaconIds: string[]) => {
    const duration = getTimeLimit(beaconIds.length);
    const newRun: ActiveRun = {
      id: crypto.randomUUID(),
      groupId,
      beaconIds,
      startTime: Date.now(),
      durationLimit: duration,
      status: 'running'
    };

    // Remove any existing active runs for this group to prevent duplicates
    const filteredRuns = state.runs.filter(r => r.groupId !== groupId || r.status === 'completed' || r.status === 'failed');
    
    const newState = { ...state, runs: [...filteredRuns, newRun] };
    syncState(newState);
  };

  const completeRun = (runId: string, success: boolean) => {
    const runIndex = state.runs.findIndex(r => r.id === runId);
    if (runIndex === -1) return;

    const run = state.runs[runIndex];
    const newStatus = success ? 'completed' : 'failed';
    
    // Calculate points
    let pointsToAdd = 0;
    if (success) {
      const runBeacons = state.beacons.filter(b => run.beaconIds.includes(b.id));
      pointsToAdd = runBeacons.reduce((acc, b) => acc + b.points, 0);
    }

    // Update Group Points
    const groupIndex = state.groups.findIndex(g => g.id === run.groupId);
    const updatedGroups = [...state.groups];
    if (groupIndex !== -1) {
      updatedGroups[groupIndex] = {
        ...updatedGroups[groupIndex],
        totalPoints: updatedGroups[groupIndex].totalPoints + pointsToAdd
      };
    }

    // Update Run
    const updatedRuns = [...state.runs];
    updatedRuns[runIndex] = { ...run, status: newStatus, endTime: Date.now() };

    const newState = { ...state, groups: updatedGroups, runs: updatedRuns };
    syncState(newState);
  };

  const addBeacon = (code: string, level: Level, points: number) => {
    const newBeacon: Beacon = {
      id: crypto.randomUUID(),
      code,
      level,
      points
    };
    const newState = { ...state, beacons: [...state.beacons, newBeacon] };
    syncState(newState);
  };

  return {
    state,
    loading,
    isOfflineMode,
    actions: {
      addGroup,
      startRun,
      completeRun,
      addBeacon
    }
  };
};
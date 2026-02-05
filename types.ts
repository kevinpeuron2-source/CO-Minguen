export type Level = 'N1' | 'N2' | 'N3';

export type RunStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface Beacon {
  id: string;
  code: string;
  level: Level;
  points: number;
  punchCode: string; // Chaîne de 25 caractères ('0' ou '1') représentant une grille 5x5
}

export interface ClassRoom {
  id: string;
  name: string; // Ex: "6ème B"
  students: string[]; // Liste des noms d'élèves
}

export interface StudentGroup {
  id: string;
  name: string;
  members: string[]; // List of student names
  totalPoints: number;
}

export interface ActiveRun {
  id: string;
  groupId: string;
  beaconIds: string[]; // IDs of beacons being searched for
  startTime: number; // Timestamp in ms
  durationLimit: number; // In seconds
  status: RunStatus;
  endTime?: number;
}

export interface GameState {
  beacons: Beacon[];
  classes: ClassRoom[]; // Ajout des classes
  groups: StudentGroup[];
  runs: ActiveRun[];
}
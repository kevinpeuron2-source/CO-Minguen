export type BaliseStatus = 'inactive' | 'searching' | 'found' | 'timeout';

export type Level = 'N1' | 'N2' | 'N3';

export interface Student {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
  studentIds: string[];
}

export interface ClassRoom {
  id: string;
  name: string;
  students: Student[];
  groups: Group[];
}

export interface Balise {
  id: string;
  number: string;
  level: Level;
  status: BaliseStatus;
  startTime: number | null; // Timestamp in ms
  endTime: number | null;   // Timestamp in ms
  duration: number;         // Duration in seconds (calculated on completion)
  assignedEntityId?: string; // ID of the group OR student searching
  assignedEntityName?: string; // Name snapshot for display
  assignedEntityType?: 'group' | 'student';
}

export interface GameStats {
  totalFound: number;
  totalTimeout: number;
  avgTime: number; // in seconds
  points: number;
}
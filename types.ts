
export enum TeamSide {
  A = 'A',
  B = 'B',
}

export enum RaidOutcome {
  EMPTY = 'Empty',
  SUCCESS = 'Success',
  SUPER_RAID = 'Super Raid',
  TACKLE = 'Tackle',
  SUPER_TACKLE = 'Super Tackle',
  DO_OR_DIE_FAIL = 'Do or Die Fail',
}

export interface Player {
  id: string;
  name: string;
  number: string;
}

export interface MatchEvent {
  id: string;
  timestamp: number;
  matchTime: number;
  team: TeamSide;
  type: 'RAID' | 'DEFENSE' | 'SYSTEM' | 'MANUAL';
  description: string;
  pointsA: number;
  pointsB: number;
  deltaA: number;
  deltaB: number;
}

export interface TeamState {
  name: string;
  score: number;
  activePlayers: number; // 0-7
  players: Player[]; // Roster
  allOuts: number;
  raids: {
    total: number;
    successful: number;
    empty: number;
    failed: number;
  };
  tackles: {
    total: number;
    successful: number;
    failed: number;
    superTackles: number;
  };
  consecutiveEmptyRaids: number;
}

export interface MatchState {
  isRunning: boolean;
  isPaused: boolean;
  matchDuration: number; // in seconds (e.g., 2400 for 40 mins)
  elapsedTime: number;
  raidClock: number; // 30 seconds
  isRaidActive: boolean;
  currentRaider: TeamSide;
  teamA: TeamState;
  teamB: TeamState;
  history: MatchEvent[];
}

// --- Tournament Types ---
export interface TournamentMatch {
  id: string;
  roundIndex: number;
  matchIndex: number;
  teamAName: string | null;
  teamBName: string | null;
  winner: 'A' | 'B' | null;
  scoreSummary?: string;
  status: 'SCHEDULED' | 'PLAYED';
}

export interface Tournament {
  rounds: TournamentMatch[][]; // Array of rounds, each containing matches
}

export type MatchAction =
  | { type: 'START_MATCH' }
  | { type: 'PAUSE_MATCH' }
  | { type: 'TICK' }
  | { type: 'START_RAID'; team: TeamSide }
  | { type: 'END_RAID' }
  | { type: 'SCORE_UPDATE'; team: TeamSide; points: number; description: string; eventType: 'RAID' | 'DEFENSE' | 'SYSTEM' | 'MANUAL' }
  | { type: 'PLAYER_OUT'; team: TeamSide; count: number }
  | { type: 'PLAYER_REVIVE'; team: TeamSide; count: number }
  | { type: 'ALL_OUT'; concedingTeam: TeamSide }
  | { type: 'RESET_RAID_CLOCK' }
  | { type: 'SET_TEAM_NAMES'; nameA: string; nameB: string }
  | { type: 'SET_EMPTY_RAID_COUNT'; team: TeamSide; count: number }
  | { type: 'ADJUST_TIME'; seconds: number }
  | { type: 'SET_MATCH_DURATION'; minutes: number }
  | { type: 'TRIGGER_HALF_TIME' }
  | { type: 'ADD_PLAYER'; team: TeamSide; name: string; number: string }
  | { type: 'REMOVE_PLAYER'; team: TeamSide; id: string };

// --- Audio Types ---
export type SoundType = 'MATCH_START' | 'MATCH_END' | 'HALF_TIME' | 'RAID_START' | 'DO_OR_DIE' | 'RAID_WARNING' | 'RAID_TICK' | 'RAID_OVER';

export type SoundMap = Record<SoundType, string | null>;

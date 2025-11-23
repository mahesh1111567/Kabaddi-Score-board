
import React, { useReducer, useEffect, useRef, useState } from 'react';
import { MatchState, MatchAction, TeamSide, RaidOutcome, TeamState, Tournament, TournamentMatch, SoundType, SoundMap } from './types';
import { MATCH_DURATION_SEC, MAX_PLAYERS, POINTS_ALL_OUT, RAID_DURATION_SEC, EMPTY_RAID_LIMIT } from './constants';
import ScoreBoard from './components/ScoreBoard';
import MatchClock from './components/MatchClock';
import ControlPanel from './components/ControlPanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import TeamManager from './components/TeamManager';
import TournamentBracket from './components/TournamentBracket';
import SoundManager from './components/SoundManager';
import MusicPlayer from './components/MusicPlayer';
import { Play, Pause, Settings, Trophy, LayoutDashboard, Users as UsersIcon, Music, Disc } from 'lucide-react';

// Initial State
const initialTeamState = (name: string): TeamState => ({
  name,
  score: 0,
  activePlayers: MAX_PLAYERS,
  players: [],
  allOuts: 0,
  raids: { total: 0, successful: 0, empty: 0, failed: 0 },
  tackles: { total: 0, successful: 0, failed: 0, superTackles: 0 },
  consecutiveEmptyRaids: 0,
});

const initialState: MatchState = {
  isRunning: false,
  isPaused: false,
  matchDuration: MATCH_DURATION_SEC,
  elapsedTime: 0,
  raidClock: RAID_DURATION_SEC,
  isRaidActive: false,
  currentRaider: TeamSide.A,
  teamA: initialTeamState("Team A"),
  teamB: initialTeamState("Team B"),
  history: [],
};

// Reducer
const matchReducer = (state: MatchState, action: MatchAction): MatchState => {
  switch (action.type) {
    case 'START_MATCH':
      return { ...state, isRunning: true, isPaused: false };
    case 'PAUSE_MATCH':
      return { ...state, isRunning: false, isPaused: true };
    case 'TICK':
      if (!state.isRunning) return state;
      const newElapsed = state.elapsedTime + 1;
      
      let newRaidClock = state.raidClock;

      if (state.isRaidActive) {
        newRaidClock -= 1;
        if (newRaidClock <= 0) {
           newRaidClock = 0;
        }
      }

      return { 
        ...state, 
        elapsedTime: newElapsed, 
        raidClock: newRaidClock,
        isRunning: newElapsed < state.matchDuration && state.isRunning
      };
    
    case 'START_RAID':
      return {
        ...state,
        isRaidActive: true,
        currentRaider: action.team,
        raidClock: RAID_DURATION_SEC,
      };

    case 'SCORE_UPDATE': {
        const isTeamA = action.team === TeamSide.A;
        const targetTeam = isTeamA ? 'teamA' : 'teamB';
        const shouldStopRaid = action.eventType !== 'MANUAL';
        
        const newState = {
            ...state,
            [targetTeam]: {
                ...state[targetTeam],
                score: Math.max(0, state[targetTeam].score + action.points)
            },
            history: [
                {
                    id: Date.now().toString(),
                    timestamp: Date.now(),
                    matchTime: state.elapsedTime,
                    team: action.team,
                    type: action.eventType,
                    description: action.description,
                    pointsA: isTeamA ? Math.max(0, state.teamA.score + action.points) : state.teamA.score,
                    pointsB: isTeamA ? state.teamB.score : Math.max(0, state.teamB.score + action.points),
                    deltaA: isTeamA ? action.points : 0,
                    deltaB: isTeamA ? 0 : action.points
                },
                ...state.history
            ],
            isRaidActive: shouldStopRaid ? false : state.isRaidActive
        };
        return newState;
    }
    
    case 'PLAYER_OUT': {
        const target = action.team === TeamSide.A ? 'teamA' : 'teamB';
        return {
            ...state,
            [target]: {
                ...state[target],
                activePlayers: Math.max(0, state[target].activePlayers - action.count)
            }
        };
    }

    case 'PLAYER_REVIVE': {
        const target = action.team === TeamSide.A ? 'teamA' : 'teamB';
        return {
            ...state,
            [target]: {
                ...state[target],
                activePlayers: Math.min(MAX_PLAYERS, state[target].activePlayers + action.count)
            }
        };
    }

    case 'ALL_OUT': {
        const scoringTeam = action.concedingTeam === TeamSide.A ? 'teamB' : 'teamA';
        const concedingTeam = action.concedingTeam === TeamSide.A ? 'teamA' : 'teamB';
        
        return {
            ...state,
            [scoringTeam]: {
                ...state[scoringTeam],
                score: state[scoringTeam].score + POINTS_ALL_OUT,
                allOuts: state[scoringTeam].allOuts + 1
            },
            [concedingTeam]: {
                ...state[concedingTeam],
                activePlayers: MAX_PLAYERS // Reset players
            },
            history: [
                {
                    id: Date.now().toString(),
                    timestamp: Date.now(),
                    matchTime: state.elapsedTime,
                    team: action.concedingTeam === TeamSide.A ? TeamSide.B : TeamSide.A,
                    type: 'SYSTEM',
                    description: `ALL OUT! +2 Points to ${state[scoringTeam].name}`,
                    pointsA: state.teamA.score + (action.concedingTeam === TeamSide.B ? 2 : 0),
                    pointsB: state.teamB.score + (action.concedingTeam === TeamSide.A ? 2 : 0),
                    deltaA: action.concedingTeam === TeamSide.B ? 2 : 0,
                    deltaB: action.concedingTeam === TeamSide.A ? 2 : 0
                },
                ...state.history
            ]
        }
    }

    case 'SET_TEAM_NAMES':
        return {
            ...state,
            teamA: { ...state.teamA, name: action.nameA },
            teamB: { ...state.teamB, name: action.nameB }
        };
    
    case 'SET_EMPTY_RAID_COUNT': {
        const target = action.team === TeamSide.A ? 'teamA' : 'teamB';
        return {
            ...state,
            [target]: {
                ...state[target],
                consecutiveEmptyRaids: action.count
            }
        };
    }

    case 'ADJUST_TIME': {
        const newElapsed = state.elapsedTime - action.seconds;
        const clampedElapsed = Math.max(0, Math.min(state.matchDuration, newElapsed));
        
        return {
            ...state,
            elapsedTime: clampedElapsed
        };
    }

    case 'SET_MATCH_DURATION':
        return {
            ...state,
            matchDuration: action.minutes * 60
        };

    case 'RESET_RAID_CLOCK':
        return {
            ...state,
            raidClock: RAID_DURATION_SEC
        };

    case 'TRIGGER_HALF_TIME':
        return {
            ...state,
            elapsedTime: 1200, // 20 minutes
            isRaidActive: false,
            raidClock: RAID_DURATION_SEC,
            isRunning: false,
            isPaused: true,
            history: [
                {
                    id: Date.now().toString(),
                    timestamp: Date.now(),
                    matchTime: 1200,
                    team: TeamSide.A, // Attribution doesn't matter for System
                    type: 'SYSTEM',
                    description: "Half Time",
                    pointsA: state.teamA.score,
                    pointsB: state.teamB.score,
                    deltaA: 0,
                    deltaB: 0
                },
                ...state.history
            ]
        };

    case 'ADD_PLAYER': {
        const target = action.team === TeamSide.A ? 'teamA' : 'teamB';
        const newPlayer = {
            id: Date.now().toString(),
            name: action.name,
            number: action.number
        };
        return {
            ...state,
            [target]: {
                ...state[target],
                players: [...state[target].players, newPlayer]
            }
        };
    }

    case 'REMOVE_PLAYER': {
        const target = action.team === TeamSide.A ? 'teamA' : 'teamB';
        return {
            ...state,
            [target]: {
                ...state[target],
                players: state[target].players.filter(p => p.id !== action.id)
            }
        };
    }

    default:
      return state;
  }
};

type ViewMode = 'SCOREBOARD' | 'TOURNAMENT';

const App: React.FC = () => {
  const [state, dispatch] = useReducer(matchReducer, initialState);
  const [viewMode, setViewMode] = useState<ViewMode>('SCOREBOARD');
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);
  const [isSoundManagerOpen, setIsSoundManagerOpen] = useState(false);
  const [isMusicPlayerOpen, setIsMusicPlayerOpen] = useState(false);
  
  const timerRef = useRef<number | null>(null);
  const prevRaidClock = useRef(state.raidClock);
  const prevElapsed = useRef(state.elapsedTime);

  // --- Custom Sounds State ---
  const [customSounds, setCustomSounds] = useState<SoundMap>({
    'MATCH_START': null,
    'MATCH_END': null,
    'HALF_TIME': null,
    'RAID_START': null,
    'DO_OR_DIE': null,
    'RAID_WARNING': null,
    'RAID_TICK': null,
    'RAID_OVER': null,
  });

  // Tournament State with localStorage Persistence
  const [tournament, setTournament] = useState<Tournament>(() => {
      try {
          const saved = localStorage.getItem('kabaddi_tournament_data');
          return saved ? JSON.parse(saved) : { rounds: [[]] };
      } catch (e) {
          console.error("Failed to load tournament data", e);
          return { rounds: [[]] };
      }
  });

  // Persist changes to localStorage
  useEffect(() => {
      localStorage.setItem('kabaddi_tournament_data', JSON.stringify(tournament));
  }, [tournament]);

  useEffect(() => {
    if (state.isRunning) {
      timerRef.current = window.setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.isRunning]);

  // --- Sound Logic ---
  const playSound = (type: SoundType) => {
      // 1. Try Custom Sound
      if (customSounds[type]) {
          const audio = new Audio(customSounds[type]!);
          audio.play().catch(e => console.warn("Audio Playback Blocked", e));
          return;
      }

      // 2. Fallback to Synthesized Sound
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const now = ctx.currentTime;

        switch (type) {
            case 'MATCH_START': // Whistle
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(1500, now);
                osc.frequency.exponentialRampToValueAtTime(2500, now + 0.1);
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
                osc.start(now);
                osc.stop(now + 0.8);
                break;

            case 'MATCH_END': // Long Whistle
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(2000, now);
                osc.frequency.linearRampToValueAtTime(1500, now + 1.5);
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 1.5);
                osc.start(now);
                osc.stop(now + 1.5);
                break;

            case 'HALF_TIME': // Double Whistle
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(2000, now);
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                
                // Second beep
                setTimeout(() => {
                    const ctx2 = new AudioContext();
                    const osc2 = ctx2.createOscillator();
                    const gain2 = ctx2.createGain();
                    osc2.connect(gain2);
                    gain2.connect(ctx2.destination);
                    osc2.type = 'triangle';
                    osc2.frequency.setValueAtTime(2000, ctx2.currentTime);
                    gain2.gain.setValueAtTime(0.5, ctx2.currentTime);
                    gain2.gain.linearRampToValueAtTime(0.01, ctx2.currentTime + 0.4);
                    osc2.start(ctx2.currentTime);
                    osc2.stop(ctx2.currentTime + 0.4);
                }, 400);
                break;

            case 'DO_OR_DIE': // Alarm / Siren
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.linearRampToValueAtTime(800, now + 0.2);
                osc.frequency.linearRampToValueAtTime(600, now + 0.4);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
                osc.start(now);
                osc.stop(now + 0.6);
                break;

            case 'RAID_WARNING': // 10s Warning (High pitched alert)
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.setValueAtTime(440, now + 0.15);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;

            case 'RAID_TICK': // Ticking for last few seconds
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, now);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;

            case 'RAID_START': // Breath / Low Thud
                 osc.type = 'sine';
                 osc.frequency.setValueAtTime(150, now);
                 osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
                 gain.gain.setValueAtTime(0.6, now);
                 gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
                 osc.start(now);
                 osc.stop(now + 0.3);
                 break;

            case 'RAID_OVER': // Buzzer
            default:
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(100, now + 0.5);
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
                break;
        }
      } catch (e) {
        console.error("Audio play failed", e);
      }
  };

  const handleUpdateSound = (type: SoundType, url: string | null) => {
      setCustomSounds(prev => ({ ...prev, [type]: url }));
  };

  // --- Sound Effects Monitor ---
  useEffect(() => {
     // 1. Raid Events
     if (state.isRaidActive) {
        // Raid Start Logic handled in handleRaidStart to allow Do-or-Die check

        // 10s Warning
        if (state.raidClock === 10 && prevRaidClock.current > 10) {
            playSound('RAID_WARNING');
        }
        
        // Ticking (5s, 4s, 3s, 2s, 1s)
        if (state.raidClock <= 5 && state.raidClock > 0 && state.raidClock < prevRaidClock.current) {
            playSound('RAID_TICK');
        }

        // Raid Over
        if (prevRaidClock.current > 0 && state.raidClock === 0) {
            playSound('RAID_OVER');
        }
     }
     prevRaidClock.current = state.raidClock;
  
     // 2. Match Events
     if (state.elapsedTime > 0) {
         // Match End
         if (state.elapsedTime >= state.matchDuration && prevElapsed.current < state.matchDuration) {
             playSound('MATCH_END');
         }
         // Half Time (20m mark in a 40m game or manually triggered to 1200)
         if (state.matchDuration >= 2400 && state.elapsedTime === 1200 && prevElapsed.current !== 1200) {
             playSound('HALF_TIME');
         }
     }
     prevElapsed.current = state.elapsedTime;
  }, [state.raidClock, state.elapsedTime, state.isRaidActive, state.isRunning, state.matchDuration]);

  // --- Game Logic Helpers ---

  const handleStartMatch = () => {
      if (!state.isRunning) {
          playSound('MATCH_START');
          dispatch({type: 'START_MATCH'});
      } else {
          dispatch({type: 'PAUSE_MATCH'});
      }
  };

  const handleRaidStart = (team: TeamSide) => {
    dispatch({ type: 'START_RAID', team });
    
    // Check for Do-Or-Die
    const currentTeamState = team === TeamSide.A ? state.teamA : state.teamB;
    if (currentTeamState.consecutiveEmptyRaids === 2) {
        playSound('DO_OR_DIE');
    } else {
        playSound('RAID_START');
    }
  };

  const handleRaidAction = (outcome: RaidOutcome, points: number) => {
    const raiderSide = state.currentRaider;
    const defenderSide = raiderSide === TeamSide.A ? TeamSide.B : TeamSide.A;
    const currentEmptyCount = state[raiderSide === TeamSide.A ? 'teamA' : 'teamB'].consecutiveEmptyRaids;
    
    if (outcome === RaidOutcome.SUCCESS) {
        dispatch({ type: 'SET_EMPTY_RAID_COUNT', team: raiderSide, count: 0 });

        if (points === 0.5) { 
             dispatch({ type: 'SCORE_UPDATE', team: raiderSide, points: 1, description: "Bonus Point", eventType: 'RAID' });
        } else {
             dispatch({ type: 'SCORE_UPDATE', team: raiderSide, points: points, description: `Touch Point (+${points})`, eventType: 'RAID' });
             dispatch({ type: 'PLAYER_OUT', team: defenderSide, count: points });
             dispatch({ type: 'PLAYER_REVIVE', team: raiderSide, count: points });
        }

    } else if (outcome === RaidOutcome.TACKLE || outcome === RaidOutcome.SUPER_TACKLE) {
        dispatch({ type: 'SET_EMPTY_RAID_COUNT', team: raiderSide, count: 0 });

        const pointVal = outcome === RaidOutcome.SUPER_TACKLE ? 2 : 1;
        const desc = outcome === RaidOutcome.SUPER_TACKLE ? "SUPER TACKLE!" : "Tackle Success";
        
        dispatch({ type: 'SCORE_UPDATE', team: defenderSide, points: pointVal, description: desc, eventType: 'DEFENSE' });
        dispatch({ type: 'PLAYER_OUT', team: raiderSide, count: 1 }); 
        dispatch({ type: 'PLAYER_REVIVE', team: defenderSide, count: 1 }); 
    
    } else if (outcome === RaidOutcome.EMPTY) {
        if (currentEmptyCount >= EMPTY_RAID_LIMIT - 1) {
            dispatch({ type: 'SCORE_UPDATE', team: defenderSide, points: 1, description: "Do-or-Die Fail (Raider Out)", eventType: 'DEFENSE' });
            dispatch({ type: 'PLAYER_OUT', team: raiderSide, count: 1 });
            dispatch({ type: 'PLAYER_REVIVE', team: defenderSide, count: 1 });
            dispatch({ type: 'SET_EMPTY_RAID_COUNT', team: raiderSide, count: 0 }); 
        } else {
            dispatch({ type: 'SCORE_UPDATE', team: raiderSide, points: 0, description: "Empty Raid", eventType: 'RAID' });
            dispatch({ type: 'SET_EMPTY_RAID_COUNT', team: raiderSide, count: currentEmptyCount + 1 });
        }
    }
  };

  useEffect(() => {
    if (state.teamA.activePlayers === 0) {
        dispatch({ type: 'ALL_OUT', concedingTeam: TeamSide.A });
    }
    if (state.teamB.activePlayers === 0) {
        dispatch({ type: 'ALL_OUT', concedingTeam: TeamSide.B });
    }
  }, [state.teamA.activePlayers, state.teamB.activePlayers]);

  const loadTournamentMatch = (match: TournamentMatch) => {
      if (match.teamAName && match.teamBName) {
          dispatch({ type: 'SET_TEAM_NAMES', nameA: match.teamAName, nameB: match.teamBName });
          // Optionally reset score if starting new match
          // For now we just update names
          setViewMode('SCOREBOARD');
      }
  };

  return (
    <div className="min-h-screen bg-surface-dark flex flex-col items-center p-4 md:p-8">
      
      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-4">
             <div className="bg-gradient-to-br from-kabaddi-orange to-red-600 p-2 rounded-lg">
                <Settings className="text-white" size={20} />
             </div>
             <h1 className="text-xl font-bold text-white tracking-wide hidden md:block">PRO KABADDI ANALYTICS</h1>
             
             <div className="flex gap-2 ml-4 bg-surface-card p-1 rounded-lg border border-gray-700">
                <button 
                   onClick={() => setViewMode('SCOREBOARD')}
                   className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold transition ${viewMode === 'SCOREBOARD' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                   <LayoutDashboard size={14} /> Match Board
                </button>
                <button 
                   onClick={() => setViewMode('TOURNAMENT')}
                   className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold transition ${viewMode === 'TOURNAMENT' ? 'bg-kabaddi-orange text-white' : 'text-gray-400 hover:text-white'}`}
                >
                   <Trophy size={14} /> Tournament
                </button>
             </div>
        </div>

        {viewMode === 'SCOREBOARD' && (
            <>
                <MatchClock 
                    elapsedTime={state.elapsedTime} 
                    totalTime={state.matchDuration}
                    raidTime={state.raidClock}
                    isRaidActive={state.isRaidActive}
                    isRunning={state.isRunning}
                    dispatch={dispatch}
                />

                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsMusicPlayerOpen(true)}
                        className="flex items-center gap-2 px-3 py-3 bg-surface-card hover:bg-surface-highlight border border-gray-700 rounded-lg text-xs font-bold text-pink-400 transition"
                        title="Stadium DJ"
                    >
                        <Disc size={16} />
                    </button>

                    <button 
                        onClick={() => setIsSoundManagerOpen(true)}
                        className="flex items-center gap-2 px-3 py-3 bg-surface-card hover:bg-surface-highlight border border-gray-700 rounded-lg text-xs font-bold text-purple-400 transition"
                        title="SFX Manager"
                    >
                        <Music size={16} />
                    </button>
                    
                    <button 
                        onClick={() => setIsTeamManagerOpen(true)}
                        className="flex items-center gap-2 px-3 py-3 bg-surface-card hover:bg-surface-highlight border border-gray-700 rounded-lg text-xs font-bold text-gray-300 transition"
                        title="Manage Roster"
                    >
                        <UsersIcon size={16} />
                    </button>
                    
                    <button 
                        onClick={handleStartMatch}
                        className={`
                            flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition
                            ${state.isRunning 
                                ? 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20' 
                                : 'bg-green-500/10 text-green-500 border border-green-500/50 hover:bg-green-500/20'
                            }
                        `}
                    >
                        {state.isRunning ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Start Match</>}
                    </button>
                </div>
            </>
        )}
      </header>

      {/* Main Content View Switcher */}
      <main className="w-full max-w-6xl flex flex-col items-center flex-1">
        {viewMode === 'SCOREBOARD' ? (
            <>
                {/* Team Name Configuration Form */}
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-surface-card p-4 rounded-xl border border-gray-800 flex items-center gap-4 shadow-lg focus-within:border-kabaddi-orange transition-all group">
                        <div className="p-2 rounded-lg bg-kabaddi-orange/10 text-kabaddi-orange group-focus-within:bg-kabaddi-orange group-focus-within:text-white transition-colors">
                            <span className="font-black text-lg">A</span>
                        </div>
                        <div className="flex-1">
                            <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Team Name</label>
                            <input 
                                type="text" 
                                value={state.teamA.name}
                                onChange={(e) => dispatch({ type: 'SET_TEAM_NAMES', nameA: e.target.value, nameB: state.teamB.name })}
                                className="w-full bg-transparent border-none outline-none text-white font-bold text-xl placeholder-gray-700 focus:ring-0"
                                placeholder="Enter Team A Name"
                            />
                        </div>
                    </div>

                    <div className="bg-surface-card p-4 rounded-xl border border-gray-800 flex items-center gap-4 shadow-lg focus-within:border-kabaddi-blue transition-all group flex-row-reverse">
                        <div className="p-2 rounded-lg bg-kabaddi-blue/10 text-kabaddi-blue group-focus-within:bg-kabaddi-blue group-focus-within:text-white transition-colors">
                            <span className="font-black text-lg">B</span>
                        </div>
                        <div className="flex-1 text-right">
                            <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Team Name</label>
                            <input 
                                type="text" 
                                value={state.teamB.name}
                                onChange={(e) => dispatch({ type: 'SET_TEAM_NAMES', nameA: state.teamA.name, nameB: e.target.value })}
                                className="w-full bg-transparent border-none outline-none text-white font-bold text-xl text-right placeholder-gray-700 focus:ring-0"
                                placeholder="Enter Team B Name"
                            />
                        </div>
                    </div>
                </div>

                <ScoreBoard 
                    teamA={state.teamA} 
                    teamB={state.teamB} 
                    currentRaider={state.currentRaider}
                    isRaidActive={state.isRaidActive}
                    dispatch={dispatch}
                />

                <ControlPanel 
                    isRaidActive={state.isRaidActive}
                    currentRaider={state.currentRaider}
                    onRaidStart={handleRaidStart}
                    onRaidAction={handleRaidAction}
                    teamA={state.teamA}
                    teamB={state.teamB}
                />

                <AnalyticsPanel matchState={state} />
            </>
        ) : (
            <TournamentBracket 
                tournament={tournament}
                onUpdateTournament={setTournament}
                onPlayMatch={loadTournamentMatch}
            />
        )}

      </main>

      {/* Event Ticker (Only on Scoreboard) */}
      {viewMode === 'SCOREBOARD' && (
          <footer className="fixed bottom-0 left-0 w-full bg-surface-card border-t border-gray-800 py-2 px-4 overflow-hidden z-20">
              <div className="flex gap-8 text-xs font-mono text-gray-400 whitespace-nowrap animate-marquee">
                  {state.history.length === 0 && <span>Waiting for match start...</span>}
                  {state.history.slice(0, 10).map(e => (
                      <span key={e.id} className="flex items-center gap-2">
                          <span className="text-gray-600">[{Math.floor(e.matchTime/60)}:{String(e.matchTime%60).padStart(2,'0')}]</span>
                          <span className={e.team === TeamSide.A ? 'text-kabaddi-orange' : 'text-kabaddi-blue'}>
                              {e.team === TeamSide.A ? state.teamA.name : state.teamB.name}
                          </span>
                          <span className="text-white">{e.description}</span>
                      </span>
                  ))}
              </div>
          </footer>
      )}

      <TeamManager 
         isOpen={isTeamManagerOpen}
         onClose={() => setIsTeamManagerOpen(false)}
         teamA={state.teamA}
         teamB={state.teamB}
         dispatch={dispatch}
      />

      <SoundManager
        isOpen={isSoundManagerOpen}
        onClose={() => setIsSoundManagerOpen(false)}
        customSounds={customSounds}
        onUpdateSound={handleUpdateSound}
        previewSound={playSound}
      />
      
      {/* Stadium DJ Music Player */}
      <MusicPlayer 
        isOpen={isMusicPlayerOpen}
        onClose={() => setIsMusicPlayerOpen(false)}
      />
    </div>
  );
};

export default App;

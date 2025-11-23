
import React, { useState } from 'react';
import { Tournament, TournamentMatch } from '../types';
import { Trophy, Plus, Play, Medal, Shield, Trash2, Cpu, UserCog, Lock, Unlock } from 'lucide-react';

interface TournamentBracketProps {
  tournament: Tournament;
  onUpdateTournament: (t: Tournament) => void;
  onPlayMatch: (match: TournamentMatch) => void;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ tournament, onUpdateTournament, onPlayMatch }) => {
  const [isAutoMode, setIsAutoMode] = useState(true);

  // Helper to find or create a match slot in the next round
  const ensureNextRoundSlot = (rounds: TournamentMatch[][], currentRoundIdx: number, currentMatchIdx: number) => {
    const nextRoundIdx = currentRoundIdx + 1;
    const targetMatchIdx = Math.floor(currentMatchIdx / 2);

    // Create next round if it doesn't exist
    if (!rounds[nextRoundIdx]) {
      rounds[nextRoundIdx] = [];
    }

    // Create target match slot if it doesn't exist
    if (!rounds[nextRoundIdx][targetMatchIdx]) {
      rounds[nextRoundIdx][targetMatchIdx] = {
        id: `r${nextRoundIdx}-m${targetMatchIdx}-${Date.now()}`,
        roundIndex: nextRoundIdx,
        matchIndex: targetMatchIdx,
        teamAName: null,
        teamBName: null,
        winner: null,
        status: 'SCHEDULED'
      };
    }
    return rounds;
  };

  const addMatchToRound = (roundIdx: number) => {
    const newRounds = [...tournament.rounds];
    
    // Ensure all previous rounds exist up to this point
    for (let i = 0; i <= roundIdx; i++) {
        if (!newRounds[i]) newRounds[i] = [];
    }
    
    const matchIdx = newRounds[roundIdx].length;
    
    // Create new match
    newRounds[roundIdx].push({
      id: `r${roundIdx}-m${matchIdx}-${Date.now()}`,
      roundIndex: roundIdx,
      matchIndex: matchIdx,
      teamAName: roundIdx === 0 ? `Team ${matchIdx * 2 + 1}` : null,
      teamBName: roundIdx === 0 ? `Team ${matchIdx * 2 + 2}` : null,
      winner: null,
      status: 'SCHEDULED'
    });

    // In Auto mode, adding to Round 0 should ensure Round 1 slots exist
    if (isAutoMode && roundIdx === 0) {
        const updatedRounds = ensureNextRoundSlot(newRounds, 0, matchIdx);
        onUpdateTournament({ rounds: updatedRounds });
    } else {
        onUpdateTournament({ rounds: newRounds });
    }
  };

  const updateTeamName = (roundIdx: number, matchIdx: number, team: 'A' | 'B', name: string) => {
    const newRounds = [...tournament.rounds];
    const match = newRounds[roundIdx][matchIdx];
    
    if (team === 'A') match.teamAName = name;
    else match.teamBName = name;
    
    onUpdateTournament({ rounds: newRounds });
  };

  const setWinner = (roundIdx: number, matchIdx: number, winner: 'A' | 'B') => {
    let newRounds = [...tournament.rounds];
    const match = newRounds[roundIdx][matchIdx];
    
    // 1. Set winner for current match
    match.winner = winner;
    match.status = 'PLAYED';
    match.scoreSummary = 'Winner Decided';

    // 2. Advance to next round (Both Auto and Manual mode trigger this for convenience, 
    // but Manual users can overwrite it later)
    const nextRoundIdx = roundIdx + 1;
    const nextMatchIdx = Math.floor(matchIdx / 2);
    const isTeamAInNext = matchIdx % 2 === 0; // Even index goes to Team A, Odd goes to Team B

    // Ensure next round exists
    newRounds = ensureNextRoundSlot(newRounds, roundIdx, matchIdx);
    
    const nextMatch = newRounds[nextRoundIdx][nextMatchIdx];
    const winnerName = winner === 'A' ? match.teamAName : match.teamBName;

    // Only propagate if the name exists
    if (winnerName) {
        if (isTeamAInNext) {
            nextMatch.teamAName = winnerName;
        } else {
            nextMatch.teamBName = winnerName;
        }
    }
    
    // Reset winner in next match if we changed the entrant (to avoid stale winners)
    if (nextMatch.winner) {
        // Optional: keep next match winner if it was already played? 
        // For now, let's leave it alone if it's played, or reset if scheduled.
        if (nextMatch.status === 'SCHEDULED') {
             nextMatch.winner = null;
        }
    }

    onUpdateTournament({ rounds: newRounds });
  };

  const clearTournament = () => {
      if (window.confirm("Are you sure you want to clear the tournament? This cannot be undone.")) {
          onUpdateTournament({ rounds: [[]] });
      }
  };

  return (
    <div className="w-full h-full flex flex-col bg-surface-dark overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-gray-800 bg-surface-card/50 gap-4">
        <div className="flex items-center gap-3">
            <div className="bg-yellow-600/20 p-3 rounded-xl text-yellow-500">
                <Trophy size={28} />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-white">Tournament Bracket</h1>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>Manage rounds and matches</span>
                    <span className="text-gray-600">•</span>
                    <span className={`flex items-center gap-1 text-xs font-bold uppercase px-2 py-0.5 rounded border ${isAutoMode ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' : 'border-purple-500/30 text-purple-400 bg-purple-500/10'}`}>
                        {isAutoMode ? <Cpu size={10} /> : <UserCog size={10} />}
                        {isAutoMode ? 'Auto Mode' : 'Manual Mode'}
                    </span>
                </div>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
            {/* Mode Toggle */}
            <button
                onClick={() => setIsAutoMode(!isAutoMode)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition ${isAutoMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-purple-900/20 border-purple-500 text-purple-300'}`}
            >
                {isAutoMode ? (
                    <>
                        <UserCog size={14} /> Switch to Manual
                    </>
                ) : (
                    <>
                        <Cpu size={14} /> Switch to Auto
                    </>
                )}
            </button>

            <div className="h-6 w-px bg-gray-700 hidden md:block mx-2"></div>

            <button 
                onClick={clearTournament}
                className="p-2 bg-gray-800 hover:bg-red-900/30 text-gray-400 hover:text-red-500 rounded-lg transition border border-gray-700 hover:border-red-900"
                title="Reset Tournament"
            >
                <Trash2 size={18} />
            </button>
            
            <button 
                onClick={() => addMatchToRound(0)}
                className="flex items-center gap-2 px-4 py-2 bg-kabaddi-orange hover:bg-orange-600 text-white rounded-lg font-bold transition shadow-lg shadow-orange-900/20"
            >
                <Plus size={18} /> Add Match (Round 1)
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto p-8">
        <div className="flex gap-12 min-w-max h-full">
            {tournament.rounds.map((round, roundIdx) => (
                <div key={roundIdx} className="flex flex-col gap-6 w-80 min-w-[320px]">
                    <div className="flex items-center justify-between mb-2 border-b border-gray-700 pb-2">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                            {roundIdx === 0 ? 'Round 1' : 
                             roundIdx === tournament.rounds.length - 1 && tournament.rounds.length > 2 ? 'Finals' : 
                             `Round ${roundIdx + 1}`}
                        </h3>
                        <span className="text-xs font-mono text-gray-600 bg-gray-900 px-2 py-0.5 rounded">{round.length} Matches</span>
                    </div>
                    
                    <div className="flex flex-col gap-8 justify-start">
                        {round.map((match, matchIdx) => (
                            <div 
                                key={match.id} 
                                className={`
                                    relative bg-surface-card border rounded-xl overflow-hidden transition-all group
                                    ${match.status === 'PLAYED' ? 'border-green-900/50 opacity-80 hover:opacity-100' : 'border-gray-700 shadow-xl'}
                                `}
                            >
                                {/* Match Header */}
                                <div className="bg-surface-highlight px-4 py-2 flex justify-between items-center border-b border-gray-800">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">Match #{matchIdx + 1}</span>
                                    {match.status === 'SCHEDULED' && match.teamAName && match.teamBName && (
                                        <button 
                                            onClick={() => onPlayMatch(match)}
                                            className="flex items-center gap-1 text-[10px] font-bold text-kabaddi-orange hover:text-white transition"
                                            title="Load into Scoreboard"
                                        >
                                            <Play size={10} /> PLAY
                                        </button>
                                    )}
                                </div>

                                {/* Team A */}
                                <div className={`p-3 flex justify-between items-center ${match.winner === 'A' ? 'bg-green-900/20' : ''}`}>
                                    {/* In Round 1 OR Manual Mode, Input is enabled. In Auto Mode Round > 1, it is text only */}
                                    {(!isAutoMode || roundIdx === 0) ? (
                                        <input 
                                            value={match.teamAName || ''}
                                            onChange={(e) => updateTeamName(roundIdx, matchIdx, 'A', e.target.value)}
                                            className={`bg-transparent text-sm font-bold focus:outline-none w-full placeholder-gray-600 ${match.teamAName ? 'text-white' : 'text-gray-500'}`}
                                            placeholder="TBD"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            {match.teamAName ? (
                                                <span className="text-sm font-bold text-white">{match.teamAName}</span>
                                            ) : (
                                                <span className="text-sm italic text-gray-600">Waiting...</span>
                                            )}
                                            <Lock size={10} className="text-gray-600 opacity-0 group-hover:opacity-100 transition" />
                                        </div>
                                    )}
                                    
                                    {(match.teamAName || !isAutoMode) && (match.teamBName || !isAutoMode) && !match.winner && (
                                        <button onClick={() => setWinner(roundIdx, matchIdx, 'A')} className="text-gray-600 hover:text-green-500" title="Set Winner">
                                            <Medal size={16} />
                                        </button>
                                    )}
                                    {match.winner === 'A' && <Shield size={14} className="text-green-500" />}
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-gray-800 w-full flex items-center justify-center">
                                    <span className="bg-surface-card px-2 text-[10px] text-gray-600 font-black">VS</span>
                                </div>

                                {/* Team B */}
                                <div className={`p-3 flex justify-between items-center ${match.winner === 'B' ? 'bg-green-900/20' : ''}`}>
                                    {(!isAutoMode || roundIdx === 0) ? (
                                        <input 
                                            value={match.teamBName || ''}
                                            onChange={(e) => updateTeamName(roundIdx, matchIdx, 'B', e.target.value)}
                                            className={`bg-transparent text-sm font-bold focus:outline-none w-full placeholder-gray-600 ${match.teamBName ? 'text-white' : 'text-gray-500'}`}
                                            placeholder="TBD"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                             {match.teamBName ? (
                                                <span className="text-sm font-bold text-white">{match.teamBName}</span>
                                            ) : (
                                                <span className="text-sm italic text-gray-600">Waiting...</span>
                                            )}
                                            <Lock size={10} className="text-gray-600 opacity-0 group-hover:opacity-100 transition" />
                                        </div>
                                    )}

                                    {(match.teamAName || !isAutoMode) && (match.teamBName || !isAutoMode) && !match.winner && (
                                        <button onClick={() => setWinner(roundIdx, matchIdx, 'B')} className="text-gray-600 hover:text-green-500" title="Set Winner">
                                            <Medal size={16} />
                                        </button>
                                    )}
                                    {match.winner === 'B' && <Shield size={14} className="text-green-500" />}
                                </div>
                                
                                {/* Connector Line Logic (Visual only) */}
                                {roundIdx < tournament.rounds.length - 1 && isAutoMode && (
                                    <div className="absolute top-1/2 -right-4 w-4 h-px bg-gray-700 z-0" />
                                )}
                            </div>
                        ))}

                        {/* Manual Add Match Button for specific round */}
                        {!isAutoMode && (
                             <button 
                                onClick={() => addMatchToRound(roundIdx)}
                                className="mt-2 flex items-center justify-center gap-2 p-3 border border-dashed border-gray-700 rounded-xl text-gray-500 hover:text-white hover:bg-gray-800 transition"
                             >
                                 <Plus size={16} /> <span className="text-xs font-bold uppercase">Add Slot</span>
                             </button>
                        )}
                    </div>
                </div>
            ))}
            
            {/* Winner Podium Area if Final is played */}
            {tournament.rounds.length > 0 && 
             tournament.rounds[tournament.rounds.length-1][0]?.winner && (
                <div className="flex flex-col justify-center items-center w-60 animate-in slide-in-from-left duration-700">
                    <Trophy size={64} className="text-yellow-500 mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                    <h2 className="text-yellow-500 font-black text-2xl uppercase tracking-widest mb-2">Champion</h2>
                    <div className="text-white font-bold text-xl bg-gray-800 px-6 py-3 rounded-lg border border-yellow-600/50">
                        {tournament.rounds[tournament.rounds.length-1][0].winner === 'A' 
                            ? tournament.rounds[tournament.rounds.length-1][0].teamAName 
                            : tournament.rounds[tournament.rounds.length-1][0].teamBName}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TournamentBracket;

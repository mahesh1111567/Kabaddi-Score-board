
import React from 'react';
import { TeamState, TeamSide, MatchAction } from '../types';
import { TEAM_A_COLOR, TEAM_B_COLOR, TEAM_A_BORDER, TEAM_B_BORDER } from '../constants';
import { Users, Trophy, Zap, ChevronUp, ChevronDown } from 'lucide-react';

interface ScoreBoardProps {
  teamA: TeamState;
  teamB: TeamState;
  currentRaider: TeamSide;
  isRaidActive: boolean;
  dispatch: React.Dispatch<MatchAction>;
}

const TeamCard: React.FC<{ team: TeamState; side: TeamSide; isRaiding: boolean; dispatch: React.Dispatch<MatchAction> }> = ({ team, side, isRaiding, dispatch }) => {
  const colorClass = side === TeamSide.A ? TEAM_A_COLOR : TEAM_B_COLOR;
  const borderClass = side === TeamSide.A ? TEAM_A_BORDER : TEAM_B_BORDER;

  const handleAdjustScore = (delta: number) => {
      dispatch({
          type: 'SCORE_UPDATE',
          team: side,
          points: delta,
          description: `Manual Correction (${delta > 0 ? '+' : ''}${delta})`,
          eventType: 'MANUAL'
      });
  };

  return (
    <div className={`flex-1 bg-surface-card rounded-xl border-t-4 ${borderClass} p-6 relative overflow-hidden`}>
      {isRaiding && (
        <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white ${side === TeamSide.A ? 'bg-kabaddi-orange' : 'bg-kabaddi-blue'} rounded-bl-lg`}>
          Raiding
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">{team.name}</h2>
            <div className="flex items-center gap-2 mt-1">
                {Array.from({ length: team.allOuts }).map((_, i) => (
                     <Trophy key={i} size={14} className="text-yellow-500" />
                ))}
            </div>
        </div>
        <div className="flex items-center gap-2">
            <div className={`text-7xl font-mono font-bold ${colorClass}`}>
            {team.score}
            </div>
            <div className="flex flex-col gap-1 opacity-20 hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => handleAdjustScore(1)}
                    className="p-0.5 hover:bg-gray-700 rounded text-gray-400 hover:text-green-400"
                    title="Correct Score (+1)"
                >
                    <ChevronUp size={16} />
                </button>
                <button 
                    onClick={() => handleAdjustScore(-1)}
                    className="p-0.5 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400"
                    title="Correct Score (-1)"
                >
                    <ChevronDown size={16} />
                </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-800">
         <div>
            <div className="text-gray-500 text-xs uppercase font-bold mb-1">Active Players</div>
            <div className="flex gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-3 h-6 rounded-sm transition-all ${i < team.activePlayers ? (side === TeamSide.A ? 'bg-kabaddi-orange' : 'bg-kabaddi-blue') : 'bg-gray-800'}`}
                    />
                ))}
            </div>
         </div>
         <div className="text-right">
            <div className="text-gray-500 text-xs uppercase font-bold mb-1">Do-or-Die Status</div>
            <div className="flex gap-1 justify-end">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div 
                        key={i}
                        className={`w-2 h-2 rounded-full ${i < team.consecutiveEmptyRaids ? 'bg-red-500' : 'bg-gray-800'}`} 
                    />
                ))}
            </div>
         </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-400 font-mono">
        <div className="flex justify-between">
            <span>Raid Pts:</span>
            <span className="text-white">{team.raids.successful + team.raids.total - team.raids.empty - team.raids.failed}</span> {/* Simplified calc logic visualization */}
        </div>
        <div className="flex justify-between">
            <span>Tackle Pts:</span>
            <span className="text-white">{team.tackles.successful}</span>
        </div>
      </div>
    </div>
  );
};

const ScoreBoard: React.FC<ScoreBoardProps> = ({ teamA, teamB, currentRaider, isRaidActive, dispatch }) => {
  return (
    <div className="flex gap-6 w-full max-w-5xl">
      <TeamCard team={teamA} side={TeamSide.A} isRaiding={isRaidActive && currentRaider === TeamSide.A} dispatch={dispatch} />
      
      {/* Center VS Divider */}
      <div className="flex flex-col justify-center items-center text-gray-600 font-black text-xl italic opacity-50">
        <span>V</span>
        <span>S</span>
      </div>

      <TeamCard team={teamB} side={TeamSide.B} isRaiding={isRaidActive && currentRaider === TeamSide.B} dispatch={dispatch} />
    </div>
  );
};

export default ScoreBoard;

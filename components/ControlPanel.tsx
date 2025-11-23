
import React from 'react';
import { TeamSide, RaidOutcome, TeamState } from '../types';
import { Hand, Shield, ShieldAlert, CheckCircle, XCircle, SkipForward, Users, AlertTriangle, Plus } from 'lucide-react';

interface ControlPanelProps {
  isRaidActive: boolean;
  currentRaider: TeamSide;
  onRaidStart: (team: TeamSide) => void;
  onRaidAction: (outcome: RaidOutcome, points: number) => void;
  teamA: TeamState;
  teamB: TeamState;
}

const ActionButton: React.FC<{
  onClick: () => void;
  label: string;
  subLabel?: string;
  color: string;
  icon: React.ReactNode;
  disabled?: boolean;
  className?: string;
}> = ({ onClick, label, subLabel, color, icon, disabled, className }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      flex flex-col items-center justify-center p-3 rounded-lg border border-gray-700 
      transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
      ${color} hover:bg-opacity-20 bg-opacity-10
      ${className || ''}
    `}
  >
    <div className="mb-1">{icon}</div>
    <span className="font-bold text-xs md:text-sm">{label}</span>
    {subLabel && <span className="text-[10px] opacity-70 mt-0.5">{subLabel}</span>}
  </button>
);

const ControlPanel: React.FC<ControlPanelProps> = ({
  isRaidActive,
  currentRaider,
  onRaidStart,
  onRaidAction,
  teamA,
  teamB,
}) => {
  
  if (!isRaidActive) {
    return (
      <div className="bg-surface-card p-6 rounded-xl border border-gray-800 mt-6 text-center">
        <h3 className="text-gray-400 text-sm uppercase font-bold mb-4">Start Next Raid</h3>
        <div className="flex justify-center gap-6">
          <button
            onClick={() => onRaidStart(TeamSide.A)}
            className="px-8 py-4 bg-kabaddi-orange hover:bg-orange-600 text-white rounded-lg font-bold text-lg transition flex items-center gap-3 relative"
          >
            {teamA.consecutiveEmptyRaids === 2 && (
                <span className="absolute -top-3 -right-3 flex h-6 w-6">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 flex items-center justify-center text-[10px] font-bold">!</span>
                </span>
            )}
            {teamA.name} Raid
            <SkipForward size={20} />
          </button>
          <button
            onClick={() => onRaidStart(TeamSide.B)}
            className="px-8 py-4 bg-kabaddi-blue hover:bg-blue-700 text-white rounded-lg font-bold text-lg transition flex items-center gap-3 relative"
          >
            {teamB.consecutiveEmptyRaids === 2 && (
                <span className="absolute -top-3 -right-3 flex h-6 w-6">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 flex items-center justify-center text-[10px] font-bold">!</span>
                </span>
            )}
            {teamB.name} Raid
            <SkipForward size={20} />
          </button>
        </div>
        {(teamA.consecutiveEmptyRaids === 2 || teamB.consecutiveEmptyRaids === 2) && (
             <div className="mt-4 text-red-500 font-mono text-xs uppercase tracking-widest font-bold animate-pulse">
                 Do-or-Die Raid Imminent
             </div>
        )}
      </div>
    );
  }

  const defendingTeamName = currentRaider === TeamSide.A ? teamB.name : teamA.name;
  const raidingTeamName = currentRaider === TeamSide.A ? teamA.name : teamB.name;
  const raidingTeamStats = currentRaider === TeamSide.A ? teamA : teamB;
  const isDoOrDie = raidingTeamStats.consecutiveEmptyRaids === 2;

  return (
    <div className={`bg-surface-card p-4 md:p-6 rounded-xl border mt-6 w-full max-w-5xl relative overflow-hidden transition-colors duration-500 ${isDoOrDie ? 'border-red-900 shadow-[0_0_30px_rgba(220,38,38,0.15)]' : 'border-gray-800'}`}>
      
      {/* Do or Die Background Effect */}
      {isDoOrDie && (
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <AlertTriangle size={200} className="text-red-600" />
          </div>
      )}

      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-800 relative z-10">
        <h3 className="text-white font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Raid Active: <span className={currentRaider === TeamSide.A ? 'text-kabaddi-orange' : 'text-kabaddi-blue'}>{raidingTeamName}</span>
          {isDoOrDie && (
             <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-[10px] uppercase font-black tracking-wider rounded animate-pulse">
                 DO OR DIE
             </span>
          )}
        </h3>
        <span className="text-gray-500 text-sm text-right">Defending: {defendingTeamName}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
        
        {/* Raider Actions (Takes up 3 columns on desktop) */}
        <div className="md:col-span-3 flex flex-col gap-2 p-3 bg-surface-highlight rounded-lg">
            <div className="text-xs text-center text-gray-400 font-mono uppercase mb-2">Raider Scoring (Touch Points)</div>
            
            {/* Flexible Point Grid 1-9 */}
            <div className="grid grid-cols-5 md:grid-cols-5 gap-2">
                 {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((points) => (
                     <button
                        key={points}
                        onClick={() => onRaidAction(RaidOutcome.SUCCESS, points)}
                        className="aspect-square md:aspect-auto md:h-12 flex items-center justify-center rounded font-bold text-xl bg-gray-800 text-green-400 border border-gray-700 hover:bg-green-600 hover:text-white hover:border-green-500 transition active:scale-95 shadow-lg"
                     >
                        {points}
                     </button>
                 ))}
                 <button
                    onClick={() => onRaidAction(RaidOutcome.SUCCESS, 0.5)}
                    className="col-span-1 aspect-square md:aspect-auto md:h-12 flex flex-col items-center justify-center rounded font-bold text-yellow-500 border border-yellow-900/50 bg-yellow-900/10 hover:bg-yellow-600 hover:text-white transition active:scale-95"
                    title="Bonus Point"
                 >
                    <span className="text-xs">BONUS</span>
                    <CheckCircle size={14} />
                 </button>
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-700/50">
                 <ActionButton 
                    label={isDoOrDie ? "Do-Or-Die Fail" : "Empty Raid"}
                    subLabel={isDoOrDie ? "Raider Out (+1 Def)" : "No Points"}
                    color={isDoOrDie ? "text-red-200 bg-red-900/50 border-red-700 hover:bg-red-800" : "text-gray-400 bg-gray-800 border-gray-700 hover:bg-gray-700"}
                    icon={isDoOrDie ? <XCircle size={20} className="text-red-500" /> : <XCircle size={20} />}
                    onClick={() => onRaidAction(RaidOutcome.EMPTY, 0)}
                    className={`w-full py-2 ${isDoOrDie ? "border-dashed border-2" : ""}`}
                />
            </div>
        </div>

        {/* Defender Actions (Takes up 2 columns on desktop) */}
        <div className="md:col-span-2 grid grid-rows-2 gap-3 p-3 bg-surface-highlight rounded-lg h-full">
            <div className="text-xs text-center text-gray-400 font-mono uppercase -mb-2">Defense Scoring</div>
            <ActionButton 
                label="Normal Tackle" 
                subLabel="+1 Pt (Defender)"
                color="text-red-400 bg-red-400 border-red-900"
                icon={<Shield size={28} />}
                onClick={() => onRaidAction(RaidOutcome.TACKLE, 1)}
                className="h-full"
            />
             <ActionButton 
                label="Super Tackle" 
                subLabel="+2 Pts (Defenders)"
                color="text-purple-400 bg-purple-400 border-purple-900"
                icon={<ShieldAlert size={28} />}
                onClick={() => onRaidAction(RaidOutcome.SUPER_TACKLE, 2)}
                className="h-full"
            />
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;

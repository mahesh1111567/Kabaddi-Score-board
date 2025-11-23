import React, { useState, useEffect } from 'react';
import { Clock, Timer, Settings, RotateCcw, Hourglass } from 'lucide-react';
import { RAID_DURATION_SEC } from '../constants';
import { MatchAction } from '../types';

interface MatchClockProps {
  elapsedTime: number;
  totalTime: number;
  raidTime: number;
  isRaidActive: boolean;
  isRunning: boolean;
  dispatch: React.Dispatch<MatchAction>;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const MatchClock: React.FC<MatchClockProps> = ({ 
  elapsedTime, 
  totalTime, 
  raidTime, 
  isRunning,
  dispatch 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const remainingMatchTime = Math.max(0, totalTime - elapsedTime);
  const isLowTime = remainingMatchTime < 300; 
  const isLowRaidTime = raidTime <= 10;

  // Close edit mode if match starts
  useEffect(() => {
      if (isRunning) setIsEditing(false);
  }, [isRunning]);

  return (
    <div className="relative group">
        <div className="flex gap-4 w-full justify-center items-center bg-surface-card p-4 rounded-xl border border-gray-800 shadow-lg relative z-10">
            {/* Main Match Clock */}
            <div className="flex flex-col items-center px-6 border-r border-gray-700">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Clock size={16} />
                <span className="text-xs uppercase tracking-wider font-bold">Match Clock</span>
                </div>
                <div className={`text-4xl font-mono font-bold ${isLowTime ? 'text-red-500' : 'text-white'} tabular-nums`}>
                {formatTime(remainingMatchTime)}
                </div>
            </div>

            {/* Raid Clock */}
            <div className="flex flex-col items-center px-6">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Timer size={16} />
                <span className="text-xs uppercase tracking-wider font-bold">Raid Clock</span>
                </div>
                <div className="relative">
                    <svg className={`w-20 h-20 transform -rotate-90 ${isLowRaidTime && isRunning ? 'animate-pulse' : ''}`}>
                        <circle
                            cx="40" cy="40" r="36"
                            stroke="currentColor" strokeWidth="6"
                            fill="transparent"
                            className="text-gray-800"
                        />
                        <circle
                            cx="40" cy="40" r="36"
                            stroke="currentColor" strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={226}
                            strokeDashoffset={226 - (226 * raidTime) / RAID_DURATION_SEC}
                            className={`${raidTime <= 5 ? 'text-red-600' : isLowRaidTime ? 'text-red-500' : 'text-yellow-500'} transition-all duration-1000 ease-linear`}
                        />
                    </svg>
                    <div className={`absolute top-0 left-0 w-full h-full flex items-center justify-center text-2xl font-mono font-bold ${raidTime <= 5 ? 'text-red-500' : 'text-white'} tabular-nums`}>
                        {Math.ceil(raidTime)}
                    </div>
                </div>
            </div>

            {/* Edit Toggle */}
            <button 
                onClick={() => setIsEditing(!isEditing)}
                disabled={isRunning}
                className={`absolute top-2 right-2 p-1.5 rounded-full transition-all ${isRunning ? 'opacity-0 pointer-events-none' : 'opacity-50 hover:opacity-100 hover:bg-gray-700'}`}
                title="Match Settings"
            >
                <Settings size={14} className={isEditing ? "text-kabaddi-orange" : "text-gray-400"} />
            </button>
        </div>

        {/* Settings Drawer */}
        {isEditing && !isRunning && (
             <div className="absolute top-full left-0 w-full mt-2 bg-surface-highlight border border-gray-700 rounded-xl p-4 shadow-xl z-20 animate-in fade-in slide-in-from-top-2">
                 <div className="grid gap-4">
                     {/* Duration Control */}
                     <div className="flex flex-col gap-2 pb-3 border-b border-gray-700">
                         <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400 uppercase">Duration</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => dispatch({type: 'SET_MATCH_DURATION', minutes: 20})} className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded border border-gray-600">20m</button>
                                <button onClick={() => dispatch({type: 'SET_MATCH_DURATION', minutes: 40})} className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded border border-gray-600">40m</button>
                                <div className="flex items-center bg-gray-800 rounded px-2 border border-gray-600">
                                    <input 
                                        type="number" 
                                        value={Math.floor(totalTime/60)} 
                                        onChange={(e) => dispatch({type: 'SET_MATCH_DURATION', minutes: parseInt(e.target.value) || 0})}
                                        className="w-8 bg-transparent text-white text-xs font-mono focus:outline-none text-center py-1"
                                    />
                                    <span className="text-xs text-gray-500">m</span>
                                </div>
                            </div>
                         </div>
                         {/* Half Time Button */}
                         <button 
                             onClick={() => dispatch({type: 'TRIGGER_HALF_TIME'})}
                             className="w-full py-1.5 bg-indigo-900/50 hover:bg-indigo-900 border border-indigo-700 rounded text-xs font-bold text-indigo-300 flex items-center justify-center gap-2"
                         >
                             <Hourglass size={12} /> Go To Half Time (20:00)
                         </button>
                     </div>

                     {/* Time Adjust */}
                     <div className="flex flex-col gap-2">
                         <span className="text-xs font-bold text-gray-400 uppercase">Adjust Clock</span>
                         <div className="flex justify-between gap-1">
                             <button onClick={() => dispatch({type: 'ADJUST_TIME', seconds: -60})} className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-[10px] font-mono text-red-400 border border-gray-700">-1m</button>
                             <button onClick={() => dispatch({type: 'ADJUST_TIME', seconds: -10})} className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-[10px] font-mono text-red-400 border border-gray-700">-10s</button>
                             <button onClick={() => dispatch({type: 'ADJUST_TIME', seconds: 10})} className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-[10px] font-mono text-green-400 border border-gray-700">+10s</button>
                             <button onClick={() => dispatch({type: 'ADJUST_TIME', seconds: 60})} className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-[10px] font-mono text-green-400 border border-gray-700">+1m</button>
                         </div>
                     </div>

                     {/* Raid Clock Reset */}
                     <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                         <span className="text-xs font-bold text-gray-400 uppercase">Raid Timer</span>
                         <button 
                             onClick={() => dispatch({type: 'RESET_RAID_CLOCK'})}
                             className="flex items-center gap-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-yellow-500 border border-yellow-900/50"
                         >
                             <RotateCcw size={10} /> Reset 30s
                         </button>
                     </div>
                 </div>
             </div>
        )}
    </div>
  );
};

export default MatchClock;

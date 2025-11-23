
import React, { useMemo, useEffect, useRef } from 'react';
import { MatchState, TeamSide, MatchEvent } from '../types';
import { ScrollText, Swords, Shield, Trophy, Zap, Activity, Hash, Wrench } from 'lucide-react';
import { TEAM_A_COLOR, TEAM_B_COLOR } from '../constants';

interface AnalyticsPanelProps {
  matchState: MatchState;
}

const StatRow: React.FC<{ 
    label: string; 
    valA: number; 
    valB: number; 
    icon?: React.ReactNode;
    total?: number;
}> = ({ label, valA, valB, icon, total }) => {
    const max = Math.max(valA, valB, total || 1);
    const percentA = (valA / max) * 100;
    const percentB = (valB / max) * 100;

    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-1 text-xs font-bold uppercase text-gray-500 tracking-wider">
                <span className={valA > valB ? 'text-kabaddi-orange' : ''}>{valA}</span>
                <div className="flex items-center gap-2 text-gray-400">
                    {icon}
                    <span>{label}</span>
                </div>
                <span className={valB > valA ? 'text-kabaddi-blue' : ''}>{valB}</span>
            </div>
            <div className="flex h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="flex-1 flex justify-end bg-gray-800 relative">
                     <div style={{ width: `${percentA}%` }} className="h-full bg-kabaddi-orange rounded-l-full transition-all duration-500" />
                </div>
                <div className="w-0.5 bg-surface-dark z-10" />
                <div className="flex-1 flex justify-start bg-gray-800 relative">
                    <div style={{ width: `${percentB}%` }} className="h-full bg-kabaddi-blue rounded-r-full transition-all duration-500" />
                </div>
            </div>
        </div>
    );
};

const EventItem: React.FC<{ event: MatchEvent; teamAName: string; teamBName: string }> = ({ event, teamAName, teamBName }) => {
    const isTeamA = event.team === TeamSide.A;
    const colorClass = isTeamA ? TEAM_A_COLOR : TEAM_B_COLOR;
    const teamName = isTeamA ? teamAName : teamBName;
    
    let Icon = Activity;
    if (event.type === 'RAID') Icon = Swords;
    if (event.type === 'DEFENSE') Icon = Shield;
    if (event.type === 'SYSTEM') Icon = Zap;
    if (event.type === 'MANUAL') Icon = Wrench;

    return (
        <div className="flex gap-3 p-3 border-b border-gray-800/50 hover:bg-white/5 transition-colors text-xs">
            <div className="font-mono text-gray-500 whitespace-nowrap pt-0.5">
                {Math.floor(event.matchTime / 60)}:{String(event.matchTime % 60).padStart(2, '0')}
            </div>
            <div className={`mt-0.5 ${colorClass}`}>
                <Icon size={14} />
            </div>
            <div className="flex-1">
                <div className="flex justify-between">
                    <span className={`font-bold ${colorClass}`}>{teamName}</span>
                    {(event.deltaA > 0 || event.deltaB > 0) && (
                        <span className="font-mono font-bold text-white bg-gray-800 px-1.5 rounded">
                            {Math.max(event.deltaA, event.deltaB) > 0 ? '+' : ''}{Math.max(event.deltaA, event.deltaB) || Math.min(event.deltaA, event.deltaB)}
                        </span>
                    )}
                </div>
                <div className="text-gray-400 mt-0.5 font-medium">
                    {event.description}
                </div>
            </div>
        </div>
    );
};

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ matchState }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Calculate detailed stats from history
  const stats = useMemo(() => {
    const s = {
        A: { raidPts: 0, tacklePts: 0, allOutPts: 0 },
        B: { raidPts: 0, tacklePts: 0, allOutPts: 0 }
    };
    
    matchState.history.forEach(e => {
        const isA = e.team === TeamSide.A;
        const target = isA ? s.A : s.B;
        const pts = Math.max(e.deltaA, e.deltaB);

        if (e.type === 'RAID') target.raidPts += pts;
        else if (e.type === 'DEFENSE') target.tacklePts += pts;
        else if (e.type === 'SYSTEM') target.allOutPts += pts;
    });
    return s;
  }, [matchState.history]);

  // Auto-scroll logs
  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollTop = 0;
      }
  }, [matchState.history]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-5xl mt-6">
      
      {/* Left Column: Match Telemetry */}
      <div className="lg:col-span-2 bg-surface-card rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-surface-highlight flex justify-between items-center">
             <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Hash size={16} className="text-gray-500" />
                Match Telemetry
             </h3>
             <span className="text-[10px] text-gray-500 font-mono uppercase">Real-time Stats</span>
        </div>
        
        <div className="p-6">
            {/* Team Headers */}
            <div className="flex justify-between mb-6 font-bold text-xl">
                <span className="text-kabaddi-orange">{matchState.teamA.name}</span>
                <span className="text-gray-600 text-sm font-mono self-center">VS</span>
                <span className="text-kabaddi-blue">{matchState.teamB.name}</span>
            </div>

            <StatRow 
                label="Raid Points" 
                valA={stats.A.raidPts} 
                valB={stats.B.raidPts} 
                icon={<Swords size={12} />} 
            />
            <StatRow 
                label="Tackle Points" 
                valA={stats.A.tacklePts} 
                valB={stats.B.tacklePts} 
                icon={<Shield size={12} />} 
            />
            <StatRow 
                label="All Out Points" 
                valA={stats.A.allOutPts} 
                valB={stats.B.allOutPts} 
                icon={<Zap size={12} />} 
            />

            <div className="mt-8 pt-6 border-t border-gray-800 grid grid-cols-2 gap-8">
                {/* Efficiency A */}
                <div>
                    <div className="text-xs text-gray-500 uppercase font-bold mb-2 text-center text-kabaddi-orange">{matchState.teamA.name} Accuracy</div>
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>Raid</span>
                        <span>{matchState.teamA.raids.total > 0 ? Math.round((matchState.teamA.raids.successful / matchState.teamA.raids.total) * 100) : 0}%</span>
                    </div>
                    <div className="h-1 bg-gray-800 rounded-full mb-3">
                        <div className="h-full bg-kabaddi-orange" style={{ width: `${matchState.teamA.raids.total > 0 ? (matchState.teamA.raids.successful / matchState.teamA.raids.total) * 100 : 0}%` }}></div>
                    </div>
                    
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>Tackle</span>
                        <span>{matchState.teamA.tackles.total > 0 ? Math.round((matchState.teamA.tackles.successful / matchState.teamA.tackles.total) * 100) : 0}%</span>
                    </div>
                    <div className="h-1 bg-gray-800 rounded-full">
                        <div className="h-full bg-kabaddi-orange" style={{ width: `${matchState.teamA.tackles.total > 0 ? (matchState.teamA.tackles.successful / matchState.teamA.tackles.total) * 100 : 0}%` }}></div>
                    </div>
                </div>

                {/* Efficiency B */}
                <div>
                     <div className="text-xs text-gray-500 uppercase font-bold mb-2 text-center text-kabaddi-blue">{matchState.teamB.name} Accuracy</div>
                     <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>Raid</span>
                        <span>{matchState.teamB.raids.total > 0 ? Math.round((matchState.teamB.raids.successful / matchState.teamB.raids.total) * 100) : 0}%</span>
                    </div>
                    <div className="h-1 bg-gray-800 rounded-full mb-3">
                        <div className="h-full bg-kabaddi-blue" style={{ width: `${matchState.teamB.raids.total > 0 ? (matchState.teamB.raids.successful / matchState.teamB.raids.total) * 100 : 0}%` }}></div>
                    </div>
                    
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>Tackle</span>
                        <span>{matchState.teamB.tackles.total > 0 ? Math.round((matchState.teamB.tackles.successful / matchState.teamB.tackles.total) * 100) : 0}%</span>
                    </div>
                    <div className="h-1 bg-gray-800 rounded-full">
                        <div className="h-full bg-kabaddi-blue" style={{ width: `${matchState.teamB.tackles.total > 0 ? (matchState.teamB.tackles.successful / matchState.teamB.tackles.total) * 100 : 0}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Right Column: Live Commentary / Logs */}
      <div className="bg-surface-card rounded-xl border border-gray-800 flex flex-col h-[420px] overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-surface-highlight flex items-center gap-2">
             <ScrollText size={16} className="text-gray-500" />
             <h3 className="text-sm font-bold text-white uppercase tracking-widest">Live Commentary</h3>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
            {matchState.history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                    <Activity size={48} className="mb-2" />
                    <span className="text-xs uppercase font-bold">Match yet to start</span>
                </div>
            ) : (
                matchState.history.map((event) => (
                    <EventItem 
                        key={event.id} 
                        event={event} 
                        teamAName={matchState.teamA.name} 
                        teamBName={matchState.teamB.name} 
                    />
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;


import React, { useState } from 'react';
import { X, Plus, Trash2, Shirt, Users } from 'lucide-react';
import { TeamState, TeamSide, MatchAction } from '../types';
import { TEAM_A_COLOR, TEAM_B_COLOR } from '../constants';

interface TeamManagerProps {
  isOpen: boolean;
  onClose: () => void;
  teamA: TeamState;
  teamB: TeamState;
  dispatch: React.Dispatch<MatchAction>;
}

const TeamManager: React.FC<TeamManagerProps> = ({ isOpen, onClose, teamA, teamB, dispatch }) => {
  const [activeTab, setActiveTab] = useState<TeamSide>(TeamSide.A);
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');

  if (!isOpen) return null;

  const activeTeam = activeTab === TeamSide.A ? teamA : teamB;
  const activeColor = activeTab === TeamSide.A ? TEAM_A_COLOR : TEAM_B_COLOR;
  const activeBg = activeTab === TeamSide.A ? 'bg-kabaddi-orange' : 'bg-kabaddi-blue';

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName && newNumber) {
      dispatch({
        type: 'ADD_PLAYER',
        team: activeTab,
        name: newName,
        number: newNumber
      });
      setNewName('');
      setNewNumber('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-card w-full max-w-2xl rounded-xl border border-gray-700 shadow-2xl flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-surface-highlight p-2 rounded-lg">
              <Shirt className="text-white" size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white">Player Roster</h2>
                <p className="text-xs text-gray-400">Manage active players for this match</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button 
            onClick={() => setActiveTab(TeamSide.A)}
            className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === TeamSide.A ? 'text-white bg-white/5 border-b-2 border-kabaddi-orange' : 'text-gray-500 hover:bg-white/5'}`}
          >
            {teamA.name}
          </button>
          <button 
            onClick={() => setActiveTab(TeamSide.B)}
            className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === TeamSide.B ? 'text-white bg-white/5 border-b-2 border-kabaddi-blue' : 'text-gray-500 hover:bg-white/5'}`}
          >
            {teamB.name}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
            
            {/* Add Player Form */}
            <form onSubmit={handleAddPlayer} className="flex gap-3 mb-8 bg-surface-highlight p-4 rounded-lg border border-gray-700">
                <div className="w-20">
                    <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Jersey #</label>
                    <input 
                        type="text" 
                        placeholder="00"
                        value={newNumber}
                        onChange={(e) => setNewNumber(e.target.value)}
                        className="w-full bg-surface-dark border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm focus:border-white focus:outline-none"
                        maxLength={3}
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Player Name</label>
                    <input 
                        type="text" 
                        placeholder="Enter Name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full bg-surface-dark border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-white focus:outline-none"
                    />
                </div>
                <div className="flex items-end">
                    <button 
                        type="submit"
                        disabled={!newName || !newNumber}
                        className={`px-4 py-2 rounded font-bold text-sm text-white flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${activeBg} hover:opacity-90`}
                    >
                        <Plus size={16} /> Add
                    </button>
                </div>
            </form>

            {/* Player List */}
            <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex justify-between">
                    <span>Roster ({activeTeam.players.length})</span>
                    <span>Jersey</span>
                </h3>
                <div className="space-y-2">
                    {activeTeam.players.length === 0 ? (
                        <div className="text-center py-8 text-gray-600 italic text-sm">
                            No players added yet.
                        </div>
                    ) : (
                        activeTeam.players.map(player => (
                            <div key={player.id} className="flex items-center justify-between bg-surface-highlight p-3 rounded-lg border border-gray-700/50 group hover:border-gray-600 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`font-mono font-bold text-lg ${activeColor} w-8 text-center`}>
                                        {player.number}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-medium">{player.name}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => dispatch({ type: 'REMOVE_PLAYER', team: activeTab, id: player.id })}
                                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded transition"
                                        title="Remove Player"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default TeamManager;


import React, { useRef } from 'react';
import { X, Upload, Play, RotateCcw, Music } from 'lucide-react';
import { SoundType, SoundMap } from '../types';

interface SoundManagerProps {
  isOpen: boolean;
  onClose: () => void;
  customSounds: SoundMap;
  onUpdateSound: (type: SoundType, url: string | null) => void;
  previewSound: (type: SoundType) => void;
}

const SOUND_LABELS: Record<SoundType, string> = {
  'MATCH_START': 'Match Start Whistle',
  'MATCH_END': 'Match End Whistle',
  'HALF_TIME': 'Half Time Signal',
  'RAID_START': 'Raid Start (Breath/Cue)',
  'DO_OR_DIE': 'Do-Or-Die Alarm',
  'RAID_WARNING': '10s Warning Alert',
  'RAID_TICK': 'Countdown Ticks (5s)',
  'RAID_OVER': 'Raid Time Up Buzzer'
};

const SoundManager: React.FC<SoundManagerProps> = ({ isOpen, onClose, customSounds, onUpdateSound, previewSound }) => {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  if (!isOpen) return null;

  const handleFileUpload = (type: SoundType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdateSound(type, url);
    }
  };

  const handleReset = (type: SoundType) => {
    onUpdateSound(type, null);
    if (fileInputRefs.current[type]) {
      fileInputRefs.current[type]!.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-card w-full max-w-2xl rounded-xl border border-gray-700 shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-surface-highlight/50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600/20 p-2 rounded-lg text-purple-400">
              <Music size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white">Audio Manager</h2>
                <p className="text-xs text-gray-400">Customize match sound effects</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
           <div className="grid gap-4">
             {(Object.keys(SOUND_LABELS) as SoundType[]).map((type) => (
               <div key={type} className="flex items-center justify-between p-4 bg-surface-highlight rounded-lg border border-gray-700/50">
                 <div className="flex flex-col">
                   <span className="text-sm font-bold text-white">{SOUND_LABELS[type]}</span>
                   <span className="text-[10px] text-gray-500 font-mono">
                     {customSounds[type] ? 'Custom Audio Loaded' : 'Default Synthesized Sound'}
                   </span>
                 </div>

                 <div className="flex items-center gap-2">
                    {/* Preview Button */}
                    <button 
                      onClick={() => previewSound(type)}
                      className="p-2 bg-gray-700 hover:bg-kabaddi-orange hover:text-white text-gray-300 rounded-md transition"
                      title="Preview Sound"
                    >
                      <Play size={16} fill="currentColor" />
                    </button>

                    {/* Upload Button */}
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      ref={el => fileInputRefs.current[type] = el}
                      onChange={(e) => handleFileUpload(type, e)}
                    />
                    <button 
                      onClick={() => fileInputRefs.current[type]?.click()}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold transition border ${customSounds[type] ? 'bg-purple-900/20 border-purple-500/50 text-purple-300' : 'bg-gray-800 border-gray-600 text-gray-400 hover:text-white'}`}
                    >
                      <Upload size={14} /> {customSounds[type] ? 'Change' : 'Upload'}
                    </button>

                    {/* Reset Button */}
                    {customSounds[type] && (
                      <button 
                        onClick={() => handleReset(type)}
                        className="p-2 text-gray-500 hover:text-red-400 transition"
                        title="Reset to Default"
                      >
                        <RotateCcw size={16} />
                      </button>
                    )}
                 </div>
               </div>
             ))}
           </div>
           
           <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg text-xs text-blue-200">
             <p className="font-bold mb-1">Note on Browser Autoplay:</p>
             Audio files work best when triggered by a click. Automatic sounds (like timers) might be blocked by browsers until you interact with the page at least once.
           </div>
        </div>
      </div>
    </div>
  );
};

export default SoundManager;

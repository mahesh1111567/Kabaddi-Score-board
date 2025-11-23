
import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Volume2, Upload, Trash2, Repeat, Disc, Music } from 'lucide-react';

interface MusicPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Track {
  id: string;
  name: string;
  url: string;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ isOpen, onClose }) => {
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Audio Events
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      
      const handleEnded = () => {
          if (isLooping) {
              audioRef.current?.play();
          } else {
              playNext();
          }
      };

      const handleTimeUpdate = () => {
          setCurrentTime(audioRef.current?.currentTime || 0);
          setDuration(audioRef.current?.duration || 0);
      };

      audioRef.current.addEventListener('ended', handleEnded);
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      
      return () => {
          audioRef.current?.removeEventListener('ended', handleEnded);
          audioRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [currentTrackIndex, isLooping, volume]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newTracks: Track[] = Array.from(e.target.files).map((file) => {
        // Explicitly cast to File because Array.from might return unknown[] depending on TS lib
        const fileObj = file as File; 
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: fileObj.name.replace(/\.[^/.]+$/, ""), // Remove extension
          url: URL.createObjectURL(fileObj)
        };
      });
      
      setPlaylist(prev => [...prev, ...newTracks]);
      
      // If nothing was playing, queue the first new track
      if (currentTrackIndex === -1 && newTracks.length > 0) {
          setCurrentTrackIndex(playlist.length); // Index of the first new track
      }
    }
  };

  const playTrack = (index: number) => {
      if (index >= 0 && index < playlist.length) {
          setCurrentTrackIndex(index);
          setIsPlaying(true);
          // Small timeout to allow state to update and audio src to change
          setTimeout(() => audioRef.current?.play(), 0);
      }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        if (currentTrackIndex === -1 && playlist.length > 0) {
            playTrack(0);
            return;
        }
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const playNext = () => {
      if (playlist.length === 0) return;
      const nextIndex = (currentTrackIndex + 1) % playlist.length;
      playTrack(nextIndex);
  };

  const playPrev = () => {
      if (playlist.length === 0) return;
      const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
      playTrack(prevIndex);
  };

  const removeTrack = (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      const newPlaylist = playlist.filter((_, i) => i !== index);
      setPlaylist(newPlaylist);
      
      if (index === currentTrackIndex) {
          setIsPlaying(false);
          setCurrentTrackIndex(-1);
          if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
          }
      } else if (index < currentTrackIndex) {
          setCurrentTrackIndex(currentTrackIndex - 1);
      }
  };

  const formatTime = (time: number) => {
      if (isNaN(time)) return "0:00";
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Hidden audio element logic
  const activeTrackUrl = currentTrackIndex !== -1 && playlist[currentTrackIndex] ? playlist[currentTrackIndex].url : undefined;

  return (
    <>
        {/* The Audio Element exists always so music keeps playing when modal is closed */}
        <audio ref={audioRef} src={activeTrackUrl} />

        {/* The Modal UI */}
        <div 
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        >
            <div className={`bg-surface-card w-full max-w-lg rounded-xl border border-gray-700 shadow-2xl flex flex-col max-h-[85vh] transition-transform duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`}>
                
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full border border-purple-400/30 ${isPlaying ? 'animate-spin-slow' : ''}`}>
                            <Disc size={24} className="text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-wide">STADIUM DJ</h2>
                            <p className="text-[10px] text-purple-300 font-mono uppercase tracking-wider">
                                {isPlaying ? 'Now Playing' : 'Ready'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Main Display / Controls */}
                <div className="p-6 bg-surface-highlight/30">
                    <div className="mb-6 text-center">
                        <div className="text-xl font-bold text-white mb-1 truncate px-4">
                            {currentTrackIndex !== -1 ? playlist[currentTrackIndex].name : "No Track Selected"}
                        </div>
                        <div className="text-xs font-mono text-gray-500 flex justify-center gap-2">
                             <span>{formatTime(currentTime)}</span>
                             <span>/</span>
                             <span>{formatTime(duration)}</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-3 w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-purple-500 transition-all duration-200"
                                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* Main Controls */}
                        <div className="flex justify-center items-center gap-6">
                            <button onClick={playPrev} className="text-gray-400 hover:text-white transition">
                                <SkipBack size={24} />
                            </button>
                            
                            <button 
                                onClick={togglePlay}
                                className="w-14 h-14 flex items-center justify-center rounded-full bg-purple-500 text-white shadow-lg shadow-purple-900/50 hover:bg-purple-400 hover:scale-105 transition active:scale-95"
                            >
                                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                            </button>
                            
                            <button onClick={playNext} className="text-gray-400 hover:text-white transition">
                                <SkipForward size={24} />
                            </button>
                        </div>

                        {/* Secondary Controls */}
                        <div className="flex justify-between items-center px-4 mt-2">
                            <button 
                                onClick={() => setIsLooping(!isLooping)}
                                className={`p-2 rounded-full transition ${isLooping ? 'text-purple-400 bg-purple-900/30' : 'text-gray-500 hover:text-gray-300'}`}
                                title="Loop Track"
                            >
                                <Repeat size={16} />
                            </button>
                            
                            <div className="flex items-center gap-2 bg-gray-900/50 px-3 py-1.5 rounded-full border border-gray-700">
                                <Volume2 size={14} className="text-gray-400" />
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.01" 
                                    value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                    className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Playlist */}
                <div className="flex-1 overflow-hidden flex flex-col border-t border-gray-700 bg-surface-card">
                    <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-gray-900/30">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Playlist ({playlist.length})</span>
                        <div className="relative">
                            <input 
                                type="file" 
                                multiple 
                                accept="audio/*" 
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1 text-[10px] font-bold bg-gray-800 hover:bg-gray-700 text-purple-300 px-2 py-1 rounded border border-gray-700 transition"
                            >
                                <Upload size={12} /> ADD SONGS
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {playlist.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2 min-h-[150px]">
                                <Music size={32} className="opacity-20" />
                                <span className="text-xs">No tracks queued</span>
                            </div>
                        ) : (
                            playlist.map((track, idx) => (
                                <div 
                                    key={track.id}
                                    onClick={() => playTrack(idx)}
                                    className={`
                                        group flex items-center justify-between p-3 rounded-lg cursor-pointer transition border border-transparent
                                        ${currentTrackIndex === idx 
                                            ? 'bg-purple-900/20 border-purple-500/30 text-white' 
                                            : 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'}
                                    `}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-4 flex justify-center">
                                            {currentTrackIndex === idx && isPlaying ? (
                                                <div className="flex gap-0.5 items-end h-3">
                                                    <div className="w-0.5 bg-purple-400 animate-[bounce_0.8s_infinite] h-2"></div>
                                                    <div className="w-0.5 bg-purple-400 animate-[bounce_1.2s_infinite] h-3"></div>
                                                    <div className="w-0.5 bg-purple-400 animate-[bounce_0.5s_infinite] h-1.5"></div>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-mono opacity-50">{idx + 1}</span>
                                            )}
                                        </div>
                                        <span className="text-sm font-medium truncate">{track.name}</span>
                                    </div>
                                    
                                    <button 
                                        onClick={(e) => removeTrack(e, idx)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded transition"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    </>
  );
};

export default MusicPlayer;

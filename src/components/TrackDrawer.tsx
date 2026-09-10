import React, { useState, useMemo, useRef } from 'react';
import { X, Search, ArrowUpDown, Music, Upload, Check, Disc3 } from 'lucide-react';
import { Track, DeckId } from '../types';
import { triggerHaptic } from '../audio/DjAudioEngine';

interface TrackDrawerProps {
  isOpen: boolean;
  targetDeck: DeckId | null;
  tracks: Track[];
  onSelectTrack: (deckId: DeckId, track: Track) => void;
  onUploadCustomTrack: (file: File) => Promise<Track>;
  onClose: () => void;
}

export const TrackDrawer: React.FC<TrackDrawerProps> = ({
  isOpen,
  targetDeck,
  tracks,
  onSelectTrack,
  onUploadCustomTrack,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'bpm' | 'key' | 'title'>('bpm');
  const [sortAsc, setSortAsc] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchStartYRef = useRef<number | null>(null);

  const filteredTracks = useMemo(() => {
    let list = tracks.filter((t) => {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.genre.toLowerCase().includes(q) ||
        t.key.toLowerCase().includes(q)
      );
    });

    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'bpm') {
        comparison = a.bpm - b.bpm;
      } else if (sortBy === 'key') {
        comparison = a.key.localeCompare(b.key);
      } else {
        comparison = a.title.localeCompare(b.title);
      }
      return sortAsc ? comparison : -comparison;
    });

    return list;
  }, [tracks, searchQuery, sortBy, sortAsc]);

  if (!isOpen || !targetDeck) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current !== null) {
      const diffY = touchStartYRef.current - e.changedTouches[0].clientY;
      // Swipe UP to close
      if (diffY > 60) {
        triggerHaptic(15);
        onClose();
      }
      touchStartYRef.current = null;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const newTrack = await onUploadCustomTrack(file);
      triggerHaptic(25);
      onSelectTrack(targetDeck, newTrack);
      onClose();
    } catch (err) {
      console.error('Error loading audio file', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deckColor = targetDeck === 'A' ? '#06b6d4' : '#f97316';

  return (
    <div
      id="track-drawer-overlay"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-start select-none transition-opacity duration-200"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          triggerHaptic(10);
          onClose();
        }
      }}
    >
      {/* 80% Top Sheet Drawer Container */}
      <div
        id="track-drawer-sheet"
        className="w-full max-w-md mx-auto bg-zinc-900 border-b border-zinc-700 shadow-2xl rounded-b-2xl flex flex-col overflow-hidden animate-in slide-in-from-top duration-250"
        style={{ height: '82vh', maxHeight: '820px' }}
      >
        {/* Drawer Header */}
        <div className="p-3 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center font-black text-sm text-zinc-950"
              style={{ backgroundColor: deckColor }}
            >
              {targetDeck}
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                <Disc3 className="w-4 h-4 text-zinc-400" />
                Carica Traccia su Deck {targetDeck}
              </h2>
              <p className="text-[10px] text-zinc-400">Swipe in alto o tocca X per chiudere</p>
            </div>
          </div>

          <button
            id="btn-close-drawer"
            type="button"
            onClick={() => {
              triggerHaptic(15);
              onClose();
            }}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 active:scale-95"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Sort Bar */}
        <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex flex-col gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              id="track-search-input"
              type="text"
              placeholder="Cerca per titolo, artista, genere, tonalità..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 text-xs rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-cyan-500 placeholder-zinc-500"
            />
          </div>

          <div className="flex items-center justify-between gap-1 text-[11px] font-mono">
            <span className="text-zinc-400 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-zinc-500" /> Ordina per:
            </span>
            <div className="flex items-center gap-1">
              {(['bpm', 'key', 'title'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    if (sortBy === mode) {
                      setSortAsc(!sortAsc);
                    } else {
                      setSortBy(mode);
                      setSortAsc(true);
                    }
                  }}
                  className={`px-2.5 py-1 rounded border uppercase ${
                    sortBy === mode
                      ? 'bg-zinc-800 text-cyan-400 border-cyan-500/50 font-bold'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                  }`}
                  style={{ minHeight: '34px' }}
                >
                  {mode} {sortBy === mode ? (sortAsc ? '▲' : '▼') : ''}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* File Upload Trigger */}
        <div className="px-3 py-2 bg-zinc-950/60 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-zinc-300">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>I tuoi brani da dispositivo:</span>
          </div>

          <label
            htmlFor="audio-file-upload"
            className="cursor-pointer px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold text-[11px] rounded-md shadow flex items-center gap-1.5 active:scale-95"
            style={{ minHeight: '36px' }}
          >
            {isUploading ? 'Caricamento...' : 'Sfoglia Audio File'}
            <input
              id="audio-file-upload"
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        </div>

        {/* Track List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 p-1">
          {filteredTracks.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">
              Nessuna traccia trovata con i filtri selezionati.
            </div>
          ) : (
            filteredTracks.map((track) => (
              <button
                key={track.id}
                id={`track-item-${track.id}`}
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  onSelectTrack(targetDeck, track);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-zinc-800/80 active:bg-zinc-700/80 transition-colors rounded-lg group select-none"
                style={{ minHeight: '56px' }}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-white/10"
                    style={{ backgroundColor: `${track.color}22`, borderColor: track.color }}
                  >
                    <Music className="w-4 h-4" style={{ color: track.color }} />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-zinc-100 truncate group-hover:text-cyan-300">
                      {track.title}
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">
                      {track.artist} • <span className="text-zinc-500">{track.genre}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-right font-mono">
                  <div className="text-[11px] font-bold text-zinc-200">
                    {track.bpm} <span className="text-[9px] text-zinc-500 font-normal">BPM</span>
                  </div>
                  <div className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {track.key}
                  </div>
                  <div
                    className="w-6 h-6 rounded-full border flex items-center justify-center text-zinc-400 group-hover:border-cyan-400 group-hover:text-cyan-400"
                    style={{ borderColor: `${track.color}66` }}
                  >
                    <Check className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Bottom swipe-indicator */}
        <div className="py-2 bg-zinc-950 flex justify-center items-center border-t border-zinc-800">
          <div className="w-12 h-1 bg-zinc-600 rounded-full" />
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, User, Tag, Calendar, MapPin, ExternalLink, Info } from 'lucide-react';

export default function StallDetailsModal({ stall, onClose }) {
  if (!stall) return null;

  return (
    <div className="glass-modal text-slate-100 rounded-xl p-5 shadow-2xl relative border border-slate-700/50 flex flex-col gap-4 text-left max-w-sm w-full transition-all duration-300 transform scale-100 opacity-100">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex gap-2.5 items-center">
          <span className="font-bold text-sm bg-accent-blue text-white px-2 py-1 rounded-md shadow-lg shadow-blue-500/20">
            {stall.id}
          </span>
          <span className="text-[11px] text-accent-orange-light font-semibold uppercase tracking-wider bg-accent-orange/10 px-2 py-0.5 rounded border border-accent-orange/20">
            {stall.category}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all focus:outline-none"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Info */}
      <div>
        <h3 className="text-xl font-bold text-slate-50 tracking-tight leading-snug">
          {stall.name}
        </h3>
        {stall.exhibitor && (
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Presented by <span className="text-slate-300 font-semibold">{stall.exhibitor}</span>
          </p>
        )}
      </div>

      {/* Description */}
      <p className="text-xs leading-relaxed text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-slate-900">
        {stall.description}
      </p>

      {/* Details Meta */}
      <div className="flex flex-col gap-2.5 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
        {stall.host && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-accent-blue-light" />
            <span>
              Booth Lead: <strong className="text-slate-200">{stall.host}</strong>
            </span>
          </div>
        )}
        {stall.event && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent-orange-light" />
            <span className="truncate">
              Upcoming Event: <strong className="text-slate-200">{stall.event}</strong>
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span>Interactive floor plan coordinates synced</span>
        </div>
      </div>

      {/* Tags */}
      {stall.tags && stall.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {stall.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800/60 px-2 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer Action buttons */}
      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/80">
        <button
          onClick={onClose}
          className="bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs py-2 rounded-lg font-medium transition-all border border-slate-800 text-center"
        >
          Dismiss
        </button>
        <button 
          onClick={() => alert(`Connecting with ${stall.exhibitor || 'Representative'}...`)}
          className="bg-accent-blue hover:bg-accent-blue-dark text-white text-xs py-2 rounded-lg font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-1"
        >
          <span>Book Meeting</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

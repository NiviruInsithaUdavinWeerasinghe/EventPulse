import React from 'react';
import { Search, SlidersHorizontal, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

export default function ControlPanel({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  stalls,
  activeStall,
  onSelectStall
}) {
  return (
    <div className="glass-panel p-4 rounded-xl flex flex-col gap-4 text-left">
      <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400 flex items-center gap-2">
        <SlidersHorizontal className="w-5 h-5 text-accent-blue-light" />
        Navigation & Search
      </h2>
      
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search exhibitor, stall, or tech..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900/60 border border-slate-700/60 focus:border-accent-blue rounded-lg py-2 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-400 focus:outline-none transition-all"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
      </div>

      {/* Category Filters */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Filter by Sector
        </label>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
              selectedCategory === 'All'
                ? 'bg-accent-blue/20 border-accent-blue text-accent-blue-light font-medium'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            All Sectors
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                selectedCategory === category
                  ? 'bg-accent-blue/20 border-accent-blue text-accent-blue-light font-medium'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Access Stall List */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Stall Index
        </label>
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
          {stalls.map((stall) => (
            <button
              key={stall.id}
              onClick={() => onSelectStall(stall)}
              className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all ${
                activeStall?.id === stall.id
                  ? 'bg-accent-orange/10 border border-accent-orange/40 text-accent-orange-light font-medium'
                  : 'bg-slate-950/40 hover:bg-slate-900/60 border border-slate-900 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="font-bold text-accent-blue-light bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  {stall.id}
                </span>
                <span className="truncate">{stall.name}</span>
              </div>
              <span className="text-[10px] text-slate-500 whitespace-nowrap bg-slate-900 px-1 py-0.5 rounded">
                {stall.category}
              </span>
            </button>
          ))}
          {stalls.length === 0 && (
            <span className="text-xs text-slate-500 italic p-2">No matching stalls found.</span>
          )}
        </div>
      </div>

      {/* Viewport Control Actions */}
      <div className="border-t border-slate-800 pt-3">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Canvas Actions
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onZoomIn}
            className="flex items-center justify-center gap-1.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 text-slate-300 py-1.5 rounded-lg text-xs transition-all"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            Zoom +
          </button>
          <button
            onClick={onZoomOut}
            className="flex items-center justify-center gap-1.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 text-slate-300 py-1.5 rounded-lg text-xs transition-all"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
            Zoom -
          </button>
          <button
            onClick={onResetZoom}
            className="flex items-center justify-center gap-1.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 text-slate-300 py-1.5 rounded-lg text-xs transition-all"
            title="Fit To Screen"
          >
            <Maximize className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

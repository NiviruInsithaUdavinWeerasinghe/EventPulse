import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Scissors, Info, Trash2, 
  Copy, Check, RefreshCw, Layers, Sparkles 
} from 'lucide-react';

export default function BlueprintMapper() {
  const [blueprintUrl, setBlueprintUrl] = useState(null);
  const [isDrawingMode, setIsDrawingMode] = useState(true);
  const [points, setPoints] = useState([]); // Current drawing points: [{x, y}]
  const [zones, setZones] = useState([]); // Finalized zones: [{id, name, category, points: [{x,y}], center: {x,y}, pointsStr: ""}]
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newZoneData, setNewZoneData] = useState({ id: '', name: '', category: 'Exhibition Stall' });
  const [copied, setCopied] = useState(false);

  const svgRef = useRef(null);
  const viewBoxWidth = 1000;
  const viewBoxHeight = 600;

  // Handle file upload and load as base64 URL or ObjectURL
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBlueprintUrl(url);
    }
  };

  // Convert client cursor coordinate to relative SVG coordinate
  const getSVGCoords = (e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    
    // Scale client mouse to SVG coordinate viewBox size
    const x = Math.round(((e.clientX - rect.left) / rect.width) * viewBoxWidth);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * viewBoxHeight);
    return { x, y };
  };

  // Handle canvas clicks (adding vertices)
  const handleCanvasClick = (e) => {
    if (!blueprintUrl || !isDrawingMode) return;
    const coords = getSVGCoords(e);

    // If click is close to the first point, close the polygon
    if (points.length >= 3) {
      const firstPoint = points[0];
      const dist = Math.hypot(coords.x - firstPoint.x, coords.y - firstPoint.y);
      if (dist < 12) {
        handleClosePolygon();
        return;
      }
    }

    setPoints([...points, coords]);
  };

  const handleMouseMove = (e) => {
    if (!blueprintUrl || !isDrawingMode) return;
    setMousePos(getSVGCoords(e));
  };

  const handleDoubleClick = () => {
    if (points.length >= 3) {
      handleClosePolygon();
    }
  };

  const handleClosePolygon = () => {
    setIsModalOpen(true);
  };

  const handleClearCurrent = () => {
    setPoints([]);
  };

  // Calculate coordinates average to find a smart map center focus
  const calculateCenter = (pts) => {
    const sumX = pts.reduce((sum, p) => sum + p.x, 0);
    const sumY = pts.reduce((sum, p) => sum + p.y, 0);
    return {
      x: Math.round(sumX / pts.length),
      y: Math.round(sumY / pts.length)
    };
  };

  const handleSaveZone = (e) => {
    e.preventDefault();
    if (!newZoneData.id.trim()) return;

    const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
    const center = calculateCenter(points);

    const completedZone = {
      id: newZoneData.id.toUpperCase(),
      name: newZoneData.name.trim() || `Stall ${newZoneData.id.toUpperCase()}`,
      category: newZoneData.category,
      points: pointsStr,
      center: center
    };

    setZones([...zones, completedZone]);
    setPoints([]);
    setNewZoneData({ id: '', name: '', category: 'Exhibition Stall' });
    setIsModalOpen(false);
  };

  const handleDeleteZone = (index) => {
    setZones(zones.filter((_, i) => i !== index));
  };

  // Generate attendee-viewer ready JSON structure
  const exportDataJson = useMemo(() => {
    return JSON.stringify(zones, null, 2);
  }, [zones]);

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(exportDataJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-left">
      
      {/* Settings / Upload Panel */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        
        {/* Step 1: Upload */}
        <div className="glass-panel p-5 rounded-xl flex flex-col gap-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Upload className="w-5 h-5 text-accent-blue-light" />
            1. Blueprint Base
          </h2>
          
          {!blueprintUrl ? (
            <label className="border-2 border-dashed border-slate-800 hover:border-accent-blue/50 bg-slate-950/40 rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all">
              <Upload className="w-8 h-8 text-slate-500" />
              <div className="text-center">
                <span className="text-xs text-slate-300 font-semibold block">Upload Blueprint</span>
                <span className="text-[10px] text-slate-500 mt-1 block">PNG, JPG or SVG hall layout</span>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="hidden" 
              />
            </label>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="text-xs text-slate-400 flex justify-between items-center bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="truncate">Blueprint Loaded</span>
                <button 
                  onClick={() => setBlueprintUrl(null)} 
                  className="text-red-400 hover:text-red-300 text-[10px] font-bold"
                >
                  Change
                </button>
              </div>
              
              {/* Drawing Controls */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-300 font-medium">Draw Mode</span>
                <button
                  onClick={() => setIsDrawingMode(!isDrawingMode)}
                  className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                    isDrawingMode 
                      ? 'bg-accent-blue text-white shadow shadow-blue-500/25' 
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDrawingMode ? 'ACTIVE' : 'PAUSED'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Drawn Zones Table */}
        <div className="glass-panel p-5 rounded-xl flex flex-col gap-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent-orange-light" />
            2. Map Zones ({zones.length})
          </h2>
          
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            {zones.map((zone, idx) => (
              <div 
                key={zone.id + idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-900 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-accent-blue-light">{zone.id}</span>
                    <span className="text-slate-300 font-semibold truncate max-w-[100px]">{zone.name}</span>
                  </div>
                  <span className="text-[9px] text-slate-500 block uppercase tracking-wider">{zone.category}</span>
                </div>
                <button
                  onClick={() => handleDeleteZone(idx)}
                  className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded transition-all"
                  title="Delete polygon"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {zones.length === 0 && (
              <span className="text-xs text-slate-500 italic py-4 text-center">No zones mapped yet.</span>
            )}
          </div>
        </div>
      </div>

      {/* Center Interactive Drawing Canvas */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        
        {/* Draw Board */}
        <div className="relative w-full aspect-[5/3] bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center justify-center">
          
          {!blueprintUrl ? (
            <div className="text-center p-8 select-none pointer-events-none text-slate-500 flex flex-col items-center gap-2">
              <Upload className="w-12 h-12 stroke-[1.5] text-slate-600 animate-bounce" />
              <p className="text-sm font-semibold">Upload a blueprint image to start mapping layout polygons.</p>
            </div>
          ) : (
            <>
              {/* Drawing HUD info bar */}
              <div className="absolute top-4 left-4 z-20 flex gap-2">
                <div className="glass-panel text-slate-300 text-[10px] uppercase font-bold tracking-wider py-1.5 px-3 rounded-lg flex items-center gap-1.5 select-none pointer-events-none">
                  <Scissors className="w-3.5 h-3.5 text-accent-blue" />
                  Vertices: {points.length}
                </div>
                {points.length >= 3 && (
                  <div className="glass-panel text-accent-orange text-[10px] uppercase font-bold tracking-wider py-1.5 px-3 rounded-lg flex items-center gap-1.5 select-none pointer-events-none animate-pulse">
                    Double-click or click start point to close shape
                  </div>
                )}
              </div>

              {/* Action resets */}
              {points.length > 0 && (
                <div className="absolute top-4 right-4 z-20">
                  <button
                    onClick={handleClearCurrent}
                    className="glass-panel text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 py-1.5 px-3 rounded-lg hover:bg-slate-900 transition-all flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset Current Shape
                  </button>
                </div>
              )}

              {/* Canvas Board */}
              <div className="w-full h-full relative">
                {/* Blueprint Background Image */}
                <img 
                  src={blueprintUrl} 
                  alt="blueprint layout" 
                  className="w-full h-full object-cover select-none pointer-events-none absolute top-0 left-0 opacity-40"
                />
                
                {/* Interactive SVG overlay */}
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                  className="absolute top-0 left-0 w-full h-full"
                  onClick={handleCanvasClick}
                  onMouseMove={handleMouseMove}
                  onDoubleClick={handleDoubleClick}
                >
                  {/* Finalized completed polygons */}
                  {zones.map((zone, idx) => (
                    <polygon
                      key={idx}
                      points={zone.points}
                      className="fill-accent-blue/15 stroke-accent-blue/60 stroke-2 hover:fill-accent-blue/35 transition-all"
                    />
                  ))}

                  {/* Completed labels */}
                  {zones.map((zone, idx) => (
                    <g key={`lbl-${idx}`}>
                      <rect 
                        x={zone.center.x - 20} 
                        y={zone.center.y - 10} 
                        width="40" 
                        height="20" 
                        rx="3" 
                        className="fill-slate-900/90 stroke-slate-800 stroke-[0.5] pointer-events-none"
                      />
                      <text
                        x={zone.center.x}
                        y={zone.center.y + 4}
                        textAnchor="middle"
                        className="fill-accent-blue-light text-[10px] font-extrabold pointer-events-none select-none"
                      >
                        {zone.id}
                      </text>
                    </g>
                  ))}

                  {/* Lines connecting points currently drawing */}
                  {points.length > 0 && (
                    <>
                      {/* Polygon fill preview */}
                      <polygon
                        points={[...points, mousePos].map(p => `${p.x},${p.y}`).join(' ')}
                        className="fill-accent-orange/10 stroke-none pointer-events-none"
                      />
                      
                      {/* Completed lines */}
                      <polyline
                        points={points.map(p => `${p.x},${p.y}`).join(' ')}
                        className="fill-none stroke-accent-orange stroke-2 stroke-dasharray-[4] pointer-events-none"
                      />
                      
                      {/* Trace line to current cursor mouse position */}
                      <line
                        x1={points[points.length - 1].x}
                        y1={points[points.length - 1].y}
                        x2={mousePos.x}
                        y2={mousePos.y}
                        className="stroke-accent-orange/60 stroke-[1.5] stroke-dasharray-[2] pointer-events-none"
                      />

                      {/* Vertices circles */}
                      {points.map((p, idx) => (
                        <circle
                          key={idx}
                          cx={p.x}
                          cy={p.y}
                          r={idx === 0 ? 6 : 4}
                          className={`${
                            idx === 0 
                              ? 'fill-accent-orange stroke-white stroke-[1.5] cursor-pointer hover:scale-125' 
                              : 'fill-slate-100 stroke-accent-orange stroke-[1]'
                          } transition-all`}
                        />
                      ))}
                    </>
                  )}
                </svg>
              </div>
            </>
          )}
        </div>

        {/* Exporter Block */}
        <div className="glass-panel p-5 rounded-xl flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-blue-light" />
              3. Generate Coordinates Data
            </h2>
            {zones.length > 0 && (
              <button
                onClick={handleCopyClipboard}
                className="flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg bg-accent-blue hover:bg-accent-blue-dark text-white shadow shadow-blue-500/20 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy JSON'}
              </button>
            )}
          </div>
          
          <div className="relative">
            <textarea
              readOnly
              value={exportDataJson}
              placeholder="Your coordinates JSON payload will render here after completing polygon paths on the blueprint..."
              className="w-full bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 text-xs font-mono text-slate-300 min-h-[160px] max-h-[300px] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Zone Details Tagging Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal max-w-sm w-full p-6 rounded-xl shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-accent-blue-light" />
              Tag Mapped Zone
            </h3>
            
            <form onSubmit={handleSaveZone} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                  Stall ID / Name Code (e.g. A1, STAGE)
                </label>
                <input
                  autoFocus
                  required
                  type="text"
                  placeholder="e.g. A1"
                  value={newZoneData.id}
                  onChange={(e) => setNewZoneData({ ...newZoneData, id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-accent-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                  Exhibitor / Display Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Security Inc."
                  value={newZoneData.name}
                  onChange={(e) => setNewZoneData({ ...newZoneData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-accent-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                  Zone Category Sector
                </label>
                <select
                  value={newZoneData.category}
                  onChange={(e) => setNewZoneData({ ...newZoneData, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-accent-blue focus:outline-none"
                >
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Biotechnology">Biotechnology</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Clean Energy">Clean Energy</option>
                  <option value="Robotics">Robotics</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Presentation Area">Presentation Area</option>
                  <option value="Refreshments">Refreshments</option>
                  <option value="Restrooms">Restrooms</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    handleClearCurrent();
                  }}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 hover:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent-blue hover:bg-accent-blue-dark text-white rounded-lg text-xs font-semibold shadow shadow-blue-500/20"
                >
                  Save Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

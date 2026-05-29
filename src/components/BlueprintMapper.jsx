import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Upload, Scissors, Info, Trash2, 
  Copy, Check, RefreshCw, Layers, Sparkles, MousePointerClick
} from 'lucide-react';

export default function BlueprintMapper() {
  const [blueprintUrl, setBlueprintUrl] = useState(null);
  const [svgContent, setSvgContent] = useState(null); // Stores raw SVG text for inline vector mapping
  const [isDrawingMode, setIsDrawingMode] = useState(true);
  const [points, setPoints] = useState([]); // Manual drawing points: [{x, y}]
  const [zones, setZones] = useState([]); // Mapped zones: [{id, name, category, center: {x,y}, points: "x1,y1 x2,y2..."}]
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newZoneData, setNewZoneData] = useState({ id: '', name: '', category: 'Cybersecurity' });
  const [copied, setCopied] = useState(false);

  // SVG Direct Element selection states
  const [selectedShapeElement, setSelectedShapeElement] = useState(null);
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [selectedShapeCenter, setSelectedShapeCenter] = useState(null);

  const svgRef = useRef(null);
  const viewBoxWidth = 1000;
  const viewBoxHeight = 600;

  // Reset all states
  const handleResetAll = () => {
    setBlueprintUrl(null);
    setSvgContent(null);
    setPoints([]);
    setZones([]);
    setSelectedShapeElement(null);
  };

  // Handle file upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBlueprintUrl(url);

      if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target.result;
          // Clean up SVG string (remove xml declaration if present)
          const cleanSvg = text.replace(/<\?xml.*\?>/gi, '').trim();
          setSvgContent(cleanSvg);
          setIsDrawingMode(false); // Toggle to Direct Click Mode automatically for SVG
          setZones([]); // Clear previous zones
        };
        reader.readAsText(file);
      } else {
        setSvgContent(null);
        setIsDrawingMode(true);
      }
    }
  };

  // Convert client cursor coordinate to relative SVG coordinate
  const getSVGCoords = (e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * viewBoxWidth);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * viewBoxHeight);
    return { x, y };
  };

  // Handle manual drawing clicks
  const handleCanvasClick = (e) => {
    if (!blueprintUrl || svgContent || !isDrawingMode) return;
    const coords = getSVGCoords(e);

    // Close polygon if clicking near first point
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
    if (!blueprintUrl || svgContent || !isDrawingMode) return;
    setMousePos(getSVGCoords(e));
  };

  const handleDoubleClick = () => {
    if (points.length >= 3 && !svgContent) {
      handleClosePolygon();
    }
  };

  const handleClosePolygon = () => {
    setIsModalOpen(true);
  };

  // Click handler for inline vector SVG elements
  const handleSvgElementClick = (e) => {
    if (!svgContent) return;
    const target = e.target;
    const tagName = target.tagName.toLowerCase();

    // Match vector shape elements
    if (['path', 'rect', 'polygon', 'circle', 'ellipse'].includes(tagName)) {
      e.stopPropagation();

      // Filter out background grids or giant border wrappers
      const rect = target.getBoundingClientRect();
      if (rect.width > 900 || rect.height > 550) return;

      let id = target.getAttribute('id');
      if (!id) {
        id = `shape-${Math.floor(1000 + Math.random() * 9000)}`;
        target.setAttribute('id', id);
      }

      // Calculate the visual center coordinates of the shape
      let center = { x: 500, y: 300 };
      const wrapper = document.getElementById('blueprint-wrapper');
      const wrapperSvg = wrapper ? wrapper.querySelector('svg') : null;

      if (wrapperSvg && target.getBBox) {
        try {
          const bbox = target.getBBox();
          center = {
            x: Math.round(bbox.x + bbox.width / 2),
            y: Math.round(bbox.y + bbox.height / 2)
          };
        } catch (err) {
          const svgRect = wrapperSvg.getBoundingClientRect();
          const viewboxAttr = wrapperSvg.getAttribute('viewBox') || '0 0 1000 600';
          const [, , vbW, vbH] = viewboxAttr.split(/[\s,]+/).map(Number);
          center = {
            x: Math.round(((rect.left + rect.width / 2 - svgRect.left) / svgRect.width) * vbW),
            y: Math.round(((rect.top + rect.height / 2 - svgRect.top) / svgRect.height) * vbH)
          };
        }
      }

      setSelectedShapeElement(target);
      setSelectedShapeId(id);
      setSelectedShapeCenter(center);

      setNewZoneData({
        id: id.startsWith('shape-') ? '' : id.toUpperCase(),
        name: target.getAttribute('name') || '',
        category: target.getAttribute('category') || 'Cybersecurity'
      });
      setIsModalOpen(true);
    }
  };

  const calculateCenter = (pts) => {
    if (pts.length === 0) return { x: 0, y: 0 };
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
    const newId = newZoneData.id.toUpperCase();

    if (svgContent && selectedShapeElement) {
      // Direct Vector Mapping Save:
      // Set the element's DOM ID to match the organizer-defined Stall ID
      selectedShapeElement.setAttribute('id', newId);
      selectedShapeElement.setAttribute('name', newZoneData.name || `Stall ${newId}`);
      selectedShapeElement.setAttribute('category', newZoneData.category);

      const completedZone = {
        id: newId,
        name: newZoneData.name.trim() || `Stall ${newId}`,
        category: newZoneData.category,
        center: selectedShapeCenter
      };

      setZones([...zones, completedZone]);
      setSelectedShapeElement(null);
    } else {
      // Manual Drawing Save:
      const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
      const center = calculateCenter(points);

      const completedZone = {
        id: newId,
        name: newZoneData.name.trim() || `Stall ${newId}`,
        category: newZoneData.category,
        points: pointsStr,
        center: center
      };

      setZones([...zones, completedZone]);
      setPoints([]);
    }

    setIsModalOpen(false);
    setNewZoneData({ id: '', name: '', category: 'Cybersecurity' });
  };

  const handleDeleteZone = (index) => {
    const deletedZone = zones[index];
    if (svgContent && deletedZone) {
      // Reset the ID of the DOM element in the SVG back to generic
      const el = document.getElementById(deletedZone.id);
      if (el) {
        el.setAttribute('id', `shape-${Math.floor(1000 + Math.random() * 9000)}`);
      }
    }
    setZones(zones.filter((_, i) => i !== index));
  };

  // Generate exported JSON coordinates
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
                  onClick={handleResetAll} 
                  className="text-red-400 hover:text-red-300 text-[10px] font-bold"
                >
                  Clear Base
                </button>
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-300 font-medium">
                  {svgContent ? 'Direct Click Mode' : 'Draw Mode'}
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-accent-blue text-white">
                  {svgContent ? 'VECTOR' : 'MANUAL'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Mapped Zones Table List */}
        <div className="glass-panel p-5 rounded-xl flex flex-col gap-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent-orange-light" />
            2. Map Zones ({zones.length})
          </h2>
          
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
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
                  title="Delete zone"
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

      {/* Center Interactive Drawing/Interception Canvas */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        
        {/* Draw Board Canvas Viewport */}
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
                  {svgContent ? (
                    <>
                      <MousePointerClick className="w-3.5 h-3.5 text-accent-blue animate-pulse" />
                      Click SVG Elements to Map
                    </>
                  ) : (
                    <>
                      <Scissors className="w-3.5 h-3.5 text-accent-orange" />
                      Vertices: {points.length}
                    </>
                  )}
                </div>
              </div>

              {/* Action reset for Manual mode */}
              {!svgContent && points.length > 0 && (
                <div className="absolute top-4 right-4 z-20">
                  <button
                    onClick={() => setPoints([])}
                    className="glass-panel text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 py-1.5 px-3 rounded-lg hover:bg-slate-900 transition-all flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset Current Shape
                  </button>
                </div>
              )}

              {/* Canvas viewport container */}
              <div className="w-full h-full relative overflow-auto">
                {svgContent ? (
                  /* Direct Click Vector SVG Mode */
                  <div 
                    className="w-full h-full relative"
                    onClick={handleSvgElementClick}
                  >
                    {/* Dynamic highlight styles targeting mapped elements */}
                    <style dangerouslySetInnerHTML={{ __html: `
                      #blueprint-wrapper svg path,
                      #blueprint-wrapper svg rect,
                      #blueprint-wrapper svg polygon,
                      #blueprint-wrapper svg circle {
                        cursor: pointer !important;
                        transition: all 0.2s ease !important;
                      }
                      #blueprint-wrapper svg path:hover,
                      #blueprint-wrapper svg rect:hover,
                      #blueprint-wrapper svg polygon:hover,
                      #blueprint-wrapper svg circle:hover {
                        fill: rgba(59, 130, 246, 0.25) !important;
                        stroke: #3b82f6 !important;
                        stroke-width: 2.5px !important;
                      }
                      ${zones.map(zone => `
                        #blueprint-wrapper #${zone.id} {
                          fill: rgba(37, 99, 235, 0.4) !important;
                          stroke: #3b82f6 !important;
                          stroke-width: 3px !important;
                        }
                      `).join('\n')}
                    `}} />
                    
                    <div 
                      id="blueprint-wrapper" 
                      className="w-full h-full flex items-center justify-center p-2"
                      dangerouslySetInnerHTML={{ __html: svgContent }} 
                    />
                  </div>
                ) : (
                  /* Fallback Custom Polygon Drawing Mode */
                  <>
                    <img 
                      src={blueprintUrl} 
                      alt="blueprint layout" 
                      className="w-full h-full object-cover select-none pointer-events-none absolute top-0 left-0 opacity-40"
                    />
                    
                    <svg
                      ref={svgRef}
                      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                      className="absolute top-0 left-0 w-full h-full"
                      onClick={handleCanvasClick}
                      onMouseMove={handleMouseMove}
                      onDoubleClick={handleDoubleClick}
                    >
                      {/* Grid overlay */}
                      <rect width="100%" height="100%" fill="none" className="stroke-slate-800/10" />

                      {/* Saved zones */}
                      {zones.map((zone, idx) => (
                        <polygon
                          key={idx}
                          points={zone.points}
                          className="fill-accent-blue/15 stroke-accent-blue/60 stroke-2 hover:fill-accent-blue/35 transition-all"
                        />
                      ))}

                      {/* Labels */}
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

                      {/* Manual draw previews */}
                      {points.length > 0 && (
                        <>
                          <polygon
                            points={[...points, mousePos].map(p => `${p.x},${p.y}`).join(' ')}
                            className="fill-accent-orange/10 stroke-none pointer-events-none"
                          />
                          <polyline
                            points={points.map(p => `${p.x},${p.y}`).join(' ')}
                            className="fill-none stroke-accent-orange stroke-2 stroke-dasharray-[4]"
                          />
                          <line
                            x1={points[points.length - 1].x}
                            y1={points[points.length - 1].y}
                            x2={mousePos.x}
                            y2={mousePos.y}
                            className="stroke-accent-orange/60 stroke-[1.5] stroke-dasharray-[2]"
                          />
                          {points.map((p, idx) => (
                            <circle
                              key={idx}
                              cx={p.x}
                              cy={p.y}
                              r={idx === 0 ? 6 : 4}
                              className={idx === 0 ? 'fill-accent-orange stroke-white stroke-[1.5]' : 'fill-slate-100 stroke-accent-orange'}
                            />
                          ))}
                        </>
                      )}
                    </svg>
                  </>
                )}
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
          <textarea
            readOnly
            value={exportDataJson}
            placeholder="Your coordinates JSON payload will render here after clicking mapping elements..."
            className="w-full bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 text-xs font-mono text-slate-300 min-h-[160px] max-h-[300px] focus:outline-none"
          />
        </div>
      </div>

      {/* Tagging Modal Overlay */}
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
                    setSelectedShapeElement(null);
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

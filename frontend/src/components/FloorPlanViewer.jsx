import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, Minus, RefreshCw, 
  MapPin, HelpCircle, AlertTriangle 
} from 'lucide-react';

export default function FloorPlanViewer({
  stalls,
  nonStallZones,
  landmarks,
  activeStall,
  onSelectStall,
  activeFloorPlan // Added from MERN active config
}) {
  const containerRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchStartDist, setTouchStartDist] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // SVG Original dimensions
  const svgWidth = 1000;
  const svgHeight = 600;

  const attendeeStyles = useMemo(() => {
    let styles = '';
    
    stalls.forEach(stall => {
      let colorClass = 'rgba(37, 99, 235, 0.2)'; // Blue default (Exhibitor)
      let strokeColor = '#3b82f6';
      
      if (stall.category === 'Presentation Area') {
        colorClass = 'rgba(245, 158, 11, 0.15)'; // Amber
        strokeColor = '#f59e0b';
      } else if (stall.category === 'Refreshments') {
        colorClass = 'rgba(16, 185, 129, 0.15)'; // Emerald
        strokeColor = '#10b981';
      } else if (stall.category === 'Restrooms') {
        colorClass = 'rgba(56, 189, 248, 0.15)'; // Sky
        strokeColor = '#38bdf8';
      }
      
      styles += `
        #blueprint-wrapper [id="${stall.id}" i] {
          fill: ${colorClass} !important;
          stroke: ${strokeColor} !important;
          stroke-width: 2px !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
        }
        #blueprint-wrapper [id="${stall.id}" i]:hover {
          fill: rgba(234, 88, 12, 0.25) !important;
          stroke: #ea580c !important;
        }
      `;
    });
    
    if (activeStall) {
      styles += `
        #blueprint-wrapper [id="${activeStall.id}" i] {
          fill: rgba(234, 88, 12, 0.45) !important;
          stroke: #ea580c !important;
          stroke-width: 3.5px !important;
          filter: drop-shadow(0 0 6px rgba(234, 88, 12, 0.4)) !important;
        }
      `;
    }
    
    return styles;
  }, [stalls, activeStall]);

  // Fit to screen initial load & reset
  const handleResetZoom = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const cw = container.clientWidth;
    const ch = container.clientHeight;

    const scaleX = cw / svgWidth;
    const scaleY = ch / svgHeight;
    const initialScale = Math.min(scaleX, scaleY, 1.2) * 0.95;

    const initialX = (cw - svgWidth * initialScale) / 2;
    const initialY = (ch - svgHeight * initialScale) / 2;

    enableTransitionTemporarily();
    setScale(initialScale);
    setPan({ x: initialX, y: initialY });
  };

  const enableTransitionTemporarily = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 450);
  };

  // Run initial fit to screen and handle resize
  useEffect(() => {
    handleResetZoom();
    window.addEventListener('resize', handleResetZoom);
    return () => window.removeEventListener('resize', handleResetZoom);
  }, [activeFloorPlan]); // Reset when new floor plan loads

  // Listen to custom canvas-zoom-in, canvas-zoom-out, and canvas-reset triggers
  useEffect(() => {
    const zoomInListener = () => handleZoom(1.25);
    const zoomOutListener = () => handleZoom(0.8);
    const resetListener = () => handleResetZoom();

    window.addEventListener('canvas-zoom-in', zoomInListener);
    window.addEventListener('canvas-zoom-out', zoomOutListener);
    window.addEventListener('canvas-reset', resetListener);

    return () => {
      window.removeEventListener('canvas-zoom-in', zoomInListener);
      window.removeEventListener('canvas-zoom-out', zoomOutListener);
      window.removeEventListener('canvas-reset', resetListener);
    };
  }, [scale, pan]);

  // Smoothly center the map on the active stall when selected
  useEffect(() => {
    if (activeStall && containerRef.current) {
      const container = containerRef.current;
      const cw = container.clientWidth;
      const ch = container.clientHeight;

      const targetScale = 1.6; 
      const targetX = cw / 2 - activeStall.center.x * targetScale;
      const targetY = ch / 2 - activeStall.center.y * targetScale;

      enableTransitionTemporarily();
      setScale(targetScale);
      setPan({ x: targetX, y: targetY });
    }
  }, [activeStall]);

  // Button zoom triggers
  const handleZoom = (factor) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const cw = container.clientWidth;
    const ch = container.clientHeight;

    const viewCenterX = cw / 2;
    const viewCenterY = ch / 2;

    const nextScale = Math.min(Math.max(scale * factor, 0.4), 4.5);
    const nextX = viewCenterX - ((viewCenterX - pan.x) / scale) * nextScale;
    const nextY = viewCenterY - ((viewCenterY - pan.y) / scale) * nextScale;

    enableTransitionTemporarily();
    setScale(nextScale);
    setPan({ x: nextX, y: nextY });
  };

  // Mouse Pan Event Handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const nextScale = Math.min(Math.max(scale * zoomFactor, 0.4), 4.5);

    const nextX = mouseX - ((mouseX - pan.x) / scale) * nextScale;
    const nextY = mouseY - ((mouseY - pan.y) / scale) * nextScale;

    setPan({ x: nextX, y: nextY });
    setScale(nextScale);
  };

  // Touch Zoom & Pan Handlers
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchStartDist(dist);
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      setPan({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    } else if (e.touches.length === 2 && touchStartDist > 0) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const zoomFactor = dist / touchStartDist;
      const nextScale = Math.min(Math.max(scale * zoomFactor, 0.4), 4.5);

      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

      const nextX = midX - ((midX - pan.x) / scale) * nextScale;
      const nextY = midY - ((midY - pan.y) / scale) * nextScale;

      setPan({ x: nextX, y: nextY });
      setScale(nextScale);
      setTouchStartDist(dist);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchStartDist(0);
  };

  // Click handler for inline vector SVG elements (Attendee View)
  const handleSvgElementClick = (e) => {
    const target = e.target;
    const id = target.getAttribute('id');
    if (id) {
      const matched = stalls.find(s => s.id.toUpperCase() === id.toUpperCase());
      if (matched) {
        onSelectStall(matched);
      }
    }
  };

  // Landmark Icons
  const renderLandmarkIcon = (type) => {
    switch (type) {
      case 'firstaid':
        return (
          <g className="text-red-500 fill-red-500/10">
            <rect x="-10" y="-10" width="20" height="20" rx="4" className="stroke-red-500 stroke-2" />
            <path d="M-5 0 H5 M0 -5 V5" className="stroke-red-500 stroke-2" />
          </g>
        );
      case 'exit':
        return (
          <g className="text-emerald-500 fill-emerald-500/10">
            <rect x="-10" y="-10" width="20" height="20" rx="4" className="stroke-emerald-500 stroke-2" />
            <path d="M-4 -4 H2 V4 H-4 M2 0 H6" className="stroke-emerald-500 stroke-2 fill-none" />
            <polygon points="4,-3 7,0 4,3" className="fill-emerald-500 stroke-none" />
          </g>
        );
      case 'restroom':
        return (
          <g className="text-sky-400 fill-sky-400/10">
            <rect x="-10" y="-10" width="20" height="20" rx="4" className="stroke-sky-400 stroke-2" />
            <circle cx="-3" cy="-4" r="2" className="stroke-sky-400 stroke-1" />
            <path d="M-5 0 H-1 V5 M-3 0 V5" className="stroke-sky-400 stroke-1 fill-none" />
            <circle cx="3" cy="-4" r="2" className="stroke-sky-400 stroke-1" />
            <path d="M1 0 H5 V5 M3 0 V5" className="stroke-sky-400 stroke-1 fill-none" />
          </g>
        );
      default:
        return <circle r="5" className="fill-slate-400" />;
    }
  };

  const renderActiveSvgContent = activeFloorPlan && activeFloorPlan.fileType === 'svg' && activeFloorPlan.rawSvgContent;

  return (
    <div className="relative w-full h-full min-h-[450px] md:min-h-[550px] bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Dynamic inline SVG styling injection */}
      {renderActiveSvgContent && (
        <style dangerouslySetInnerHTML={{ __html: attendeeStyles }} />
      )}

      {/* HUD Control Indicators */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <div className="glass-panel text-slate-400 text-[10px] uppercase font-bold tracking-wider py-1.5 px-3 rounded-lg flex items-center gap-1.5 pointer-events-none select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse"></span>
          Interactive Plan Mode
        </div>
        <div className="glass-panel text-slate-400 text-[10px] uppercase font-bold tracking-wider py-1.5 px-3 rounded-lg flex items-center gap-1.5 pointer-events-none select-none">
          Zoom: {Math.round(scale * 100)}%
        </div>
      </div>

      {/* Floating Canvas Zoom Panel */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5">
        <button
          onClick={() => handleZoom(1.25)}
          className="w-9 h-9 flex items-center justify-center rounded-lg glass-panel hover:bg-slate-800/80 text-slate-300 hover:text-white transition-all shadow-lg shadow-black/40"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(0.8)}
          className="w-9 h-9 flex items-center justify-center rounded-lg glass-panel hover:bg-slate-800/80 text-slate-300 hover:text-white transition-all shadow-lg shadow-black/40"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="w-9 h-9 flex items-center justify-center rounded-lg glass-panel hover:bg-slate-800/80 text-slate-300 hover:text-white transition-all shadow-lg shadow-black/40"
          title="Reset View"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Legend overlays */}
      <div className="absolute bottom-4 left-4 z-20 glass-panel p-3 rounded-lg hidden md:block select-none pointer-events-none">
        <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Legend</h4>
        <div className="flex flex-col gap-1.5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 bg-accent-blue/10 border border-accent-blue/60 rounded"></span>
            <span>Exhibitor Booths</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 bg-amber-500/10 border border-amber-500/40 rounded"></span>
            <span>Keynote Areas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 bg-emerald-500/10 border border-emerald-500/40 rounded"></span>
            <span>Refreshments</span>
          </div>
        </div>
      </div>

      {/* Map Viewport Canvas */}
      <div
        ref={containerRef}
        className={`w-full flex-grow relative overflow-hidden select-none cursor-grab active:cursor-grabbing ${
          isTransitioning ? 'transition-all duration-300' : ''
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {renderActiveSvgContent ? (
          /* MERN Inline SVG Renderer */
          <div
            id="blueprint-wrapper"
            onClick={handleSvgElementClick}
            className="absolute origin-top-left w-full h-full flex items-center justify-center p-2 attendee-svg-container"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transition: isTransitioning ? 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
            }}
            dangerouslySetInnerHTML={{ __html: activeFloorPlan.rawSvgContent }}
          />
        ) : (
          /* Standard fallback viewport map */
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="absolute origin-top-left"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transition: isTransitioning ? 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
            }}
          >
            {/* Grid Pattern */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.025)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Blueprint Background raster image if loaded from MERN */}
            {activeFloorPlan && activeFloorPlan.imageUrl && (
              <image
                href={activeFloorPlan.imageUrl}
                width={svgWidth}
                height={svgHeight}
                className="opacity-40 select-none pointer-events-none"
              />
            )}

            {/* Exhibition Outer Hall Border Walls (render only if no custom layout loaded) */}
            {(!activeFloorPlan || !activeFloorPlan.imageUrl) && (
              <rect
                x="10"
                y="10"
                width={svgWidth - 20}
                height={svgHeight - 20}
                rx="12"
                fill="none"
                className="stroke-slate-800 stroke-[3]"
              />
            )}

            {/* Non-Stall Major Zones (render only if fallback) */}
            {(!activeFloorPlan || !activeFloorPlan.imageUrl) && nonStallZones.map((zone) => {
              const isActive = activeStall?.id === zone.id;
              return (
                <g key={zone.id} className="group">
                  <polygon
                    points={zone.points}
                    onClick={() => onSelectStall(zone)}
                    className={`cursor-pointer transition-all duration-350 ${
                      zone.id === 'STAGE' 
                        ? 'fill-amber-500/10 stroke-amber-500/40 hover:fill-amber-500/15 group-hover:stroke-amber-500/60'
                        : zone.id === 'FOOD'
                        ? 'fill-emerald-500/10 stroke-emerald-500/40 hover:fill-emerald-500/15 group-hover:stroke-emerald-500/60'
                        : 'fill-slate-800/40 stroke-slate-700/60 hover:fill-slate-800/60 group-hover:stroke-slate-600'
                    }`}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                  <text
                    x={zone.center.x}
                    y={zone.center.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`pointer-events-none text-xs font-bold transition-all ${
                      zone.id === 'STAGE' 
                        ? 'fill-amber-400/80 group-hover:fill-amber-300'
                        : zone.id === 'FOOD'
                        ? 'fill-emerald-400/80 group-hover:fill-emerald-300'
                        : 'fill-slate-400 group-hover:fill-slate-200'
                    }`}
                  >
                    {zone.name}
                  </text>
                </g>
              );
            })}

            {/* Interactive Exhibitor Stalls */}
            {stalls.map((stall) => {
              const isActive = activeStall?.id === stall.id;
              return (
                <g key={stall.id} className="group">
                  <polygon
                    points={stall.points}
                    onClick={() => onSelectStall(stall)}
                    className={`cursor-pointer transition-all duration-200 ${
                      isActive
                        ? 'fill-accent-blue/20 stroke-accent-blue stroke-[2.5]'
                        : 'fill-slate-900/80 stroke-slate-700 hover:fill-accent-blue/10 hover:stroke-accent-blue-light'
                    }`}
                  />
                  <text
                    x={stall.center.x}
                    y={stall.center.y - 12}
                    textAnchor="middle"
                    className={`text-[13px] font-extrabold pointer-events-none select-none transition-colors ${
                      isActive ? 'fill-accent-blue-light' : 'fill-slate-400 group-hover:fill-slate-200'
                    }`}
                  >
                    {stall.id}
                  </text>
                  <text
                    x={stall.center.x}
                    y={stall.center.y + 10}
                    textAnchor="middle"
                    className={`text-[9px] pointer-events-none select-none max-w-[80px] font-medium transition-colors ${
                      isActive ? 'fill-slate-200' : 'fill-slate-500 group-hover:fill-slate-400'
                    }`}
                  >
                    {stall.name.split(' ')[0]}
                  </text>
                </g>
              );
            })}

            {/* Safety Landmarks/Icons Layer */}
            {(!activeFloorPlan || !activeFloorPlan.imageUrl) && landmarks.map((landmark) => (
              <g
                key={landmark.id}
                transform={`translate(${landmark.x}, ${landmark.y})`}
                className="cursor-pointer group"
                onClick={() => {
                  const zone = stalls.find(s => s.id === landmark.id.toUpperCase()) || 
                               nonStallZones.find(z => z.id === landmark.id.toUpperCase()) ||
                               { id: landmark.id, name: landmark.label, category: 'Landmark', description: landmark.label, center: { x: landmark.x, y: landmark.y } };
                  onSelectStall(zone);
                }}
              >
                {renderLandmarkIcon(landmark.type)}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <rect
                    x="-50"
                    y="-32"
                    width="100"
                    height="18"
                    rx="3"
                    className="fill-slate-900 stroke-slate-800"
                  />
                  <text
                    x="0"
                    y="-20"
                    textAnchor="middle"
                    className="fill-slate-300 text-[8px] font-bold"
                  >
                    {landmark.label}
                  </text>
                </g>
              </g>
            ))}

            {/* Flashing Location Marker for Active Selection */}
            {activeStall && (
              <g
                transform={`translate(${activeStall.center.x}, ${activeStall.center.y})`}
                className="pointer-events-none"
              >
                <circle
                  r="30"
                  fill="none"
                  className="stroke-accent-orange marker-pulse stroke-2"
                  style={{ transformOrigin: '0px 0px' }}
                />
                <circle
                  r="18"
                  fill="none"
                  className="stroke-accent-orange/40 marker-pulse stroke-1"
                  style={{ transformOrigin: '0px 0px', animationDelay: '0.5s' }}
                />
                <circle
                  r="5"
                  className="fill-accent-orange stroke-white stroke-[1.5]"
                />
              </g>
            )}
          </svg>
        )}
      </div>
    </div>
  );
}

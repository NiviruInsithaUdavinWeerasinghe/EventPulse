import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Upload, Scissors, Info, Trash2, 
  Copy, Check, RefreshCw, Layers, Sparkles, MousePointerClick,
  AlertCircle
} from 'lucide-react';

export default function BlueprintMapper({ activeFloorPlan, fetchFloorPlan, showNotification }) {
  const [blueprintUrl, setBlueprintUrl] = useState(null);
  const [svgContent, setSvgContent] = useState(null); // Stores raw SVG text for inline vector mapping
  const [isDrawingMode, setIsDrawingMode] = useState(true);
  const [points, setPoints] = useState([]); // Manual drawing points: [{x, y}]
  const [zones, setZones] = useState([]); // Mapped zones: [{id, name, category, center: {x,y}, points: "x1,y1 x2,y2..."}]
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newZoneData, setNewZoneData] = useState({ id: '', name: '', category: 'Cybersecurity' });
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // SVG Direct Element selection states
  const [selectedShapes, setSelectedShapes] = useState([]); // [{ id, center }]
  const [batchTagData, setBatchTagData] = useState({ prefix: '', startNum: '1', commonTitle: 'Booth', category: 'Cybersecurity' });

  // Drag-to-select (marquee) state
  const [dragRect, setDragRect] = useState(null); // { x, y, w, h } screen-px – only for visual rect
  const dragStartRef = useRef(null);              // { clientX, clientY } where drag began
  const isDragActiveRef = useRef(false);           // true once threshold crossed

  const svgRef = useRef(null);
  const viewBoxWidth = 1000;
  const viewBoxHeight = 600;

  const dynamicStyles = useMemo(() => {
    return zones.map(zone => `
      #blueprint-wrapper #${zone.id} {
        fill: rgba(37, 99, 235, 0.4) !important;
        stroke: #3b82f6 !important;
        stroke-width: 3px !important;
      }
    `).join('\n');
  }, [zones]);

  const selectedShapesStyles = useMemo(() => {
    if (selectedShapes.length === 0) return '';
    return selectedShapes.map(shape => `
      #blueprint-wrapper #${shape.id} {
        fill: rgba(234, 88, 12, 0.45) !important;
        stroke: #ea580c !important;
        stroke-width: 3.5px !important;
      }
    `).join('\n');
  }, [selectedShapes]);

  // Sync state from MERN backend prop on load or updates
  useEffect(() => {
    if (activeFloorPlan && activeFloorPlan.imageUrl) {
      setZones(activeFloorPlan.zones || []);
      setBlueprintUrl(activeFloorPlan.imageUrl);
      
      let rawSvg = activeFloorPlan.rawSvgContent || null;
      if (rawSvg) {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
          const shapes = doc.querySelectorAll('path, rect, polygon, circle, ellipse');
          shapes.forEach((shape, index) => {
            if (!shape.getAttribute('id')) {
              shape.setAttribute('id', `vector-shape-${index}`);
            }
          });
          const serializer = new XMLSerializer();
          rawSvg = serializer.serializeToString(doc);
        } catch (err) {
          console.error('Error pre-processing SVG IDs:', err);
        }
      }
      
      setSvgContent(rawSvg);
      setIsDrawingMode(!activeFloorPlan.rawSvgContent);
    } else {
      setZones([]);
      setBlueprintUrl(null);
      setSvgContent(null);
      setIsDrawingMode(true);
    }
  }, [activeFloorPlan]);

  // Preload details for a single selected shape
  useEffect(() => {
    if (isModalOpen && selectedShapes.length === 1) {
      const shape = selectedShapes[0];
      const existingZone = zones.find(z => z.id === shape.id);
      if (existingZone) {
        setNewZoneData({
          id: existingZone.id,
          name: existingZone.name,
          category: existingZone.category
        });
      } else {
        setNewZoneData({
          id: shape.id.startsWith('vector-shape-') ? '' : shape.id.toUpperCase(),
          name: '',
          category: 'Cybersecurity'
        });
      }
    }
  }, [isModalOpen, selectedShapes, zones]);

  // Preload batch tag details for multiple selected shapes if they are already mapped
  useEffect(() => {
    if (isModalOpen && selectedShapes.length > 1) {
      // Helper: find a zone for a shape, by exact ID match first, then by spatial proximity.
      // Proximity fallback is needed because SVG shapes often have two stacked paths
      // (fill + stroke). The user might click the stroke path (vector-shape-X) that sits on
      // top of the fill path that carries the real tagged ID (e.g. "FS1"). The centers of both
      // paths are virtually identical, so a small distance threshold resolves the right zone.
      const findZoneForShape = (shape) => {
        // 1. Exact ID match
        const byId = zones.find(z => z.id === shape.id);
        if (byId) return byId;
        // 2. Proximity match – within 40 SVG units on both axes
        return zones.find(z =>
          Math.abs(z.center.x - shape.center.x) <= 40 &&
          Math.abs(z.center.y - shape.center.y) <= 40
        ) || null;
      };

      const mappedZones = selectedShapes
        .map(findZoneForShape)
        .filter(Boolean);

      if (mappedZones.length > 0) {
        const baseZone = mappedZones[0];

        // Robustly split an ID like "FS1", "FOOD-3", "A12" into prefix + number
        // Regex: capture all leading non-digit chars as prefix, trailing digits as number
        const idMatch = baseZone.id.match(/^([^\d]*)(\d+)$/);
        const prefix = idMatch ? idMatch[1] : baseZone.id;
        const startNum = idMatch ? idMatch[2] : '1';

        // Derive commonTitle by stripping the full ID (and any surrounding spaces) from the name
        // e.g. "Food Stalls FS1" -> strip " FS1" -> "Food Stalls"
        let commonTitle = baseZone.name
          .replace(new RegExp(`\\s*${baseZone.id}\\s*$`, 'i'), '')
          .trim();
        if (!commonTitle) commonTitle = 'Booth';

        setBatchTagData({
          prefix,
          startNum,
          commonTitle,
          category: baseZone.category || 'Cybersecurity'
        });
      }
      // If none of the selected shapes are yet mapped, leave defaults so user can fill in fresh
    }
  }, [isModalOpen, selectedShapes, zones]);

  // Reset inputs when modal is closed (but do NOT touch selectedShapes here)
  useEffect(() => {
    if (!isModalOpen) {
      setNewZoneData({ id: '', name: '', category: 'Cybersecurity' });
      setBatchTagData({ prefix: '', startNum: '1', commonTitle: 'Booth', category: 'Cybersecurity' });
    }
  }, [isModalOpen]);

  // Reset/Clear base floor plan layout in MERN backend
  const handleResetAll = () => {
    setShowConfirmModal(true);
  };

  const confirmResetAll = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/floorplan/clear', {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchFloorPlan();
        setBlueprintUrl(null);
        setSvgContent(null);
        setPoints([]);
        setZones([]);
        setShowConfirmModal(false);
        if (showNotification) {
          showNotification('Blueprint layout deactivated and cleared from database successfully!', 'success');
        }
      } else {
        const data = await res.json();
        if (showNotification) {
          showNotification(`Failed to clear layout from server: ${data.error || 'Unknown error'}`, 'error');
        }
      }
    } catch (err) {
      console.error(err);
      if (showNotification) {
        showNotification('Network error connecting to API server to clear layout.', 'error');
      }
    }
  };

  // Upload blueprint file to MERN server (Cloudinary and DB persist)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('blueprint', file);

    try {
      setUploading(true);
      const res = await fetch('http://localhost:5000/api/floorplan/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        await fetchFloorPlan();
        if (showNotification) {
          showNotification('Blueprint successfully uploaded to Cloudinary & active floor plan layout initialized!', 'success');
        }
      } else {
        if (showNotification) {
          showNotification(`Upload failed: ${data.error || 'Unknown error'}`, 'error');
        }
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      if (showNotification) {
        showNotification('Network error connecting to API server.', 'error');
      }
    } finally {
      setUploading(false);
    }
  };

  // PUT zones update request
  const saveZonesToDb = async (updatedZones) => {
    try {
      const wrapper = document.getElementById('blueprint-wrapper');
      const updatedSvg = wrapper ? wrapper.innerHTML : null;

      const res = await fetch('http://localhost:5000/api/floorplan/zones', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ zones: updatedZones, rawSvgContent: updatedSvg })
      });
      if (res.ok) {
        await fetchFloorPlan();
        if (showNotification) {
          showNotification('Zones mapping saved successfully!', 'success');
        }
      } else {
        const data = await res.json();
        if (showNotification) {
          showNotification(`Failed to save mapping to DB: ${data.error}`, 'error');
        }
      }
    } catch (err) {
      console.error(err);
      if (showNotification) {
        showNotification('Failed to connect to the backend server to save mapping.', 'error');
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

      const rect = target.getBoundingClientRect();
      if (rect.width > 900 || rect.height > 550) return;

      const id = target.getAttribute('id');
      if (!id) return;

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

      // Toggle shape selection in state
      setSelectedShapes((prev) => {
        const exists = prev.find((s) => s.id === id);
        if (exists) {
          return prev.filter((s) => s.id !== id);
        } else {
          return [...prev, { id, center }];
        }
      });
    }
  };

  // ─── Drag-to-select helpers ───────────────────────────────────────────────

  /** Resolve center + id for a single SVG element, or null if it should be skipped */
  const resolveShapeInfo = (el, svg) => {
    const id = el.getAttribute('id');
    if (!id) return null;

    // Skip anything that lives inside <clipPath> or <defs> — those are invisible helpers
    if (el.closest('clipPath') || el.closest('defs')) return null;

    const screenRect = el.getBoundingClientRect();
    // Skip zero-size invisible elements
    if (screenRect.width < 0.5 && screenRect.height < 0.5) return null;

    // Skip elements whose area covers > 15% of the SVG canvas
    // (large background/outline paths that shouldn't be selectable)
    const svgScreenRect = svg.getBoundingClientRect();
    const svgArea = svgScreenRect.width * svgScreenRect.height;
    const shapeArea = screenRect.width * screenRect.height;
    if (svgArea > 0 && shapeArea / svgArea > 0.15) return null;

    let center = { x: 0, y: 0 };
    try {
      const bbox = el.getBBox();
      center = {
        x: Math.round(bbox.x + bbox.width / 2),
        y: Math.round(bbox.y + bbox.height / 2)
      };
    } catch {
      const parts = (svg.getAttribute('viewBox') || '0 0 841 595').split(/[\s,]+/).map(Number);
      const vbW = parts[2] || 841;
      const vbH = parts[3] || 595;
      center = {
        x: Math.round(((screenRect.left + screenRect.width  / 2 - svgScreenRect.left) / svgScreenRect.width)  * vbW),
        y: Math.round(((screenRect.top  + screenRect.height / 2 - svgScreenRect.top)  / svgScreenRect.height) * vbH)
      };
    }
    return { id, center, screenRect };
  };

  /** Add all shapes whose screen-center falls inside the drag rectangle */
  const finalizeDragSelection = (x1, y1, x2, y2) => {
    const left   = Math.min(x1, x2);
    const right  = Math.max(x1, x2);
    const top    = Math.min(y1, y2);
    const bottom = Math.max(y1, y2);
    if (right - left < 4 || bottom - top < 4) return; // too small → ignore

    const wrapper = document.getElementById('blueprint-wrapper');
    const svg = wrapper?.querySelector('svg');
    if (!svg) return;

    const newSelections = [];
    const seen = new Set();

    svg.querySelectorAll('path, rect, polygon, circle, ellipse').forEach(el => {
      const info = resolveShapeInfo(el, svg);
      if (!info || seen.has(info.id)) return;

      const cx = info.screenRect.left + info.screenRect.width  / 2;
      const cy = info.screenRect.top  + info.screenRect.height / 2;

      if (cx >= left && cx <= right && cy >= top && cy <= bottom) {
        seen.add(info.id);
        newSelections.push({ id: info.id, center: info.center });
      }
    });

    if (newSelections.length > 0) {
      setSelectedShapes(prev => {
        const combined = [...prev];
        newSelections.forEach(s => {
          if (!combined.find(p => p.id === s.id)) combined.push(s);
        });
        return combined;
      });
    }
  };

  const handleMapMouseDown = (e) => {
    if (!svgContent) return;
    const tag = e.target.tagName.toLowerCase();
    const isShape = ['path', 'rect', 'polygon', 'circle', 'ellipse'].includes(tag);

    dragStartRef.current = { clientX: e.clientX, clientY: e.clientY, isShape, target: e.target };
    isDragActiveRef.current = false;

    // Always prevent browser default (text-select / image-drag) during mouse interaction
    e.preventDefault();
  };

  const handleMapMouseMove = (e) => {
    // Allow drag-select to start from ANYWHERE — including on top of a background path.
    // (The old check `dragStartRef.current.isShape` was the bug: the large SVG background
    //  path registered as "isShape=true" and short-circuited every drag attempt.)
    if (!svgContent || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      isDragActiveRef.current = true;
      setDragRect({
        x: Math.min(e.clientX, dragStartRef.current.clientX),
        y: Math.min(e.clientY, dragStartRef.current.clientY),
        w: Math.abs(dx),
        h: Math.abs(dy)
      });
    }
  };

  const handleMapMouseUp = (e) => {
    if (!svgContent || !dragStartRef.current) return;

    if (isDragActiveRef.current) {
      // Marquee release — collect shapes
      finalizeDragSelection(
        dragStartRef.current.clientX, dragStartRef.current.clientY,
        e.clientX, e.clientY
      );
    } else if (dragStartRef.current.isShape) {
      // Short click on a shape — delegate to existing toggle logic
      handleSvgElementClick({ target: dragStartRef.current.target, stopPropagation: () => {} });
    }

    dragStartRef.current = null;
    isDragActiveRef.current = false;
    setDragRect(null);
  };

  const handleMapMouseLeave = () => {
    // Cancel drag visually if mouse exits the canvas
    if (isDragActiveRef.current) {
      dragStartRef.current = null;
      isDragActiveRef.current = false;
      setDragRect(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  const calculateCenter = (pts) => {
    if (pts.length === 0) return { x: 0, y: 0 };
    const sumX = pts.reduce((sum, p) => sum + p.x, 0);
    const sumY = pts.reduce((sum, p) => sum + p.y, 0);
    return {
      x: Math.round(sumX / pts.length),
      y: Math.round(sumY / pts.length)
    };
  };

  const handleSaveZone = async (e) => {
    e.preventDefault();
    if (!newZoneData.id.trim()) return;
    const newId = newZoneData.id.toUpperCase();

    let updatedZones = [];

    if (svgContent && selectedShapes.length === 1) {
      // Direct Vector Single Edit
      const shape = selectedShapes[0];
      
      const el = document.getElementById(shape.id);
      if (el) {
        el.setAttribute('id', newId);
        el.setAttribute('name', newZoneData.name.trim() || `Stall ${newId}`);
        el.setAttribute('category', newZoneData.category);
      }

      const completedZone = {
        id: newId,
        name: newZoneData.name.trim() || `Stall ${newId}`,
        category: newZoneData.category,
        center: shape.center
      };

      const exists = zones.some(z => z.id === shape.id);
      if (exists) {
        updatedZones = zones.map(z => z.id === shape.id ? completedZone : z);
      } else {
        updatedZones = [...zones, completedZone];
      }
      setSelectedShapes([]);
    } else {
      // Manual Drawing Save
      const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
      const center = calculateCenter(points);

      const completedZone = {
        id: newId,
        name: newZoneData.name.trim() || `Stall ${newId}`,
        category: newZoneData.category,
        points: pointsStr,
        center: center
      };

      updatedZones = [...zones, completedZone];
      setPoints([]);
    }

    setZones(updatedZones);
    await saveZonesToDb(updatedZones);

    setIsModalOpen(false);
    setNewZoneData({ id: '', name: '', category: 'Cybersecurity' });
  };

  const handleBatchSaveZones = async (e) => {
    e.preventDefault();
    if (selectedShapes.length === 0) return;

    const prefix = batchTagData.prefix.toUpperCase();
    let startNum = parseInt(batchTagData.startNum, 10);
    if (isNaN(startNum)) startNum = 1;

    // Check if the details are identical to already saved zones to prevent redundant saves
    let isIdentical = true;
    selectedShapes.forEach((shape, index) => {
      const seqId = `${prefix}${startNum + index}`;
      const name = `${batchTagData.commonTitle} ${seqId}`;
      const category = batchTagData.category;
      
      const existingZone = zones.find(z => z.id === shape.id);
      if (!existingZone || existingZone.id !== seqId || existingZone.name !== name || existingZone.category !== category) {
        isIdentical = false;
      }
    });

    if (isIdentical) {
      if (showNotification) {
        showNotification('These shapes are already saved with the exact same details.', 'info');
      }
      setIsModalOpen(false);
      return;
    }

    let updatedZones = [...zones];

    selectedShapes.forEach((shape, index) => {
      const seqId = `${prefix}${startNum + index}`;
      const name = `${batchTagData.commonTitle} ${seqId}`;
      const category = batchTagData.category;

      const el = document.getElementById(shape.id);
      if (el) {
        el.setAttribute('id', seqId);
        el.setAttribute('name', name);
        el.setAttribute('category', category);
      }

      const completedZone = {
        id: seqId,
        name: name,
        category: category,
        center: shape.center
      };
      
      // If it exists in the zones list, replace it. Otherwise append it.
      const existsIndex = updatedZones.findIndex(z => z.id === shape.id);
      if (existsIndex > -1) {
        updatedZones[existsIndex] = completedZone;
      } else {
        updatedZones.push(completedZone);
      }
    });

    setZones(updatedZones);
    await saveZonesToDb(updatedZones);
    setSelectedShapes([]);
    setIsModalOpen(false);
  };

  const handleDeleteZone = async (index) => {
    const deletedZone = zones[index];
    if (svgContent && deletedZone) {
      const el = document.getElementById(deletedZone.id);
      if (el) {
        el.setAttribute('id', `shape-${Math.floor(1000 + Math.random() * 9000)}`);
      }
    }
    const updatedZones = zones.filter((_, i) => i !== index);
    setZones(updatedZones);
    await saveZonesToDb(updatedZones);
  };

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
                <span className="text-xs text-slate-300 font-semibold block">
                  {uploading ? 'Uploading...' : 'Upload Blueprint'}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">PNG, JPG or SVG hall layout</span>
              </div>
              <input 
                disabled={uploading}
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="hidden" 
              />
            </label>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="text-xs text-slate-400 flex justify-between items-center bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="truncate">Blueprint Active</span>
                <button 
                  onClick={handleResetAll} 
                  className="text-red-400 hover:text-red-300 text-[10px] font-bold"
                >
                  Clear Layout
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

        {/* Batch Actions Panel */}
        {selectedShapes.length > 0 && (
          <div className="glass-panel p-5 rounded-xl flex flex-col gap-4 animate-scale-in">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-orange-light animate-pulse" />
              Batch Actions ({selectedShapes.length})
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              You have selected {selectedShapes.length} shapes on the floor plan. Click below to tag them in sequence.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-2.5 bg-accent-orange hover:bg-accent-orange-dark text-white rounded-lg text-xs font-semibold shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                Tag Selected Shapes
              </button>
              <button
                onClick={() => setSelectedShapes([])}
                className="w-full py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                Deselect All
              </button>
            </div>
          </div>
        )}

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

      {/* Center Drawing/Interception Canvas */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        <div className="relative w-full aspect-[5/3] bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center justify-center">
          {uploading && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md z-45 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-10 h-10 animate-spin text-accent-blue" />
              <p className="text-sm font-semibold text-slate-200 animate-pulse">Uploading blueprint...</p>
              <p className="text-[11px] text-slate-400">Processing Cloudinary upload and vector assets</p>
            </div>
          )}
          {!blueprintUrl ? (
            <div className="text-center p-8 select-none pointer-events-none text-slate-500 flex flex-col items-center gap-2">
              <Upload className="w-12 h-12 stroke-[1.5] text-slate-600 animate-bounce" />
              <p className="text-sm font-semibold">Upload a blueprint image to start mapping layout polygons.</p>
            </div>
          ) : (
            <>
              {/* HUD info bar */}
              <div className="absolute top-4 left-4 z-20 flex gap-2">
                <div className="glass-panel text-slate-300 text-[10px] uppercase font-bold tracking-wider py-1.5 px-3 rounded-lg flex items-center gap-1.5 select-none pointer-events-none">
                  {svgContent ? (
                    <>
                      <MousePointerClick className="w-3.5 h-3.5 text-accent-blue animate-pulse" />
                      Click or Drag to Select
                    </>
                  ) : (
                    <>
                      <Scissors className="w-3.5 h-3.5 text-accent-orange" />
                      Vertices: {points.length}
                    </>
                  )}
                </div>
              </div>

              {!svgContent && points.length > 0 && (
                <div className="absolute top-4 right-4 z-20">
                  <button
                    onClick={() => setPoints([])}
                    className="glass-panel text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 py-1.5 px-3 rounded-lg hover:bg-slate-900 transition-all flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset Shape
                  </button>
                </div>
              )}

              {/* Viewport canvas */}
              <div className="w-full h-full relative overflow-auto">
                {svgContent ? (
                  /* SVG Click / Drag-Select Vector Mode */
                  <div 
                    className="w-full h-full relative select-none"
                    onMouseDown={handleMapMouseDown}
                    onMouseMove={handleMapMouseMove}
                    onMouseUp={handleMapMouseUp}
                    onMouseLeave={handleMapMouseLeave}
                  >
                    <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />
                    <style dangerouslySetInnerHTML={{ __html: selectedShapesStyles }} />

                    <div 
                      id="blueprint-wrapper" 
                      className="w-full h-full flex items-center justify-center p-2"
                      dangerouslySetInnerHTML={{ __html: svgContent }} 
                    />

                    {/* Marquee drag-select rectangle overlay */}
                    {dragRect && (
                      <div
                        className="pointer-events-none fixed z-50"
                        style={{
                          left:   dragRect.x,
                          top:    dragRect.y,
                          width:  dragRect.w,
                          height: dragRect.h,
                          border: '1.5px solid rgba(234, 88, 12, 0.85)',
                          background: 'rgba(234, 88, 12, 0.08)',
                          boxShadow: 'inset 0 0 0 1px rgba(234,88,12,0.25)',
                          borderRadius: '2px'
                        }}
                      />
                    )}
                  </div>
                ) : (
                  /* PNG/JPG Manual Mode fallback */
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
                      <rect width="100%" height="100%" fill="none" className="stroke-slate-800/10" />

                      {zones.map((zone, idx) => (
                        <polygon
                          key={idx}
                          points={zone.points}
                          className="fill-accent-blue/15 stroke-accent-blue/60 stroke-2 hover:fill-accent-blue/35 transition-all"
                        />
                      ))}

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

        {/* Exporter json coordinates */}
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

      {/* Modal Tagging Form */}
      {createPortal(
        <div 
          onClick={() => {
            setIsModalOpen(false);
            // Do NOT clear selectedShapes here — user should keep their selection after closing
            setPoints([]);
          }}
          className={`fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 transition-opacity duration-250 ease-out ${
            isModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`bg-slate-900 border border-slate-800 max-w-sm w-full p-6 rounded-xl shadow-2xl relative transition-[opacity,transform] duration-250 ease-out transform ${
              isModalOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
          >
            {svgContent && selectedShapes.length > 1 ? (
              /* Vector Mode Batch Tagging Form */
              <>
                <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent-orange-light animate-pulse" />
                  Batch Tag Selected ({selectedShapes.length})
                </h3>
                <form onSubmit={handleBatchSaveZones} className="flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                      ID Prefix (e.g. A, STALL-)
                    </label>
                    <input
                      autoFocus
                      required
                      type="text"
                      placeholder="e.g. A"
                      value={batchTagData.prefix}
                      onChange={(e) => setBatchTagData({ ...batchTagData, prefix: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-accent-orange focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                        Start Sequence #
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        placeholder="e.g. 1"
                        value={batchTagData.startNum}
                        onChange={(e) => setBatchTagData({ ...batchTagData, startNum: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-accent-orange focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                        Common Base Title
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Booth"
                        value={batchTagData.commonTitle}
                        onChange={(e) => setBatchTagData({ ...batchTagData, commonTitle: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-accent-orange focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                      Zone Category Sector
                    </label>
                    <select
                      value={batchTagData.category}
                      onChange={(e) => setBatchTagData({ ...batchTagData, category: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-accent-orange focus:outline-none"
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
                        // Keep selectedShapes intact so user can re-open or modify
                      }}
                      className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 hover:text-slate-350 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-accent-orange hover:bg-accent-orange-dark text-white rounded-lg text-xs font-semibold shadow shadow-orange-500/20"
                    >
                      Save Zones ({selectedShapes.length})
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Manual Drawing Single Tagging Form */
              <>
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
                        // Keep selectedShapes intact; only clear manual drawing points
                        setPoints([]);
                      }}
                      className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 hover:text-slate-350 transition-all"
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
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 max-w-sm w-full p-6 rounded-xl shadow-2xl text-left animate-scale-in">
            <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Clear Blueprint Layout?
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to clear the blueprint? This will deactivate the current layout and clear all mapped stalls.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 hover:text-slate-350 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmResetAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-lg shadow-red-500/25 transition-all"
              >
                Clear Layout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

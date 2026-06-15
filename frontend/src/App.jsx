import React, { useState, useEffect, useMemo } from 'react';
import { stallsData, nonStallZones, landmarks } from './data/stallsData';
import FloorPlanViewer from './components/FloorPlanViewer';
import ControlPanel from './components/ControlPanel';
import StallDetailsModal from './components/StallDetailsModal';
import BlueprintMapper from './components/BlueprintMapper';
import { 
  Compass, Shield, Flame, Activity, Settings, Eye, RefreshCw,
  CheckCircle2, AlertCircle, Info, X 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('attendee'); // 'attendee' or 'organizer'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeStall, setActiveStall] = useState(null);
  
  // Persisted Database State
  const [activeFloorPlan, setActiveFloorPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  // Custom toast notification state
  const [notification, setNotification] = useState(null); // { message, type: 'success' | 'error' | 'info' }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  // Auto-dismiss custom notifications after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch active layout from backend MERN database
  const fetchFloorPlan = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/floorplan');
      if (res.ok) {
        const data = await res.json();
        if (data && data.imageUrl) {
          setActiveFloorPlan(data);
        } else {
          setActiveFloorPlan(null);
        }
      }
    } catch (err) {
      console.error('Error fetching floor plan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFloorPlan();
  }, []);

  // Use persisted database zones if available, otherwise return empty array
  const currentStalls = useMemo(() => {
    return activeFloorPlan && activeFloorPlan.zones ? activeFloorPlan.zones : [];
  }, [activeFloorPlan]);

  // Extract all categories dynamically based on active booths
  const categories = useMemo(() => {
    const allCats = currentStalls.map((stall) => stall.category).filter(Boolean);
    return [...new Set(allCats)];
  }, [currentStalls]);

  // Filter stalls based on search inputs
  const filteredStalls = useMemo(() => {
    return currentStalls.filter((stall) => {
      const nameVal = stall.name || '';
      const idVal = stall.id || '';
      const catVal = stall.category || '';
      const descVal = stall.description || '';

      const matchesSearch =
        nameVal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idVal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        catVal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        descVal.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' || catVal === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [currentStalls, searchTerm, selectedCategory]);

  const handleSelectStall = (stall) => {
    setActiveStall(stall);
  };

  const handleCloseModal = () => {
    setActiveStall(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Premium Glassmorphic Top Navigation Header */}
      <header className="glass-panel sticky top-0 z-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-accent-blue to-accent-orange p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
            <Compass className="w-6 h-6 text-white animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              EventPulse <span className="text-accent-orange font-medium text-sm px-1.5 py-0.5 rounded bg-accent-orange/10 ml-1.5 border border-accent-orange/20">v1.2</span>
            </h1>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Interactive Floor Plan & Space Locator
            </p>
          </div>
        </div>

        {/* Tab switcher controls */}
        <div className="flex gap-2 p-1.5 bg-slate-950/80 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('attendee')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'attendee'
                ? 'bg-accent-blue text-white shadow shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Attendee Floor Plan
          </button>
          <button
            onClick={() => setActiveTab('organizer')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'organizer'
                ? 'bg-accent-orange text-white shadow shadow-orange-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Organizer Mapper
          </button>
        </div>

        {/* Live event statistics tracker */}
        <div className="hidden lg:flex items-center gap-6 text-xs border-l border-slate-800/80 pl-6">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent-blue-light animate-pulse" />
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Total Booths</span>
              <span className="font-bold text-slate-200">{currentStalls.length} Mapped</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Safety Level</span>
              <span className="font-bold text-emerald-400">Class-A Certified</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-accent-blue" />
            <p className="text-sm font-semibold">Synchronizing Event Floor Plan...</p>
          </div>
        ) : (
          <div className="relative w-full min-h-[500px]">
            {/* Attendee Floor Plan Tab Container */}
            <div className={activeTab === 'attendee' ? 'block' : 'hidden'}>
              {!activeFloorPlan ? (
                /* Empty state when no plan has been uploaded yet */
                <div className="glass-panel p-12 rounded-2xl text-center flex flex-col items-center justify-center gap-4 max-w-2xl mx-auto my-12">
                  <Compass className="w-16 h-16 text-slate-500 animate-spin-slow stroke-[1.5]" />
                  <h2 className="text-2xl font-bold text-slate-200">No Active Floor Plan Published</h2>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                    The database does not contain any published event floor plan blueprint layouts. Switch to the **Organizer Mapper** tab in the top header to configure and upload your event blueprint hall map.
                  </p>
                  <button
                    onClick={() => setActiveTab('organizer')}
                    className="mt-2 bg-accent-blue hover:bg-accent-blue-dark text-white font-semibold py-2 px-5 rounded-lg shadow-lg shadow-blue-500/25 transition-all text-sm"
                  >
                    Go to Organizer Dashboard
                  </button>
                </div>
              ) : (
                /* Attendee Mapping Dashboard Panel */
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  
                  {/* Left Control and Search Column */}
                  <div className="lg:col-span-1 flex flex-col gap-6">
                    <ControlPanel
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      selectedCategory={selectedCategory}
                      setSelectedCategory={setSelectedCategory}
                      categories={categories}
                      onZoomIn={() => window.dispatchEvent(new CustomEvent('canvas-zoom-in'))}
                      onZoomOut={() => window.dispatchEvent(new CustomEvent('canvas-zoom-out'))}
                      onResetZoom={() => window.dispatchEvent(new CustomEvent('canvas-reset'))}
                      stalls={filteredStalls}
                      activeStall={activeStall}
                      onSelectStall={handleSelectStall}
                    />
                  </div>

                  {/* Center Canvas Viewport Column */}
                  <div className="lg:col-span-3 flex flex-col gap-4 relative">
                    
                    {/* Map canvas */}
                    <div className="relative flex-grow h-full">
                      <FloorPlanViewer
                        stalls={currentStalls}
                        nonStallZones={[]}
                        landmarks={[]}
                        activeStall={activeStall}
                        onSelectStall={handleSelectStall}
                        activeFloorPlan={activeFloorPlan}
                      />

                      {/* Float details panel card inside the map layout if space allows */}
                      {activeStall && (
                        <div className="absolute top-4 right-4 z-30 max-w-sm w-full p-2 hidden sm:block">
                          <StallDetailsModal
                            stall={activeStall}
                            onClose={handleCloseModal}
                            showNotification={showNotification}
                          />
                        </div>
                      )}
                    </div>

                    {/* Fallback Display Overlay for Mobile viewport sizes */}
                    {activeStall && (
                      <div className="sm:hidden fixed inset-x-0 bottom-0 z-50 p-4 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 shadow-2xl flex justify-center">
                        <StallDetailsModal
                          stall={activeStall}
                          onClose={handleCloseModal}
                          showNotification={showNotification}
                        />
                      </div>
                    )}

                    {/* Interactive instruction banner */}
                    <div className="glass-panel p-3.5 rounded-xl text-xs text-slate-400 flex items-center justify-between">
                      <p>
                        💡 <strong>Interaction Guide:</strong> Drag or swipe anywhere inside the canvas to pan. Use mouse wheel / double-tap to zoom. Click individual stall zones to view real-time data & scheduled events.
                      </p>
                      <button
                        onClick={() => showNotification("Help Center: Contact support at support@eventpulse.io", "info")}
                        className="text-accent-blue-light hover:text-accent-blue font-semibold hover:underline shrink-0 pl-4"
                      >
                        Get Help
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Organizer Draw/Mapper Panel Dashboard view */}
            <div className={activeTab === 'organizer' ? 'block' : 'hidden'}>
              <div className="flex flex-col gap-4">
                <div className="glass-panel p-4 rounded-xl text-xs text-slate-400 mb-2">
                  <p>
                    🛠️ <strong>Organizer Mode Active:</strong> Map structural shapes by clicking to set vertices. Complete a loop by double-clicking or selecting the start point again. Assign metadata and export coordinates to configure the active attendees viewer.
                  </p>
                </div>
                <BlueprintMapper 
                  activeFloorPlan={activeFloorPlan}
                  fetchFloorPlan={fetchFloorPlan}
                  showNotification={showNotification}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 text-center text-xs text-slate-500 mt-auto">
        <p>© 2026 EventPulse Hall Systems. Real-time SVG positioning engine. All rights reserved.</p>
      </footer>

      {notification && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-slide-in-bottom">
          <div className="bg-slate-900 border border-slate-800 flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-2xl min-w-[280px]">
            {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
            {notification.type === 'info' && <Info className="w-5 h-5 text-accent-blue-light shrink-0" />}
            <span className="text-xs font-semibold text-slate-200 flex-grow">{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="text-slate-500 hover:text-slate-350 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

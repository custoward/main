
import React, { useState, useEffect, useRef } from 'react';
import { Settings, Maximize, Move, Layers, AlertTriangle, Download, Info, Plus, Trash2, Eye, EyeOff, Lightbulb, CheckCircle2, Monitor, ZoomIn, ZoomOut, RotateCcw, Crosshair, ChevronDown, Grid3X3, Hand, Copy, ScanLine, ArrowDownToLine, Save, FolderOpen, FileJson, Target } from 'lucide-react';

// --- 조명기 스펙 데이터베이스 ---
const FIXTURE_SPECS = {
  EMPTY: {
    name: "빈 바 (Empty)",
    defaultQty: 0,
    minAngle: 0,
    maxAngle: 0,
    doubleHung: false,
    color: "bg-gray-600",
    beamColor: "transparent"
  },
  FRONT: {
    name: "Front: Castor Fresnel 2kW",
    defaultQty: 6,
    minAngle: 8.5,
    maxAngle: 45.5,
    doubleHung: false,
    color: "bg-yellow-500",
    beamColor: "border-yellow-500/40 bg-yellow-500/10"
  },
  BACK: {
    name: "Back: Polaris Fresnel",
    defaultQty: 12, 
    minAngle: 12,
    maxAngle: 58,
    doubleHung: true, 
    color: "bg-blue-500",
    beamColor: "border-blue-500/40 bg-blue-500/10"
  },
  SIDE_BAR: {
    name: "Side (Horizontal Bar)",
    defaultQty: 6,
    minAngle: 25,
    maxAngle: 50,
    doubleHung: false,
    color: "bg-purple-500",
    beamColor: "border-purple-500/40 bg-purple-500/10"
  },
  SIDE_VERTICAL: {
    name: "Side (Vertical ±6m)",
    defaultQty: 2, 
    minAngle: 25,
    maxAngle: 50,
    doubleHung: false,
    color: "bg-fuchsia-500",
    beamColor: "border-fuchsia-500/40 bg-fuchsia-500/10"
  }
};

const StageLuminaPro = () => {
  // --- 상태 관리 ---
  const [stageWidth, setStageWidth] = useState(13500); 
  const [stageDepth, setStageDepth] = useState(16300); 
  const [defaultGridHeight, setDefaultGridHeight] = useState(6450); 
  const [plasterLineZ, setPlasterLineZ] = useState(6300); 
  const [targetHeight, setTargetHeight] = useState(1700); 
  const [overlapRatio, setOverlapRatio] = useState(0.5); 
  
  // 빔 뷰 모드
  const [beamPlane, setBeamPlane] = useState('floor'); // 'floor' or 'face'
  
  // 툴팁 상태
  const [hoverInfo, setHoverInfo] = useState(null);

  const FIXED_BAR_WIDTH = 11000;

  // 조명 바 (Bar) 리스트 (기본 세팅)
  // focusVal: Front/Back은 Target Z(Global), Side는 Offset from Center
  // spacing: 0이면 Auto(전체폭), >0이면 Manual
  const [bars, setBars] = useState([
    { id: 1, z: -4280, y: 6400, type: 'FRONT', name: 'Bar 1 (FOH)', quantity: 6, zoom: 0, spacing: 0, focusVal: null },
    { id: 2, z: -2420, y: 6450, type: 'EMPTY', name: 'Bar 2', quantity: 0, zoom: 0, spacing: 0, focusVal: null },
    { id: 3, z: -620, y: 6450, type: 'EMPTY', name: 'Bar 3', quantity: 0, zoom: 0, spacing: 0, focusVal: null },
    { id: 4, z: 1300, y: 6450, type: 'EMPTY', name: 'Bar 4', quantity: 0, zoom: 0, spacing: 0, focusVal: null },
    { id: 5, z: 2950, y: 6450, type: 'EMPTY', name: 'Bar 5', quantity: 0, zoom: 0, spacing: 0, focusVal: null },
    { id: 6, z: 4720, y: 6450, type: 'EMPTY', name: 'Bar 6', quantity: 0, zoom: 0, spacing: 0, focusVal: null },
    { id: 7, z: 6520, y: 6450, type: 'EMPTY', name: 'Bar 7', quantity: 0, zoom: 0, spacing: 0, focusVal: null },
    { id: 8, z: 8250, y: 6450, type: 'BACK', name: 'Bar 8 (Back)', quantity: 12, zoom: 0, spacing: 0, focusVal: null },
    { id: 9, z: 0, y: 5900, type: 'SIDE_VERTICAL', name: 'Side Pair 1', quantity: 2, spacing: 1000, zoom: 36, focusVal: 2000 },
  ]);

  const [fixtures, setFixtures] = useState([]);
  
  // UI 상태
  const [viewMode, setViewMode] = useState('top'); 
  const [showBeams, setShowBeams] = useState(true);
  const [visibleTypes, setVisibleTypes] = useState({
    FRONT: true,
    BACK: true,
    SIDE_BAR: true,
    SIDE_VERTICAL: true
  });
  const [showGrid, setShowGrid] = useState(true); 
  const [showHotspots, setShowHotspots] = useState(true);
  const [mobileTab, setMobileTab] = useState('view');
  const [containerWidth, setContainerWidth] = useState(800);
  const [zoomLevel, setZoomLevel] = useState(1); 
  
  // 드래그 상태 (Pan)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Refs
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const SIDE_FIXED_X = 6000;

  // --- 리사이즈 핸들러 ---
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    if (window.innerWidth >= 768) setMobileTab('view');
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (mobileTab === 'view' && containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
  }, [mobileTab]);

  // --- 타원형 빔 계산 함수 ---
  const calculateProjectedEllipse = (fixture, aimTarget, viewPlaneY, beamAngleDeg) => {
    if (fixture.y <= viewPlaneY) return null;

    const H_view = fixture.y - viewPlaneY;
    const H_total = fixture.y - aimTarget.y;
    // Division by zero guard
    const t = H_total !== 0 ? H_view / H_total : 0; 
    
    const axisX = fixture.x + (aimTarget.x - fixture.x) * t;
    const axisZ = fixture.z + (aimTarget.z - fixture.z) * t;

    const dx = axisX - fixture.x;
    const dz = axisZ - fixture.z;
    const horizontalDist = Math.sqrt(dx*dx + dz*dz); 
    const azimuth = Math.atan2(dx, dz); 

    const slantHeight = Math.sqrt(Math.pow(axisX - fixture.x, 2) + Math.pow(axisZ - fixture.z, 2) + Math.pow(H_view, 2));
    // acos input range guard
    const cosTheta = Math.min(1, Math.max(-1, H_view / slantHeight));
    const tiltRad = Math.acos(cosTheta); 
    
    const beamRad = (beamAngleDeg * Math.PI) / 180;
    const halfBeam = beamRad / 2;

    const thetaNear = tiltRad - halfBeam;
    const thetaFar = tiltRad + halfBeam;

    const MAX_DIST = 50000; 
    
    let distNear = H_view * Math.tan(thetaNear);
    let distFar = H_view * Math.tan(thetaFar);

    if (thetaFar >= 1.5) distFar = MAX_DIST; 
    if (distFar > MAX_DIST) distFar = MAX_DIST; 

    const majorAxisLength = distFar - distNear;
    const centerDistFromSource = distNear + (majorAxisLength / 2); 

    const centerSlant = Math.sqrt(centerDistFromSource*centerDistFromSource + H_view*H_view);
    const minorAxisWidth = 2 * centerSlant * Math.tan(halfBeam);

    const centerX = fixture.x + Math.sin(azimuth) * centerDistFromSource;
    const centerZ = fixture.z + Math.cos(azimuth) * centerDistFromSource;

    return {
      width: isNaN(minorAxisWidth) ? 0 : minorAxisWidth,
      height: isNaN(majorAxisLength) ? 0 : majorAxisLength,
      centerX: isNaN(centerX) ? 0 : centerX,
      centerZ: isNaN(centerZ) ? 0 : centerZ,
      rotation: isNaN(azimuth) ? 0 : azimuth * (180 / Math.PI) 
    };
  };


  // --- 핵심 계산 로직 ---
  useEffect(() => {
    calculateFixtures();
  }, [stageWidth, stageDepth, plasterLineZ, targetHeight, overlapRatio, bars, beamPlane]); 

  const calculateFixtures = () => {
    const newFixtures = [];
    const HANG_OFFSET = 300; 
    
    const safePlasterLineZ = isNaN(Number(plasterLineZ)) ? 0 : Number(plasterLineZ);
    const safeTargetHeight = isNaN(Number(targetHeight)) ? 1700 : Number(targetHeight);
    
    const currentPlaneY = beamPlane === 'floor' ? 0 : safeTargetHeight;

    bars.forEach(bar => {
      if (bar.type === 'EMPTY') return;

      const spec = FIXTURE_SPECS[bar.type];
      const countPerLine = bar.quantity || spec.defaultQty; 
      
      const safeBarZ = isNaN(Number(bar.z)) ? 0 : Number(bar.z);
      const safeBarY = isNaN(Number(bar.y)) ? 0 : Number(bar.y);

      const absoluteBarZ = safePlasterLineZ + safeBarZ;
      const fixtureY = safeBarY - HANG_OFFSET; 
      const deltaY_Face = fixtureY - safeTargetHeight; 

      // --- 1. HORIZONTAL BARS (Front, Back, Side-Bar) ---
      if (['FRONT', 'BACK', 'SIDE_BAR'].includes(bar.type)) {
        // Target Z: 사용자 지정 or 기본값
        let focusZ = (bar.focusVal !== null && bar.focusVal !== undefined && bar.focusVal !== '') 
                     ? Number(bar.focusVal) 
                     : (safePlasterLineZ + 2000); // Default
        
        const deltaZ = Math.abs(focusZ - absoluteBarZ); 
        const deltaY_Floor = fixtureY - 0;
        const tiltRad = Math.atan2(deltaZ, deltaY_Floor);
        const tiltDeg = tiltRad * (180 / Math.PI); 

        // Spacing Logic
        let appliedSpacing = bar.spacing > 0 ? Number(bar.spacing) : 0;
        // if Manual Spacing is 0, use auto distribution over fixed bar width
        if (appliedSpacing === 0) {
             const spacingCount = spec.doubleHung ? Math.ceil(countPerLine / 2) : countPerLine;
             appliedSpacing = FIXED_BAR_WIDTH / Math.max(1, spacingCount);
        }

        // Zoom Calculation (Goal: 50% Overlap at Floor)
        // Spacing = Radius at Floor -> Diameter = 2*Spacing
        const requiredRadiusFloor = appliedSpacing;
        const throwDistFloor = Math.sqrt(deltaZ*deltaZ + deltaY_Floor*deltaY_Floor);
        const halfAngleRad = Math.atan(requiredRadiusFloor / throwDistFloor);
        let calculatedAngle = (halfAngleRad * 2) * (180 / Math.PI);
        
        let appliedAngle = calculatedAngle;
        let status = "OK"; 
        if (calculatedAngle < spec.minAngle) { appliedAngle = spec.minAngle; status = "MIN_LIMIT"; }
        else if (calculatedAngle > spec.maxAngle) { appliedAngle = spec.maxAngle; status = "MAX_LIMIT"; }
        else { appliedAngle = Math.round(appliedAngle / 2) * 2; }

        // Placement Calculation
        const iterations = countPerLine;
        const groupSize = spec.doubleHung ? Math.ceil(iterations / 2) : iterations;
        // Center the group based on spacing
        const totalGroupWidth = (groupSize - 1) * appliedSpacing;
        const startX = -(totalGroupWidth / 2);

        for (let k = 0; k < iterations; k++) {
          const i = spec.doubleHung ? Math.floor(k / 2) : k;
          const subOffset = spec.doubleHung ? (k % 2 === 0 ? -150 : 150) : 0;
          const x = startX + (i * appliedSpacing) + subOffset;
          
          let focusX = x;
          if (bar.type === 'SIDE_BAR') focusX = 0; // Cross focus center

          const currentFixture = { x: x, y: fixtureY, z: absoluteBarZ };
          const currentTarget = { x: focusX, y: 0, z: focusZ };
          
          const ellipse = calculateProjectedEllipse(
              currentFixture, 
              currentTarget, 
              currentPlaneY, 
              appliedAngle
          );

          newFixtures.push({
            id: `${bar.id}-${k}`,
            barId: bar.id,
            type: bar.type,
            x: x, y: fixtureY, z: absoluteBarZ, 
            relativeZ: safeBarZ,
            focusX: focusX, focusZ: focusZ,
            tilt: tiltDeg, throwDist: throwDistFloor, beamAngle: appliedAngle,
            status: status,
            isReverse: bar.type === 'BACK',
            subIndex: spec.doubleHung ? (k % 2) : 0,
            projection: ellipse
          });
        }
      } 
      // --- 2. SIDE VERTICAL (Side Pair) ---
      else if (bar.type === 'SIDE_VERTICAL') {
        const countPerSide = Math.max(1, Math.floor(countPerLine / 2));
        
        const sideSpacing = bar.spacing > 0 ? bar.spacing : 1000; 
        const startZ = absoluteBarZ; 

        const leftX = -SIDE_FIXED_X;
        const rightX = SIDE_FIXED_X;
        const H_Face = Math.max(100, fixtureY - safeTargetHeight);
        
        // Focus Offset
        const focusOffset = (bar.focusVal !== null && bar.focusVal !== undefined && bar.focusVal !== '') 
                            ? Number(bar.focusVal) 
                            : 0; // Default Center Line
        
        const distToTarget = Math.abs(SIDE_FIXED_X + focusOffset); 

        // Manual Zoom
        let appliedAngle = Number(bar.zoom) > 0 ? Number(bar.zoom) : 36;
        let status = "OK";
        if (appliedAngle < spec.minAngle) status = "MIN_WARNING";
        else if (appliedAngle > spec.maxAngle) status = "MAX_WARNING";

        // Touch Logic
        const angleToCenter = Math.atan2(distToTarget, H_Face);
        const finalHalfRad = (appliedAngle * Math.PI / 360);
        const tiltRad = angleToCenter - finalHalfRad; 
        const tiltDeg = tiltRad * (180 / Math.PI);

        const H_Floor = fixtureY;
        const floorDistX = H_Floor * Math.tan(tiltRad); 
        
        const leftTargetX = leftX + floorDistX; 
        const rightTargetX = rightX - floorDistX; 

        for (let i = 0; i < countPerSide; i++) {
            const zPos = startZ + (i * sideSpacing);
            
            ['Left', 'Right'].forEach(side => {
                const myX = side === 'Left' ? leftX : rightX;
                const myTargetX = side === 'Left' ? leftTargetX : rightTargetX;
                
                const currentFixture = { x: myX, y: fixtureY, z: zPos };
                const currentTarget = { x: myTargetX, y: 0, z: zPos }; 

                const ellipse = calculateProjectedEllipse(
                    currentFixture, 
                    currentTarget, 
                    currentPlaneY, 
                    appliedAngle
                );

                newFixtures.push({
                  id: `${bar.id}-${side[0]}-${i}`,
                  barId: bar.id,
                  type: bar.type,
                  x: myX,
                  y: fixtureY,
                  z: zPos,
                  relativeZ: safeBarZ + (i * sideSpacing),
                  focusX: myTargetX,
                  focusZ: zPos, 
                  tilt: tiltDeg, 
                  throwDist: Math.sqrt(floorDistX*floorDistX + H_Floor*H_Floor),
                  beamAngle: appliedAngle,
                  status: status,
                  side: side,
                  calculatedSpacing: sideSpacing, 
                  projection: ellipse
                });
            });
        }
      }
    });
    setFixtures(newFixtures);
  };

  // --- UI 핸들러 ---
  const addBar = () => {
    const newId = bars.length > 0 ? Math.max(...bars.map(b => b.id)) + 1 : 1;
    setBars([...bars, { 
        id: newId, 
        z: 0, 
        y: defaultGridHeight, 
        type: 'EMPTY', 
        name: `Bar ${newId}`, 
        quantity: 0,
        spacing: 0,
        zoom: 0,
        focusVal: null
    }]);
  };

  const removeBar = (id) => setBars(bars.filter(b => b.id !== id));
  
  const duplicateBar = (bar) => {
    const newId = bars.length > 0 ? Math.max(...bars.map(b => b.id)) + 1 : 1;
    setBars([...bars, { ...bar, id: newId, z: bar.z + 1000, name: `${bar.name} (Copy)` }]);
  };

  const updateBar = (id, field, value) => {
    let newVal = value;
    if (field === 'type') {
       const spec = FIXTURE_SPECS[value];
       let newSpacing = 0;
       let newZoom = 0;
       let newY = bars.find(b => b.id === id).y;
       let newFocus = null;

       if (value === 'SIDE_VERTICAL') {
           newSpacing = 1000;
           newZoom = 36; 
           if (newY === 2000) newY = 8000; 
           newFocus = 2000; // Default Focus Offset for Side Vert
       } else if (['FRONT', 'BACK'].includes(value)) {
           newSpacing = 0; // Default auto spacing
       }

       setBars(bars.map(b => b.id === id ? { 
           ...b, 
           [field]: value, 
           quantity: spec.defaultQty, 
           spacing: newSpacing, 
           y: newY,
           zoom: newZoom,
           focusVal: newFocus 
       } : b));
       return;
    }
    
    if (field === 'quantity') {
        const bar = bars.find(b => b.id === id);
        if (bar && bar.type === 'SIDE_VERTICAL') {
            newVal = Number(newVal);
            if (newVal % 2 !== 0) newVal += 1; 
            if (newVal < 2) newVal = 2; 
        }
    }

    setBars(bars.map(b => b.id === id ? { ...b, [field]: newVal } : b)); 
  };
  
  const finalizeBarInput = (id, field, value) => {
    const num = Number(value);
    if (!isNaN(num)) {
      updateBar(id, field, num);
    }
  };

  // --- SAVE & LOAD Project ---
  const handleSaveProject = () => {
    const projectData = {
        version: "5.0",
        timestamp: new Date().toISOString(),
        config: {
            stageWidth, stageDepth, defaultGridHeight, plasterLineZ, targetHeight, overlapRatio
        },
        bars: bars
    };
    
    const dataStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StageLumina_Project_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  const handleLoadProject = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.config) {
                setStageWidth(data.config.stageWidth);
                setStageDepth(data.config.stageDepth);
                setDefaultGridHeight(data.config.defaultGridHeight);
                setPlasterLineZ(data.config.plasterLineZ);
                setTargetHeight(data.config.targetHeight);
                setOverlapRatio(data.config.overlapRatio);
            }
            if (data.bars && Array.isArray(data.bars)) {
                setBars(data.bars);
            }
            setPanOffset({ x: 0, y: 0 });
            setZoomLevel(1);
            alert("Project loaded successfully.");
        } catch (err) {
            console.error(err);
            alert("Failed to load project file. Invalid format.");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExportData = () => {
    const exportData = fixtures.map(f => ({
       BarName: bars.find(b => b.id === f.barId)?.name,
       Type: FIXTURE_SPECS[f.type].name,
       ID: f.id,
       Pos: { X: Math.round(f.x), Y: Math.round(f.y), Z: Math.round(f.z) },
       Target: { X: Math.round(f.focusX), Y: 0, Z: Math.round(f.focusZ) },
       Angles: { 
           Tilt: f.tilt.toFixed(1), 
           Zoom: f.beamAngle.toFixed(1) 
       },
       Status: f.status
    }));
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "StageLumina_Patch_List.json";
    a.click();
  };

  // --- 호버 및 드래그 핸들러 ---
  const handleFixtureHover = (e, fixture) => {
    setHoverInfo({
        data: fixture,
        x: e.clientX,
        y: e.clientY
    });
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    setPanOffset({ x: newX, y: newY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleResetZoom = () => {
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 }); 
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 3.0));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.4));
  const toggleTypeVisibility = (type) => {
    setVisibleTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const autoScale = Math.max(0.005, (containerWidth - 100) / (viewMode === 'top' ? stageWidth : (stageDepth + 8000)));
  const currentScale = autoScale * zoomLevel;

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-200 font-sans overflow-hidden">
      
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-800 p-3 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded">
            <Lightbulb size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-none">StageLumina <span className="text-xs font-normal text-indigo-400">V5.0</span></h1>
            <p className="text-[10px] text-slate-500">Manual Spacing & Target Control</p>
          </div>
        </div>
        <div className="flex gap-2">
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleLoadProject} />
            <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded border border-slate-700 transition">
                <FolderOpen size={14} /> Load
            </button>
            <button onClick={handleSaveProject} className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded border border-slate-700 transition">
                <Save size={14} /> Save
            </button>
            <button onClick={handleExportData} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded border border-indigo-600 transition">
                <FileJson size={14} /> Export
            </button>
        </div>
      </header>

      {/* 모바일 탭 */}
      <div className="md:hidden flex border-b border-slate-800 bg-slate-900 shrink-0">
        <button onClick={() => setMobileTab('settings')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${mobileTab === 'settings' ? 'text-indigo-400 bg-slate-800 border-b-2 border-indigo-400' : 'text-slate-500'}`}>
          <Settings size={16} /> 설정
        </button>
        <button onClick={() => setMobileTab('view')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${mobileTab === 'view' ? 'text-green-400 bg-slate-800 border-b-2 border-green-400' : 'text-slate-500'}`}>
          <Monitor size={16} /> 시뮬레이션
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* --- 왼쪽: 설정 패널 --- */}
        <aside className={`bg-slate-900 border-r border-slate-800 overflow-y-auto custom-scrollbar ${mobileTab === 'settings' ? 'absolute inset-0 z-20 w-full' : 'hidden'} md:block md:w-80 md:static`}>
          <div className="p-4 space-y-6 pb-20 md:pb-4">
            
            {/* 1. 무대 설정 */}
            <section className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <h2 className="font-bold text-indigo-400 mb-3 text-xs uppercase flex items-center gap-2"><Maximize size={14}/> Stage Dimension</h2>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Width (mm)</label>
                  <input type="number" value={stageWidth} onChange={e => setStageWidth(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-sm outline-none focus:border-indigo-500"/>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Depth (mm)</label>
                  <input type="number" value={stageDepth} onChange={e => setStageDepth(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-sm outline-none focus:border-indigo-500"/>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Default Grid Height</label>
                    <input type="number" value={defaultGridHeight} onChange={e => setDefaultGridHeight(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-sm outline-none focus:border-indigo-500"/>
                </div>
                <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Plaster Line Z (Global)</label>
                    <input type="number" value={plasterLineZ} onChange={e => setPlasterLineZ(Number(e.target.value))} className="w-full bg-slate-950 border border-red-500/50 rounded px-2 py-1.5 text-sm outline-none focus:border-red-500"/>
                </div>
              </div>
            </section>

            {/* 2. 바 추가 */}
            <section>
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-bold text-slate-400 text-xs uppercase flex items-center gap-2"><Layers size={14}/> Lighting Bars</h2>
              </div>
              <button 
                onClick={() => addBar()} 
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-3 rounded font-bold transition flex items-center justify-center gap-2 shadow-lg"
              >
                <Plus size={16}/> Add New Bar
              </button>
            </section>

            {/* 3. 리스트 */}
            <section className="space-y-3">
              {bars.map(bar => {
                const spec = FIXTURE_SPECS[bar.type];
                const fix = fixtures.find(f => f.barId === bar.id); 
                const isVertical = bar.type === 'SIDE_VERTICAL';
                
                return (
                  <div key={bar.id} className="bg-slate-800 p-3 rounded border border-slate-700 relative overflow-hidden transition hover:border-slate-500">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${spec.color}`}></div>
                    
                    <div className="flex justify-between items-center mb-2 pl-2">
                      <input value={bar.name} onChange={e => updateBar(bar.id, 'name', e.target.value)} className="bg-transparent font-bold text-xs text-slate-200 outline-none w-28 focus:border-b focus:border-blue-500"/>
                      <div className="flex gap-2">
                        {isVertical && (
                            <button onClick={() => duplicateBar(bar)} className="text-slate-500 hover:text-white" title="Duplicate Pair">
                                <Copy size={12}/>
                            </button>
                        )}
                        <button onClick={() => removeBar(bar.id)} className="text-slate-600 hover:text-red-400">
                            <Trash2 size={12}/>
                        </button>
                      </div>
                    </div>

                    <div className="pl-2 mb-2">
                      <div className="relative">
                        <select 
                          value={bar.type} 
                          onChange={e => updateBar(bar.id, 'type', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-600 text-xs text-slate-300 rounded px-2 py-1.5 appearance-none outline-none focus:border-indigo-500 font-bold"
                        >
                          <option value="EMPTY">🚫 Empty Bar</option>
                          <option value="FRONT">🟡 Front Light</option>
                          <option value="BACK">🔵 Back Light</option>
                          <option value="SIDE_BAR">🟣 Side (Horizontal Bar)</option>
                          <option value="SIDE_VERTICAL">🟣 Side (Vertical ±6m)</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-2 text-slate-500 pointer-events-none"/>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pl-2 mb-2">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">Z (from PL)</label>
                        <input 
                            type="number" 
                            step="50"
                            value={bar.z} 
                            onChange={e => updateBar(bar.id, 'z', e.target.value)} 
                            onBlur={e => finalizeBarInput(bar.id, 'z', e.target.value)}
                            className="w-full bg-black/20 px-2 py-1 text-xs rounded text-white text-right"
                        />
                      </div>
                      <div>
                         <label className="text-[9px] text-slate-500 block mb-1">Height (Y)</label>
                         <input 
                              type="number" 
                              value={bar.y} 
                              onChange={e => updateBar(bar.id, 'y', e.target.value)} 
                              onBlur={e => finalizeBarInput(bar.id, 'y', e.target.value)}
                              className="w-full bg-black/20 px-2 py-1 text-xs rounded text-white text-right font-mono"
                          />
                      </div>
                    </div>

                    {bar.type !== 'EMPTY' && (
                        <>
                        <div className="grid grid-cols-2 gap-2 pl-2 mb-2">
                            <div>
                                <label className="text-[9px] text-slate-500 block mb-1">Quantity</label>
                                <input 
                                    type="number" 
                                    step={isVertical ? 2 : 1}
                                    min={isVertical ? 2 : 1}
                                    value={bar.quantity} 
                                    onChange={e => updateBar(bar.id, 'quantity', e.target.value)} 
                                    onBlur={e => finalizeBarInput(bar.id, 'quantity', e.target.value)}
                                    className="w-full bg-black/20 px-2 py-1 text-xs rounded text-white text-right font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] text-slate-500 block mb-1">Spacing (mm)</label>
                                <input 
                                    type="number" 
                                    step="100"
                                    value={bar.spacing} 
                                    placeholder={isVertical ? "1000" : "Auto"}
                                    onChange={e => updateBar(bar.id, 'spacing', e.target.value)} 
                                    onBlur={e => finalizeBarInput(bar.id, 'spacing', e.target.value)}
                                    className="w-full bg-black/20 px-2 py-1 text-xs rounded text-white text-right"
                                />
                            </div>
                        </div>

                        {/* 타겟 설정 (Target Z or Focus Dist) */}
                        <div className="pl-2 mb-2">
                             <label className="text-[9px] text-slate-500 block mb-1">
                                {isVertical ? 'Focus Dist (from Center)' : 'Target Z (Global)'}
                             </label>
                             <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    step="100"
                                    value={bar.focusVal !== null ? bar.focusVal : ''} 
                                    placeholder={isVertical ? "Auto (Center)" : `Auto (${plasterLineZ + 2000})`}
                                    onChange={e => updateBar(bar.id, 'focusVal', e.target.value)} 
                                    onBlur={e => finalizeBarInput(bar.id, 'focusVal', e.target.value)}
                                    className="w-full bg-black/20 px-2 py-1 text-xs rounded text-white text-right placeholder-gray-500"
                                />
                                {isVertical ? <Crosshair size={12} className="text-slate-500"/> : <Target size={12} className="text-slate-500"/>}
                             </div>
                        </div>
                        </>
                    )}

                    {isVertical && (
                      <div className="pl-2 mb-2">
                         <label className="text-[9px] text-fuchsia-400 block mb-1">Zoom (°)</label>
                         <input 
                            type="number" 
                            value={bar.zoom} 
                            onChange={e => updateBar(bar.id, 'zoom', e.target.value)} 
                            onBlur={e => finalizeBarInput(bar.id, 'zoom', e.target.value)}
                            className="w-full bg-black/20 px-2 py-1 text-xs rounded text-white text-right font-bold text-fuchsia-400"
                        />
                      </div>
                    )}

                    {fix && (
                      <div className="pl-2 pt-2 border-t border-slate-700/50 flex justify-between items-center text-[10px]">
                        <span className="text-slate-400">Zoom Angle:</span>
                        <div className="flex items-center gap-1">
                            <span className={`font-bold text-lg ${fix.status === 'OK' ? 'text-green-400' : 'text-red-400'}`}>
                                {Number(fix.beamAngle).toFixed(1)}°
                            </span>
                            {fix.status !== 'OK' && <AlertTriangle size={12} className="text-red-400" title="Angle Limit" />}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
            <div className="h-20"></div>
          </div>
        </aside>

        {/* --- 메인 시각화 --- */}
        <main 
            ref={containerRef} 
            className={`flex-1 bg-slate-950 relative flex flex-col ${mobileTab === 'view' ? 'block' : 'hidden'} md:block overflow-hidden cursor-default`}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
          {/* ... View Controls ... */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <div className="bg-slate-800/90 backdrop-blur rounded border border-slate-700 flex p-1 shadow-lg">
              <button onClick={() => setViewMode('top')} className={`px-3 py-1.5 text-xs font-bold rounded ${viewMode === 'top' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>TOP</button>
              <button onClick={() => setViewMode('side')} className={`px-3 py-1.5 text-xs font-bold rounded ${viewMode === 'side' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>SIDE</button>
            </div>
            
            <div className="bg-slate-800/90 backdrop-blur rounded border border-slate-700 flex p-1 shadow-lg items-center gap-1 px-2 pointer-events-auto">
                <span className="text-[10px] text-slate-400">View:</span>
                <button onClick={() => setBeamPlane('floor')} className={`px-3 py-1.5 text-[10px] font-bold rounded transition ${beamPlane === 'floor' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-700'}`}>FLOOR</button>
                <button onClick={() => setBeamPlane('face')} className={`px-3 py-1.5 text-[10px] font-bold rounded transition ${beamPlane === 'face' ? 'bg-green-600 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-700'}`}>FACE</button>
            </div>
          </div>

          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button onClick={() => setShowHotspots(!showHotspots)} className={`p-2 rounded border border-slate-700 shadow-lg transition ${showHotspots ? 'bg-red-600 text-white border-red-500' : 'bg-slate-800/90 text-slate-400'}`} title="Toggle Target Points"><Target size={18} /></button>
            <button onClick={() => setShowGrid(!showGrid)} className={`p-2 rounded border border-slate-700 shadow-lg transition ${showGrid ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800/90 text-slate-400'}`}><Grid3X3 size={18} /></button>
            <div className="bg-slate-800/90 backdrop-blur rounded border border-slate-700 flex p-1 shadow-lg items-center text-slate-300">
               <button onClick={handleZoomOut} className="p-1.5 hover:bg-slate-700 rounded hover:text-white"><ZoomOut size={16}/></button>
               <span className="text-[10px] w-8 text-center font-mono">{Math.round(zoomLevel * 100)}%</span>
               <button onClick={handleZoomIn} className="p-1.5 hover:bg-slate-700 rounded hover:text-white"><ZoomIn size={16}/></button>
               <div className="w-px h-4 bg-slate-600 mx-1"></div>
               <button onClick={handleResetZoom} className="p-1.5 hover:bg-slate-700 rounded hover:text-white"><RotateCcw size={14}/></button>
            </div>
            <button onClick={() => setShowBeams(!showBeams)} className="bg-slate-800/90 p-2 rounded border border-slate-700 text-slate-300 hover:text-white shadow-lg"><Eye size={18}/></button>
          </div>
          <div className="absolute top-16 right-4 z-10 bg-slate-900/90 border border-slate-700 rounded p-2 flex gap-2">
            {['FRONT','BACK','SIDE_BAR','SIDE_VERTICAL'].map(type => (
              <button
                key={type}
                onClick={() => toggleTypeVisibility(type)}
                className={`px-2 py-1 text-[10px] rounded border ${
                  visibleTypes[type] ? 'text-white border-slate-500' : 'text-slate-500 border-slate-800'
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-1 ${FIXTURE_SPECS[type].color}`}></span>
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* ... Tooltip ... */}
          {hoverInfo && (
            <div className="fixed pointer-events-none bg-slate-900/90 border border-slate-600 text-white text-xs p-3 rounded-md shadow-2xl z-50 backdrop-blur-md" style={{ left: hoverInfo.x + 15, top: hoverInfo.y + 15 }}>
                <div className="flex items-center gap-2 border-b border-slate-700 pb-1 mb-1">
                    <div className={`w-2 h-2 rounded-full ${FIXTURE_SPECS[hoverInfo.data.type].color}`}></div>
                    <span className="font-bold text-yellow-400">{hoverInfo.data.id}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                    <span className="text-slate-400">Type:</span> <span>{hoverInfo.data.type}</span>
                    <span className="text-slate-400">Zoom:</span> <span className="font-bold text-green-400">{Number(hoverInfo.data.beamAngle).toFixed(1)}°</span>
                    <span className="text-slate-400">Tilt:</span> <span>{Number(hoverInfo.data.tilt).toFixed(1)}°</span>
                    <span className="text-slate-400">Height:</span> <span>{Math.round(hoverInfo.data.y)}mm</span>
                    <span className="text-slate-400">Target:</span> <span>{Math.round(hoverInfo.data.focusX)}, {Math.round(hoverInfo.data.focusZ)}</span>
                </div>
            </div>
          )}

          <div className="flex-1 overflow-hidden flex items-center justify-center p-4 custom-scrollbar bg-slate-950">
            {/* 캔버스 컨테이너 */}
            <div className="relative transition-transform duration-75"
              style={{
                width: viewMode === 'top' ? stageWidth * currentScale : (stageDepth + 8000) * currentScale,
                height: viewMode === 'top' ? (stageDepth + 8000) * currentScale : 12000 * currentScale,
                minWidth: 300, minHeight: 300,
                transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
                transformOrigin: 'center center'
              }}
            >
              
              {/* === TOP VIEW === */}
              {viewMode === 'top' && (() => {
                const zZeroY = (stageDepth + 8000) * currentScale * 0.8; 
                const safePlasterLineZ = isNaN(Number(plasterLineZ)) ? 0 : Number(plasterLineZ);
                const plPixelY = zZeroY - (safePlasterLineZ * currentScale);
                const gridSizePx = 1000 * currentScale;

                return (
                <>
                  {/* Grid */}
                  {showGrid && (
                    <div 
                        className="absolute inset-0 pointer-events-none opacity-10"
                        style={{
                            backgroundImage: `
                                linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)
                            `,
                            backgroundSize: `${gridSizePx}px ${gridSizePx}px`,
                            backgroundPosition: `calc(50% - ${gridSizePx / 2}px) ${plPixelY}px` 
                        }}
                    />
                  )}

                  {/* Stage Rect */}
                  <div className="absolute border-2 border-slate-600 bg-slate-800/30" 
                    style={{ 
                      left: '50%', top: zZeroY - (stageDepth * currentScale),
                      width: stageWidth * currentScale, height: stageDepth * currentScale, 
                      transform: 'translateX(-50%)' 
                    }}>
                    <span className="absolute top-2 left-2 text-[10px] text-slate-500">UPSTAGE</span>
                  </div>
                  
                  {/* Side Lighting Infrastructure */}
                  <div className="absolute border-l border-dashed border-purple-500/30 h-[200%] top-[-50%]" style={{ left: '50%', marginLeft: -SIDE_FIXED_X * currentScale }} />
                  <div className="absolute border-l border-dashed border-purple-500/30 h-[200%] top-[-50%]" style={{ left: '50%', marginLeft: SIDE_FIXED_X * currentScale }} />

                  {/* Reference Lines */}
                  <div className="absolute w-full border-t-2 border-red-600/60 z-10" style={{ top: zZeroY - (safePlasterLineZ * currentScale) }}>
                     <span className="absolute right-10 -top-5 text-red-500 font-bold text-[10px] bg-slate-950/80 px-1 rounded">PL (Z={safePlasterLineZ})</span>
                  </div>
                  <div className="absolute h-full border-l border-dashed border-slate-500/30" style={{ left: '50%', top:0 }}>
                     <span className="absolute bottom-10 left-1 text-slate-500 text-[10px]">CL (X=0)</span>
                  </div>

                  {/* Fixtures & Beams (Order: Beam -> Bar -> Icon -> Hotspot) */}
                  {/* Layer 1: Beams */}
                  {fixtures.map(f => {
                    const topPos = zZeroY - (f.z * currentScale);
                    const spec = FIXTURE_SPECS[f.type];
                    const proj = f.projection;
                    const hasBeam = showBeams && proj && visibleTypes[f.type];

                    return hasBeam ? (
                      <div key={`beam-${f.id}`}
                        className={`absolute border mix-blend-screen ${spec.beamColor}`}
                        style={{
                          left: '50%',
                          top: zZeroY, 
                          marginLeft: proj.centerX * currentScale - (proj.width * currentScale / 2),
                          marginTop: -(proj.centerZ * currentScale) - (proj.height * currentScale / 2),
                          width: proj.width * currentScale,
                          height: proj.height * currentScale,
                          transform: `rotate(${-proj.rotation}deg)`, 
                          transformOrigin: 'center',
                          borderRadius: '50%'
                        }}
                      />
                    ) : null;
                  })}

                  {/* Layer 2: Bar Graphics (Between Beam and Icon) */}
                  {bars.map(bar => {
                      const zVal = isNaN(Number(bar.z)) ? 0 : Number(bar.z);
                      const topPos = zZeroY - ((safePlasterLineZ + zVal) * currentScale);
                      const safeTop = isNaN(topPos) ? 0 : topPos;
                      if (bar.type === 'SIDE_VERTICAL') return null;

                      return (
                        <div key={`bar-${bar.id}`} className="absolute bg-gray-700/80 rounded-full border border-gray-500 z-10"
                          style={{
                            left: '50%', top: safeTop - 2,
                            width: FIXED_BAR_WIDTH * currentScale, height: 4,
                            transform: 'translateX(-50%)'
                          }}
                        >
                            <span className="absolute left-full ml-2 text-[9px] text-gray-400 whitespace-nowrap">{bar.name}</span>
                        </div>
                      )
                  })}

                  {/* Layer 3: Fixture Icons & Hotspots */}
                  {fixtures.map(f => {
                    const topPos = zZeroY - (f.z * currentScale);
                    const spec = FIXTURE_SPECS[f.type];
                    const safeTopPos = isNaN(topPos) ? 0 : topPos;
                    const safeLeft = isNaN(f.x * currentScale) ? 0 : f.x * currentScale;
                    if (!visibleTypes[f.type]) return null;

                    return (
                      <React.Fragment key={f.id}>
                        {/* Fixture Icon */}
                        <div 
                            className={`absolute rounded-full shadow-sm z-20 flex items-center justify-center ${spec.color} border border-white/20`}
                            style={{
                                top: safeTopPos - 3, left: '50%',
                                marginLeft: safeLeft - 3,
                                width: 6, height: 6
                            }}
                            onMouseEnter={(e) => handleFixtureHover(e, f)}
                            onMouseMove={(e) => handleFixtureHover(e, f)}
                            onMouseLeave={() => setHoverInfo(null)}
                        />
                        {/* Back Light Sub-color Dot */}
                        {f.type === 'BACK' && f.subIndex === 1 && (
                            <div className="absolute bg-white w-1 h-1 rounded-full z-30 pointer-events-none"
                            style={{
                                top: safeTopPos - 0.5,
                                left: '50%',
                                marginLeft: safeLeft - 0.5,
                            }}
                            />
                        )}
                        {/* Hotspot (Red Cross) */}
                        {showHotspots && (
                            <div className="absolute z-30 pointer-events-none text-red-500/90 text-xs font-bold"
                                style={{
                                    top: zZeroY - (f.focusZ * currentScale) - 6,
                                    left: '50%',
                                    marginLeft: (f.focusX * currentScale) - 4,
                                }}
                            >
                                ✖
                            </div>
                        )}
                        
                        {/* Hit Area (Transparent) */}
                        <div 
                            className="absolute z-40 cursor-pointer"
                            style={{
                                top: safeTopPos - 12, left: '50%', marginLeft: safeLeft - 12,
                                width: 24, height: 24,
                            }}
                            onMouseEnter={(e) => handleFixtureHover(e, f)}
                            onMouseMove={(e) => handleFixtureHover(e, f)}
                            onMouseLeave={() => setHoverInfo(null)}
                        />
                      </React.Fragment>
                    );
                  })}
                </>
              )})()}

              {/* === SIDE VIEW (Flipped) === */}
              {viewMode === 'side' && (() => {
                const sideViewWidth = (stageDepth + 8000) * currentScale;
                const safePlasterLineZ = isNaN(Number(plasterLineZ)) ? 0 : Number(plasterLineZ);
                const safeTargetHeight = isNaN(Number(targetHeight)) ? 1700 : Number(targetHeight);
                const safeDefaultGridHeight = isNaN(Number(defaultGridHeight)) ? 8000 : Number(defaultGridHeight);
                const paddingRight = 200 + (4000 * currentScale); 
                const plPixelX = sideViewWidth - paddingRight; 

                return (
                <div 
                    className="relative h-full border-l border-b border-slate-700 ml-4 overflow-hidden"
                    style={{ width: sideViewWidth }}
                >
                   {/* Grid etc. same as before... */}
                   <div className="absolute bottom-10 h-1 bg-slate-500/50" style={{ left: plPixelX - (stageDepth * currentScale), width: stageDepth * currentScale }}/>
                   <div className="absolute bottom-10 border-r-2 border-red-600/60 h-full" style={{ left: plPixelX }}>
                      <span className="text-[10px] text-red-500 font-bold absolute top-2 right-1 bg-slate-950/80 px-1">PL (Z={safePlasterLineZ})</span>
                   </div>
                   <div className="absolute border-t border-dashed border-green-500/40 w-full" style={{ bottom: 10 + (safeTargetHeight * currentScale) }}>
                      <span className="text-[10px] text-green-500 absolute right-0 -top-4">Face Level</span>
                   </div>
                   <div className="absolute border-t border-slate-600/30 w-full" style={{ bottom: 10 + (safeDefaultGridHeight * currentScale) }}>
                      <span className="text-[10px] text-slate-600 absolute right-0 -top-4">Default Grid ({safeDefaultGridHeight})</span>
                   </div>

                   {/* Fixtures Only (No Beam in Side View) */}
                   {fixtures.map(f => {
                      const relZ = f.z - safePlasterLineZ;
                      const viewX = plPixelX - (relZ * currentScale);
                      const bottomPos = 10 + (f.y * currentScale);
                      const spec = FIXTURE_SPECS[f.type];
                      const safeLeft = isNaN(viewX) ? 0 : viewX;
                      const safeBottom = isNaN(bottomPos) ? 0 : bottomPos;
                      if (!visibleTypes[f.type]) return null;

                      return (
                        <React.Fragment key={f.id}>
                           <div className={`absolute w-3 h-3 rounded-full z-20 ${spec.color}`} style={{ left: safeLeft - 4, bottom: safeBottom - 4 }}/>
                           <div 
                                className="absolute z-40 cursor-pointer"
                                style={{
                                    left: safeLeft - 10, bottom: safeBottom - 10, width: 20, height: 20
                                }}
                                onMouseEnter={(e) => handleFixtureHover(e, f)}
                                onMouseMove={(e) => handleFixtureHover(e, f)}
                                onMouseLeave={() => setHoverInfo(null)}
                           />
                        </React.Fragment>
                      )
                   })}
                   
                   {bars.map(bar => {
                        if (bar.type === 'SIDE_VERTICAL') return null;
                        const zVal = isNaN(Number(bar.z)) ? 0 : Number(bar.z);
                        const viewX = plPixelX - (zVal * currentScale);
                        const bottomPos = 10 + (bar.y * currentScale);
                        return (
                            <div key={`side-bar-${bar.id}`} className="absolute w-2 h-2 rounded-full bg-gray-600 pointer-events-none z-10"
                             style={{ left: viewX - 3, bottom: bottomPos - 3 }}
                            />
                        )
                   })}
                </div>
              )})()}
            </div>
          </div>
          
          <div className="h-8 bg-slate-900 border-t border-slate-800 flex items-center justify-center text-[10px] text-slate-500 gap-4 shrink-0">
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Front</div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Back</div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Side (Bar)</div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-fuchsia-500"></div> Side (Vert)</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StageLuminaPro;

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

  // 조명 바 (Bar) 리스트
  const [bars, setBars] = useState([
    { id: 1, z: -4280, y: 6400, type: 'FRONT', name: 'Bar 1 (FOH)', quantity: 3, zoom: 0, spacing: 2000, focusVal: null },
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

  // --- SOLVER: Side Tilt & Zoom Calculator ---
  const solveSideTiltAndZoom = (fixtureY, distToCenter, safeTargetHeight, sideSpacing, spec) => {
    const H_Face = Math.max(100, fixtureY - safeTargetHeight);
    
    const targetFloorWidth = sideSpacing * 2; // for 50% overlap
    
    let bestZoom = 36;
    let bestTilt = 0;
    let minError = Infinity;

    for (let z = spec.minAngle; z <= spec.maxAngle; z += 0.5) {
        const beamRad = (z * Math.PI) / 180;
        const halfBeam = beamRad / 2;
        
        const angleToCenter = Math.atan2(distToCenter, H_Face);
        const tiltRad = angleToCenter - halfBeam; 
        
        if (tiltRad <= 0) continue; 

        const H_Floor = fixtureY;
        const floorDistNear = H_Floor * Math.tan(tiltRad - halfBeam);
        const floorDistFar = H_Floor * Math.tan(tiltRad + halfBeam);
        const calcWidth = floorDistFar - floorDistNear;
        
        const error = Math.abs(calcWidth - targetFloorWidth);
        
        if (error < minError) {
            minError = error;
            bestZoom = z;
            bestTilt = tiltRad * (180/Math.PI);
        }
    }
    
    return { zoom: bestZoom, tilt: bestTilt };
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

    const depthOrderIndexByBarId = {};
    const typeSpacingByType = {};
    const zSpacingByType = {};
    ['FRONT', 'BACK'].forEach((type) => {
      const typeBars = bars.filter((bar) => bar.type === type);
      if (!typeBars.length) return;
      let spacingForType = 0;
      let runningIndex = 0;
      [...typeBars]
        .sort((a, b) => (Number(a.z) || 0) - (Number(b.z) || 0))
        .forEach((bar) => {
          const spec = FIXTURE_SPECS[bar.type];
          const countPerLine = bar.quantity || spec.defaultQty;
          let barSpacing = bar.spacing > 0 ? Number(bar.spacing) : 0;
          if (barSpacing === 0) {
            const spacingCount = spec.doubleHung ? Math.ceil(countPerLine / 2) : countPerLine;
            barSpacing = FIXED_BAR_WIDTH / Math.max(1, spacingCount);
          }
          spacingForType = Math.max(spacingForType, barSpacing);
          depthOrderIndexByBarId[bar.id] = runningIndex;
          runningIndex += 1;
        });
      typeSpacingByType[type] = spacingForType;
      const baseDepthStep = stageDepth / (typeBars.length + 1);
      zSpacingByType[type] = spacingForType > 0 ? Math.min(baseDepthStep, spacingForType) : baseDepthStep;
    });

    const getNearestSameTypeSpacing = (currentBar) => {
      const currentZ = safePlasterLineZ + (isNaN(Number(currentBar.z)) ? 0 : Number(currentBar.z));
      const siblings = bars.filter(
        (bar) => bar.type === currentBar.type && bar.id !== currentBar.id
      );
      if (!siblings.length) return 0;
      const distances = siblings.map((bar) => {
        const barZ = safePlasterLineZ + (isNaN(Number(bar.z)) ? 0 : Number(bar.z));
        return Math.abs(barZ - currentZ);
      });
      return Math.min(...distances);
    };

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
        // Spacing Logic
        let appliedSpacing = bar.spacing > 0 ? Number(bar.spacing) : 0;
        if (appliedSpacing === 0) {
             const spacingCount = spec.doubleHung ? Math.ceil(countPerLine / 2) : countPerLine;
             appliedSpacing = FIXED_BAR_WIDTH / Math.max(1, spacingCount);
        }
        const isFrontBack = bar.type === 'FRONT' || bar.type === 'BACK';
        const typeSpacing = typeSpacingByType[bar.type] || appliedSpacing;
        if (isFrontBack && typeSpacing) {
          appliedSpacing = typeSpacing;
        }
        const overlapSpacing = bar.type === 'SIDE_BAR'
          ? Math.max(appliedSpacing, getNearestSameTypeSpacing(bar))
          : appliedSpacing;

        const iterations = countPerLine;
        const subGroupSize = spec.doubleHung ? Math.ceil(iterations / 2) : iterations;
        const totalGroupWidth = (subGroupSize - 1) * appliedSpacing;
        const startX = -(totalGroupWidth / 2);

        for (let k = 0; k < iterations; k++) {
          const i = spec.doubleHung ? Math.floor(k / 2) : k;
          const subOffset = spec.doubleHung ? (k % 2 === 0 ? -150 : 150) : 0;
          const x = startX + (i * appliedSpacing) + subOffset;
          
          let focusX = x;
          let focusZ = bar.type === 'SIDE_BAR'
            ? absoluteBarZ
            : safePlasterLineZ
                + (zSpacingByType[bar.type] || 0) * ((depthOrderIndexByBarId[bar.id] ?? 0) + 1);
          
          let appliedAngle = 0;
          let tiltDeg = 0;
          let throwDist = 0;
          let status = "OK";

          if (bar.type === 'SIDE_BAR') {
              // Side Horizontal: Cross Focus + Touch Center
              // Z target is same as bar Z (Straight vertical plane)
              focusZ = absoluteBarZ;

              const isLeft = x < 0;
              const distToTarget = Math.abs(x);

              const solution = solveSideTiltAndZoom(
                fixtureY,
                distToTarget,
                safeTargetHeight,
                overlapSpacing,
                spec
              );
              appliedAngle = solution.zoom;
              const sideTilt = solution.tilt; 
              
              // Recalculate Floor Target X
              const floorDistX = fixtureY * Math.tan(sideTilt * Math.PI / 180);
              focusX = isLeft ? (x + floorDistX) : (x - floorDistX);
              
              // Display properties
              tiltDeg = sideTilt;
              throwDist = Math.sqrt(floorDistX*floorDistX + fixtureY*fixtureY);
          } else {
              // Front/Back Logic
              const deltaZ = Math.abs(focusZ - absoluteBarZ); 
              const deltaY_Floor = fixtureY - 0;
              const tiltRad = Math.atan2(deltaZ, deltaY_Floor);
              tiltDeg = tiltRad * (180 / Math.PI); 

              const requiredRadiusFloor = appliedSpacing;
              const throwDistFloor = Math.sqrt(deltaZ*deltaZ + deltaY_Floor*deltaY_Floor);
              const halfAngleRad = Math.atan(requiredRadiusFloor / throwDistFloor);
              let calculatedAngle = (halfAngleRad * 2) * (180 / Math.PI);
              
              appliedAngle = calculatedAngle;
              if (calculatedAngle < spec.minAngle) { appliedAngle = spec.minAngle; status = "MIN_LIMIT"; }
              else if (calculatedAngle > spec.maxAngle) { appliedAngle = spec.maxAngle; status = "MAX_LIMIT"; }
              else { appliedAngle = Math.round(appliedAngle / 2) * 2; }
              
              throwDist = throwDistFloor;
          }

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
            tilt: tiltDeg, 
            throwDist: throwDist,
            beamAngle: appliedAngle,
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
        
        const sideSpacing = bar.spacing > 0 ? bar.spacing : (stageDepth / Math.max(1, countPerSide + 1)); 
        const startZ = absoluteBarZ; 

        const leftX = -SIDE_FIXED_X;
        const rightX = SIDE_FIXED_X;
        // const H_Face = Math.max(100, fixtureY - safeTargetHeight);
        
        const distToTarget = Math.abs(SIDE_FIXED_X); 

        // Solve for Optimal Tilt & Zoom
        const solution = solveSideTiltAndZoom(fixtureY, distToTarget, safeTargetHeight, sideSpacing, spec);
        const appliedAngle = solution.zoom;
        const tiltDeg = solution.tilt;
        const status = "OK"; 

        // Calculate Floor Target X
        const H_Floor = fixtureY;
        const floorDistX = H_Floor * Math.tan(tiltDeg * Math.PI / 180);
        
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
           newSpacing = 0; 
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

  // --- SAVE & LOAD ---
  const handleSaveProject = () => {
    const projectData = {
        version: "5.1",
        config: { stageWidth, stageDepth, defaultGridHeight, plasterLineZ, targetHeight, overlapRatio },
        bars: bars
    };
    const dataStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StageLumina_Project.json`;
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
            if (data.bars) setBars(data.bars);
            alert("Project loaded.");
        } catch (err) {
            alert("Failed to load.");
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
       Target: { X: Math.round(f.focusX), Z: Math.round(f.focusZ) },
       Zoom: Number(f.beamAngle).toFixed(1),
       Tilt: Number(f.tilt).toFixed(1)
    }));
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "Patch_List.json";
    a.click();
  };

  // --- View Control ---
  const handleFixtureHover = (e, fixture) => setHoverInfo({ data: fixture, x: e.clientX, y: e.clientY });
  const handleMouseDown = (e) => { if (e.button === 0) { setIsDragging(true); dragStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y }; } };
  const handleMouseMove = (e) => { if (isDragging) { e.preventDefault(); setPanOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }); } };
  const handleMouseUp = () => setIsDragging(false);
  const handleResetZoom = () => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); };
  const handleZoomIn = () => setZoomLevel(p => Math.min(p + 0.2, 3.0));
  const handleZoomOut = () => setZoomLevel(p => Math.max(p - 0.2, 0.4));
  const toggleTypeVisibility = (type) => {
    setVisibleTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const autoScale = Math.max(0.005, (containerWidth - 100) / (viewMode === 'top' ? stageWidth : (stageDepth + 8000)));
  const currentScale = autoScale * zoomLevel;

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-200 font-sans overflow-hidden">
      <header className="bg-slate-950 border-b border-slate-800 p-3 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded"><Lightbulb size={18} className="text-white" /></div>
          <div><h1 className="text-base font-bold text-white">StageLumina <span className="text-xs font-normal text-indigo-400">V5.1</span></h1><p className="text-[10px] text-slate-500">Manual Spacing & Target Control</p></div>
        </div>
        <div className="flex gap-2">
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleLoadProject} />
            <button onClick={() => fileInputRef.current.click()} className="flex gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded border border-slate-700"><FolderOpen size={14}/> Load</button>
            <button onClick={handleSaveProject} className="flex gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded border border-slate-700"><Save size={14}/> Save</button>
            <button onClick={handleExportData} className="flex gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded border border-indigo-600"><FileJson size={14}/> Export</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="w-80 bg-slate-900 border-r border-slate-800 overflow-y-auto custom-scrollbar p-4 space-y-6">
            <section className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <h2 className="font-bold text-indigo-400 mb-3 text-xs uppercase flex items-center gap-2"><Maximize size={14}/> Stage Dimension</h2>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div><label className="text-[10px] text-slate-500 mb-1">Width</label><input type="number" value={stageWidth} onChange={e=>setStageWidth(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-sm"/></div>
                <div><label className="text-[10px] text-slate-500 mb-1">Depth</label><input type="number" value={stageDepth} onChange={e=>setStageDepth(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-sm"/></div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Default Grid H</label>
                  <input
                    type="number"
                    value={defaultGridHeight}
                    onChange={e=>setDefaultGridHeight(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Plaster Line Z (Global)</label>
                  <input
                    type="number"
                    value={plasterLineZ}
                    onChange={e=>setPlasterLineZ(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-red-500/60 rounded px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Target Height</label>
                  <input
                    type="number"
                    value={targetHeight}
                    onChange={e=>setTargetHeight(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
            </section>
            
            <section className="space-y-3">
                <div className="flex justify-between items-center"><h2 className="font-bold text-slate-400 text-xs uppercase"><Layers size={14} className="inline mr-1"/> Bars</h2><button onClick={addBar} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-2 py-1 rounded"><Plus size={12}/> Add</button></div>
                {bars.map(bar => (
                  <div key={bar.id} className="bg-slate-800 p-3 rounded border border-slate-700 hover:border-slate-500">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${FIXTURE_SPECS[bar.type].color}`}></div>
                    <div className="flex justify-between items-center mb-2 pl-2">
                        <input value={bar.name} onChange={e=>updateBar(bar.id, 'name', e.target.value)} className="bg-transparent font-bold text-xs text-slate-200 w-28 outline-none"/>
                        <div className="flex gap-2">
                            {bar.type.includes('SIDE') && <button onClick={()=>duplicateBar(bar)} className="text-slate-500 hover:text-white"><Copy size={12}/></button>}
                            <button onClick={()=>removeBar(bar.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={12}/></button>
                        </div>
                    </div>
                    <div className="pl-2 mb-2"><select value={bar.type} onChange={e=>updateBar(bar.id, 'type', e.target.value)} className="w-full bg-slate-900 border border-slate-600 text-xs text-slate-300 rounded px-2 py-1"><option value="EMPTY">Empty</option><option value="FRONT">Front</option><option value="BACK">Back</option><option value="SIDE_BAR">Side (Bar)</option><option value="SIDE_VERTICAL">Side (Vert)</option></select></div>
                    <div className="grid grid-cols-2 gap-2 pl-2 mb-2">
                        <div><label className="text-[9px] text-slate-500">Z (PL)</label><input type="number" value={bar.z} onChange={e=>updateBar(bar.id, 'z', e.target.value)} className="w-full bg-black/20 px-2 py-1 text-xs rounded text-white text-right"/></div>
                        <div><label className="text-[9px] text-slate-500">Height</label><input type="number" value={bar.y} onChange={e=>updateBar(bar.id, 'y', e.target.value)} className="w-full bg-black/20 px-2 py-1 text-xs rounded text-white text-right"/></div>
                    </div>
                    {bar.type !== 'EMPTY' && (
                        <>
                        <div className="grid grid-cols-2 gap-2 pl-2 mb-2">
                            <div><label className="text-[9px] text-slate-500">Qty</label><input type="number" value={bar.quantity} onChange={e=>updateBar(bar.id, 'quantity', e.target.value)} className="w-full bg-black/20 px-2 py-1 text-xs rounded text-white text-right"/></div>
                            <div><label className="text-[9px] text-slate-500">Spacing</label><input type="number" value={bar.spacing} placeholder={bar.type==='SIDE_VERTICAL'?"1000":"Auto"} onChange={e=>updateBar(bar.id, 'spacing', e.target.value)} className="w-full bg-black/20 px-2 py-1 text-xs rounded text-white text-right"/></div>
                        </div>
                        {['FRONT', 'BACK', 'SIDE_BAR'].includes(bar.type) && (
                            <div className="pl-2 mb-2">
                              <label className="text-[9px] text-slate-500">{bar.type === 'SIDE_BAR' ? 'Focus Dist' : 'Target Z'}</label>
                              <input
                                type="number"
                                value=""
                                placeholder="Auto"
                                disabled
                                className="w-full bg-black/20 px-2 py-1 text-xs rounded text-white/60 text-right"
                              />
                            </div>
                        )}
                        {bar.type === 'SIDE_VERTICAL' && (
                            <div className="pl-2 mb-2">
                              <label className="text-[9px] text-slate-500">Focus Dist</label>
                              <input
                                type="number"
                                value=""
                                placeholder="Auto"
                                disabled
                                className="w-full bg-black/20 px-2 py-1 text-xs rounded text-white/60 text-right"
                              />
                            </div>
                        )}
                        </>
                    )}

                    {/* Zoom Field (Only for Side Vertical in previous version, now kept just in case or hidden if auto) */}
                    {bar.type === 'SIDE_VERTICAL' && (
                      <div className="pl-2 mb-2">
                         <label className="text-[9px] text-fuchsia-400 block mb-1">Zoom (°)</label>
                         <input 
                            type="number" 
                            value="" 
                            placeholder="Auto"
                            disabled
                            className="w-full bg-black/20 px-2 py-1 text-xs rounded text-white/60 text-right font-bold"
                        />
                      </div>
                    )}
                  </div>
                ))}
            </section>
            <div className="h-20"/>
        </aside>

        <main ref={containerRef} className="flex-1 bg-slate-950 relative overflow-hidden cursor-grab active:cursor-grabbing" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <div className="absolute top-4 left-4 z-10 flex gap-2">
                <div className="bg-slate-800/90 rounded p-1 flex shadow-lg"><button onClick={()=>setViewMode('top')} className={`px-3 py-1 text-xs rounded ${viewMode==='top'?'bg-indigo-600 text-white':'text-slate-400'}`}>TOP</button><button onClick={()=>setViewMode('side')} className={`px-3 py-1 text-xs rounded ${viewMode==='side'?'bg-indigo-600 text-white':'text-slate-400'}`}>SIDE</button></div>
                <div className="bg-slate-800/90 rounded p-1 flex shadow-lg items-center px-2 gap-2"><span className="text-[10px] text-slate-400">Beam:</span><button onClick={()=>setBeamPlane('floor')} className={`px-2 py-1 text-[10px] rounded ${beamPlane==='floor'?'bg-blue-600 text-white':'text-slate-500'}`}>Floor</button><button onClick={()=>setBeamPlane('face')} className={`px-2 py-1 text-[10px] rounded ${beamPlane==='face'?'bg-green-600 text-white':'text-slate-500'}`}>Face</button></div>
            </div>
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button onClick={()=>setShowHotspots(!showHotspots)} className={`p-2 rounded border border-slate-700 ${showHotspots?'bg-red-600 text-white':'bg-slate-800 text-slate-400'}`}><Target size={18}/></button>
                <button onClick={()=>setShowGrid(!showGrid)} className={`p-2 rounded border border-slate-700 ${showGrid?'bg-indigo-600 text-white':'bg-slate-800 text-slate-400'}`}><Grid3X3 size={18}/></button>
                <div className="bg-slate-800/90 rounded flex p-1 items-center"><button onClick={handleZoomOut} className="p-1.5 hover:text-white text-slate-400"><ZoomOut size={16}/></button><button onClick={handleZoomIn} className="p-1.5 hover:text-white text-slate-400"><ZoomIn size={16}/></button><button onClick={handleResetZoom} className="p-1.5 hover:text-white text-slate-400"><RotateCcw size={14}/></button></div>
                <button onClick={()=>setShowBeams(!showBeams)} className="bg-slate-800 p-2 rounded border border-slate-700 text-slate-300"><Eye size={18}/></button>
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

            {hoverInfo && (
                <div className="fixed pointer-events-none bg-slate-900/90 border border-slate-600 text-white text-xs p-3 rounded z-50" style={{left:hoverInfo.x+15, top:hoverInfo.y+15}}>
                    <div className="font-bold text-yellow-400 mb-1">{hoverInfo.data.id}</div>
                    <div>Zoom: {Number(hoverInfo.data.beamAngle).toFixed(1)}°</div>
                    <div>Tilt: {Number(hoverInfo.data.tilt).toFixed(1)}°</div>
                </div>
            )}

            <div className="w-full h-full flex items-center justify-center">
                <div style={{
                    width: viewMode === 'top' ? stageWidth * currentScale : (stageDepth + 8000) * currentScale,
                    height: viewMode === 'top' ? (stageDepth + 8000) * currentScale : 12000 * currentScale,
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
                    position: 'relative'
                }}>
                    {viewMode === 'top' && (
                        <>
                         {showGrid && <div className="absolute inset-0 opacity-10" style={{backgroundImage: `linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)`, backgroundSize: `${1000*currentScale}px ${1000*currentScale}px`}}/>}
                         <div className="absolute border-2 border-slate-600" style={{left: '50%', top: (stageDepth+8000)*currentScale*0.8 - (stageDepth*currentScale), width: stageWidth*currentScale, height: stageDepth*currentScale, transform: 'translateX(-50%)'}}/>
                         
                         {/* Visual Plaster Line (Top View) */}
                         <div className="absolute h-0.5 bg-red-500 w-full z-10" style={{top: (stageDepth+8000)*currentScale*0.8 - (plasterLineZ*currentScale)}}><span className="absolute right-0 -top-4 text-red-500 text-[10px]">PL ({plasterLineZ})</span></div>

                         {/* Bar Graphics */}
                         {bars.map(bar => {
                            if (bar.type === 'SIDE_VERTICAL') return null;
                            const safeTop = ((stageDepth+8000)*currentScale*0.8) - ((plasterLineZ + bar.z) * currentScale);
                            return (
                                <div key={bar.id} className="absolute bg-gray-700/80 rounded-full border border-gray-500 z-10" style={{left: '50%', top: safeTop - 2, width: FIXED_BAR_WIDTH * currentScale, height: 4, transform: 'translateX(-50%)'}}><span className="absolute left-full ml-2 text-[9px] text-gray-400 whitespace-nowrap">{bar.name}</span></div>
                            )
                         })}

                         {/* Beams */}
                         {fixtures.map(f => {
                             const proj = f.projection;
                             return (showBeams && proj && visibleTypes[f.type]) ? (
                                 <div key={`beam-${f.id}`} className={`absolute border mix-blend-screen ${FIXTURE_SPECS[f.type].beamColor}`}
                                    style={{
                                        left: '50%', top: (stageDepth+8000)*currentScale*0.8,
                                        marginLeft: proj.centerX*currentScale - (proj.width*currentScale/2),
                                        marginTop: -(proj.centerZ*currentScale) - (proj.height*currentScale/2),
                                        width: proj.width*currentScale, height: proj.height*currentScale,
                                        transform: `rotate(${-proj.rotation}deg)`, borderRadius: '50%'
                                    }}
                                 />
                             ) : null;
                         })}

                         {/* Icons & Hotspots */}
                         {fixtures.map(f => {
                            const topPos = ((stageDepth+8000)*currentScale*0.8) - (f.z * currentScale);
                            if (!visibleTypes[f.type]) return null;
                            return (
                                <React.Fragment key={f.id}>
                                    <div className={`absolute w-3 h-3 rounded-full z-20 ${FIXTURE_SPECS[f.type].color} border border-white/20`}
                                        style={{top: topPos-3, left: '50%', marginLeft: (f.x*currentScale)-3}}
                                        onMouseEnter={(e)=>handleFixtureHover(e,f)} onMouseLeave={()=>setHoverInfo(null)}
                                    />
                                    {showHotspots && <div className="absolute z-30 text-red-500 text-[8px]" style={{top: ((stageDepth+8000)*currentScale*0.8) - (f.focusZ*currentScale)-4, left:'50%', marginLeft:(f.focusX*currentScale)-3}}>✖</div>}
                                </React.Fragment>
                            )
                         })}
                        </>
                    )}
                    {viewMode === 'side' && (
                        <div className="w-full h-full border-l border-b border-slate-700 ml-4 relative">
                            {/* Side View Graphics */}
                            {(() => {
                                const sideViewWidth = (stageDepth + 8000) * currentScale;
                                const paddingRight = 200 + (4000 * currentScale);
                                const plPixelX = sideViewWidth - paddingRight;

                                return (
                                    <>
                                        {/* Visual Plaster Line (Side View) */}
                                        <div className="absolute w-0.5 bg-red-500 h-full z-20" style={{left: plPixelX}}><span className="absolute top-2 right-1 text-red-500 text-[10px] font-bold">PL</span></div>
                                        
                                        <div className="absolute top-2 text-slate-500 text-[10px]" style={{left: plPixelX + 10}}>FOH &rarr;</div>
                                        <div className="absolute top-2 text-slate-500 text-[10px]" style={{right: sideViewWidth - plPixelX + 10}}>&larr; STAGE</div>

                                        {showGrid && <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: `linear-gradient(to left, #fff 1px, transparent 1px), linear-gradient(to top, #fff 1px, transparent 1px)`, backgroundSize: `${1000*currentScale}px ${1000*currentScale}px`, backgroundPosition: `right ${paddingRight}px bottom 10px`}}/>}

                                        {bars.map(bar => {
                                            if (bar.type === 'SIDE_VERTICAL') return null;
                                            const viewX = plPixelX - (bar.z * currentScale);
                                            return (
                                                <div key={`side-bar-${bar.id}`} className="absolute w-2 h-2 rounded-full bg-gray-600 pointer-events-none z-10" style={{left: viewX - 3, bottom: 10 + (bar.y * currentScale)}} />
                                            )
                                        })}
                                        {fixtures.map(f => {
                                            const viewX = plPixelX - ((f.z - plasterLineZ) * currentScale);
                                            if (!visibleTypes[f.type]) return null;
                                            return (
                                                <div key={f.id} className={`absolute w-3 h-3 rounded-full z-20 ${FIXTURE_SPECS[f.type].color}`}
                                                    style={{left: viewX - 4, bottom: 10 + (f.y * currentScale)}}
                                                    onMouseEnter={(e)=>handleFixtureHover(e,f)} onMouseLeave={()=>setHoverInfo(null)}
                                                />
                                            )
                                        })}
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>
        </main>
      </div>
    </div>
  );
};

export default StageLuminaPro;

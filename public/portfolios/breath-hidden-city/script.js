// script.js
document.addEventListener('DOMContentLoaded', () => {

  // 필요한 노드
  const rootEl = document.getElementById("root");
  const gridEl = document.getElementById("grid");
  const titleKo = document.getElementById("title-ko");
  const titleEn = document.getElementById("title-en");
  const footEl = document.getElementById("foot");
  const vignetteEl = document.getElementById("vignette");

  const toggleBtn = document.getElementById('modeToggle') || document.querySelector('.toggle-btn');
  const toggleMainLabel = document.getElementById("toggle-main-label");
  const toggleSubLabel = document.getElementById("toggle-sub-label");

  // 상태
  window.hiddenMode = false;    // 전역으로 노출해서 fx.js에서 접근
  window.currentStage = null;
  window.prevStageKey = null;
  window.lastRows = 0;
  window.lastCols = 0;
  window.centerCellEl = null;
  window.baseCellFontPx = 12;

  // per-onomatopoeia font map (user-editable)
  window.DEFAULT_VEHICLE_FONT = "Pretendard, sans-serif";
  window.VEHICLE_FONT_MAP = {
    "부릉": { font: "blazeface-hangeul, sans-serif", weight: 900 },
    "따르릉": { font: "yoon-px-pixelbatang, sans-serif", weight: 400 },
    "빵빵": { font: "dunkel-serif-display-medium, sans-serif", weight: 900 }
  };
  // helper for runtime override, e.g., setVehicleFont("빵빵", "Orbit, sans-serif")
  window.setVehicleFont = function (base, cssFontFamily) {
    if (typeof base === "string" && cssFontFamily) {
      window.VEHICLE_FONT_MAP[base] = cssFontFamily;
    }
  };

  // TOWN moving '숨' font (only for moving breath tokens, not the static grid)
  window.TOWN_BREATH_FONT = { font: "dragon-heavy, sans-serif", weight: 900 };
  window.setTownBreathFont = function (cssFontFamily, weight) {
    if (cssFontFamily) {
      window.TOWN_BREATH_FONT = { font: cssFontFamily, weight: (typeof weight === 'number' ? weight : 600) };
    }
  };

  // FX suspend flag used during window movement; fx.js may optionally check this too
  window.suspendFXDuringResize = false;

  // 헬퍼
  function clamp(n, lo, hi) {
    return n < lo ? lo : (n > hi ? hi : n);
  }
  function nearestOdd(x) {
    const r = Math.round(x);
    return (r % 2 === 0) ? r + 1 : r;
  }

  // 단계 정의 (toggle short labels 포함)
  window.STAGES = [
    { k: "HUMAN", a: 1, b: 2, koTitle: "숨은 인간", enTitle: "Breath Hide Human", foot: "한 사람의 숨", koShort: "인간", enShort: "Human" },
    { k: "THEM", a: 2, b: 6, koTitle: "숨은 모임", enTitle: "Breath Hide Them", foot: "그들은 숨쉰다", koShort: "모임", enShort: "Group" },
    { k: "TOWN", a: 6, b: 15, koTitle: "숨은 마을", enTitle: "Breath Hide Town", foot: "숨들이 모여 마을을 이룬다.", koShort: "마을", enShort: "Town" },
    { k: "CITY", a: 15, b: 47, koTitle: "숨은 도시", enTitle: "Breath Hide City", foot: "모인 숨들은 결국 도시가 된다.", koShort: "도시", enShort: "City" }
  ];

  const AREA_MIN = 320 * 560;
  const AREA_MAX = 1920 * 1080 * 1.4;

  function areaToSide(area) {
    if (!isFinite(area) || area <= 0) return 1;
    const t = clamp((area - AREA_MIN) / (AREA_MAX - AREA_MIN), 0, 1);
    const eased = 1 - Math.pow(1 - t, 1.35);
    const side = 1 + eased * (47 - 1);
    return clamp(nearestOdd(side), 1, 47);
  }

  function sideToCols(side) {
    const r = 0.5;
    const extra = Math.floor(r * (side));
    const cols = side + extra;
    return nearestOdd(cols);
  }

  function pickStage(side) {
    for (let i = 0; i < STAGES.length; i++) {
      const s = STAGES[i];
      if (side >= s.a && side < s.b) return s;
    }
    return STAGES[STAGES.length - 1];
  }

  // 중앙 인덱스 계산
  function getCenterIndex(rows, cols) {
    const centerR = (rows - 1) / 2;
    const centerC = (cols - 1) / 2;
    return {
      centerFlat: centerR * cols + centerC
    };
  }

  function renderGrid(rows, cols, cellFont) {


    const needRebuild = (rows !== lastRows) || (cols !== lastCols);

    const { centerFlat } = getCenterIndex(rows, cols);

    if (needRebuild) {
      gridEl.innerHTML = "";
      gridEl.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
      gridEl.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;

      const total = rows * cols;
      const frag = document.createDocumentFragment();
      let newCenterCell = null;

      for (let i = 0; i < total; i++) {
        const cell = document.createElement("div");
        cell.className = "grid-cell";
        cell.textContent = "숨";
        cell.style.fontSize = cellFont + "px";

        if (i === centerFlat) {
          newCenterCell = cell;
        }
        frag.appendChild(cell);
      }

      gridEl.appendChild(frag);

      window.lastRows = rows;
      window.lastCols = cols;
      window.centerCellEl = newCenterCell;

      window.baseCellFontPx = cellFont;

    } else {
      const cells = gridEl.children;
      for (let i = 0; i < cells.length; i++) {
        cells[i].style.fontSize = cellFont + "px";
      }

      window.baseCellFontPx = cellFont;
    }
  }

  function renderStageText(stage) {
    // Left title is fixed (project name)
    titleKo.textContent = "숨은 도시";
    titleEn.textContent = "Breathe Hidden City";
    // Bottom foot varies by stage
    footEl.textContent = stage.foot || "";
    footEl.style.display = stage.foot ? "block" : "none";
  }

  function updateToggleLabels() {
    if (!window.currentStage) return;
    if (window.hiddenMode) {
      // toggled: show current stage short labels
      toggleMainLabel.textContent = window.currentStage.koShort || "";
      toggleSubLabel.textContent = window.currentStage.enShort || "";
    } else {
      // idle: fixed labels
      toggleMainLabel.textContent = "숨은";
      toggleSubLabel.textContent = "Hidden";
    }
  }
  window.updateToggleLabels = updateToggleLabels;

  function setVignette(area) {
    const t = clamp(area / AREA_MAX, 0, 1);
    const strength = 0.24 + (1 - t) * 0.7;
    vignetteEl.style.background =
      `radial-gradient(circle at 50% 55%, rgba(0,0,0,0) 0%, rgba(0,0,0,${strength}) 75%)`;
  }

  // 전역에서 fx.js가 부르는 헬퍼들에 접근할 수 있도록 window에 몇 개 올려둔다
  window.getGridCells = () => gridEl.children;

  // fx.js에서 stage를 보고 이펙트 켜고 끄기 위해 호출할 함수
  window.syncAllFX = function () {
    if (window.suspendFXDuringResize) return;
    if (window.syncHumanFX) window.syncHumanFX();
    if (window.syncGroupFX) window.syncGroupFX();
    if (window.syncTownFX) window.syncTownFX();
    if (window.syncCityFX) window.syncCityFX();
  };

  // Optional hooks that fx.js can implement to stop/restart ONLY visuals (keep audio running)
  window.pauseVisualsKeepAudio = function () {
    if (typeof window._pauseVisualsKeepAudio === "function") window._pauseVisualsKeepAudio();
  };
  window.resumeVisualsKeepAudio = function () {
    if (typeof window._resumeVisualsKeepAudio === "function") window._resumeVisualsKeepAudio();
  };

  // Fully reset to idle state (old behavior)
  window.hardResetAll = function () {
    // turn hidden mode off and UI labels back to idle
    window.hiddenMode = false;
    toggleBtn.classList.remove("active");
    updateToggleLabels();
    // stop any running FX explicitly
    if (window.stopHumanFX) window.stopHumanFX();
    if (window.stopGroupFX) window.stopGroupFX();
    if (window.stopTownSystem) window.stopTownSystem();
    if (window.stopCitySystem) window.stopCitySystem();
    if (window.stopHumanFX) window.stopHumanFX();
    if (window.stopGroupFX) window.stopGroupFX();
    // rebuild layout/stage in clean state
    update();
  };

  // Pause/Resume hooks for all FX (used during window resizing/moving)
  window.pauseAllFX = function () {
    // stop/pause if available
    if (window.stopHumanFX) window.stopHumanFX();
    if (window.stopGroupFX) window.stopGroupFX();
    if (window.stopTownSystem) window.stopTownSystem();
    if (window.stopCitySystem) window.stopCitySystem();
  };
  window.resumeAllFX = function () {
    // restart according to current hiddenMode/stage
    window.syncAllFX();
  };

  // 메인 업데이트: 리사이즈나 첫 진입 때 호출
  function update() {
    const ww = window.innerWidth || 800;
    const hh = window.innerHeight || 600;
    const area = ww * hh;

    // 리사이즈 시 숨 모드 강제 해제
    // window.hiddenMode = false;
    // toggleSubLabel.textContent = "Breath";
    // toggleBtn.classList.remove("active");

    const side = areaToSide(area);
    const rows = side;
    const cols = sideToCols(side);

    // 셀 크기 기반 폰트
    const cellUnit = Math.min(ww / cols, hh / rows);
    const cellFont = clamp(0.75 * cellUnit, 10, 300);

    const stage = pickStage(side);
    window.currentStage = stage;

    // If stage changed (e.g., TOWN -> CITY), hard-stop non-matching systems
    if (window.prevStageKey !== stage.k) {
      if (typeof stopTownSystem === 'function') stopTownSystem();
      if (typeof stopCitySystem === 'function') stopCitySystem();
      if (typeof stopAllWaves === 'function') stopAllWaves();
    }
    window.prevStageKey = stage.k;

    renderGrid(rows, cols, cellFont);
    renderStageText(stage);
    setVignette(area);
    updateToggleLabels();

    // fx 반영
    window.syncAllFX();
  }

  function toggleHidden() {
    window.hiddenMode = !window.hiddenMode;

    // 토글 켤 때 혹시 남아있을 수 있는 resize-suspend 해제
    window.suspendFXDuringResize = false;
    ensureCityTimers();

    // UI
    toggleBtn.classList.toggle("active", window.hiddenMode);
    updateToggleLabels();

    // 비주얼 타이머 보장
    if (window.hiddenMode) {
      ensureCityTimers();  // ↓ 2)에서 추가
    }
    window.syncAllFX();

    // 🔹 토글 OFF일 때 전체 숨 상태로 초기화
    if (!window.hiddenMode) {
      const cells = document.querySelectorAll('.grid-cell');
      cells.forEach(cell => {
        cell.textContent = '숨';
        cell.className = 'grid-cell';
        cell.style.removeProperty('background');
        cell.style.removeProperty('background-color');
        cell.style.removeProperty('color');
        cell.style.removeProperty('font-family');
        cell.style.removeProperty('font-weight');
      });
    }

  }

  toggleBtn.addEventListener("click", toggleHidden);

  // script.js — resize 핸들러를 단일화 (기존 중첩 제거)
  let _resizeDebounceId = null;
  let _resizingActive = false;
  let _wasHiddenMode = false;

  window.addEventListener("resize", () => {
    if (!_resizingActive) {
      _resizingActive = true;
      _wasHiddenMode = window.hiddenMode;
      window.suspendFXDuringResize = true;
      if (typeof stopAllWaves === 'function') stopAllWaves();
      if (typeof stopTownSystem === 'function') stopTownSystem();
      if (typeof stopCitySystem === 'function') stopCitySystem();
    }
    if (_resizeDebounceId) cancelAnimationFrame(_resizeDebounceId);
    _resizeDebounceId = requestAnimationFrame(() => {
      clearTimeout(_resizeDebounceId._t);
      _resizeDebounceId._t = setTimeout(() => {
        _resizingActive = false;
        update();                         // 레이아웃 재빌드
        window.hiddenMode = _wasHiddenMode;
        toggleBtn.classList.toggle("active", window.hiddenMode);
        updateToggleLabels();
        window.suspendFXDuringResize = false;
        if (window.hiddenMode) window.syncAllFX();

        // 🔹 토글 OFF일 때 전체 숨 상태로 초기화
        if (!window.hiddenMode) {
          const cells = document.querySelectorAll('.grid-cell');
          cells.forEach(cell => {
            cell.textContent = '숨';
            cell.className = 'grid-cell';
            cell.style.removeProperty('background');
            cell.style.removeProperty('background-color');
            cell.style.removeProperty('color');
            cell.style.removeProperty('font-family');
            cell.style.removeProperty('font-weight');
          });
        }
      }, 280);
    });
  });

  // === merged from fx.js: audio ===
  const breathAudio = new Audio("https://dl.dropboxusercontent.com/scl/fi/c9d99ghw3kldmlj0n9akz/Breath_human.mp3?rlkey=c68i0wyngwcr7jzimcddhveha&st=uwnqle8h&dl=1");
  breathAudio.loop = true;
  breathAudio.volume = 0.2; // HUMAN stage: slightly lower volume

  const groupAudio = new Audio("https://dl.dropboxusercontent.com/scl/fi/brfhifwdede67u1hvvtiw/Breath_Group.mp3?rlkey=mgppjkbvv1w0id3fmrtcwu5m0&st=qjdkssf5&dl=1");
  groupAudio.loop = true;

  const townAudio = new Audio("https://dl.dropboxusercontent.com/scl/fi/r90k0ikbbjl30j3np828c/Breath_Town.mp3?rlkey=ij88neeiyee07y245slugf7cs&st=vhqqyfo9&dl=1");
  townAudio.loop = true;
  townAudio.volume = 0.4;

  const cityAudio = new Audio("https://dl.dropboxusercontent.com/scl/fi/k4j1di9h866f43ud06hzn/Breath_City.mp3?rlkey=v5fy9wtkmmoxymj1n3v0zazh5&st=96r7iv8v&dl=1");
  cityAudio.loop = true;
  cityAudio.volume = 0.5;

  // Pause all audios with a short fade-out (used by modal open)
  window.pauseAllAudio = function () {
    const list = [breathAudio, groupAudio, townAudio, cityAudio].filter(Boolean);
    const DURATION = 600;  // ms
    const STEP = 60;       // ms
    list.forEach(aud => {
      try {
        if (!aud.paused) {
          let t = 0;
          const startVol = (typeof aud.volume === 'number') ? aud.volume : 1.0;
          const iv = setInterval(() => {
            t += STEP;
            const r = Math.max(0, 1 - t / DURATION);
            aud.volume = startVol * r;
            if (t >= DURATION) {
              clearInterval(iv);
              aud.pause();
              aud.currentTime = 0;
              // do not reset volume; keep last configured value
            }
          }, STEP);
        }
      } catch (_) { }
    });
  };

  // === merged from fx.js: group wave ===
  let waveRunning = false;
  let waveScheduleTimer = null;
  let waveStepTimers = [];

  function rcToIndex(r, c, cols) { return r * cols + c; }
  function indexToRC(index, cols) { return { r: Math.floor(index / cols), c: index % cols }; }

  function runWaveFrom(centerIndex) {
    if (waveRunning) return;
    waveRunning = true;
    const cells = window.getGridCells();
    if (!cells || cells.length === 0) { waveRunning = false; return; }
    const cols = window.lastCols; const rows = window.lastRows;
    const { r: cr, c: cc } = indexToRC(centerIndex, cols);
    const maxRadius = 5; const stepDelay = 80;
    for (let radius = 0; radius <= maxRadius; radius++) {
      const timerId = setTimeout(() => {
        const ringCells = [];
        for (let dr = -radius; dr <= radius; dr++) {
          for (let dc = -radius; dc <= radius; dc++) {
            const nr = cr + dr, nc = cc + dc;
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            const dist = Math.abs(dr) + Math.abs(dc);
            if (dist === radius) ringCells.push(rcToIndex(nr, nc, cols));
          }
        }
        for (let i = 0; i < ringCells.length; i++) {
          const idx = ringCells[i]; const cell = cells[idx]; if (!cell) continue;
          cell.classList.remove("group-active"); void cell.offsetWidth; cell.classList.add("group-active");
        }
        if (radius === maxRadius) { setTimeout(() => { waveRunning = false; }, 200); }
      }, radius * stepDelay);
      waveStepTimers.push(timerId);
    }
  }

  function scheduleNextWave() {
    if (waveScheduleTimer) return;
    waveScheduleTimer = setInterval(() => {
      if (waveRunning) return;
      const cells = window.getGridCells(); if (!cells || cells.length === 0) return;
      const randomIndex = Math.floor(Math.random() * cells.length);
      runWaveFrom(randomIndex);
    }, 600);
  }

  function stopAllWaves() {
    waveRunning = false;
    if (waveScheduleTimer) { clearInterval(waveScheduleTimer); waveScheduleTimer = null; }
    for (let i = 0; i < waveStepTimers.length; i++) clearTimeout(waveStepTimers[i]);
    waveStepTimers = [];
  }
  window.stopTownSystem = stopTownSystem;
  window.pauseTownSystem = pauseTownSystem;
  window.startTownSystem = startTownSystem;

  window.stopCitySystem = stopCitySystem;
  window.pauseCitySystem = pauseCitySystem;
  window.startCitySystem = startCitySystem;

  window.stopAllWaves = stopAllWaves;

  // === merged from fx.js: human/group sync ===
  window.syncHumanFX = function () {
    const active = window.hiddenMode && window.currentStage && window.currentStage.k === "HUMAN";
    if (active) {
      // ensure softer volume for HUMAN stage every time it (re)starts
      breathAudio.volume = 0.2;
      if (breathAudio.paused) {
        breathAudio.currentTime = 0;
        breathAudio.play().catch(() => { });
      }
    }
    else { if (!breathAudio.paused) breathAudio.pause(); }
    if (window.centerCellEl) {
      if (active) window.centerCellEl.classList.add("breathing-active");
      else window.centerCellEl.classList.remove("breathing-active");
    }
  };

  window.syncGroupFX = function () {
    const activeGroup = window.hiddenMode && window.currentStage && window.currentStage.k === "THEM";
    if (activeGroup) {
      groupAudio.volume = 0.35;
      if (groupAudio.paused) { groupAudio.currentTime = 0; groupAudio.play().catch(() => { }); }
      if (!breathAudio.paused) breathAudio.pause();
      if (window.centerCellEl) window.centerCellEl.classList.remove("breathing-active");
      scheduleNextWave();
    } else {
      if (!groupAudio.paused) groupAudio.pause();
      stopAllWaves();
    }
  };
  // explicit stop handlers so modal/toggle/resize can reliably halt visuals + audio
  window.stopHumanFX = function () {
    try { if (window.centerCellEl) window.centerCellEl.classList.remove("breathing-active"); } catch (_) { }
    try { if (typeof breathAudio !== 'undefined' && !breathAudio.paused) breathAudio.pause(); } catch (_) { }
  };
  window.stopGroupFX = function () {
    try { if (typeof stopAllWaves === 'function') stopAllWaves(); } catch (_) { }
    try { if (typeof groupAudio !== 'undefined' && !groupAudio.paused) groupAudio.pause(); } catch (_) { }
  };

  // === merged from fx.js: town (rebuilt like CITY) ===
  let townLines = [];
  let townInterval = null;
  let townSpawnInterval = null;

  const VEHICLE_WORDS = ["부릉", "따르릉", "빵빵"]; // base syllables
  function buildTownVehicleToken() {
    const base = VEHICLE_WORDS[Math.floor(Math.random() * VEHICLE_WORDS.length)];
    if (base === "부릉") {
      const n = Math.floor(Math.random() * 4) + 1;
      return { base, chars: Array.from("부" + "르".repeat(n) + "릉") };
    } else if (base === "따르릉") {
      const n = Math.floor(Math.random() * 4) + 1;
      return { base, chars: Array.from("따" + "르".repeat(n) + "릉") };
    } else {
      const m = Math.floor(Math.random() * 4) + 2;
      return { base, chars: Array.from("빵".repeat(m)) };
    }
  }
  const TOWN_TICK_MS = 110;      // slightly slower than city for calmer feel
  const TOWN_SPAWN_MS = 1200;   // slightly sparser to raise "숨" ratio

  // buildOnomatopoeia() is now replaced by buildTownVehicleToken for TOWN logic.

  // Create a one-line conveyor like CITY, but non-cyclic: characters are injected from an edge and flow out the other side.
  const TOWN_SMOKE_STEPS = 3;
  function createTownLine(type, index, dir, rows, cols, contentKind = "vehicle") {
    const len = (type === "row") ? cols : rows;
    const buffer = new Array(len).fill("숨");

    let injectQueue;
    if (contentKind === "breath") {
      // '숨' 1글자씩 N번 주입
      const n = Math.floor(Math.random() * 5) + 3; // 3~7개
      injectQueue = Array.from({ length: n }, () => ({ ch: "숨", kind: "breath" }));
    } else {
      const tok = buildTownVehicleToken();
      injectQueue = tok.chars.map(ch => ({ ch, kind: "vehicle", base: tok.base }));
    }

    const entryAtStart = (dir === "forward");
    const tailGraceTicks = (len + injectQueue.length + 2);
    const smokeAges = new Array(len).fill(0); // 더 이상 사용 안하지만 유지

    return { type, index, dir, buffer, injectQueue, entryAtStart, tailTicks: tailGraceTicks, alive: true, smokeAges };
  }

  // 2) TOWN 버퍼 전진: 오브젝트/문자 처리
  function advanceTownBuffer(line) {
    const arr = line.buffer;

    if (line.entryAtStart) {
      for (let i = arr.length - 1; i > 0; i--) arr[i] = arr[i - 1];
      arr[0] = (line.injectQueue.length > 0) ? line.injectQueue.shift() : "숨";
    } else {
      for (let i = 0; i < arr.length - 1; i++) arr[i] = arr[i + 1];
      arr[arr.length - 1] = (line.injectQueue.length > 0) ? line.injectQueue.shift() : "숨";
    }
    // TOWN에서는 숨 그라데이션(연기) 완전히 비활성 → smokeAges 갱신/감쇠 제거
  }

  function renderTownLine(line) {
    const cells = window.getGridCells(); if (!cells || cells.length === 0) return;
    const rows = window.lastRows, cols = window.lastCols, len = line.buffer.length;
    const base = window.baseCellFontPx || 16;

    for (let off = 0; off < len; off++) {
      let r, c;
      if (line.type === "row") { r = line.index; c = off; } else { r = off; c = line.index; }
      const flat = r * cols + c;
      const cell = cells[flat]; if (!cell) continue;

      const token = line.buffer[off];

      // 초기화
      cell.classList.remove("smoke-1", "smoke-2", "smoke-3", "town-active-vehicle");
      cell.style.fontSize = base + "px";
      cell.style.backgroundColor = '';
      cell.style.removeProperty('color');
      cell.style.fontFamily = '';

      if (token === "숨") {
        cell.textContent = "숨";

        // 잔상/스타일 완전 초기화
        cell.classList.remove("town-active-vehicle", "smoke-1", "smoke-2", "smoke-3");
        cell.style.removeProperty('background');
        cell.style.removeProperty('background-color');
        cell.style.removeProperty('color');
        cell.style.removeProperty('font-family');
        cell.style.removeProperty('font-weight');
      } else {
        // 움직이는 토큰(의성어/숨 한글자) 렌더
        cell.textContent = token.ch;

        // font selection:
        // - token.kind === 'breath'  -> use TOWN_BREATH_FONT
        // - token.base exists        -> per-onomatopoeia font from VEHICLE_FONT_MAP
        // - fallback                 -> DEFAULT_VEHICLE_FONT
        let map;
        if (token.kind === 'breath') {
          map = window.TOWN_BREATH_FONT || window.DEFAULT_VEHICLE_FONT;
        } else if (token.base) {
          map = window.VEHICLE_FONT_MAP[token.base] || window.DEFAULT_VEHICLE_FONT;
        } else {
          map = window.DEFAULT_VEHICLE_FONT;
        }

        if (typeof map === 'object') {
          cell.style.fontFamily = map.font;
          cell.style.fontWeight = map.weight ?? '400';
        } else {
          cell.style.fontFamily = map;
          cell.style.fontWeight = '400';
        }

        // Town moving tokens use white bg / black text
        cell.style.backgroundColor = '#fff';
        cell.style.setProperty('color', '#000', 'important');
        cell.classList.add("town-active-vehicle");
      }
    }
  }

  function tickTownLines() {
    if (window.suspendFXDuringResize) return;
    if (!window.hiddenMode || !window.currentStage || window.currentStage.k !== "TOWN") return;
    for (let i = townLines.length - 1; i >= 0; i--) {
      const line = townLines[i]; if (!line.alive) continue;
      advanceTownBuffer(line);
      renderTownLine(line);
      // Removal: only remove after buffer is fully empty ("숨" everywhere)
      if (line.injectQueue.length === 0) {
        let allEmpty = true;
        for (let k = 0; k < line.buffer.length; k++) { if (line.buffer[k] !== "숨") { allEmpty = false; break; } }
        if (allEmpty) {
          line.alive = false;
          resetTownLineCells(line);
          townLines.splice(i, 1);
        }
        // else: keep advancing until buffer empties naturally; no countdown kill
      }
    }
  }
  // Pauses town system (keeps DOM/townLines untouched)
  function pauseTownSystem() {
    if (townInterval) { clearInterval(townInterval); townInterval = null; }
    if (townSpawnInterval) { clearInterval(townSpawnInterval); townSpawnInterval = null; }
    // keep townLines and DOM as-is (freeze visuals)
  }

  function resetTownLineCells(line) {
    const cells = window.getGridCells(); if (!cells || cells.length === 0) return;
    const rows = window.lastRows, cols = window.lastCols, len = line.buffer.length;
    const base = window.baseCellFontPx || 16;
    for (let off = 0; off < len; off++) {
      let r, c;
      if (line.type === "row") { r = line.index; c = off; } else { r = off; c = line.index; }
      const flat = r * cols + c;
      const cell = cells[flat]; if (!cell) continue;
      cell.textContent = "숨";
      cell.style.fontSize = base + "px";
      cell.classList.remove("town-active-vehicle", "smoke-1", "smoke-2", "smoke-3");
      // clear per-cell style overrides (to revert to default black bg/white text)
      cell.style.backgroundColor = '';
      cell.style.color = '';
      cell.style.fontFamily = '';
      cell.style.opacity = '1.0';
      cell.style.transform = 'scale(1.0)';
      if (line.smokeAges) line.smokeAges[off] = 0;
    }
  }
  // 4) 스폰 로직: 일정 확률로 'breath' 라인 생성
  function spawnTownLineMaybe() {
    if (window.suspendFXDuringResize) return;
    if (!window.hiddenMode || !window.currentStage || window.currentStage.k !== "TOWN") return;
    const rows = window.lastRows, cols = window.lastCols;
    const cells = window.getGridCells(); if (!cells || cells.length === 0) return;
    if (rows < 3 || cols < 3) return;
    if (townLines.length >= 4) return;

    if (Math.random() < 0.8) {
      const useRow = Math.random() < 0.5;
      const idx = useRow ? Math.floor(Math.random() * rows) : Math.floor(Math.random() * cols);
      const dir = (Math.random() < 0.5) ? "forward" : "backward";
      const kind = (Math.random() < 0.7) ? "breath" : "vehicle"; // 숨 비율 ↑
      const line = createTownLine(useRow ? "row" : "col", idx, dir, rows, cols, kind);
      townLines.push(line);
      renderTownLine(line);
    }
  }

  function startTownSystem() {
    if (window.suspendFXDuringResize) return;
    if (townInterval || townSpawnInterval) return;
    townLines = [];
    // start ticking and spawning
    townInterval = setInterval(tickTownLines, TOWN_TICK_MS);
    townSpawnInterval = setInterval(spawnTownLineMaybe, TOWN_SPAWN_MS);
  }

  function stopTownSystem() {
    if (townInterval) { clearInterval(townInterval); townInterval = null; }
    if (townSpawnInterval) { clearInterval(townSpawnInterval); townSpawnInterval = null; }
    // clear leftovers
    for (let i = 0; i < townLines.length; i++) resetTownLineCells(townLines[i]);
    townLines = [];
  }

  // group/town audio + sync
  window.syncTownFX = function () {
    const activeTown = window.hiddenMode && window.currentStage && window.currentStage.k === "TOWN";
    if (activeTown) {
      startTownSystem();
      townAudio.volume = 0.4;
      if (townAudio.paused) { townAudio.currentTime = 0; townAudio.play().catch(() => { }); }
    } else {
      stopTownSystem();
      if (!townAudio.paused) townAudio.pause();
    }
  };

  // === merged from fx.js: city — REBUILT SPAWN/INJECTION SYSTEM ===
  let cityLines = [];
  let cityInterval = null;
  let citySpawnInterval = null;

  // density controls
  const CITY_TICK_MS = 90;           // movement cadence
  const CITY_MIN_LINES = 12;         // maintain at least this many conveyors
  const CITY_MAX_LINES = 28;         // upper bound
  const CITY_MIN_COOLDOWN = 12;      // per-line spawn cooldown ticks (fastest)
  const CITY_MAX_COOLDOWN = 28;      // per-line spawn cooldown ticks (slowest)
  const CITY_MIN_GAP = 2;            // at least N "숨" between words on the same line
  const CITY_MAX_INJECT = 3;         // at most N words waiting in queue per line
  const CITY_SMOKE_STEPS = 3;        // trailing “연기” 잔상 단계 (유지)

  // build a basic onomatopoeia token (each syllable occupies one cell)
  function buildCityWord() {
    const bases = VEHICLE_WORDS;
    const base = bases[Math.floor(Math.random() * bases.length)];
    if (base === "부릉") {
      const n = Math.floor(Math.random() * 4) + 1;
      return { base, chars: Array.from("부" + "르".repeat(n) + "릉") };
    } else if (base === "따르릉") {
      const n = Math.floor(Math.random() * 4) + 1;
      return { base, chars: Array.from("따" + "르".repeat(n) + "릉") };
    } else {
      const m = Math.floor(Math.random() * 4) + 2;
      return { base, chars: Array.from("빵".repeat(m)) };
    }
  }

  // create a conveyor line with edge-fed injection queue (no prefill jitter)
  function createCityLine(type, index, dir, rows, cols) {
    const len = (type === "row") ? cols : rows;
    const buffer = new Array(len).fill("숨");

    // injection queue holds tokens that will be pushed from the entry edge
    const injectQueue = [];

    // per-line cooldown (ticks) before trying to enqueue next word
    const cooldown = Math.floor(Math.random() * (CITY_MAX_COOLDOWN - CITY_MIN_COOLDOWN + 1)) + CITY_MIN_COOLDOWN;
    let nextSpawnTick = Math.floor(Math.random() * cooldown); // desync lines

    // trailing smoke ages
    const smokeAges = new Array(len).fill(0);

    return {
      type, index, dir, buffer,
      injectQueue,
      cooldown, nextSpawnTick,
      smokeAges,
      alive: true
    };
  }

  // shift a line one step, inject from queue at the entry edge
  function advanceCityBuffer(line) {
    const arr = line.buffer;
    const ages = line.smokeAges;

    if (line.dir === "forward") {
      const exitIdx = arr.length - 1;
      const exiting = arr[exitIdx];
      for (let i = arr.length - 1; i > 0; i--) arr[i] = arr[i - 1];
      // inject at entry
      arr[0] = (line.injectQueue.length > 0) ? line.injectQueue.shift() : "숨";
      if (exiting !== "숨") ages[exitIdx] = CITY_SMOKE_STEPS;
    } else {
      const exitIdx = 0;
      const exiting = arr[exitIdx];
      for (let i = 0; i < arr.length - 1; i++) arr[i] = arr[i + 1];
      // inject at entry
      arr[arr.length - 1] = (line.injectQueue.length > 0) ? line.injectQueue.shift() : "숨";
      if (exiting !== "숨") ages[exitIdx] = CITY_SMOKE_STEPS;
    }

    // decay smoke
    for (let i = 0; i < ages.length; i++) { if (ages[i] > 0) ages[i] -= 1; }
  }

  // try to enqueue a new word for a line if cooldown passed and queue has space
  function maybeEnqueueForLine(line) {
    line.nextSpawnTick -= 1;
    if (line.nextSpawnTick > 0) return;
    line.nextSpawnTick = line.cooldown;

    // keep queue small to prevent clumping
    if (line.injectQueue.length > CITY_MAX_INJECT) return;

    // add a spacer gap before each new word to avoid overlap on the conveyor
    for (let g = 0; g < CITY_MIN_GAP; g++) line.injectQueue.push("숨");

    // push word characters into queue in natural order (direction-agnostic)
    const word = buildCityWord();
    for (let k = 0; k < word.chars.length; k++) {
      line.injectQueue.push({ ch: word.chars[k], base: word.base, kind: "vehicle" });
    }

    // trailing spacer (optional small gap)
    for (let g = 0; g < CITY_MIN_GAP; g++) line.injectQueue.push("숨");
  }

  function resetLineCells(line) {
    const cells = window.getGridCells(); if (!cells || cells.length === 0) return;
    const rows = window.lastRows, cols = window.lastCols, len = line.buffer.length;
    const base = window.baseCellFontPx || 16;
    for (let off = 0; off < len; off++) {
      let r, c;
      if (line.type === "row") { r = line.index; c = off; } else { r = off; c = line.index; }
      const flat = r * cols + c;
      const cell = cells[flat]; if (!cell) continue;
      cell.textContent = "숨";
      cell.style.fontSize = base + "px";
      cell.classList.remove("city-vehicle", "smoke-1", "smoke-2", "smoke-3");
      cell.style.backgroundColor = '';
      cell.style.color = '';
      cell.style.fontFamily = '';
    }
  }

  function renderCityLine(line) {
    const cells = window.getGridCells(); if (!cells || cells.length === 0) return;
    const rows = window.lastRows, cols = window.lastCols, len = line.buffer.length;
    const base = window.baseCellFontPx || 16;

    for (let off = 0; off < len; off++) {
      let r, c;
      if (line.type === "row") { r = line.index; c = off; } else { r = off; c = line.index; }
      const flat = r * cols + c;
      const cell = cells[flat]; if (!cell) continue;

      const token = line.buffer[off];
      const age = line.smokeAges[off] || 0;

      cell.classList.remove("city-vehicle", "smoke-1", "smoke-2", "smoke-3");
      cell.style.fontSize = base + "px";

      if (token === "숨") {
        cell.textContent = "숨";

        // 잔상/스타일 완전 초기화
        cell.classList.remove("city-vehicle");
        cell.style.removeProperty('background');
        cell.style.removeProperty('background-color');
        cell.style.removeProperty('color');
        cell.style.removeProperty('font-family');
        cell.style.removeProperty('font-weight');

        // 스모크 단계 적용(있으면)
        if (age >= 3) cell.classList.add("smoke-3");
        else if (age === 2) cell.classList.add("smoke-2");
        else if (age === 1) cell.classList.add("smoke-1");
      } else {
        // 의성어 렌더 (그대로)
        const isObj = token && typeof token === "object";
        cell.textContent = isObj ? token.ch : token;

        const map = isObj && token.base
          ? (window.VEHICLE_FONT_MAP[token.base] || window.DEFAULT_VEHICLE_FONT)
          : window.DEFAULT_VEHICLE_FONT;

        if (typeof map === 'object') {
          cell.style.fontFamily = map.font;
          cell.style.fontWeight = map.weight ?? '400';
        } else {
          cell.style.fontFamily = map;
          cell.style.fontWeight = '400';
        }
        cell.style.backgroundColor = '#fff';
        cell.style.color = '#000';
        cell.classList.add("city-vehicle");
      }
    }
  }

  // main tick: shift, enqueue, render; no TTL — lines persist
  function tickCityLines() {
    if (window.suspendFXDuringResize) return;
    if (!window.hiddenMode || !window.currentStage || window.currentStage.k !== "CITY") return;

    for (let i = 0; i < cityLines.length; i++) {
      const line = cityLines[i];
      if (!line.alive) continue;
      maybeEnqueueForLine(line);
      advanceCityBuffer(line);
      renderCityLine(line);
    }

    // maintain minimum density (fill empty slots quickly, but never exceed max)
    if (cityLines.length < CITY_MIN_LINES) {
      const rows = window.lastRows, cols = window.lastCols;
      if (rows >= 3 && cols >= 3) {
        const need = Math.min(CITY_MIN_LINES - cityLines.length, 4);
        for (let n = 0; n < need; n++) {
          const useRow = Math.random() < 0.5;
          const idx = useRow ? Math.floor(Math.random() * rows) : Math.floor(Math.random() * cols);
          const dir = (Math.random() < 0.5) ? "forward" : "backward";
          const line = createCityLine(useRow ? "row" : "col", idx, dir, rows, cols);
          cityLines.push(line);
          renderCityLine(line);
        }
      }
    }
  }

  function spawnCityLineMaybe() {
    if (window.suspendFXDuringResize) return;
    if (!window.hiddenMode || !window.currentStage || window.currentStage.k !== "CITY") return;

    if (cityLines.length >= CITY_MAX_LINES) return;

    const rows = window.lastRows, cols = window.lastCols;
    if (rows < 3 || cols < 3) return;

    // probabilistic extra line to keep motion lively
    if (Math.random() < 0.45) {
      const useRow = Math.random() < 0.3;
      const idx = useRow ? Math.floor(Math.random() * rows) : Math.floor(Math.random() * cols);
      const dir = (Math.random() < 0.5) ? "forward" : "backward";
      const line = createCityLine(useRow ? "row" : "col", idx, dir, rows, cols);
      cityLines.push(line);
      renderCityLine(line);
    }
  }

  // timers
  function ensureCityTimers() {
    if (cityInterval) clearInterval(cityInterval);
    cityInterval = setInterval(tickCityLines, CITY_TICK_MS);

    if (citySpawnInterval) clearInterval(citySpawnInterval);
    citySpawnInterval = setInterval(spawnCityLineMaybe, 300);
  }

  function startCitySystem() {
    if (window.suspendFXDuringResize) return;
    if (!cityLines) cityLines = [];
    // seed a baseline if empty
    if (cityLines.length === 0) {
      const rows = window.lastRows, cols = window.lastCols;
      if (rows >= 3 && cols >= 3) {
        const seed = Math.min(CITY_MIN_LINES, rows + cols);
        for (let n = 0; n < seed; n++) {
          const useRow = Math.random() < 0.5;
          const idx = useRow ? Math.floor(Math.random() * rows) : Math.floor(Math.random() * cols);
          const dir = (Math.random() < 0.5) ? "forward" : "backward";
          const line = createCityLine(useRow ? "row" : "col", idx, dir, rows, cols);
          cityLines.push(line);
          renderCityLine(line);
        }
      }
    }
    ensureCityTimers();
  }

  function pauseCitySystem() {
    if (cityInterval) { clearInterval(cityInterval); cityInterval = null; }
    if (citySpawnInterval) { clearInterval(citySpawnInterval); citySpawnInterval = null; }
  }

  function stopCitySystem() {
    if (cityInterval) { clearInterval(cityInterval); cityInterval = null; }
    if (citySpawnInterval) { clearInterval(citySpawnInterval); citySpawnInterval = null; }
    // clear DOM
    for (let i = 0; i < cityLines.length; i++) resetLineCells(cityLines[i]);
    cityLines = [];
  }

  window.stopCitySystem = stopCitySystem;
  window.pauseCitySystem = pauseCitySystem;
  window.startCitySystem = startCitySystem;
  window.ensureCityTimers = ensureCityTimers;

  window.syncCityFX = function () {
    const active = window.hiddenMode && window.currentStage && window.currentStage.k === 'CITY';
    if (active) {
      startCitySystem();
      cityAudio.volume = 0.5;
      if (cityAudio.paused) { cityAudio.currentTime = 0; cityAudio.play().catch(() => { }); }
    } else {
      stopCitySystem();
      if (!cityAudio.paused) cityAudio.pause();
    }
  };

  // === merged from fx.js: custom cursor ===
  const cursorEl = document.getElementById("custom-cursor");
  // reuse existing toggleBtn var from above
  if (cursorEl) {
    document.addEventListener("mousemove", (e) => { cursorEl.style.left = e.clientX + "px"; cursorEl.style.top = e.clientY + "px"; });
  }
  if (toggleBtn && cursorEl) {
    toggleBtn.addEventListener("mouseenter", () => { cursorEl.classList.add("active"); });
    toggleBtn.addEventListener("mouseleave", () => { cursorEl.classList.remove("active"); });
  }

  // visuals-only pause/resume hooks used by resize handler
  window._pauseVisualsKeepAudio = function () {
    stopAllWaves();
    pauseTownSystem();
    pauseCitySystem();
  };
  window._resumeVisualsKeepAudio = function () {
    // simply resync according to current stage; audio was untouched
    window.syncAllFX();
  };

  update();
});
// ---- Modal + Idle Open ----
window.addEventListener('DOMContentLoaded', () => {
  const fab = document.getElementById('helpFab');
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');
  const toggleBtn = document.querySelector('.toggle-btn'); // 토글 참조 추가

  if (!fab || !overlay || !closeBtn) return;

  const IDLE_MS = 30000; // 30초 대기
  let idleTimer = null;
  let modalOpen = false;

  function openModal() {

    if (modalOpen) return;
    overlay.removeAttribute('hidden');
    modalOpen = true;
    document.body.style.cursor = 'auto';
    clearTimeout(idleTimer);

    // 모달이 열리면 토글 OFF
    if (toggleBtn && toggleBtn.classList.contains('active')) {
      toggleBtn.classList.remove('active');
      window.hiddenMode = false;
      if (window.updateToggleLabels) window.updateToggleLabels();
      if (typeof window.stopTownSystem === 'function') window.stopTownSystem();
      if (typeof window.stopCitySystem === 'function') window.stopCitySystem();
      // also halt human/group explicitly
      if (typeof window.stopHumanFX === 'function') window.stopHumanFX();
      if (typeof window.stopGroupFX === 'function') window.stopGroupFX();
      if (typeof window.stopAllWaves === 'function') window.stopAllWaves();

      // 🔹 토글 OFF일 때 전체 숨 상태로 초기화
      if (!window.hiddenMode) {
        const cells = document.querySelectorAll('.grid-cell');
        cells.forEach(cell => {
          cell.textContent = '숨';
          cell.className = 'grid-cell';
          cell.style.removeProperty('background');
          cell.style.removeProperty('background-color');
          cell.style.removeProperty('color');
          cell.style.removeProperty('font-family');
          cell.style.removeProperty('font-weight');
        });
      }
    }
    // Also stop any playing audio explicitly
    if (typeof window.pauseAllAudio === 'function') window.pauseAllAudio();
  }

  function closeModal() {
    if (!modalOpen) return;
    overlay.setAttribute('hidden', '');
    modalOpen = false;
    resetIdle();
  }

  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!modalOpen) openModal();
    }, IDLE_MS);
  }

  // 이벤트 등록
  fab.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === '/') {
      e.preventDefault();
      openModal();
    }
    if (e.key === 'Escape') closeModal();
  });

  const idleEvents = ['mousemove', 'keydown', 'pointerdown', 'wheel', 'touchstart', 'scroll'];
  idleEvents.forEach(evt =>
    window.addEventListener(evt, () => {
      if (!modalOpen) resetIdle();
    }, { passive: true })
  );

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !modalOpen) resetIdle();
  });

  // Open modal immediately on first load (and after reload)
  openModal();

  resetIdle();
});
/**
 * 타이포 이끼 — React 페이지
 * 1920×1080 Canvas를 렌더링하고 TypoMossRenderer를 관리
 */

import React, { useEffect, useRef, useState } from 'react';
import { TypoMossRenderer } from './renderer';
import { loadVectorElements } from './vectorLoader';
import { ELEMENT_CONFIGS, DEFAULT_PRESETS } from './config';
import { ElementConfig } from './types';
import './TypoMoss.css';

const STORAGE_KEY = 'typomoss-settings';
const PRESETS_KEY = 'typomoss-presets';

interface Preset {
  name: string;
  elementConfigs: Record<string, ElementConfig>;
  maxInstances: number;
  minElementSize: number;
  spawnSpeed: number;
  autoResetEnabled: boolean;
  autoResetInterval: number;
}

// 화면 크기 프리셋
const CANVAS_SIZE_PRESETS = [
  { label: '1920 × 1080 (가로)', width: 1920, height: 1080 },
  { label: '1080 × 1080 (정사각형)', width: 1080, height: 1080 },
  { label: '1080 × 1350 (세로)', width: 1080, height: 1350 },
  { label: '1080 × 1920 (세로)', width: 1080, height: 1920 },
];

const TypoMoss: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TypoMossRenderer | null>(null);
  const [stats, setStats] = useState({ frameCount: 0, instanceCount: 0, maxInstances: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });
  const [selectedSizePreset, setSelectedSizePreset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // 프리셋 상태
  const [presets, setPresets] = useState<Preset[]>([]);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [editingPresetIndex, setEditingPresetIndex] = useState<number | null>(null);
  const [isRenamingOnly, setIsRenamingOnly] = useState(false);
  
  // localStorage에서 설정 불러오기
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // localStorage의 설정과 config.ts의 설정을 병합
        // config.ts에 있는 항목은 config.ts 우선, 없는 항목만 localStorage 사용
        const mergedConfigs: Record<string, ElementConfig> = {};
        
        // 1단계: config.ts의 설정을 먼저 복사 (최우선)
        Object.entries(ELEMENT_CONFIGS).forEach(([id, config]) => {
          mergedConfigs[id] = { ...config };
        });
        
        // 2단계: localStorage에만 있는 설정 추가
        if (parsed.elementConfigs) {
          Object.entries(parsed.elementConfigs).forEach(([id, config]) => {
            if (!ELEMENT_CONFIGS[id]) {
              mergedConfigs[id] = config as ElementConfig;
            }
          });
        }
        
        return {
          elementConfigs: mergedConfigs,
          maxInstances: parsed.maxInstances ?? 80,
          minElementSize: parsed.minElementSize ?? 40,
        };
      }
    } catch (e) {
      console.error('[TypoMoss] 설정 불러오기 실패:', e);
    }
    return {
      elementConfigs: ELEMENT_CONFIGS,
      maxInstances: 80,
      minElementSize: 40,
    };
  };

  const savedSettings = loadSettings();
  const [elementConfigs, setElementConfigs] = useState<Record<string, ElementConfig>>(savedSettings.elementConfigs);
  const [expandedElement, setExpandedElement] = useState<string | null>(null);
  const [maxInstances, setMaxInstances] = useState(savedSettings.maxInstances);
  const [minElementSize, setMinElementSize] = useState(savedSettings.minElementSize);
  const [spawnSpeed, setSpawnSpeed] = useState(2.0); // 생성 속도 배율
  const [presetLoaded, setPresetLoaded] = useState(false); // 프리셋 로딩 완료 플래그
  
  // 시드 상태
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 1000000));
  const [seedInput, setSeedInput] = useState<string>('');
  const [seedHistory, setSeedHistory] = useState<number[]>([]);
  
  // 녹화 상태
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentSeedRef = useRef<number>(seed);
  
  // 자동 리셋 상태
  const [autoResetEnabled, setAutoResetEnabled] = useState(false);
  const [autoResetInterval, setAutoResetInterval] = useState(60); // 초 단위
  const [autoResetStopsRecording, setAutoResetStopsRecording] = useState(true); // 자동 리셋 시 녹화 중지
  const autoResetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoResetStartTimeRef = useRef<number>(0);
  const recordingAutoStopRef = useRef<NodeJS.Timeout | null>(null);

  // 최초 로딩 시 도움말 표시 (로딩보다 먼저)
  useEffect(() => {
    const hasSeenHelp = localStorage.getItem('typomoss-help-seen');
    if (!hasSeenHelp) {
      setShowHelp(true);
      // localStorage는 도움말 닫을 때 설정하도록 변경
    }
  }, []);

  // 모바일 감지 및 화면 크기 설정
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      if (mobile) {
        // 모바일: 화면에 맞춤
        const width = window.innerWidth;
        const height = window.innerHeight;
        setCanvasSize({ width, height });
      } else {
        // 데스크톱: 선택된 프리셋 사용
        const preset = CANVAS_SIZE_PRESETS[selectedSizePreset];
        setCanvasSize({ width: preset.width, height: preset.height });
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [selectedSizePreset]);

  // 프리셋 로드
  useEffect(() => {
    try {
      const savedPresets = localStorage.getItem(PRESETS_KEY);
      let presetsToLoad: Preset[];
      
      if (savedPresets) {
        presetsToLoad = JSON.parse(savedPresets);
      } else {
        // localStorage에 없으면 기본 프리셋 사용
        presetsToLoad = DEFAULT_PRESETS;
        localStorage.setItem(PRESETS_KEY, JSON.stringify(DEFAULT_PRESETS));
      }
      
      setPresets(presetsToLoad);
      
      // 두 번째 프리셋('컬러')을 자동으로 적용
      if (presetsToLoad.length > 1) {
        const colorPreset = presetsToLoad[1];
        
        console.log('[TypoMoss] 프리셋 로딩:', colorPreset.name);
        console.log('[TypoMoss] 프리셋 elementConfigs:', Object.keys(colorPreset.elementConfigs).length);
        
        // 프리셋의 elementConfigs를 그대로 적용
        setElementConfigs(colorPreset.elementConfigs);
        setMaxInstances(colorPreset.maxInstances);
        setMinElementSize(colorPreset.minElementSize);
        setSpawnSpeed(colorPreset.spawnSpeed ?? 1.0);
        setAutoResetEnabled(colorPreset.autoResetEnabled ?? false);
        setAutoResetInterval(colorPreset.autoResetInterval ?? 60);
        
        // 프리셋 로딩 완료 표시
        setPresetLoaded(true);
      }
    } catch (e) {
      console.error('[TypoMoss] 프리셋 불러오기 실패:', e);
      // 오류 시 기본 프리셋 사용
      setPresets(DEFAULT_PRESETS);
      
      // 첫 번째 기본 프리셋 적용
      if (DEFAULT_PRESETS.length > 0) {
        const firstPreset = DEFAULT_PRESETS[0];
        
        // 프리셋의 elementConfigs를 그대로 적용
        setElementConfigs(firstPreset.elementConfigs);
        setMaxInstances(firstPreset.maxInstances);
        setMinElementSize(firstPreset.minElementSize);
        setSpawnSpeed(firstPreset.spawnSpeed ?? 1.0);
        setAutoResetEnabled(firstPreset.autoResetEnabled ?? false);
        setAutoResetInterval(firstPreset.autoResetInterval ?? 60);
        
        // 프리셋 로딩 완료 표시
        setPresetLoaded(true);
      }
    }
  }, []);
  
  // 자동 리셋 타이머
  // 자동 리셋 타이머 (녹화 중이 아닐 때만)
  useEffect(() => {
    // 녹화 중일 때는 자동 리셋 타이머를 설정하지 않음
    if (isRecording) {
      if (autoResetTimerRef.current) {
        clearInterval(autoResetTimerRef.current);
        autoResetTimerRef.current = null;
      }
      return;
    }

    if (autoResetEnabled && autoResetInterval > 0) {
      console.log(`[TypoMoss] 자동 리셋 타이머 시작: ${autoResetInterval}초 간격`);
      autoResetStartTimeRef.current = Date.now();
      
      autoResetTimerRef.current = setInterval(() => {
        const elapsed = ((Date.now() - autoResetStartTimeRef.current) / 1000).toFixed(1);
        console.log(`[TypoMoss] 자동 리셋 실행 (시작 후 ${elapsed}초 경과, 설정값: ${autoResetInterval}초)`);
        
        // 새 시드 생성 및 리셋
        const newSeed = Math.floor(Math.random() * 1000000);
        
        // 이전 시드를 히스토리에 추가 (최대 20개)
        setSeedHistory(prev => {
          const updated = [currentSeedRef.current, ...prev];
          return updated.slice(0, 20);
        });
        
        setSeed(newSeed);
        currentSeedRef.current = newSeed;
        
        if (rendererRef.current) {
          rendererRef.current.updateConfig({ seed: newSeed });
          rendererRef.current.reset();
          // enable spawning after applying seed
          if ((rendererRef.current as any).enableSpawning) {
            (rendererRef.current as any).enableSpawning();
          }
        }
        
        autoResetStartTimeRef.current = Date.now();
      }, autoResetInterval * 1000);
      
      return () => {
        if (autoResetTimerRef.current) {
          clearInterval(autoResetTimerRef.current);
          autoResetTimerRef.current = null;
        }
      };
    } else {
      if (autoResetTimerRef.current) {
        clearInterval(autoResetTimerRef.current);
        autoResetTimerRef.current = null;
      }
    }
  }, [autoResetEnabled, autoResetInterval, isRecording]);

  // Notify renderer about auto-reset interval so spawn ramp can align and reach
  // maximum ~2 seconds before reset. If auto-reset is disabled, clear the setting.
  useEffect(() => {
    if (rendererRef.current) {
      const resetVal = autoResetEnabled ? autoResetInterval : undefined;
      rendererRef.current.updateConfig({ resetIntervalSeconds: resetVal as any });
    }
  }, [autoResetEnabled, autoResetInterval, presetLoaded]);

  useEffect(() => {
    const initializeRenderer = async () => {
      // 프리셋이 로딩되지 않았으면 대기
      if (!presetLoaded) {
        console.log('[TypoMoss] 프리셋 로딩 대기 중...');
        return;
      }
      
      if (!canvasRef.current) {
        console.error('[TypoMoss] Canvas ref 없음');
        return;
      }

      try {
        // 벡터 요소 로드
        console.log('[TypoMoss] 벡터 요소 로드 시작');
        setIsLoading(true);
        const elements = await loadVectorElements();
        console.log('[TypoMoss] 벡터 요소 로드 완료:', elements.length);

        // 렌더러 생성 (저장된 설정 적용)
        console.log('[TypoMoss] 렌더러 생성');
        const renderer = new TypoMossRenderer(canvasRef.current, {
          maxInstances: maxInstances,
          spawnSpeed: spawnSpeed,
          canvasWidth: canvasSize.width,
          canvasHeight: canvasSize.height,
          seed: seed,
        });
        
        // 먼저 요소 설정 (기본 설정 로드)
        renderer.setElements(elements);
        
        // 그 다음 저장된 프리셋 설정으로 덮어쓰기
        Object.entries(elementConfigs).forEach(([elementId, config]) => {
          // 모바일에서는 크기를 0.6배로 조정
          // Ensure randomModeConfig values are numeric 0..1 (coerce strings/percentages)
          const sanitizeRandomConfig = (rc: any) => {
            if (!rc) return rc;
            const out: Record<string, number> = {};
            (['layered','rotate','pulse','flicker','grow'] as const).forEach((k) => {
              const raw = rc[k as string];
              if (raw === undefined || raw === null) return;
              let n = typeof raw === 'number' ? raw : Number(String(raw).replace('%',''));
              if (!isFinite(n)) return;
              if (String(raw).trim().endsWith('%')) n = n / 100;
              if (n > 1) n = n / 100;
              out[k] = Math.max(0, Math.min(1, n));
            });
            return out;
          };

          const sanitizedRandom = sanitizeRandomConfig((config as any).randomModeConfig);
          const adjustedConfig = isMobile
            ? { ...config, size: Math.round(config.size * 0.6), randomModeConfig: sanitizedRandom }
            : { ...config, randomModeConfig: sanitizedRandom };
          renderer.updateElementConfig(elementId, adjustedConfig);
        });
        
        // title 순서 재계산
        renderer.recalculateTitleOrder();
        
        renderer.start();
        console.log('[TypoMoss] 렌더러 시작');

        rendererRef.current = renderer;

        // Auto-enable spawning so canvas shows content immediately for users
        try {
          if ((renderer as any).enableSpawning) {
            (renderer as any).enableSpawning();
          }
        } catch (e) {
          console.warn('[TypoMoss] enableSpawning 호출 실패:', e);
        }
        
        // 로딩 완료
        setIsLoading(false);

        // 통계 업데이트 (1초마다)
        const statsInterval = setInterval(() => {
          if (rendererRef.current) {
            setStats(rendererRef.current.getStats());
          }
        }, 1000);

        return () => {
          clearInterval(statsInterval);
          if (rendererRef.current) {
            rendererRef.current.stop();
          }
        };
      } catch (err) {
        console.error('[TypoMoss] 초기화 에러:', err);
        setIsLoading(false); // 에러 시에도 로딩 해제
      }
    };

    initializeRenderer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spawnSpeed, presetLoaded, canvasSize, isMobile]);

  // 설정을 localStorage에 저장
  const saveSettings = (configs: Record<string, ElementConfig>, maxInst: number, minSize: number) => {
    try {
      const toSave = {
        elementConfigs: configs,
        maxInstances: maxInst,
        minElementSize: minSize,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error('[TypoMoss] 설정 저장 실패:', e);
    }
  };

  const handleUpdateMaxInstances = (maxInst: number) => {
    setMaxInstances(maxInst);
    if (rendererRef.current) {
      rendererRef.current.updateConfig({ maxInstances: maxInst });
    }
    saveSettings(elementConfigs, maxInst, minElementSize);
  };

  const handleUpdateSpawnSpeed = (speed: number) => {
    setSpawnSpeed(speed);
    if (rendererRef.current) {
      rendererRef.current.updateConfig({ spawnSpeed: speed });
    }
  };

  const handleUpdateMinElementSize = (size: number) => {
    setMinElementSize(size);
    // minSize는 더 이상 사용하지 않음
    saveSettings(elementConfigs, maxInstances, size);
  };

  const handleUpdateElementConfig = (elementId: string, key: string, value: any) => {
    const updated = { ...elementConfigs };
    if (updated[elementId]) {
      (updated[elementId] as any)[key] = value;
      setElementConfigs(updated);
      if (rendererRef.current) {
        rendererRef.current.updateElementConfig(elementId, updated[elementId]);
      }
      saveSettings(updated, maxInstances, minElementSize);
    }
  };

  // 프리셋 저장
  const savePreset = () => {
    if (!presetNameInput.trim()) {
      alert('프리셋 이름을 입력해주세요.');
      return;
    }
    
    if (editingPresetIndex === null && presets.length >= 3) {
      alert('최대 3개의 프리셋만 저장할 수 있습니다.');
      return;
    }

    let updatedPresets: Preset[];
    
    if (editingPresetIndex !== null) {
      updatedPresets = [...presets];
      
      if (isRenamingOnly) {
        // 이름만 변경
        updatedPresets[editingPresetIndex] = {
          ...updatedPresets[editingPresetIndex],
          name: presetNameInput,
        };
        alert(`프리셋 이름이 "${presetNameInput}"(으)로 변경되었습니다.`);
      } else {
        // 설정 덮어쓰기
        const newPreset: Preset = {
          name: presetNameInput,
          elementConfigs: { ...elementConfigs },
          maxInstances,
          minElementSize,
          spawnSpeed,
          autoResetEnabled,
          autoResetInterval,
        };
        updatedPresets[editingPresetIndex] = newPreset;
        alert(`프리셋 "${presetNameInput}"이(가) 업데이트되었습니다.`);
      }
    } else {
      // 새로 추가
      const newPreset: Preset = {
        name: presetNameInput,
        elementConfigs: { ...elementConfigs },
        maxInstances,
        minElementSize,
        spawnSpeed,
        autoResetEnabled,
        autoResetInterval,
      };
      updatedPresets = [...presets, newPreset];
      alert(`프리셋 "${presetNameInput}"이(가) 저장되었습니다.`);
    }
    
    setPresets(updatedPresets);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(updatedPresets));
    
    setPresetNameInput('');
    setEditingPresetIndex(null);
    setIsRenamingOnly(false);
    setShowPresetModal(false);
  };

  // 프리셋 이름만 변경
  const renamePreset = (index: number) => {
    setEditingPresetIndex(index);
    setPresetNameInput(presets[index].name);
    setIsRenamingOnly(true);
    setShowPresetModal(true);
  };

  // 프리셋 설정 덮어쓰기
  const overwritePreset = (index: number) => {
    setEditingPresetIndex(index);
    setPresetNameInput(presets[index].name);
    setIsRenamingOnly(false);
    setShowPresetModal(true);
  };

  // 프리셋 로드
  const loadPreset = (preset: Preset) => {
    // 현재 elementConfigs와 병합 (새로 추가된 요소는 기본값 유지)
    const mergedConfigs: Record<string, ElementConfig> = { ...elementConfigs };
    
    // 프리셋의 설정으로 덮어쓰기 (존재하는 것만)
    Object.entries(preset.elementConfigs).forEach(([id, config]) => {
      if (mergedConfigs[id]) {
        mergedConfigs[id] = config;
      }
    });
    
    setElementConfigs(mergedConfigs);
    setMaxInstances(preset.maxInstances);
    setMinElementSize(preset.minElementSize);
    setSpawnSpeed(preset.spawnSpeed ?? 1.0);
    setAutoResetEnabled(preset.autoResetEnabled ?? false);
    setAutoResetInterval(preset.autoResetInterval ?? 60);

    if (rendererRef.current) {
      rendererRef.current.updateConfig({ 
        maxInstances: preset.maxInstances,
        spawnSpeed: preset.spawnSpeed ?? 1.0
      });
      
      Object.entries(mergedConfigs).forEach(([elementId, config]) => {
        rendererRef.current!.updateElementConfig(elementId, config);
      });
    }

    saveSettings(mergedConfigs, preset.maxInstances, preset.minElementSize);
    alert(`프리셋 "${preset.name}"을(를) 불러왔습니다.`);
  };

  // 프리셋 삭제
  const deletePreset = (index: number) => {
    const presetName = presets[index].name;
    if (window.confirm(`프리셋 "${presetName}"을(를) 삭제하시겠습니까?`)) {
      const updatedPresets = presets.filter((_, i) => i !== index);
      setPresets(updatedPresets);
      localStorage.setItem(PRESETS_KEY, JSON.stringify(updatedPresets));
    }
  };

  // 녹화 시작/중지
  const toggleRecording = () => {
    if (!canvasRef.current) return;

    if (isRecording) {
      // 녹화 중지
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      // 녹화 자동 중지 타이머 정리
      if (recordingAutoStopRef.current) {
        clearTimeout(recordingAutoStopRef.current);
        recordingAutoStopRef.current = null;
      }
    } else {
      // 녹화 시작: 먼저 입력된 시드가 있으면 그 시드를 적용하고,
      // 없으면 새 시드를 생성(리셋)합니다. 이후 자동 리셋 타이머를 초기화합니다.
      const seedTxt = (seedInput || '').toString().trim();
      if (seedTxt !== '') {
        const parsed = parseInt(seedTxt, 10);
        const newSeed = Number.isNaN(parsed) ? Math.floor(Math.random() * 1000000) : parsed;

        // 이전 시드 히스토리에 추가
        setSeedHistory(prev => {
          const updated = [currentSeedRef.current, ...prev];
          return updated.slice(0, 20);
        });

        setSeed(newSeed);
        currentSeedRef.current = newSeed;
        setSeedInput('');
        if (rendererRef.current) {
          rendererRef.current.updateConfig({ seed: newSeed });
          rendererRef.current.reset();
        }
      } else {
        // 입력된 시드가 없으면 기존 리셋 동작 수행
        handleReset();
      }

      // 자동 리셋 카운트 초기화
      autoResetStartTimeRef.current = Date.now();

      // 자동 리셋이 활성화된 경우 타이머 설정 (한 번만 실행)
      if (autoResetEnabled && autoResetInterval > 0) {
          // 기존 타이머 정리 (녹화용 타이머)
          if (recordingAutoStopRef.current) {
            clearTimeout(recordingAutoStopRef.current);
            recordingAutoStopRef.current = null;
          }

          // 자동 리셋 간격 후 녹화 자동 중지 (녹화용 타이머)
          recordingAutoStopRef.current = setTimeout(() => {
            console.log(`[TypoMoss] 녹화 자동 중지 타이머 실행`);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.stop();
            }
            if (recordingIntervalRef.current) {
              clearInterval(recordingIntervalRef.current);
              recordingIntervalRef.current = null;
            }

            // 자동 리셋 동작: 녹화가 자동 중지된 후 새 시드를 생성하여 적용
            try {
              const newSeed = Math.floor(Math.random() * 1000000);
              setSeedHistory(prev => {
                const updated = [currentSeedRef.current, ...prev];
                return updated.slice(0, 20);
              });
              setSeed(newSeed);
              currentSeedRef.current = newSeed;
              if (rendererRef.current) {
                rendererRef.current.updateConfig({ seed: newSeed });
                rendererRef.current.reset();
              }
            } catch (e) {
              console.error('[TypoMoss] 자동 리셋 적용 중 오류:', e);
            }

            recordingAutoStopRef.current = null;
          }, autoResetInterval * 1000);
      }
      
      // 녹화 시작
      recordedChunksRef.current = [];
      setRecordingTime(0);

      // captureStream() without FPS argument - captures at actual canvas update rate
      // This prevents frame drops from being recorded
      const stream = canvasRef.current.captureStream();
      
      // MP4 지원 확인 (Safari/iOS는 MP4 지원)
      let mimeType = 'video/webm;codecs=vp9';
      let fileExtension = 'webm';
      
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
        fileExtension = 'mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
        mimeType = 'video/webm;codecs=h264';
      }

      // Capture the seed used for this recording so filename remains stable
      const recordingSeed = currentSeedRef.current;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: 5000000 // 5 Mbps (reduced from 8 for better performance)
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // 파일명 생성: TypographyMoss_시드값 (녹화 시작 시점의 시드 사용)
        a.download = `TypographyMoss_${recordingSeed}.${fileExtension}`;
        a.click();
        URL.revokeObjectURL(url);
        setIsRecording(false);
        setRecordingTime(0);
        
        // 녹화용 타이머 정리
        if (recordingAutoStopRef.current) {
          clearTimeout(recordingAutoStopRef.current);
          recordingAutoStopRef.current = null;
        }
        // 기존 autoResetTimerRef도 정리(안전상)
        if (autoResetTimerRef.current) {
          clearTimeout(autoResetTimerRef.current as any);
          autoResetTimerRef.current = null;
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // 녹화 시간 카운터
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const handleReset = () => {
    // 새로운 시드 생성
    const newSeed = Math.floor(Math.random() * 1000000);
    
    // 이전 시드를 히스토리에 추가 (최대 20개)
    setSeedHistory(prev => {
      const updated = [seed, ...prev];
      return updated.slice(0, 20);
    });
    
    setSeed(newSeed);
    currentSeedRef.current = newSeed;
    
    // 렌더러에 새 시드 적용 및 리셋
    if (rendererRef.current) {
      rendererRef.current.updateConfig({ seed: newSeed });
      rendererRef.current.reset();
      if ((rendererRef.current as any).enableSpawning) {
        (rendererRef.current as any).enableSpawning();
      }
    }
  };

  const handleSeedChange = () => {
    const newSeed = parseInt(seedInput) || Math.floor(Math.random() * 1000000);
    
    // 이전 시드를 히스토리에 추가 (최대 20개)
    setSeedHistory(prev => {
      const updated = [seed, ...prev];
      return updated.slice(0, 20);
    });
    
    setSeed(newSeed);
    currentSeedRef.current = newSeed;
    setSeedInput('');
    
    if (rendererRef.current) {
      rendererRef.current.updateConfig({ seed: newSeed });
      rendererRef.current.reset();
    }
  };

  const loadSeedFromHistory = (historySeed: number) => {
    // 현재 시드를 히스토리에 추가
    setSeedHistory(prev => {
      const updated = [seed, ...prev];
      return updated.slice(0, 20);
    });
    
    setSeed(historySeed);
    currentSeedRef.current = historySeed;
    
    if (rendererRef.current) {
      rendererRef.current.updateConfig({ seed: historySeed });
      rendererRef.current.reset();
      if ((rendererRef.current as any).enableSpawning) {
        (rendererRef.current as any).enableSpawning();
      }
    }
  };

  return (
    <div className="typo-moss-page">
      <div className="typo-moss-container">
        <canvas
          ref={canvasRef}
          className="typo-moss-canvas"
          width={canvasSize.width}
          height={canvasSize.height}
        />

        {/* 설정 모달 */}
        {showSettings && (
          <div className="typo-moss-modal-overlay">
            <div className="typo-moss-modal">
              <div className="typo-moss-modal-header">
                <h2>타이포 이끼 — 설정</h2>
                <button 
                  className="typo-moss-modal-close"
                  onClick={() => setShowSettings(false)}
                >
                  ✕
                </button>
              </div>

              <div className="typo-moss-modal-content">
                <div className="control-group">
                  <label htmlFor="max-instances-slider">최대 인스턴스:</label>
                  <input
                    id="max-instances-slider"
                    type="range"
                    min="20"
                    max="400"
                    step="10"
                    value={maxInstances}
                    onChange={(e) => handleUpdateMaxInstances(parseInt(e.target.value))}
                  />
                  <span>{maxInstances}</span>
                </div>
                
                <div className="control-group">
                  <label htmlFor="spawn-speed-slider">생성 속도:</label>
                  <input
                    id="spawn-speed-slider"
                    type="range"
                    min="0.5"
                    max="10.0"
                    step="0.1"
                    value={spawnSpeed}
                    onChange={(e) => handleUpdateSpawnSpeed(parseFloat(e.target.value))}
                  />
                  <span>{spawnSpeed.toFixed(1)}x</span>
                </div>
                
                {/* 화면 크기 설정 (데스크톱만) */}
                {!isMobile && (
                  <div className="control-group">
                    <label htmlFor="canvas-size-select">캔버스 크기:</label>
                    <select
                      id="canvas-size-select"
                      value={selectedSizePreset}
                      onChange={(e) => setSelectedSizePreset(parseInt(e.target.value))}
                      style={{ width: '200px', marginLeft: '10px', padding: '5px' }}
                    >
                      {CANVAS_SIZE_PRESETS.map((preset, index) => (
                        <option key={index} value={index}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="control-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={autoResetEnabled}
                      onChange={(e) => setAutoResetEnabled(e.target.checked)}
                    />
                    {' '}자동 리셋
                  </label>
                </div>
                
                {autoResetEnabled && (
                  <>
                    <div className="control-group">
                      <label htmlFor="auto-reset-interval">리셋 주기 (초):</label>
                      <input
                        id="auto-reset-interval"
                        type="number"
                        min="5"
                        max="3600"
                        step="5"
                        value={autoResetInterval}
                        onChange={(e) => setAutoResetInterval(parseInt(e.target.value) || 60)}
                        style={{ width: '80px', marginLeft: '10px' }}
                      />
                    </div>
                  </>
                )}

                <div className="control-group" style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '20px' }}>
                  <label htmlFor="seed-input">시드 값 (현재: {seed}):</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <input
                      id="seed-input"
                      type="number"
                      placeholder="시드 입력"
                      value={seedInput}
                      onChange={(e) => setSeedInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSeedChange()}
                      style={{ flex: 1 }}
                    />
                    <button onClick={handleSeedChange} style={{ minWidth: '60px' }}>
                      적용
                    </button>
                  </div>
                  <small style={{ color: '#888', marginTop: '4px', display: 'block' }}>
                    시드를 입력하면 동일한 패턴으로 재생됩니다
                  </small>
                </div>

                {/* 녹화 설정 (데스크톱에서만 모달 안에 표시) */}
                {!isMobile && (
                  <div className="control-group" style={{ marginTop: '12px', borderTop: '1px dashed #333', paddingTop: '12px' }}>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>녹화 설정</label>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button onClick={toggleRecording} style={{ minWidth: '120px', padding: '8px 12px' }}>
                          {isRecording ? '■ 녹화 중지' : '● 녹화 시작'}
                        </button>

                        <div style={{ color: '#aaa', fontSize: '13px', lineHeight: '1.4', maxWidth: '420px' }}>
                          <div>녹화 길이: <strong style={{ color: '#9be098' }}>{autoResetInterval}초</strong> (자동 리셋 기준)</div>
                          {isRecording && (
                            <div style={{ marginTop: '4px' }}>경과: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</div>
                          )}
                        </div>
                      </div>

                      <div style={{ color: '#bbb', fontSize: '13px' }}>
                        시드를 적용한 후 바로 녹화 버튼을 눌러 해당 시드를 지정 시간만큼 녹화하세요. (모달을 닫아도 아래의 시드 패널로 시드 확인·적용·리셋이 가능합니다)
                      </div>
                    </div>
                  </div>
                )}

                {/* 시드 히스토리 */}
                {seedHistory.length > 0 && (
                  <div className="control-group" style={{ marginTop: '15px' }}>
                    <label>시드 히스토리 (최대 20개):</label>
                    <div style={{
                      maxHeight: '150px',
                      overflowY: 'auto',
                      marginTop: '8px',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      padding: '8px',
                      boxSizing: 'border-box',
                      paddingRight: '12px'
                    }}>
                      {seedHistory.map((historySeed, index) => (
                        <div
                          key={`${historySeed}-${index}`}
                          style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            padding: '6px 8px',
                            marginBottom: '6px',
                            backgroundColor: '#1a1a1a',
                            borderRadius: '3px',
                            fontSize: '13px'
                          }}
                        >
                          <span style={{ color: '#888', minWidth: '30px', textAlign: 'right' }}>#{index + 1}</span>
                          <span style={{ flex: '1 1 auto', marginLeft: '8px', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {historySeed}
                          </span>
                          <button
                            onClick={() => loadSeedFromHistory(historySeed)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              flex: '0 0 auto',
                              minWidth: '56px'
                            }}
                          >
                            불러오기
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="modal-button-group">
                  <button onClick={handleReset}>리셋</button>
                  <button onClick={() => {
                    setEditingPresetIndex(null);
                    setPresetNameInput('');
                    setShowPresetModal(true);
                  }}>
                    프리셋 저장
                  </button>
                </div>

                {/* 프리셋 목록 */}
                {presets.length > 0 && (
                  <div className="presets-section">
                    <h3>저장된 프리셋</h3>
                    {presets.map((preset, index) => (
                      <div key={`${preset.name}-${index}`} className="preset-item">
                        <button 
                          className="preset-load-btn"
                          onClick={() => loadPreset(preset)}
                        >
                          {preset.name}
                        </button>
                        <button 
                          className="preset-rename-btn"
                          onClick={() => renamePreset(index)}
                          title="이름 변경"
                        >
                          ✏️
                        </button>
                        <button 
                          className="preset-overwrite-btn"
                          onClick={() => overwritePreset(index)}
                          title="설정 덮어쓰기"
                        >
                          💾
                        </button>
                        <button 
                          className="preset-delete-btn"
                          onClick={() => deletePreset(index)}
                          title="삭제"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="stats-section">
                  <h3>통계</h3>
                  <p>프레임: {stats.frameCount}</p>
                  <p>활성 요소: {stats.instanceCount} / {stats.maxInstances}</p>
                </div>

                {/* 요소별 설정 */}
                <div className="element-controls">
                  <h3>요소별 설정</h3>
                  <div className="element-controls-scroll">
                    {Object.entries(elementConfigs).map(([elementId, config]) => (
                      <div key={elementId} className="element-control-item">
                        <button 
                          className="element-toggle"
                          onClick={() => setExpandedElement(expandedElement === elementId ? null : elementId)}
                        >
                          <div className="element-toggle-content">
                            <img 
                              src={`/portfolios/typomoss/${config.elementId.replace('svg-', '')}.svg`}
                              alt={config.elementId}
                              className="element-thumbnail"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <span className="element-toggle-arrow">{expandedElement === elementId ? '▼' : '▶'}</span>
                            <span className="element-toggle-name">{config.elementId}</span>
                          </div>
                        </button>
                        
                        {expandedElement === elementId && (
                          <div className="element-control-panel">
                            <div className="control-row">
                              <label>빈도:</label>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={config.frequency}
                                onChange={(e) => handleUpdateElementConfig(elementId, 'frequency', parseFloat(e.target.value))}
                              />
                              <span>{config.frequency.toFixed(2)}</span>
                            </div>

                            <div className="control-row">
                              <label>크기:</label>
                              <input
                                type="range"
                                min="20"
                                max="300"
                                step="5"
                                value={config.size}
                                onChange={(e) => handleUpdateElementConfig(elementId, 'size', parseInt(e.target.value))}
                              />
                              <span>{config.size}</span>
                            </div>

                            <div className="control-row">
                              <label>색상:</label>
                              <input
                                type="color"
                                value={(config as any).color || '#1AB551'}
                                onChange={(e) => handleUpdateElementConfig(elementId, 'color', e.target.value)}
                                style={{ width: '48px', height: '28px', padding: 0, border: 'none' }}
                              />
                              <span style={{ marginLeft: '8px' }}>{((config as any).color || '#1AB551').toUpperCase()}</span>
                            </div>

                            <div className="control-row">
                              <label>애니메이션:</label>
                              <select
                                value={config.animationMode}
                                onChange={(e) => handleUpdateElementConfig(elementId, 'animationMode', e.target.value)}
                              >
                                <option value="layered">Layered (층층이 쌓임)</option>
                                <option value="rotate">Rotate (회전)</option>
                                <option value="pulse">Pulse (계속 커졌다 작아졌다)</option>
                                <option value="flicker">Flicker (점멸)</option>
                                <option value="grow">Grow (벽돌 쌓기)</option>
                                <option value="random">Random (랜덤)</option>
                                <option value="title">Title (각도0 점멸)</option>
                              </select>
                            </div>

                            {config.animationMode === 'random' && (
                              <div className="random-mode-config">
                                <div style={{ fontSize: '12px', marginBottom: '8px', color: '#666' }}>
                                  Random 모드 확률 설정:
                                </div>
                                {(['layered', 'rotate', 'pulse', 'flicker', 'grow'] as const).map((mode) => (
                                  <div key={mode} className="control-row" style={{ fontSize: '11px' }}>
                                    <label style={{ minWidth: '60px' }}>{mode}:</label>
                                    <input
                                      type="range"
                                      min="0"
                                      max="1"
                                      step="0.01"
                                      value={config.randomModeConfig?.[mode] || 0}
                                      onChange={(e) => {
                                        const newConfig = {
                                          ...config.randomModeConfig,
                                          [mode]: parseFloat(e.target.value),
                                        };
                                        handleUpdateElementConfig(elementId, 'randomModeConfig', newConfig);
                                      }}
                                    />
                                    <span style={{ minWidth: '35px' }}>
                                      {((config.randomModeConfig?.[mode] || 0) * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="control-row">
                              <label>속도:</label>
                              <input
                                type="range"
                                min="0.1"
                                max="2"
                                step="0.1"
                                value={config.animationSpeed}
                                onChange={(e) => handleUpdateElementConfig(elementId, 'animationSpeed', parseFloat(e.target.value))}
                              />
                              <span>{config.animationSpeed.toFixed(1)}x</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 프리셋 저장/편집 모달 */}
        {showPresetModal && (
          <div className="typo-moss-modal-overlay">
            <div className="typo-moss-preset-modal">
              <div className="typo-moss-modal-header">
                <h2>
                  {editingPresetIndex !== null 
                    ? (isRenamingOnly ? '프리셋 이름 변경' : '프리셋 덮어쓰기')
                    : '프리셋 저장'}
                </h2>
                <button 
                  className="typo-moss-modal-close"
                  onClick={() => {
                    setShowPresetModal(false);
                    setPresetNameInput('');
                    setEditingPresetIndex(null);
                    setIsRenamingOnly(false);
                  }}
                >
                  ✕
                </button>
              </div>
              <div className="typo-moss-modal-content">
                <p>
                  {editingPresetIndex !== null 
                    ? (isRenamingOnly 
                        ? '프리셋의 이름만 변경합니다.' 
                        : '현재 설정으로 프리셋을 덮어씁니다.')
                    : '현재 설정을 프리셋으로 저장합니다. (최대 3개)'}
                </p>
                <input
                  type="text"
                  placeholder="프리셋 이름 입력"
                  value={presetNameInput}
                  onChange={(e) => setPresetNameInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && savePreset()}
                  className="preset-name-input"
                />
                <div className="modal-button-group">
                  <button onClick={savePreset}>
                    {editingPresetIndex !== null 
                      ? (isRenamingOnly ? '이름 변경' : '덮어쓰기')
                      : '저장'}
                  </button>
                  <button onClick={() => {
                    setShowPresetModal(false);
                    setPresetNameInput('');
                    setEditingPresetIndex(null);
                    setIsRenamingOnly(false);
                  }}>
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 설정 열기 버튼 (모달 닫혔을 때) */}
        {!showSettings && !showHelp && (
          <>
            <button 
              className="typo-moss-back-button"
              onClick={() => window.location.href = '/portfolio'}
              title="포트폴리오 목록"
            >
              ←
            </button>
            <button 
              className="typo-moss-settings-fab"
              onClick={() => setShowSettings(true)}
            >
              ⚙️
            </button>
            {!isMobile && (
              <div className="typo-moss-seed-panel" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ fontFamily: 'monospace', color: '#ddd' }}>Seed: {seed}</div>
                <input
                  type="number"
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSeedChange()}
                  placeholder="시드 입력"
                  style={{ width: '110px', padding: '4px' }}
                />
                <button onClick={handleSeedChange} style={{ minWidth: '60px' }}>적용</button>
                <button onClick={handleReset} style={{ minWidth: '60px' }}>리셋</button>
              </div>
            )}
            <button 
              className="typo-moss-help-fab"
              onClick={() => setShowHelp(true)}
              title="도움말"
            >
              ?
            </button>
          </>
        )}

        {/* 로딩 오버레이 */}
        {isLoading && (
          <div className="typo-moss-loading-overlay">
            <div className="typo-moss-loading-spinner"></div>
          </div>
        )}

        {/* 도움말 모달 */}
        {showHelp && (
          <div className="typo-moss-help-overlay" onClick={() => setShowHelp(false)}>
            <div className="typo-moss-help-modal" onClick={(e) => e.stopPropagation()}>
              <div className="typo-moss-help-header">
                <h2>타이포 이끼</h2>
                <button 
                  className="typo-moss-modal-close"
                  onClick={() => setShowHelp(false)}
                >
                  ✕
                </button>
              </div>
              <div className="typo-moss-help-content">
                <p>도시의 전단 스티커에서 영감을 받아 제작한 모션 타이포그래피입니다.<br/>이끼처럼 도시의 틈에서 증식하며, 조용히 관심을 기다리는 모습을 표현했습니다.</p>
                
                <h3>주요 기능</h3>
                <ul>
                  <li><strong>⚙️ 설정</strong>: 요소별 애니메이션, 최대 인스턴스, 생성 속도 조정</li>
                  <li><strong>⏺ 녹화</strong>: 현재 화면을 비디오로 녹화 (설정한 캔버스 크기로 저장)</li>
                  <li><strong>캔버스 크기</strong>: 1920×1080, 1080×1080, 1080×1350, 1080×1920 중 선택</li>
                  <li><strong>프리셋</strong>: 현재 설정을 저장하고 불러오기 (최대 3개)</li>
                  <li><strong>자동 리셋</strong>: 설정한 주기마다 화면 자동 초기화</li>
                </ul>

                <h3>애니메이션 모드</h3>
                <ul>
                  <li><strong>Layered</strong>: 레이어드 구조로 쌓이는 효과</li>
                  <li><strong>Rotate</strong>: 회전하며 움직임</li>
                  <li><strong>Pulse</strong>: 크기가 변화함</li>
                  <li><strong>Flicker</strong>: 투명도가 변화함</li>
                  <li><strong>Grow</strong>: 점점 커짐</li>
                  <li><strong>Random</strong>: 무작위 방향으로 이동</li>
                  <li><strong>Title</strong>: 초기에 순서대로 배치되는 타이틀 요소</li>
                </ul>

                <div className="typo-moss-help-footer">
                  <button onClick={() => {
                    setShowHelp(false);
                    localStorage.setItem('typomoss-help-seen', 'true');
                  }}>시작하기</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TypoMoss;

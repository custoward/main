/**
 * 타이포 이끼 — React 페이지
 * 1920×1080 Canvas를 렌더링하고 TypoMossRenderer를 관리
 */

import React, { useEffect, useRef, useState } from 'react';
import { TypoMossRenderer } from './renderer';
import { loadVectorElements } from './vectorLoader';
import { ELEMENT_CONFIGS } from './config';
import { ElementConfig } from './types';
import './TypoMoss.css';

const STORAGE_KEY = 'typomoss-settings';
const PRESETS_KEY = 'typomoss-presets';

interface Preset {
  name: string;
  elementConfigs: Record<string, ElementConfig>;
  density: number;
  minElementSize: number;
}

const TypoMoss: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TypoMossRenderer | null>(null);
  const [stats, setStats] = useState({ frameCount: 0, instanceCount: 0, maxInstances: 0 });
  const [showSettings, setShowSettings] = useState(false);
  
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
          density: parsed.density ?? 0.6,
          minElementSize: parsed.minElementSize ?? 40,
        };
      }
    } catch (e) {
      console.error('[TypoMoss] 설정 불러오기 실패:', e);
    }
    return {
      elementConfigs: ELEMENT_CONFIGS,
      density: 0.6,
      minElementSize: 40,
    };
  };

  const savedSettings = loadSettings();
  const [elementConfigs, setElementConfigs] = useState<Record<string, ElementConfig>>(savedSettings.elementConfigs);
  const [expandedElement, setExpandedElement] = useState<string | null>(null);
  const [density, setDensity] = useState(savedSettings.density);
  const [minElementSize, setMinElementSize] = useState(savedSettings.minElementSize);
  
  // 녹화 상태
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 프리셋 로드
  useEffect(() => {
    try {
      const savedPresets = localStorage.getItem(PRESETS_KEY);
      if (savedPresets) {
        setPresets(JSON.parse(savedPresets));
      }
    } catch (e) {
      console.error('[TypoMoss] 프리셋 불러오기 실패:', e);
    }
  }, []);

  useEffect(() => {
    const initializeRenderer = async () => {
      if (!canvasRef.current) {
        console.error('[TypoMoss] Canvas ref 없음');
        return;
      }

      try {
        // 벡터 요소 로드
        console.log('[TypoMoss] 벡터 요소 로드 시작');
        const elements = await loadVectorElements();
        console.log('[TypoMoss] 벡터 요소 로드 완료:', elements.length);

        // 렌더러 생성 (저장된 설정 적용)
        console.log('[TypoMoss] 렌더러 생성');
        const renderer = new TypoMossRenderer(canvasRef.current, {
          density: density,
          minSize: minElementSize,
        });
        renderer.setElements(elements);
        
        // 저장된 요소별 설정 적용
        Object.entries(elementConfigs).forEach(([elementId, config]) => {
          renderer.updateElementConfig(elementId, config);
        });
        
        renderer.start();
        console.log('[TypoMoss] 렌더러 시작');

        rendererRef.current = renderer;

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
      }
    };

    initializeRenderer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 설정을 localStorage에 저장
  const saveSettings = (configs: Record<string, ElementConfig>, densityValue: number, minSize: number) => {
    try {
      const toSave = {
        elementConfigs: configs,
        density: densityValue,
        minElementSize: minSize,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error('[TypoMoss] 설정 저장 실패:', e);
    }
  };

  const handleUpdateDensity = (density: number) => {
    setDensity(density);
    if (rendererRef.current) {
      rendererRef.current.updateConfig({ density });
    }
    saveSettings(elementConfigs, density, minElementSize);
  };

  const handleUpdateMinElementSize = (size: number) => {
    setMinElementSize(size);
    if (rendererRef.current) {
      rendererRef.current.updateConfig({ minSize: size });
    }
    saveSettings(elementConfigs, density, size);
  };

  const handleUpdateElementConfig = (elementId: string, key: string, value: any) => {
    const updated = { ...elementConfigs };
    if (updated[elementId]) {
      (updated[elementId] as any)[key] = value;
      setElementConfigs(updated);
      if (rendererRef.current) {
        rendererRef.current.updateElementConfig(elementId, updated[elementId]);
      }
      saveSettings(updated, density, minElementSize);
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
          density,
          minElementSize,
        };
        updatedPresets[editingPresetIndex] = newPreset;
        alert(`프리셋 "${presetNameInput}"이(가) 업데이트되었습니다.`);
      }
    } else {
      // 새로 추가
      const newPreset: Preset = {
        name: presetNameInput,
        elementConfigs: { ...elementConfigs },
        density,
        minElementSize,
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
    setDensity(preset.density);
    setMinElementSize(preset.minElementSize);

    if (rendererRef.current) {
      rendererRef.current.updateConfig({ 
        density: preset.density, 
        minSize: preset.minElementSize 
      });
      
      Object.entries(mergedConfigs).forEach(([elementId, config]) => {
        rendererRef.current!.updateElementConfig(elementId, config);
      });
    }

    saveSettings(mergedConfigs, preset.density, preset.minElementSize);
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
    } else {
      // 녹화 시작 전 리셋
      rendererRef.current?.reset();
      
      // 녹화 시작
      recordedChunksRef.current = [];
      setRecordingTime(0);

      const stream = canvasRef.current.captureStream(60); // 60 FPS
      
      // MP4 지원 확인 (Safari/iOS는 MP4 지원)
      let mimeType = 'video/webm;codecs=vp9';
      let fileExtension = 'webm';
      
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
        fileExtension = 'mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
        mimeType = 'video/webm;codecs=h264';
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: 8000000 // 8 Mbps
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
        a.download = `typomoss-${Date.now()}.${fileExtension}`;
        a.click();
        URL.revokeObjectURL(url);
        setIsRecording(false);
        setRecordingTime(0);
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
    rendererRef.current?.reset();
  };

  return (
    <div className="typo-moss-page">
      <div className="typo-moss-container">
        <canvas
          ref={canvasRef}
          className="typo-moss-canvas"
          width={1920}
          height={1080}
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
                  <label htmlFor="density-slider">화면 밀도:</label>
                  <input
                    id="density-slider"
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={density}
                    onChange={(e) => handleUpdateDensity(parseFloat(e.target.value))}
                  />
                  <span>{density.toFixed(1)}</span>
                </div>

                <div className="control-group">
                  <label htmlFor="min-size-slider">최소 크기:</label>
                  <input
                    id="min-size-slider"
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={minElementSize}
                    onChange={(e) => handleUpdateMinElementSize(parseInt(e.target.value, 10))}
                  />
                  <span>{minElementSize}px</span>
                </div>

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
                      <div key={index} className="preset-item">
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
                              <label>최대 크기:</label>
                              <input
                                type="range"
                                min="20"
                                max="200"
                                step="5"
                                value={config.maxSize}
                                onChange={(e) => handleUpdateElementConfig(elementId, 'maxSize', parseInt(e.target.value))}
                              />
                              <span>{config.maxSize}</span>
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
        {!showSettings && (
          <>
            <button 
              className="typo-moss-settings-fab"
              onClick={() => setShowSettings(true)}
            >
              ⚙️
            </button>
            <button 
              className={`typo-moss-record-button ${isRecording ? 'recording' : ''}`}
              onClick={toggleRecording}
              title={isRecording ? '녹화 중지' : '녹화 시작 (1920x1080)'}
            >
              {isRecording ? (
                <>
                  <span className="record-icon recording">⏹</span>
                  <span className="record-time">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                </>
              ) : (
                <span className="record-icon">⏺</span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TypoMoss;

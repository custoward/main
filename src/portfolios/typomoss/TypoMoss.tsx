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

const TypoMoss: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TypoMossRenderer | null>(null);
  const [stats, setStats] = useState({ frameCount: 0, instanceCount: 0, maxInstances: 0 });
  const [showSettings, setShowSettings] = useState(false);
  
  // localStorage에서 설정 불러오기
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          elementConfigs: parsed.elementConfigs || ELEMENT_CONFIGS,
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
                </div>

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
                                <option value="pulse">Pulse (반동)</option>
                                <option value="instant">Instant (즉시)</option>
                              </select>
                            </div>

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

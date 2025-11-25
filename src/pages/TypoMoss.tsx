/**
 * 타이포 이끼 — React 페이지
 * 1920×1080 Canvas를 렌더링하고 TypoMossRenderer를 관리
 */

import React, { useEffect, useRef, useState } from 'react';
import { TypoMossRenderer } from '../typoMoss/renderer';
import { loadVectorElements } from '../typoMoss/vectorLoader';
import './TypoMoss.css';

const TypoMoss: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TypoMossRenderer | null>(null);
  const [stats, setStats] = useState({ frameCount: 0, instanceCount: 0, maxInstances: 0 });
  const [showStats, setShowStats] = useState(false);

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

        // 렌더러 생성
        console.log('[TypoMoss] 렌더러 생성');
        const renderer = new TypoMossRenderer(canvasRef.current);
        renderer.setElements(elements);
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

  const handleReset = () => {
    if (rendererRef.current) {
      rendererRef.current.reset();
    }
  };

  const handleUpdateDensity = (density: number) => {
    if (rendererRef.current) {
      rendererRef.current.updateConfig({ density });
    }
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

        {/* 제어판 */}
        <div className="typo-moss-controls">
          <h2>타이포 이끼 — 컨트롤</h2>

          <div className="control-group">
            <label htmlFor="density-slider">화면 밀도:</label>
            <input
              id="density-slider"
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              defaultValue="0.6"
              onChange={(e) => handleUpdateDensity(parseFloat(e.target.value))}
            />
          </div>

          <button onClick={handleReset}>리셋</button>
          <button onClick={() => setShowStats(!showStats)}>
            {showStats ? '숨기기' : '통계 보기'}
          </button>

          {showStats && (
            <div className="stats">
              <p>프레임: {stats.frameCount}</p>
              <p>활성 요소: {stats.instanceCount} / {stats.maxInstances}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TypoMoss;

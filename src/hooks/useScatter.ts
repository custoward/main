import { useCallback, useEffect, useRef, useState } from 'react';

/** 정규화(0~1) 좌표계에서의 드래그 변위. */
export interface Offset {
  x: number;
  y: number;
}

interface CanvasSize {
  w: number;
  h: number;
}

interface UseScatterOptions {
  /** 픽셀↔정규화 변환에 쓰는 캔버스 픽셀 크기 (없으면 드래그 비활성). */
  canvasSize: CanvasSize | null;
  /** 손을 뗀 뒤 제자리로 돌아오기 시작하기까지의 대기 시간(ms). */
  holdMs?: number;
  /** 복귀 속도 상수(s). 클수록 더 천천히 돌아온다. */
  tauSec?: number;
  /** 변위가 이 값보다 작아지면 0으로 스냅하고 멈춘다. */
  epsilon?: number;
}

interface UseScatterResult {
  /** id별 현재 변위(정규화). 렌더링 위치에 더해 쓴다. */
  offsets: Record<string, Offset>;
  /** board-image에 펼쳐 붙일 포인터 핸들러. */
  bind: (id: string) => {
    onPointerDown: (e: React.PointerEvent) => void;
  };
  /** 방금 드래그가 일어났는지 — 드래그 직후의 click(모달 열기) 억제용. */
  didDrag: () => boolean;
  /** 현재 드래그 중인 이미지 id (z-index 띄우기 등에 사용). */
  draggingId: string | null;
}

/**
 * 보드 사진을 드래그해 흩뜨리고, 손을 떼면 시간이 지나며 천천히 제자리로
 * 돌아오게 한다. 변위는 정규화 좌표라 화면/창 크기와 무관하게 동작한다.
 * (로컬 전용 인터랙션 — 서버/DB에는 저장하지 않는다.)
 */
export function useScatter({
  canvasSize,
  holdMs = 700,
  tauSec = 0.7,
  epsilon = 0.0008,
}: UseScatterOptions): UseScatterResult {
  const [offsets, setOffsets] = useState<Record<string, Offset>>({});

  // rAF 루프와 포인터 핸들러가 공유하는 가변 상태는 ref로 둔다.
  const offsetsRef = useRef<Record<string, Offset>>({});
  const releaseAtRef = useRef<Record<string, number>>({}); // id별 복귀 시작 시각
  const draggingRef = useRef<{
    id: string;
    pointerId: number;
    startX: number;
    startY: number;
    baseOff: Offset;
  } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const movedRef = useRef(false); // 클릭/드래그 구분
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);

  const canvasRef = useRef<CanvasSize | null>(canvasSize);
  canvasRef.current = canvasSize;

  const commit = useCallback(() => {
    // 새 객체로 만들어 React가 변경을 감지하게 한다.
    setOffsets({ ...offsetsRef.current });
  }, []);

  const ensureLoop = useCallback(() => {
    if (rafRef.current != null) return;
    lastTsRef.current = performance.now();
    const step = (ts: number) => {
      const dt = Math.min(0.05, (ts - lastTsRef.current) / 1000); // 탭 전환 등 큰 점프 방지
      lastTsRef.current = ts;

      const offs = offsetsRef.current;
      const dragging = draggingRef.current;
      let active = false;

      for (const id of Object.keys(offs)) {
        if (dragging && dragging.id === id) {
          active = true; // 드래그 중인 건 복귀시키지 않음
          continue;
        }
        const releaseAt = releaseAtRef.current[id] ?? 0;
        if (ts < releaseAt) {
          active = true; // 아직 대기 시간 중
          continue;
        }
        const o = offs[id];
        const k = Math.exp(-dt / tauSec); // 프레임레이트 독립 지수 감쇠
        const nx = o.x * k;
        const ny = o.y * k;
        if (Math.hypot(nx, ny) < epsilon) {
          delete offs[id];
          delete releaseAtRef.current[id];
        } else {
          offs[id] = { x: nx, y: ny };
          active = true;
        }
      }

      commit();

      if (active || draggingRef.current) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }, [commit, tauSec, epsilon]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const drag = draggingRef.current;
    const size = canvasRef.current;
    if (!drag || !size || e.pointerId !== drag.pointerId) return;

    const dxPx = e.clientX - drag.startX;
    const dyPx = e.clientY - drag.startY;
    if (Math.hypot(dxPx, dyPx) > 4) movedRef.current = true;

    // 픽셀 변위를 정규화 변위로. 화면 밖으로 너무 멀리 가지 않게 살짝 여유만 둔다.
    const clamp = (v: number) => Math.max(-0.3, Math.min(1.3, v));
    const nx = clamp(drag.baseOff.x + dxPx / size.w);
    const ny = clamp(drag.baseOff.y + dyPx / size.h);
    offsetsRef.current[drag.id] = { x: nx, y: ny };
    commit();
  }, [commit]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    const drag = draggingRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    // 지금부터 holdMs 뒤에 복귀 시작.
    releaseAtRef.current[drag.id] = performance.now() + holdMs;
    draggingRef.current = null;
    setDraggingId(null);
    ensureLoop();
  }, [ensureLoop, holdMs]);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [handlePointerMove, handlePointerUp]);

  const bind = useCallback(
    (id: string) => ({
      onPointerDown: (e: React.PointerEvent) => {
        if (!canvasRef.current) return;
        movedRef.current = false;
        draggingRef.current = {
          id,
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          baseOff: offsetsRef.current[id] ?? { x: 0, y: 0 },
        };
        delete releaseAtRef.current[id]; // 다시 잡으면 복귀 취소
        setDraggingId(id);
        ensureLoop();
      },
    }),
    [ensureLoop]
  );

  const didDrag = useCallback(() => movedRef.current, []);

  return { offsets, bind, didDrag, draggingId };
}

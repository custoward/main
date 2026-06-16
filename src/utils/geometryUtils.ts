// 보드 좌표는 모두 정규화(0~1) 값으로 다룬다.
// 화면 배치는 CSS 퍼센트가 담당하므로, 여기서는 컨테이너 픽셀 크기를 알 필요가 없다.

export interface Center {
  /** 0~1, 보드 폭 기준 가로 비율(이미지 중심) */
  x: number;
  /** 0~1, 보드 높이 기준 세로 비율(이미지 중심) */
  y: number;
}

/**
 * 기존 이미지들과 너무 겹치지 않는 새 위치(정규화 중심)를 고른다.
 * 컨테이너 크기와 무관하므로 어떤 화면에서도 동일하게 동작한다.
 */
export function generateRandomCenter(
  existing: Center[],
  minDist = 0.16,
  maxAttempts = 30
): Center {
  const lo = 0.1;
  const hi = 0.9;

  let best: Center = {
    x: lo + Math.random() * (hi - lo),
    y: lo + Math.random() * (hi - lo),
  };
  let bestNearest = -1;

  for (let i = 0; i < maxAttempts; i++) {
    const cand: Center = {
      x: lo + Math.random() * (hi - lo),
      y: lo + Math.random() * (hi - lo),
    };
    if (existing.length === 0) return cand;

    let nearest = Infinity;
    for (const e of existing) {
      const d = Math.hypot(cand.x - e.x, cand.y - e.y);
      if (d < nearest) nearest = d;
    }
    if (nearest >= minDist) return cand;
    if (nearest > bestNearest) {
      bestNearest = nearest;
      best = cand;
    }
  }
  return best;
}

/**
 * 정규화 중심점들을 연결하는 거미줄 SVG 경로를 만든다.
 * 좌표계는 0~100 (viewBox="0 0 100 100", preserveAspectRatio="none" 기준).
 */
export function buildWebPaths(centers: Center[]): string[] {
  if (centers.length < 2) return [];

  const pts = centers.map((c) => ({ x: c.x * 100, y: c.y * 100 }));
  const paths: string[] = [];

  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 + 4; // 살짝 늘어지는 곡선
    paths.push(`M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`);
  }
  return paths;
}

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

/** 의자 실루엣을 이루는 부위 영역들 (정규화 0~1, y는 아래로 증가).
 *  3/4 뷰 의자: 등받이 → 지지 기둥 → 좌판 → 다리. bbox가 영역을 꽉 채우도록
 *  잡아 주변 빈 공간을 최소화한다. */
const CHAIR_PARTS: Array<{ x0: number; y0: number; x1: number; y1: number }> = [
  { x0: 0.47, y0: 0.04, x1: 0.71, y1: 0.40 }, // 등받이
  { x0: 0.51, y0: 0.38, x1: 0.58, y1: 0.47 }, // 등받이-좌판 지지 기둥
  { x0: 0.25, y0: 0.44, x1: 0.70, y1: 0.63 }, // 좌판
  { x0: 0.28, y0: 0.60, x1: 0.33, y1: 0.97 }, // 왼쪽 앞다리
  { x0: 0.45, y0: 0.62, x1: 0.51, y1: 0.98 }, // 가운데 앞다리
  { x0: 0.64, y0: 0.44, x1: 0.70, y1: 0.97 }, // 오른쪽 뒷다리
];

/** Halton 저불일치 수열 — 점들이 한쪽에 몰리지 않고 골고루 채워지는 순서. */
function halton(i: number, base: number): number {
  let f = 1;
  let r = 0;
  let n = i + 1; // i=0이 0으로 시작하지 않도록
  while (n > 0) {
    f /= base;
    r += f * (n % base);
    n = Math.floor(n / base);
  }
  return r;
}

/** 인덱스 기반 deterministic 의사난수 (격자처럼 딱딱하지 않게 흩뿌리는 jitter용). */
function hashRand(i: number, salt: number): number {
  const s = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * count개의 이미지를 의자 실루엣 모양으로 배치한 정규화 좌표를 만든다.
 * - 부위 면적에 비례해 점이 분포 → 좌판·등받이부터 채워지고 많아질수록 다리까지.
 * - Halton 수열로 골고루 채워, 적을 땐 흩어져 보이다 많아질수록 의자 실루엣이 드러난다.
 * - 약간의 jitter로 정위치 격자처럼 보이지 않게 살짝 흐트러뜨린다.
 * - 인덱스 고정이라 새 이미지를 추가해도 기존 이미지는 제자리를 유지한다.
 */
export function chairLayout(count: number): Center[] {
  const areas = CHAIR_PARTS.map((p) => (p.x1 - p.x0) * (p.y1 - p.y0));
  const total = areas.reduce((a, b) => a + b, 0);
  const cum: number[] = [];
  areas.reduce((acc, a, idx) => (cum[idx] = acc + a), 0);

  const out: Center[] = [];
  for (let i = 0; i < count; i++) {
    // 부위 선택: 면적 가중 (큰 부위일수록 점이 많이 들어감)
    const r = halton(i, 2) * total;
    let pi = cum.findIndex((c) => r < c);
    if (pi < 0) pi = CHAIR_PARTS.length - 1;
    const p = CHAIR_PARTS[pi];

    // 부위 내부 위치: Halton(균등) + 작은 jitter(흐트러짐)
    const hx = halton(i, 3);
    const hy = halton(i, 5);
    const jx = (hashRand(i, 1) - 0.5) * 0.045;
    const jy = (hashRand(i, 2) - 0.5) * 0.045;

    const x = Math.min(0.98, Math.max(0.02, p.x0 + hx * (p.x1 - p.x0) + jx));
    const y = Math.min(0.98, Math.max(0.02, p.y0 + hy * (p.y1 - p.y0) + jy));
    out.push({ x, y });
  }
  return out;
}

/**
 * 정규화 중심점들을 연결하는 거미줄 SVG 경로를 만든다.
 * 가까운 점끼리 잇는 최소 신장 트리(MST, Prim) 기준 — 선 개수는 N-1개로
 * 최소이며, 이미지가 많아져도 화면이 빽빽해지지 않고 거미줄 형태가 유지된다.
 * 좌표계는 0~100 (viewBox="0 0 100 100", preserveAspectRatio="none" 기준).
 */
export function buildWebPaths(centers: Center[]): string[] {
  if (centers.length < 2) return [];

  const pts = centers.map((c) => ({ x: c.x * 100, y: c.y * 100 }));
  const n = pts.length;

  // Prim 알고리즘: 트리에 포함된 집합에서 가장 가까운 미포함 점을 하나씩 흡수
  const inTree = new Array<boolean>(n).fill(false);
  const dist = new Array<number>(n).fill(Infinity);
  const parent = new Array<number>(n).fill(-1);
  dist[0] = 0;

  const paths: string[] = [];

  for (let k = 0; k < n; k++) {
    // 아직 트리에 없는 점 중 가장 가까운 것
    let u = -1;
    let best = Infinity;
    for (let i = 0; i < n; i++) {
      if (!inTree[i] && dist[i] < best) {
        best = dist[i];
        u = i;
      }
    }
    if (u === -1) break;
    inTree[u] = true;

    if (parent[u] !== -1) {
      const a = pts[parent[u]];
      const b = pts[u];
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2 + 4; // 살짝 늘어지는 곡선
      paths.push(`M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`);
    }

    // 새로 들어온 u 기준으로 남은 점들의 최단 거리 갱신
    for (let v = 0; v < n; v++) {
      if (!inTree[v]) {
        const d = Math.hypot(pts[u].x - pts[v].x, pts[u].y - pts[v].y);
        if (d < dist[v]) {
          dist[v] = d;
          parent[v] = u;
        }
      }
    }
  }

  return paths;
}

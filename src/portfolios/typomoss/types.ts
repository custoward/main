/**
 * 타이포 이끼 — 타입 정의
 */

// 애니메이션 모드 (생기는 방식)
export type AnimationMode = 'layered' | 'rotate' | 'pulse' | 'flicker' | 'grow' | 'random' | 'title';

// Random 모드의 확률 설정
export interface RandomModeConfig {
  layered: number; // 0 ~ 1
  rotate: number; // 0 ~ 1
  pulse: number; // 0 ~ 1
  flicker: number; // 0 ~ 1
  grow: number; // 0 ~ 1
}

// 벡터 요소 (SVG 또는 경로 정의)
export interface VectorElement {
  id: string;
  name: string;
  animationMode: AnimationMode;
  color?: string; // 기본 색상 (Green 테마)
  weight?: number; // 선 두께 또는 강도
  customData?: Record<string, unknown>; // 확장성
}

// 개별 SVG 요소 설정 (각 이미지마다 독립적으로 조절 가능)
export interface ElementConfig {
  elementId: string; // VectorElement.id
  frequency: number; // 생성 빈도 (0 ~ 1)
  size: number; // 크기 (이 값 ±30% 범위로 랜덤)
  animationMode: AnimationMode; // 애니메이션 형식
  animationSpeed: number; // 애니메이션 속도 배율 (1 = 기본 속도)
  randomModeConfig?: Partial<RandomModeConfig>; // random 모드일 때의 확률 설정 (부분 설정 가능)
}

// 캔버스에 렌더링될 객체 인스턴스
export interface RenderInstance {
  id: string;
  elementId: string; // VectorElement의 id 참조
  elementName: string; // VectorElement의 name (카테고리 판단용)
  x: number;
  y: number;
  size: number; // 랜덤 크기 (1 ~ maxSize 범위)
  rotation: number; // 회전 각도
  opacity: number; // 불투명도
  animationMode: AnimationMode;
  age: number; // 생성된 이후 프레임 수
  lifespan: number; // 애니메이션 지속 시간 (프레임 단위)
  seed: number; // 랜덤 시드 (각 인스턴스마다 고유)
  customProps?: Record<string, unknown>; // 애니메이션별 커스텀 속성
}

// 렌더 시스템 설정
export interface RenderConfig {
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string; // "#ffffff" or "#000000"
  density?: number; // 하위 호환성을 위해 유지 (사용 안 함)
  spawnRate: number; // 프레임당 생성 확률 (0 ~ 1)
  maxInstances: number; // 동시 활성 인스턴스 최대 개수
  spawnSpeed?: number; // 생성 속도 배율 (0.5 ~ 3.0, 기본 1.0)
}

// 애니메이션 상태 (런타임)
export interface AnimationState {
  mode: AnimationMode;
  progress: number; // 0 ~ 1
  isActive: boolean;
  customData?: Record<string, unknown>;
}

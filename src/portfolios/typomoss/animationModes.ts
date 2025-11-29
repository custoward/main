/**
 * 타이포 이끼 — 애니메이션 모드
 * 
 * 5가지 애니메이션 + random:
 * 1. layered: 층층이 쌓임
 * 2. rotate: 제자리 회전
 * 3. pulse: 계속 커졌다 작아졌다
 * 4. flicker: 깜빡임
 * 5. grow: 벽돌처럼 단방향 쌓임
 * 6. random: 위 5가지 중 랜덤 선택
 */

import { AnimationMode, RenderInstance } from './types';
import { ANIMATION_MODE_DEFAULTS } from './config';

/**
 * 애니메이션 진행도 계산
 */
export function calculateAnimationProgress(age: number, maxAge: number): number {
  if (maxAge <= 0) return 1;
  return Math.min(age / maxAge, 1);
}

/**
 * Layered: 층층이 쌓임
 * - 즉시 나타남
 * - 같은 요소들이 일정한 방향과 각도로 순차적으로 쌓임
 * - 크기는 고정, 회전값은 생성 시 결정된 값 사용
 */
export function animateLayered(
  instance: RenderInstance,
  progress: number
): {
  scale: number;
  opacity: number;
  rotation: number;
} {
  // instance.rotation을 그대로 사용 (생성 시 결정된 값)
  const rotation = instance.rotation;
  
  // 즉시 등장
  const scale = 1.0;
  const opacity = 1.0;

  return {
    scale,
    opacity,
    rotation,
  };
}

/**
 * Rotate: 제자리 회전
 * - 천천히 커지며 나타남
 * - 계속 회전
 * - 사라질 때 커지며 투명해짐
 */
export function animateRotate(
  instance: RenderInstance,
  progress: number
): {
  scale: number;
  opacity: number;
  rotation: number;
} {
  const rotationSpeed = ANIMATION_MODE_DEFAULTS.rotate.rotationSpeed;
  const fadeInDuration = 0.2; // 처음 20%
  const fadeOutStart = 0.8; // 마지막 20%
  
  let scale: number;
  let opacity: number;
  
  // 등장 (0 ~ 0.2): 0.3 → 1.0
  if (progress < fadeInDuration) {
    const fadeProgress = progress / fadeInDuration;
    scale = 0.3 + fadeProgress * 0.7;
    opacity = fadeProgress;
  }
  // 사라짐 (0.8 ~ 1.0): 1.0 → 1.5, 투명해짐
  else if (progress > fadeOutStart) {
    const fadeProgress = (progress - fadeOutStart) / (1 - fadeOutStart);
    scale = 1.0 + fadeProgress * 0.5;
    opacity = 1.0 - fadeProgress;
  }
  // 유지 (0.2 ~ 0.8)
  else {
    scale = 1.0;
    opacity = 1.0;
  }
  
  // 계속 회전 (방향 적용)
  const rotationDirection = (instance.customProps?.rotationDirection as number) || 1;
  const rotation = progress * Math.PI * 2 * rotationSpeed * rotationDirection;

  return {
    scale,
    opacity,
    rotation,
  };
}

/**
 * Pulse: 커지며 반동 (계속 반복)
 * - 0 → 1.0으로 커지며 나타남
 * - 지속적으로 커졌다 작아졌다 반복
 * - 사라질 때 페이드 아웃
 */
export function animatePulse(
  progress: number
): {
  scale: number;
  opacity: number;
} {
  const fadeInDuration = 0.15; // 처음 15%만 페이드 인
  const fadeOutStart = 0.85; // 마지막 15%
  const pulseSpeed = 3; // 펄스 속도 (3 사이클)
  
  let scale: number;
  let opacity: number;
  
  // 등장 (0 ~ 0.15): 0 → 1.0
  if (progress < fadeInDuration) {
    const fadeProgress = progress / fadeInDuration;
    scale = fadeProgress;
    opacity = fadeProgress;
  }
  // 사라짐 (0.85 ~ 1.0): 페이드 아웃
  else if (progress > fadeOutStart) {
    const fadeProgress = (progress - fadeOutStart) / (1 - fadeOutStart);
    // 계속 펄스하면서 페이드 아웃
    const pulseAmount = Math.sin(progress * Math.PI * 2 * pulseSpeed) * 0.15;
    scale = (1.0 + pulseAmount) * (1.0 - fadeProgress * 0.7);
    opacity = 1.0 - fadeProgress;
  }
  // 펄스 반복 (0.15 ~ 0.85): 0.85 ~ 1.15 반복
  else {
    const pulseAmount = Math.sin(progress * Math.PI * 2 * pulseSpeed) * 0.15;
    scale = 1.0 + pulseAmount;
    opacity = 1.0;
  }

  return {
    scale,
    opacity,
  };
}

/**
 * Flicker: 점멸 (3-7번 랜덤)
 * - 깜빡이며 등장
 * - 마지막에 페이드 아웃
 */
export function animateFlicker(
  instance: RenderInstance,
  progress: number
): {
  scale: number;
  opacity: number;
  rotation: number;
} {
  const flickerCount = (instance.customProps?.flickerCount as number) || 5;
  const flickerProgress = progress * flickerCount;
  const isVisible = Math.floor(flickerProgress) % 2 === 0;
  
  // 마지막에 페이드 아웃
  let opacity = isVisible ? 1.0 : 0.0;
  if (progress > 0.85) {
    opacity *= (1 - (progress - 0.85) / 0.15);
  }
  
  return {
    scale: 1.0,
    opacity,
    rotation: instance.rotation,
  };
}

/**
 * Grow: 벽돌처럼 단방향으로 쌓임
 * - 짧은 면 방향으로 긴 면의 거리만큼 멀어져서 쌓임
 * - layered와 유사하지만 단방향
 */
export function animateGrow(
  instance: RenderInstance,
  progress: number
): {
  scale: number;
  opacity: number;
  rotation: number;
} {
  return {
    scale: 1.0,
    opacity: 1.0,
    rotation: instance.rotation,
  };
}

/**
 * 애니메이션 프로퍼티 계산
 */
export function getAnimationProperties(
  instance: RenderInstance,
  deltaTime: number,
  mode: AnimationMode,
  elementName?: string
): Record<string, any> {
  const progress = calculateAnimationProgress(instance.age, instance.lifespan);

  // random 모드는 actualMode를 사용
  const actualMode = mode === 'random' 
    ? (instance.customProps?.actualMode as AnimationMode) || 'pulse'
    : mode;

  switch (actualMode) {
    case 'layered':
      return animateLayered(instance, progress);
    case 'rotate':
      return animateRotate(instance, progress);
    case 'pulse':
      return animatePulse(progress);
    case 'flicker':
      return animateFlicker(instance, progress);
    case 'grow':
      return animateGrow(instance, progress);
    default:
      return { scale: 1, opacity: 1, rotation: 0 };
  }
}

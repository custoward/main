/**
 * 타이포 이끼 — 애니메이션 모드
 * 
 * 4가지 명확한 애니메이션:
 * 1. layered: 층층이 쌓임
 * 2. rotate: 제자리 회전
 * 3. pulse: 커지며 반동
 * 4. instant: 바로 나타남
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
  
  // 계속 회전
  const rotation = progress * Math.PI * 2 * rotationSpeed;

  return {
    scale,
    opacity,
    rotation,
  };
}

/**
 * Pulse: 커지며 반동
 * - 0 → 1.0으로 커지며 나타남
 * - 1.15까지 튀어나감 (반동)
 * - 1.0으로 정착
 * - 사라질 때 작아짐
 */
export function animatePulse(
  progress: number
): {
  scale: number;
  opacity: number;
} {
  const bounceAmount = ANIMATION_MODE_DEFAULTS.pulse.bounceAmount;
  const fadeInDuration = 0.3; // 처음 30%
  const bounceEnd = 0.5; // 반동 종료 50%
  const fadeOutStart = 0.85; // 마지막 15%
  
  let scale: number;
  let opacity: number;
  
  // 등장 (0 ~ 0.3): 0 → 1.0
  if (progress < fadeInDuration) {
    const fadeProgress = progress / fadeInDuration;
    scale = fadeProgress;
    opacity = fadeProgress;
  }
  // 반동 (0.3 ~ 0.5): 1.0 → 1.15 → 1.0
  else if (progress < bounceEnd) {
    const bounceProgress = (progress - fadeInDuration) / (bounceEnd - fadeInDuration);
    const bounce = Math.sin(bounceProgress * Math.PI) * bounceAmount;
    scale = 1.0 + bounce;
    opacity = 1.0;
  }
  // 사라짐 (0.85 ~ 1.0): 1.0 → 0.3
  else if (progress > fadeOutStart) {
    const fadeProgress = (progress - fadeOutStart) / (1 - fadeOutStart);
    scale = 1.0 - fadeProgress * 0.7;
    opacity = 1.0 - fadeProgress;
  }
  // 유지 (0.5 ~ 0.85)
  else {
    scale = 1.0;
    opacity = 1.0;
  }

  return {
    scale,
    opacity,
  };
}

/**
 * Instant: 바로 나타남
 * - 즉시 등장
 * - 유지
 */
export function animateInstant(): {
  scale: number;
  opacity: number;
} {
  return {
    scale: 1.0,
    opacity: 1.0,
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

  switch (mode) {
    case 'layered':
      return animateLayered(instance, progress);
    case 'rotate':
      return animateRotate(instance, progress);
    case 'pulse':
      return animatePulse(progress);
    case 'instant':
      return animateInstant();
    default:
      return { scale: 1, opacity: 1, rotation: 0 };
  }
}

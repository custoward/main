/**
 * 타이포 이끼 — 애니메이션 모드
 * 
 * 요소별 카테고리 + 3가지 애니메이션:
 * 1. Sticker: 연속 누적 스택 (낮은 위치 변화, 즉시 생성)
 * 2. Circle: 천천히 회전 (회전 동작)
 * 3. Grow: 백그라운드에서 천천히 확대
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
 * 요소명 기반 카테고리 결정
 */
export function getElementCategory(
  elementName: string
): 'sticker' | 'circle' | 'grow' {
  if (elementName.toLowerCase().includes('sticker')) return 'sticker';
  if (elementName.toLowerCase().includes('circle')) return 'circle';
  return 'grow';
}

/**
 * Sticker 동작: 연속 누적 스택 (낮은 위치 변화, 즉시 생성)
 */
export function animateSticker(progress: number): {
  scale: number;
  opacity: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
} {
  return {
    scale: 0.8 + progress * 0.2, // 약간의 크기 변화 (0.8 ~ 1.0)
    opacity: 1, // 즉시 완전 불투명
    rotation: 0,
    offsetX: (Math.random() - 0.5) * 2, // 매우 작은 위치 변화
    offsetY: (Math.random() - 0.5) * 2,
  };
}

/**
 * Circle 동작: 천천히 회전
 */
export function animateCircle(progress: number): {
  scale: number;
  opacity: number;
  rotation: number;
} {
  return {
    scale: 0.9 + progress * 0.1, // 미세한 크기 변화 (0.9 ~ 1.0)
    opacity: Math.min(1, progress * 1.5), // 천천히 나타남
    rotation: progress * 360 * 2, // 빠른 회전 (2바퀴)
  };
}

/**
 * Grow 동작: 백그라운드에서 천천히 확대
 */
export function animateGrow(progress: number): {
  scale: number;
  opacity: number;
  rotation: number;
  zIndex: number;
} {
  return {
    scale: 0.1 + progress * 0.9, // 0.1에서 1.0으로
    opacity: Math.min(1, progress * 2), // 천천히 나타남
    rotation: 0,
    zIndex: -1, // 백그라운드
  };
}

/**
 * 기본 Layered (점층적 쌓임)
 */
export function animateLayered(progress: number): {
  scale: number;
  opacity: number;
} {
  const eased = 1 - Math.pow(1 - progress, 2); // ease-out
  return {
    scale: 0.8 + eased * 0.2,
    opacity: progress < 0.5 ? progress * 2 : 1,
  };
}

/**
 * 기본 Pulse (크기 변화)
 */
export function animatePulse(progress: number): {
  scale: number;
  opacity: number;
} {
  const eased = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
  const minScale = ANIMATION_MODE_DEFAULTS.pulse.scaleMin;
  const maxScale = ANIMATION_MODE_DEFAULTS.pulse.scaleMax;

  return {
    scale: minScale + (maxScale - minScale) * eased,
    opacity: progress < 0.3 ? 0.5 + progress * 1.67 : Math.max(0.8 - progress * 0.4, 0.3),
  };
}

/**
 * 기본 Flicker (깜빡임)
 */
export function animateFlicker(progress: number, seed: number = 0): {
  opacity: number;
  scale: number;
} {
  const config = ANIMATION_MODE_DEFAULTS.flicker;
  const flickerPhase = ((progress * seed + progress) / config.flickerFrequency) % 1;
  const flicker = flickerPhase < 0.5;

  const baseOpacity = progress * 0.9 + 0.1;
  return {
    opacity: flicker ? baseOpacity : baseOpacity * 0.3,
    scale: 0.5 + progress * 0.5,
  };
}

/**
 * 요소별 애니메이션 프로퍼티 계산
 * elementName이 있으면 카테고리 기반 동작 우선, 없으면 기본 애니메이션 모드 사용
 */
export function getAnimationProperties(
  instance: RenderInstance,
  deltaTime: number,
  mode: AnimationMode,
  elementName?: string
): Record<string, any> {
  const progress = calculateAnimationProgress(instance.age, instance.lifespan);

  // 요소명 기반 카테고리 동작 우선
  if (elementName) {
    const category = getElementCategory(elementName);
    switch (category) {
      case 'sticker':
        return animateSticker(progress);
      case 'circle':
        return animateCircle(progress);
      case 'grow':
        return animateGrow(progress);
    }
  }

  // 기본 애니메이션 모드
  switch (mode) {
    case 'layered':
      return animateLayered(progress);
    case 'pulse':
      return animatePulse(progress);
    case 'flicker':
      return animateFlicker(progress, instance.seed);
    default:
      return { scale: 1, opacity: 1 };
  }
}

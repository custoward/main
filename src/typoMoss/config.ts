/**
 * 타이포 이끼 — 기본 설정
 * 나중에 쉽게 수정 가능하도록 구조화
 */

import { RenderConfig } from './types';

export const DEFAULT_RENDER_CONFIG: RenderConfig = {
  canvasWidth: 1920,
  canvasHeight: 1080,
  backgroundColor: '#ffffff', // 흰색 배경
  density: 0.6, // 화면 밀도 (0 ~ 1)
  spawnRate: 0.15, // 프레임당 새로운 요소 생성 확률
  maxInstances: 250, // 동시 활성 최대 개수 (누적 효과 증가)
  minSize: 20,
  maxSize: 120,
};

// 애니메이션 모드별 기본 설정
export const ANIMATION_MODE_DEFAULTS = {
  layered: {
    duration: 1800, // 매우 긴 지속시간 (30초, 60fps 기준)
    easing: 'ease-out',
    stackOffset: 8,
  },
  pulse: {
    duration: 1800,
    easing: 'ease-in-out',
    scaleMin: 0.6,
    scaleMax: 1.2,
  },
  flicker: {
    duration: 1800,
    easing: 'ease-in',
    flickerFrequency: 0.4,
  },
};

// 컬러 팔레트 (Green 테마)
export const COLOR_PALETTE = {
  primary: '#1AB551', // 메인 그린
  dark: '#0d5a29', // 어두운 그린
  light: '#4edb9a', // 밝은 그린
  accent: '#00cc66', // 강조 그린
};

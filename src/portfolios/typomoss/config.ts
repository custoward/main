/**
 * 타이포 이끼 — 기본 설정
 * 나중에 쉽게 수정 가능하도록 구조화
 */

import { RenderConfig, ElementConfig } from './types';

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
    duration: 1800, // 30초
    stackSpacing: 3, // 레이어 간 간격 (px)
  },
  rotate: {
    duration: 1200, // 20초
    rotationSpeed: 2, // 회전 속도 (바퀴 수)
  },
  pulse: {
    duration: 900, // 15초
    bounceAmount: 0.15, // 반동 크기
  },
  instant: {
    duration: 1800, // 30초 (유지 시간)
  },
};

// 컬러 팔레트 (Green 테마)
export const COLOR_PALETTE = {
  primary: '#1AB551', // 메인 그린
  dark: '#0d5a29', // 어두운 그린
  light: '#4edb9a', // 밝은 그린
  accent: '#00cc66', // 강조 그린
};

// 개별 SVG 요소별 설정 (각 이미지 독립 조절)
export const ELEMENT_CONFIGS: Record<string, ElementConfig> = {
  'svg-vector_sticker_1': {
    elementId: 'svg-vector_sticker_1',
    frequency: 0.8,
    maxSize: 120,
    animationMode: 'layered',
    animationSpeed: 1.0,
  },
  'svg-vector_sticker_2': {
    elementId: 'svg-vector_sticker_2',
    frequency: 0.8,
    maxSize: 120,
    animationMode: 'layered',
    animationSpeed: 1.0,
  },
  'svg-vector_sticker_3': {
    elementId: 'svg-vector_sticker_3',
    frequency: 0.8,
    maxSize: 120,
    animationMode: 'layered',
    animationSpeed: 1.0,
  },
  'svg-vector_circle_1': {
    elementId: 'svg-vector_circle_1',
    frequency: 0.12,
    maxSize: 100,
    animationMode: 'pulse',
    animationSpeed: 1.0,
  },
  'svg-vector_circle_2': {
    elementId: 'svg-vector_circle_2',
    frequency: 0.12,
    maxSize: 100,
    animationMode: 'pulse',
    animationSpeed: 1.0,
  },
  'svg-vector_4': {
    elementId: 'svg-vector_4',
    frequency: 0.1,
    maxSize: 110,
    animationMode: 'rotate',
    animationSpeed: 1.0,
  },
  'svg-vector_5': {
    elementId: 'svg-vector_5',
    frequency: 0.1,
    maxSize: 110,
    animationMode: 'rotate',
    animationSpeed: 1.0,
  },
  'svg-vector_6': {
    elementId: 'svg-vector_6',
    frequency: 0.1,
    maxSize: 110,
    animationMode: 'instant',
    animationSpeed: 1.0,
  },
  'svg-vector_7': {
    elementId: 'svg-vector_7',
    frequency: 0.1,
    maxSize: 110,
    animationMode: 'instant',
    animationSpeed: 1.0,
  },
  'svg-vector_8': {
    elementId: 'svg-vector_8',
    frequency: 0.1,
    maxSize: 110,
    animationMode: 'instant',
    animationSpeed: 1.0,
  },
  'svg-vector_9': {
    elementId: 'svg-vector_9',
    frequency: 0.1,
    maxSize: 110,
    animationMode: 'instant',
    animationSpeed: 1.0,
  },
  'svg-vector_10': {
    elementId: 'svg-vector_10',
    frequency: 0.1,
    maxSize: 110,
    animationMode: 'instant',
    animationSpeed: 1.0,
  },
};

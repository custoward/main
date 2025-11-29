/**
 * 타이포 이끼 — 기본 설정
 * 나중에 쉽게 수정 가능하도록 구조화
 */

import { RenderConfig, ElementConfig } from './types';

export const DEFAULT_RENDER_CONFIG: RenderConfig = {
  canvasWidth: 1920,
  canvasHeight: 1080,
  backgroundColor: '#ffffff', // 흰색 배경
  spawnRate: 0.15, // 프레임당 새로운 요소 생성 확률
  maxInstances: 80, // 동시 활성 최대 개수
  spawnSpeed: 1.0, // 생성 속도 배율 (기본값)
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
  flicker: {
    duration: 180, // 3초 (더 길게)
    minFlickers: 3,
    maxFlickers: 7,
  },
  grow: {
    duration: 999999, // 영구
    stackSpacing: 0, // 이미지 크기에 따라 동적 계산
  },
  random: {
    duration: 1200, // 평균 지속 시간
  },
  title: {
    duration: 90, // 1.5초
    minFlickers: 3,
    maxFlickers: 7,
  },
};

// Random 모드의 기본 확률 설정
export const DEFAULT_RANDOM_MODE_CONFIG = {
  layered: 0.2,  // 20%
  rotate: 0.3,   // 30%
  pulse: 0.3,    // 30%
  flicker: 0.1,  // 10%
  grow: 0.1,     // 10%
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
    size: 120,
    animationMode: 'layered',
    animationSpeed: 1.0,
  },
  'svg-vector_sticker_2': {
    elementId: 'svg-vector_sticker_2',
    frequency: 0.8,
    size: 120,
    animationMode: 'layered',
    animationSpeed: 1.0,
  },
  'svg-vector_sticker_3': {
    elementId: 'svg-vector_sticker_3',
    frequency: 0.8,
    size: 120,
    animationMode: 'layered',
    animationSpeed: 1.0,
  },
  'svg-vector_circle_1': {
    elementId: 'svg-vector_circle_1',
    frequency: 0.12,
    size: 100,
    animationMode: 'rotate',
    animationSpeed: 1.0,
  },
  'svg-vector_circle_2': {
    elementId: 'svg-vector_circle_2',
    frequency: 0.12,
    size: 100,
    animationMode: 'rotate',
    animationSpeed: 1.0,
  },
  'svg-vector_4': {
    elementId: 'svg-vector_4',
    frequency: 0.1,
    size: 110,
    animationMode: 'random',
    animationSpeed: 1.0,
  },
  'svg-vector_5': {
    elementId: 'svg-vector_5',
    frequency: 0.1,
    size: 110,
    animationMode: 'random',
    animationSpeed: 1.0,
  },
  'svg-vector_6': {
    elementId: 'svg-vector_6',
    frequency: 0.1,
    size: 110,
    animationMode: 'random',
    animationSpeed: 1.0,
  },
  'svg-vector_7': {
    elementId: 'svg-vector_7',
    frequency: 0.1,
    size: 110,
    animationMode: 'random',
    animationSpeed: 1.0,
  },
  'svg-vector_8': {
    elementId: 'svg-vector_8',
    frequency: 0.1,
    size: 110,
    animationMode: 'random',
    animationSpeed: 1.0,
  },
  'svg-vector_9': {
    elementId: 'svg-vector_9',
    frequency: 0.1,
    size: 110,
    animationMode: 'random',
    animationSpeed: 1.0,
  },
  'svg-vector_10': {
    elementId: 'svg-vector_10',
    frequency: 0.1,
    size: 110,
    animationMode: 'random',
    animationSpeed: 1.0,
  },
  'svg-vector_11': {
    elementId: 'svg-vector_11',
    frequency: 0.1,
    size: 110,
    animationMode: 'random',
    animationSpeed: 1.0,
  },
  'svg-vector_12': {
    elementId: 'svg-vector_12',
    frequency: 0.1,
    size: 110,
    animationMode: 'random',
    animationSpeed: 1.0,
  },
  'svg-vector_13': {
    elementId: 'svg-vector_13',
    frequency: 0.1,
    size: 110,
    animationMode: 'random',
    animationSpeed: 1.0,
  },
  'svg-vector_14': {
    elementId: 'svg-vector_14',
    frequency: 0.1,
    size: 110,
    animationMode: 'random',
    animationSpeed: 1.0,
  },
  'svg-vector_15': {
    elementId: 'svg-vector_15',
    frequency: 0.1,
    size: 110,
    animationMode: 'random',
    animationSpeed: 1.0,
  },
  'svg-vector_sticker_4': {
    elementId: 'svg-vector_sticker_4',
    frequency: 0.8,
    size: 120,
    animationMode: 'layered',
    animationSpeed: 1.0,
  },
  'svg-vector_sticker_5': {
    elementId: 'svg-vector_sticker_5',
    frequency: 0.8,
    size: 120,
    animationMode: 'layered',
    animationSpeed: 1.0,
  },
  'svg-vector_circle_3': {
    elementId: 'svg-vector_circle_3',
    frequency: 0.12,
    size: 100,
    animationMode: 'rotate',
    animationSpeed: 1.0,
  },
  'svg-vector_원': {
    elementId: 'svg-vector_원',
    frequency: 0.12,
    size: 100,
    animationMode: 'rotate',
    animationSpeed: 1.0,
  },
};

// 기본 프리셋
export const DEFAULT_PRESETS = [
  {
    "name": "default",
    "elementConfigs": {
      "svg-vector_sticker_1": {
        "elementId": "svg-vector_sticker_1",
        "frequency": 0.8,
        "size": 195,
        "animationMode": "layered" as const,
        "animationSpeed": 1.5
      },
      "svg-vector_sticker_2": {
        "elementId": "svg-vector_sticker_2",
        "frequency": 0.8,
        "size": 155,
        "animationMode": "layered" as const,
        "animationSpeed": 1.6
      },
      "svg-vector_sticker_3": {
        "elementId": "svg-vector_sticker_3",
        "frequency": 0.85,
        "size": 195,
        "animationMode": "grow" as const,
        "animationSpeed": 1.7
      },
      "svg-vector_circle_1": {
        "elementId": "svg-vector_circle_1",
        "frequency": 0.12,
        "size": 140,
        "animationMode": "rotate" as const,
        "animationSpeed": 0.7
      },
      "svg-vector_circle_2": {
        "elementId": "svg-vector_circle_2",
        "frequency": 0.12,
        "size": 185,
        "animationMode": "rotate" as const,
        "animationSpeed": 0.7
      },
      "svg-vector_4": {
        "elementId": "svg-vector_4",
        "frequency": 0.1,
        "size": 180,
        "animationMode": "random" as const,
        "animationSpeed": 2,
        "randomModeConfig": {
          "pulse": 0.2,
          "flicker": 0.18
        }
      },
      "svg-vector_5": {
        "elementId": "svg-vector_5",
        "frequency": 0.1,
        "size": 150,
        "animationMode": "random" as const,
        "animationSpeed": 0.9,
        "randomModeConfig": {
          "pulse": 0.22,
          "flicker": 0.27,
          "rotate": 0.05
        }
      },
      "svg-vector_6": {
        "elementId": "svg-vector_6",
        "frequency": 0.1,
        "size": 160,
        "animationMode": "random" as const,
        "animationSpeed": 1,
        "randomModeConfig": {
          "pulse": 0.25,
          "flicker": 0.26,
          "rotate": 0.07
        }
      },
      "svg-vector_7": {
        "elementId": "svg-vector_7",
        "frequency": 0.1,
        "size": 165,
        "animationMode": "random" as const,
        "animationSpeed": 1.2,
        "randomModeConfig": {
          "pulse": 0.25,
          "flicker": 0.25,
          "rotate": 0.05
        }
      },
      "svg-vector_8": {
        "elementId": "svg-vector_8",
        "frequency": 0.05,
        "size": 165,
        "animationMode": "random" as const,
        "animationSpeed": 1,
        "randomModeConfig": {
          "pulse": 0.26,
          "flicker": 0.24
        }
      },
      "svg-vector_9": {
        "elementId": "svg-vector_9",
        "frequency": 0.05,
        "size": 140,
        "animationMode": "random" as const,
        "animationSpeed": 1,
        "randomModeConfig": {
          "pulse": 0.14,
          "flicker": 0.16
        }
      },
      "svg-vector_10": {
        "elementId": "svg-vector_10",
        "frequency": 0.1,
        "size": 140,
        "animationMode": "random" as const,
        "animationSpeed": 1,
        "randomModeConfig": {
          "pulse": 0.19,
          "flicker": 0.19
        }
      },
      "svg-vector_11": {
        "elementId": "svg-vector_11",
        "frequency": 0.1,
        "size": 75,
        "animationMode": "title" as const,
        "animationSpeed": 1
      },
      "svg-vector_12": {
        "elementId": "svg-vector_12",
        "frequency": 0.1,
        "size": 105,
        "animationMode": "title" as const,
        "animationSpeed": 1
      },
      "svg-vector_13": {
        "elementId": "svg-vector_13",
        "frequency": 0.1,
        "size": 105,
        "animationMode": "title" as const,
        "animationSpeed": 1
      },
      "svg-vector_14": {
        "elementId": "svg-vector_14",
        "frequency": 0.1,
        "size": 105,
        "animationMode": "title" as const,
        "animationSpeed": 1
      },
      "svg-vector_15": {
        "elementId": "svg-vector_15",
        "frequency": 0.1,
        "size": 105,
        "animationMode": "title" as const,
        "animationSpeed": 1
      },
      "svg-vector_sticker_4": {
        "elementId": "svg-vector_sticker_4",
        "frequency": 0.8,
        "size": 195,
        "animationMode": "grow" as const,
        "animationSpeed": 1.5
      },
      "svg-vector_sticker_5": {
        "elementId": "svg-vector_sticker_5",
        "frequency": 0.8,
        "size": 190,
        "animationMode": "layered" as const,
        "animationSpeed": 1.6
      },
      "svg-vector_circle_3": {
        "elementId": "svg-vector_circle_3",
        "frequency": 0.12,
        "size": 255,
        "animationMode": "rotate" as const,
        "animationSpeed": 1.2
      },
      "svg-vector_원": {
        "elementId": "svg-vector_원",
        "frequency": 0.12,
        "size": 300,
        "animationMode": "flicker" as const,
        "animationSpeed": 1
      }
    },
    "maxInstances": 140,
    "minElementSize": 165,
    "spawnSpeed": 1,
    "autoResetEnabled": true,
    "autoResetInterval": 20
  }
];

/**
 * 타이포 이끼 — 벡터 요소 로더
 * 
 * SVG 파일들을 로드하여 Canvas에서 렌더링 가능하도록 변환
 */

import { VectorElement, AnimationMode } from './types';

// SVG 파일 경로들 (public/portfolio_image/typomoss/)
const SVG_FOLDER = '/portfolio_image/typomoss/';
const SVG_FILES = [
  'vector_sticker_1.svg',
  'vector_sticker_2.svg',
  'vector_sticker_3.svg',
  'vector_circle_1.svg',
  'vector_circle_2.svg',
  'vector_4.svg',
  'vector_5.svg',
  'vector_6.svg',
  'vector_7.svg',
  'vector_8.svg',
  'vector_9.svg',
  'vector_10.svg',
];

// 로드된 SVG 이미지 캐시
const SVG_IMAGE_CACHE: Map<string, HTMLImageElement> = new Map();

/**
 * 파일명 기반으로 애니메이션 모드 결정
 */
function getAnimationModeFromName(filename: string): AnimationMode {
  if (filename.includes('sticker')) {
    return 'layered'; // sticker: 점층적 스택
  } else if (filename.includes('circle')) {
    return 'pulse'; // circle: 회전 (pulse 사용)
  } else {
    return 'flicker'; // 기본: 깜빡임
  }
}

/**
 * SVG 파일을 Image로 변환 (캐싱)
 */
export async function loadSVGAsImage(svgPath: string): Promise<HTMLImageElement> {
  // 캐시에서 먼저 확인
  if (SVG_IMAGE_CACHE.has(svgPath)) {
    console.log(`[SVG Cache] 캐시에서 로드: ${svgPath}`);
    return SVG_IMAGE_CACHE.get(svgPath)!;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      console.log(`[SVG Loaded] 성공: ${svgPath}, 크기: ${img.width}x${img.height}`);
      SVG_IMAGE_CACHE.set(svgPath, img);
      resolve(img);
    };
    img.onerror = () => {
      console.error(`[SVG Error] 로드 실패: ${svgPath}`);
      // 실패 시 기본 이미지 반환 (흰 캔버스)
      const fallback = new Image();
      fallback.width = 100;
      fallback.height = 100;
      SVG_IMAGE_CACHE.set(svgPath, fallback);
      resolve(fallback);
    };
    console.log(`[SVG Loading] 시작: ${svgPath}`);
    img.src = svgPath;
  });
}

/**
 * SVG 파일을 VectorElement로 변환
 */
export async function loadVectorElements(): Promise<VectorElement[]> {
  console.log(`[VectorLoader] 시작: ${SVG_FILES.length}개 파일 로드`);
  const elements: VectorElement[] = [];

  for (const filename of SVG_FILES) {
    try {
      const svgPath = SVG_FOLDER + filename;
      console.log(`[VectorLoader] 로드 중: ${filename}`);
      
      // 비동기로 이미지 미리 로드
      await loadSVGAsImage(svgPath);

      const element: VectorElement = {
        id: `svg-${filename.replace('.svg', '')}`,
        name: filename.replace('.svg', ''),
        animationMode: getAnimationModeFromName(filename),
        color: '#1AB551', // 기본 그린 색상
        weight: 2,
        customData: {
          svgPath: svgPath,
        },
      };
      elements.push(element);
      console.log(`[VectorLoader] 완료: ${filename}`);
    } catch (e) {
      console.error(`[VectorLoader] 에러: ${filename}`, e);
    }
  }

  console.log(`[VectorLoader] 완료: 총 ${elements.length}개 요소 로드`);
  return elements;
}

/**
 * 벡터 요소의 경로 정보 반환
 */
export function getVectorPath(element: VectorElement): {
  type: 'text' | 'path' | 'svg';
  data: string | Path2D | HTMLImageElement;
} {
  const svgPath = element.customData?.svgPath as string;
  
  if (svgPath && SVG_IMAGE_CACHE.has(svgPath)) {
    return {
      type: 'svg',
      data: SVG_IMAGE_CACHE.get(svgPath)!,
    };
  }

  // Fallback: 요소명을 텍스트로 렌더링
  return {
    type: 'text',
    data: element.name,
  };
}

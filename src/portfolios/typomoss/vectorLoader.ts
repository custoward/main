/**
 * 타이포 이끼 — 벡터 요소 로더
 * 
 * SVG 파일들을 로드하여 Canvas에서 렌더링 가능하도록 변환
 */

import { VectorElement, AnimationMode } from './types';

// public에서 제공되는 SVG 경로들 (포트폴리오별로 분리)
export const SVG_FOLDER = '/portfolios/typomoss/';

// SVG 파일 목록을 동적으로 가져오기
async function getSVGFileList(): Promise<string[]> {
  try {
    // public 폴더의 SVG 파일들을 하드코딩하지만, 쉽게 추가 가능하도록 구조화
    const files = [
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
    
    // 실제로 로드 가능한 파일만 필터링
    const validFiles: string[] = [];
    for (const file of files) {
      try {
        const response = await fetch(SVG_FOLDER + file);
        if (response.ok) {
          validFiles.push(file);
        }
      } catch (e) {
        console.warn(`[VectorLoader] 파일 확인 실패: ${file}`);
      }
    }
    
    return validFiles;
  } catch (e) {
    console.error('[VectorLoader] SVG 목록 가져오기 실패:', e);
    return [];
  }
}

// 로드된 SVG 이미지 캐시
const SVG_IMAGE_CACHE: Map<string, HTMLImageElement> = new Map();

/**
 * 파일명 기반으로 애니메이션 모드 결정
 */
function getAnimationModeFromName(filename: string): AnimationMode {
  if (filename.includes('sticker')) {
    return 'layered'; // sticker: 점층적 스택
  } else if (filename.includes('circle')) {
    return 'rotate'; // circle: 회전
  } else {
    return 'instant'; // 기본: 즉시 나타남
  }
}

/**
 * SVG 파일을 Image로 변환 (캐싱)
 */
export async function loadSVGAsImage(svgPath: string): Promise<HTMLImageElement> {
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
  const SVG_FILES = await getSVGFileList();
  console.log(`[VectorLoader] 시작: ${SVG_FILES.length}개 파일 로드`);
  const elements: VectorElement[] = [];

  for (const filename of SVG_FILES) {
    try {
      const svgPath = SVG_FOLDER + filename;
      console.log(`[VectorLoader] 로드 중: ${filename}`);
      
      // 비동기로 이미지 미리 로드
      await loadSVGAsImage(svgPath);

      const animationMode = getAnimationModeFromName(filename);
      console.log(`[VectorLoader] 파일명: ${filename} → 애니메이션 모드: ${animationMode}`);

      const element: VectorElement = {
        id: `svg-${filename.replace('.svg', '')}`,
        name: filename.replace('.svg', ''),
        animationMode: animationMode,
        color: '#1AB551', // 기본 그린 색상
        weight: 2,
        customData: {
          svgPath: svgPath,
        },
      };
      elements.push(element);
      console.log(`[VectorLoader] 완료: ${filename} (id: ${element.id}, name: ${element.name}, mode: ${element.animationMode})`);
    } catch (e) {
      console.error(`[VectorLoader] 에러: ${filename}`, e);
    }
  }

  console.log(`[VectorLoader] 완료: 총 ${elements.length}개 요소 로드`);
  console.log('[VectorLoader] 로드된 요소 목록:', elements.map(e => ({ name: e.name, mode: e.animationMode })));
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

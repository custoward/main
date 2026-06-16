// 거미줄 연결선 유틸리티

export interface ImagePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * SVG 거미줄 경로를 생성합니다
 */
export const generateWebLines = (
  images: ImagePosition[],
  svgWidth: number,
  svgHeight: number
): string[] => {
  if (images.length < 2) return [];

  const lines: string[] = [];

  // 각 이미지의 중심점 계산
  const centers = images.map((img) => ({
    x: img.x + img.width / 2,
    y: img.y + img.height / 2,
    id: img.id,
  }));

  // 인접한 이미지들을 연결
  for (let i = 0; i < centers.length; i++) {
    // 다음 이미지와 연결 (순환)
    const next = (i + 1) % centers.length;
    const path = `M${centers[i].x},${centers[i].y} Q${
      (centers[i].x + centers[next].x) / 2
    },${(centers[i].y + centers[next].y) / 2 + 30} ${centers[next].x},${centers[next].y}`;

    lines.push(path);
  }

  return lines;
};

/**
 * 이미지가 화면 내에 있는지 확인
 */
export const isImageInBounds = (
  x: number,
  y: number,
  width: number,
  height: number,
  containerWidth: number,
  containerHeight: number
): boolean => {
  return x >= 0 && y >= 0 && x + width <= containerWidth && y + height <= containerHeight;
};

/**
 * 겹치지 않는 랜덤 위치 생성
 */
export const generateRandomPosition = (
  images: ImagePosition[],
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
  containerHeight: number,
  maxAttempts: number = 10
): { x: number; y: number } => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const x = Math.random() * (containerWidth - imageWidth);
    const y = Math.random() * (containerHeight - imageHeight - 100); // 하단 100px 여유

    const newImageBounds: ImagePosition = {
      id: 'temp',
      x,
      y,
      width: imageWidth,
      height: imageHeight,
    };

    // 기존 이미지와 겹치는지 확인
    const overlaps = images.some((img) => checkOverlap(newImageBounds, img));

    if (!overlaps && isImageInBounds(x, y, imageWidth, imageHeight, containerWidth, containerHeight)) {
      return { x, y };
    }

    attempts++;
  }

  // 겹침이 있어도 위치 반환
  return {
    x: Math.random() * (containerWidth - imageWidth),
    y: Math.random() * (containerHeight - imageHeight - 100),
  };
};

/**
 * 두 영역이 겹치는지 확인
 */
const checkOverlap = (rect1: ImagePosition, rect2: ImagePosition, margin: number = 20): boolean => {
  return !(
    rect1.x + rect1.width + margin < rect2.x ||
    rect1.x > rect2.x + rect2.width + margin ||
    rect1.y + rect1.height + margin < rect2.y ||
    rect1.y > rect2.y + rect2.height + margin
  );
};

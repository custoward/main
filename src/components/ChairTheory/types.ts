// The Chair Theory 공유 타입

/** 보드에 배치되는, 참여자가 그린 의자 그림 + 이유 설문지 한 장 */
export interface CapturedImage {
  id: string;
  dataUrl: string;
  timestamp: number;
  x: number;
  y: number;
}

/** 보드 위 이미지 한 변의 크기(px) */
export const IMAGE_SIZE = 150;

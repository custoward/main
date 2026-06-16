// 웹캠으로 비스듬히 촬영된 설문지를 자동으로 펼쳐(원근 보정) 정면 스캔본으로 만든다.
import { loadOpenCV } from './opencvLoader';

export interface ScanResult {
  /** 보정(또는 원본) 결과 이미지 dataURL */
  dataUrl: string;
  /** 문서 사각형을 찾아 실제로 보정했는지 여부 */
  corrected: boolean;
}

interface Point {
  x: number;
  y: number;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 불러오지 못했습니다.'));
    img.src = dataUrl;
  });
}

/** 4개 꼭짓점을 좌상-우상-우하-좌하 순으로 정렬 */
function orderPoints(pts: Point[]): [Point, Point, Point, Point] {
  const bySum = [...pts].sort((a, b) => a.x + a.y - (b.x + b.y));
  const byDiff = [...pts].sort((a, b) => a.y - a.x - (b.y - b.x));
  const tl = bySum[0];
  const br = bySum[bySum.length - 1];
  const tr = byDiff[0];
  const bl = byDiff[byDiff.length - 1];
  return [tl, tr, br, bl];
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * 설문지 영역을 검출해 원근 보정한다.
 * 문서 사각형을 찾지 못하면 원본을 그대로 반환한다(corrected: false).
 */
export async function scanDocument(dataUrl: string): Promise<ScanResult> {
  const cv = await loadOpenCV();
  const img = await loadImage(dataUrl);

  const src = cv.imread(img);
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const edged = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  let kernel: any = null;
  let bestQuad: Point[] | null = null;

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    cv.Canny(blurred, edged, 75, 200);

    // 끊긴 엣지를 메워 외곽선이 닫히도록 팽창
    kernel = cv.Mat.ones(3, 3, cv.CV_8U);
    cv.dilate(edged, edged, kernel);

    cv.findContours(
      edged,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE
    );

    const imgArea = src.rows * src.cols;
    let bestArea = 0;

    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i);
      const area = cv.contourArea(cnt);

      // 너무 작은 윤곽(전체의 20% 미만)은 문서로 보지 않음
      if (area < imgArea * 0.2) {
        cnt.delete();
        continue;
      }

      const peri = cv.arcLength(cnt, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

      if (approx.rows === 4 && area > bestArea) {
        bestArea = area;
        const data = approx.data32S;
        bestQuad = [
          { x: data[0], y: data[1] },
          { x: data[2], y: data[3] },
          { x: data[4], y: data[5] },
          { x: data[6], y: data[7] },
        ];
      }
      approx.delete();
      cnt.delete();
    }

    if (!bestQuad) {
      return { dataUrl, corrected: false };
    }

    const [tl, tr, br, bl] = orderPoints(bestQuad);
    const widthTop = distance(tl, tr);
    const widthBottom = distance(bl, br);
    const heightLeft = distance(tl, bl);
    const heightRight = distance(tr, br);
    const maxWidth = Math.max(1, Math.round(Math.max(widthTop, widthBottom)));
    const maxHeight = Math.max(1, Math.round(Math.max(heightLeft, heightRight)));

    const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
      tl.x, tl.y,
      tr.x, tr.y,
      br.x, br.y,
      bl.x, bl.y,
    ]);
    const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0, 0,
      maxWidth - 1, 0,
      maxWidth - 1, maxHeight - 1,
      0, maxHeight - 1,
    ]);

    const M = cv.getPerspectiveTransform(srcTri, dstTri);
    const warped = new cv.Mat();
    cv.warpPerspective(
      src,
      warped,
      M,
      new cv.Size(maxWidth, maxHeight),
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      new cv.Scalar(255, 255, 255, 255)
    );

    const outCanvas = document.createElement('canvas');
    cv.imshow(outCanvas, warped);
    const out = outCanvas.toDataURL('image/jpeg', 0.9);

    srcTri.delete();
    dstTri.delete();
    M.delete();
    warped.delete();

    return { dataUrl: out, corrected: true };
  } finally {
    src.delete();
    gray.delete();
    blurred.delete();
    edged.delete();
    contours.delete();
    hierarchy.delete();
    if (kernel) kernel.delete();
  }
}

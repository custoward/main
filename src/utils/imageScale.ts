// 이미지 dataURL을 적당한 크기로 줄여 JPEG로 재인코딩한다.
// Firestore 문서 1MB 제한 안에 base64 이미지를 담기 위해 사용.

/**
 * @param dataUrl 원본 이미지 dataURL
 * @param maxSize 가장 긴 변의 최대 픽셀 (기본 1280)
 * @param quality JPEG 품질 0~1 (기본 0.7)
 */
export function downscaleDataUrl(
  dataUrl: string,
  maxSize = 1280,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const longest = Math.max(width, height);
      if (longest > maxSize) {
        const ratio = maxSize / longest;
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

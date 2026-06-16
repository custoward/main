import React, { useState, useEffect, useRef, useMemo } from 'react';
import './TheChairTheory.css';
import WebcamCapture from '../components/ChairTheory/WebcamCapture';
import DocumentCorrection from '../components/ChairTheory/DocumentCorrection';
import PDFViewer from '../components/ChairTheory/PDFViewer';
import '../components/ChairTheory/styles.css';
import { generateRandomPosition, generateWebLines } from '../utils/geometryUtils';
import { CapturedImage, IMAGE_SIZE } from '../components/ChairTheory/types';
import { useChairImages } from '../hooks/useChairImages';
import { loadOpenCV } from '../utils/opencvLoader';

const SURVEY_PDF_URL = `${process.env.PUBLIC_URL}/the-chair-theory-survey.pdf`;

/** 컨테이너 폭에 맞춘 반응형 이미지 크기(px) */
function getImageSize(containerWidth: number): number {
  const w = containerWidth || window.innerWidth;
  return Math.round(Math.max(80, Math.min(IMAGE_SIZE, w / 8)));
}

/**
 * 저장된 위치(정규화 0~1 또는 레거시 px)를 현재 화면의 좌상단 px 좌표로 변환.
 * 정규화 좌표를 쓰므로 창 크기/기기가 달라도 비율대로 배치된다(반응형 + 공동 보드 일관성).
 */
function resolvePixel(
  img: CapturedImage,
  containerWidth: number,
  containerHeight: number,
  size: number
): { left: number; top: number } {
  const maxLeft = Math.max(0, containerWidth - size);
  const maxTop = Math.max(0, containerHeight - size);
  const left = img.x <= 1 ? img.x * maxLeft : Math.min(img.x, maxLeft);
  const top = img.y <= 1 ? img.y * maxTop : Math.min(img.y, maxTop);
  return { left, top };
}

const TheChairTheory: React.FC = () => {
  const { images, isLoading, error, isShared, addImage, removeImage } = useChairImages();

  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [selectedImage, setSelectedImage] = useState<CapturedImage | null>(null);
  // 촬영 직후 원근 보정 단계에 넘길 원본 이미지
  const [pendingRaw, setPendingRaw] = useState<string | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // OpenCV를 미리 로드해 둔다. 촬영 후 "펼치기"가 즉시 동작하도록.
  useEffect(() => {
    loadOpenCV().catch((err) => console.error('OpenCV 사전 로드 실패:', err));
  }, []);

  // 컨테이너 크기 감지
  useEffect(() => {
    const updateSize = () => {
      if (boardRef.current) {
        setContainerSize({
          width: boardRef.current.clientWidth,
          height: boardRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isLoading]);

  // 반응형 이미지 크기
  const imageSize = useMemo(() => getImageSize(containerSize.width), [containerSize.width]);

  // 거미줄 경로 계산 (현재 화면 px 기준)
  const webPaths = useMemo(() => {
    if (images.length < 2) return [];
    const positions = images.map((img) => {
      const { left, top } = resolvePixel(img, containerSize.width, containerSize.height, imageSize);
      return { id: img.id, x: left, y: top, width: imageSize, height: imageSize };
    });
    return generateWebLines(positions, containerSize.width, containerSize.height);
  }, [images, containerSize, imageSize]);

  // 촬영 완료 → 원근 보정 단계로
  const handleCaptured = (rawDataUrl: string) => {
    setPendingRaw(rawDataUrl);
  };

  const handleCloseCapture = () => {
    setShowCaptureModal(false);
    setPendingRaw(null);
  };

  const handleAddImage = (imageData: string) => {
    const W = containerSize.width || window.innerWidth;
    const H = containerSize.height || window.innerHeight;
    const maxLeft = Math.max(1, W - imageSize);
    const maxTop = Math.max(1, H - imageSize);

    // 기존 이미지를 현재 px로 변환해 겹침 검사
    const existingPx = images.map((img) => {
      const { left, top } = resolvePixel(img, W, H, imageSize);
      return { id: img.id, x: left, y: top, width: imageSize, height: imageSize };
    });

    const { x: px, y: py } = generateRandomPosition(existingPx, imageSize, imageSize, W, H);

    const newImage: CapturedImage = {
      id: Date.now().toString(),
      dataUrl: imageData,
      timestamp: Date.now(),
      // 정규화(0~1)해서 저장 → 어느 화면에서도 비율대로 배치
      x: px / maxLeft,
      y: py / maxTop,
    };

    addImage(newImage);
    setPendingRaw(null);
    setShowCaptureModal(false);
  };

  const handleDeleteSelected = () => {
    if (selectedImage) {
      removeImage(selectedImage.id);
      setSelectedImage(null);
    }
  };

  return (
    <div className="the-chair-theory-container">
      {/* Header */}
      <header className="chair-theory-header">
        <div className="header-left">
          <button
            className="instructions-btn"
            onClick={() => setShowInstructions(true)}
            title="설명서"
            aria-label="설명서 열기"
          >
            ?
          </button>
          <button className="survey-btn" onClick={() => setShowSurvey(true)}>
            설문지 양식
          </button>
        </div>

        <h1 className="chair-theory-title">
          The Chair Theory
          {isShared && <span className="shared-badge" title="모든 기기가 같은 보드를 공유 중">공동 보드</span>}
        </h1>

        <a href="/portfolio" className="catalog-link">
          The Chair Catalog →
        </a>
      </header>

      {/* Main Board */}
      <main className="chair-theory-board" ref={boardRef}>
        <svg className="web-canvas" width="100%" height="100%">
          {webPaths.map((d, i) => (
            <path
              key={i}
              d={d}
              stroke="#d0d0d0"
              strokeWidth="1"
              fill="none"
              strokeDasharray="5,5"
            />
          ))}
        </svg>

        {/* 이미지 보드 */}
        <div className="images-board">
          {images.map((image) => {
            const { left, top } = resolvePixel(
              image,
              containerSize.width,
              containerSize.height,
              imageSize
            );
            return (
              <div
                key={image.id}
                className="board-image"
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${imageSize}px`,
                  height: `${imageSize}px`,
                }}
                onClick={() => setSelectedImage(image)}
              >
                <img src={image.dataUrl} alt="누군가가 그린 의자" />
              </div>
            );
          })}
        </div>

        {/* 빈 상태 메시지 */}
        {!isLoading && images.length === 0 && (
          <div className="empty-state">
            <p>아직 그림이 없습니다.</p>
            <p className="empty-hint">
              아래 버튼을 눌러 당신이 생각하는 의자를 보드에 올려보세요.
            </p>
          </div>
        )}

        {error && <div className="board-error">{error}</div>}

        {/* 캡처 버튼 */}
        <button className="capture-btn" onClick={() => setShowCaptureModal(true)}>
          + 그림 추가
        </button>
      </main>

      {/* Capture Modal: 촬영 → 원근 보정 2단계 */}
      {showCaptureModal && (
        <div className="modal-overlay" onClick={handleCloseCapture}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseCapture} aria-label="닫기">
              ×
            </button>
            {pendingRaw ? (
              <DocumentCorrection
                rawDataUrl={pendingRaw}
                onConfirm={handleAddImage}
                onRetake={() => setPendingRaw(null)}
              />
            ) : (
              <WebcamCapture onCapture={handleCaptured} />
            )}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedImage(null)}
              aria-label="닫기"
            >
              ×
            </button>
            <img src={selectedImage.dataUrl} alt="확대된 의자 그림" className="enlarged-image" />
            <div className="image-modal-actions">
              <button className="btn-delete" onClick={handleDeleteSelected}>
                보드에서 삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="modal-overlay" onClick={() => setShowInstructions(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowInstructions(false)}
              aria-label="닫기"
            >
              ×
            </button>
            <h2>The Chair Theory란?</h2>
            <div className="instructions-content">
              <p>
                <strong>1단계:</strong> 설문지에 <em>당신이 생각하는 의자</em>를 자유롭게 그리고,
                그렇게 그린 이유를 적습니다.
              </p>
              <p>
                <strong>2단계:</strong> "+ 그림 추가" 버튼을 누릅니다. 카메라로 설문지를 비추면
                5초 후 자동 촬영되고, <strong>휴대폰에서는 폰카로 찍거나 앨범에서 사진을 골라</strong>
                올릴 수도 있습니다.
              </p>
              <p>
                <strong>3단계:</strong> 촬영된 그림이 보드의 무작위 위치에 놓입니다.
              </p>
              <p>
                <strong>4단계:</strong> 보드의 그림을 클릭하면 크게 볼 수 있습니다.
              </p>
              <hr />
              <p>
                <em>
                  사람마다 다르게 상상한 의자들이 모여, 거미줄처럼 연결된 하나의 보드를 만들어갑니다.
                </em>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Survey PDF Modal */}
      {showSurvey && (
        <div className="modal-overlay" onClick={() => setShowSurvey(false)}>
          <div
            className="modal-content pdf-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowSurvey(false)}
              aria-label="닫기"
            >
              ×
            </button>
            <h2>설문지 양식</h2>
            <PDFViewer url={SURVEY_PDF_URL} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TheChairTheory;

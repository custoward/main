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

  // 거미줄 경로 계산 (React 렌더링용)
  const webPaths = useMemo(() => {
    if (images.length < 2) return [];
    const positions = images.map((img) => ({
      id: img.id,
      x: img.x,
      y: img.y,
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
    }));
    return generateWebLines(positions, containerSize.width, containerSize.height);
  }, [images, containerSize]);

  // 촬영 완료 → 원근 보정 단계로
  const handleCaptured = (rawDataUrl: string) => {
    setPendingRaw(rawDataUrl);
  };

  const handleCloseCapture = () => {
    setShowCaptureModal(false);
    setPendingRaw(null);
  };

  const handleAddImage = (imageData: string) => {
    const { x, y } = generateRandomPosition(
      images.map((img) => ({ ...img, width: IMAGE_SIZE, height: IMAGE_SIZE })),
      IMAGE_SIZE,
      IMAGE_SIZE,
      containerSize.width || window.innerWidth,
      containerSize.height || window.innerHeight
    );

    const newImage: CapturedImage = {
      id: Date.now().toString(),
      dataUrl: imageData,
      timestamp: Date.now(),
      x,
      y,
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
          {images.map((image) => (
            <div
              key={image.id}
              className="board-image"
              style={{
                left: `${image.x}px`,
                top: `${image.y}px`,
                width: `${IMAGE_SIZE}px`,
                height: `${IMAGE_SIZE}px`,
              }}
              onClick={() => setSelectedImage(image)}
            >
              <img src={image.dataUrl} alt="누군가가 그린 의자" />
            </div>
          ))}
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
                <strong>2단계:</strong> "+ 그림 추가" 버튼을 눌러 카메라에 설문지를 보여줍니다.
                5초 후 자동으로 촬영됩니다.
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

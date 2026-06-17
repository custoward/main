import React, { useState, useMemo } from 'react';
import './TheChairTheory.css';
import WebcamCapture from '../components/ChairTheory/WebcamCapture';
import PDFViewer from '../components/ChairTheory/PDFViewer';
import '../components/ChairTheory/styles.css';
import { chairLayout, buildWebPaths } from '../utils/geometryUtils';
import { CapturedImage } from '../components/ChairTheory/types';
import { useChairImages } from '../hooks/useChairImages';
import { LanguageProvider, useLang } from '../i18n';

const SURVEY_PDF_URL = `${process.env.PUBLIC_URL}/the-chair-theory-survey.pdf`;

/** 데모(시각화 전용) 더미 이미지 생성 — DB에 저장하지 않고 렌더링만 한다.
 *  URL에 ?demo=40 같은 쿼리가 있을 때만 사용. (배포 동작에는 영향 없음) */
const makeDemoImages = (count: number): CapturedImage[] => {
  const palette = ['#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#111827'];
  return Array.from({ length: count }, (_, i) => {
    const color = palette[i % palette.length].replace('#', '%23');
    const dataUrl = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='${color}'/%3E%3Ctext x='40' y='48' font-size='28' fill='white' text-anchor='middle' font-family='sans-serif'%3E${i + 1}%3C/text%3E%3C/svg%3E`;
    return { id: `demo-${i}`, dataUrl, timestamp: i, x: 0.5, y: 0.5 };
  });
};

const ChairTheoryInner: React.FC = () => {
  const { t, toggle } = useLang();
  const { images: liveImages, isLoading, error, clientId, addImage, removeImage } =
    useChairImages();

  // ?demo=N 이 있으면 더미 N개로 시각화 (저장/구독과 무관, 읽기 전용)
  const demoCount = useMemo(() => {
    const n = Number(new URLSearchParams(window.location.search).get('demo'));
    return Number.isFinite(n) && n > 0 ? Math.min(n, 300) : 0;
  }, []);
  const images = useMemo(
    () => (demoCount > 0 ? makeDemoImages(demoCount) : liveImages),
    [demoCount, liveImages]
  );

  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [selectedImage, setSelectedImage] = useState<CapturedImage | null>(null);

  // 추가된 순서(timestamp asc)대로 의자 실루엣 좌표를 배정.
  // 이미지 위치와 거미줄이 같은 좌표를 공유하므로 둘 사이 오차가 없다.
  const positions = useMemo(() => chairLayout(images.length), [images.length]);
  const webPaths = useMemo(() => buildWebPaths(positions), [positions]);

  const handleAddImage = (imageData: string) => {
    const newImage: CapturedImage = {
      id: Date.now().toString(),
      dataUrl: imageData,
      timestamp: Date.now(),
      // 위치는 chairLayout이 인덱스 기반으로 결정하므로 저장값은 사용하지 않는다.
      x: 0.5,
      y: 0.5,
    };

    addImage(newImage);
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
          <button className="lang-btn" onClick={toggle} aria-label="Language">
            {t('toggle')}
          </button>
          <button
            className="instructions-btn"
            onClick={() => setShowInstructions(true)}
            title={t('openInstructions')}
            aria-label={t('openInstructions')}
          >
            ?
          </button>
          <button className="survey-btn" onClick={() => setShowSurvey(true)}>
            {t('survey')}
          </button>
        </div>

        <h1 className="chair-theory-title">The Chair Theory</h1>

        <div className="header-right">
          <a href="/catalog" className="catalog-link">
            The Chair Catalog →
          </a>
        </div>
      </header>

      {/* Main Board */}
      <main className="chair-theory-board">
        {/* 이미지와 거미줄이 정확히 같은 좌표 박스를 공유하도록 stage로 묶는다.
            (SVG는 replaced element라 inset만으로는 크기가 어긋날 수 있어 wrapper 사용) */}
        <div className="board-stage">
          <svg
            className="web-canvas"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {webPaths.map((d, i) => (
              <path
                key={i}
                d={d}
                stroke="#d0d0d0"
                strokeWidth="1"
                fill="none"
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {/* 이미지 보드 */}
          <div className="images-board">
            {images.map((image, i) => (
              <div
                key={image.id}
                className="board-image"
                style={{
                  left: `${(positions[i]?.x ?? 0.5) * 100}%`,
                  top: `${(positions[i]?.y ?? 0.5) * 100}%`,
                }}
                onClick={() => setSelectedImage(image)}
              >
                <img src={image.dataUrl} alt={t('capturedAlt')} />
              </div>
            ))}
          </div>
        </div>

        {/* 빈 상태 메시지 */}
        {!isLoading && images.length === 0 && (
          <div className="empty-state">
            <p>{t('emptyTitle')}</p>
            <p className="empty-hint">{t('emptyHint')}</p>
          </div>
        )}

        {error && <div className="board-error">{error}</div>}

        {/* 캡처 버튼 */}
        <button className="capture-btn" onClick={() => setShowCaptureModal(true)}>
          {t('addChair')}
        </button>
      </main>

      {/* Capture Modal: 촬영/업로드 → 바로 보드에 */}
      {showCaptureModal && (
        <div className="modal-overlay" onClick={() => setShowCaptureModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowCaptureModal(false)}
              aria-label={t('close')}
            >
              ×
            </button>
            <WebcamCapture onCapture={handleAddImage} />
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
              aria-label={t('close')}
            >
              ×
            </button>
            <img src={selectedImage.dataUrl} alt={t('enlargedAlt')} className="enlarged-image" />
            <div className="image-modal-actions">
              {selectedImage.ownerId && selectedImage.ownerId === clientId ? (
                <button className="btn-delete" onClick={handleDeleteSelected}>
                  {t('remove')}
                </button>
              ) : (
                <span className="image-modal-note">{t('othersImage')}</span>
              )}
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
              aria-label={t('close')}
            >
              ×
            </button>
            <h2>{t('instructionsTitle')}</h2>
            <div className="instructions-content">
              <p>
                <strong>{t('step1Label')}:</strong> {t('step1Body')}
              </p>
              <p>
                <strong>{t('step2Label')}:</strong> {t('step2Body')}
              </p>
              <p>
                <strong>{t('step3Label')}:</strong> {t('step3Body')}
              </p>
              <p>
                <strong>{t('step4Label')}:</strong> {t('step4Body')}
              </p>
              <hr />
              <p>
                <em>{t('instructionsClosing')}</em>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Survey PDF Modal */}
      {showSurvey && (
        <div className="modal-overlay" onClick={() => setShowSurvey(false)}>
          <div className="modal-content pdf-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowSurvey(false)}
              aria-label={t('close')}
            >
              ×
            </button>
            <h2>{t('survey')}</h2>
            <PDFViewer url={SURVEY_PDF_URL} />
          </div>
        </div>
      )}
    </div>
  );
};

const TheChairTheory: React.FC = () => (
  <LanguageProvider>
    <ChairTheoryInner />
  </LanguageProvider>
);

export default TheChairTheory;

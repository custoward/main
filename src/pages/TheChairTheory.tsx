import React, { useState, useMemo } from 'react';
import './TheChairTheory.css';
import WebcamCapture from '../components/ChairTheory/WebcamCapture';
import PDFViewer from '../components/ChairTheory/PDFViewer';
import '../components/ChairTheory/styles.css';
import { generateRandomCenter, buildWebPaths } from '../utils/geometryUtils';
import { CapturedImage } from '../components/ChairTheory/types';
import { useChairImages } from '../hooks/useChairImages';
import { LanguageProvider, useLang } from '../i18n';

const SURVEY_PDF_URL = `${process.env.PUBLIC_URL}/the-chair-theory-survey.pdf`;

/** 저장값을 정규화 비율(0~1)로 해석. 레거시 px(>1) 값은 중앙으로 폴백. */
const toUnit = (v: number): number => (v > 1 ? 0.5 : v);

const ChairTheoryInner: React.FC = () => {
  const { t, toggle } = useLang();
  const { images, isLoading, error, clientId, addImage, removeImage } = useChairImages();

  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [selectedImage, setSelectedImage] = useState<CapturedImage | null>(null);

  // 거미줄 경로 (정규화 좌표 → 0~100 SVG 공간). 컨테이너 픽셀과 무관.
  const webPaths = useMemo(
    () => buildWebPaths(images.map((img) => ({ x: toUnit(img.x), y: toUnit(img.y) }))),
    [images]
  );

  const handleAddImage = (imageData: string) => {
    const center = generateRandomCenter(
      images.map((img) => ({ x: toUnit(img.x), y: toUnit(img.y) }))
    );

    const newImage: CapturedImage = {
      id: Date.now().toString(),
      dataUrl: imageData,
      timestamp: Date.now(),
      x: center.x,
      y: center.y,
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
          {images.map((image) => (
            <div
              key={image.id}
              className="board-image"
              style={{ left: `${toUnit(image.x) * 100}%`, top: `${toUnit(image.y) * 100}%` }}
              onClick={() => setSelectedImage(image)}
            >
              <img src={image.dataUrl} alt={t('capturedAlt')} />
            </div>
          ))}
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

import React, { useState } from 'react';
import { scanDocument } from '../../utils/documentScan';

interface DocumentCorrectionProps {
  /** 웹캠으로 막 촬영했거나 앨범에서 고른 원본 이미지 */
  rawDataUrl: string;
  /** 사용자가 보드에 올리기로 한 최종 이미지 */
  onConfirm: (finalDataUrl: string) => void;
  /** 다시 촬영 */
  onRetake: () => void;
}

type Status = 'idle' | 'processing' | 'done' | 'failed';

/**
 * 촬영/업로드 직후 단계.
 * 기본은 원본을 그대로 보여주고, 원하면 "자동으로 펼치기"로 원근 보정을 적용한다.
 * (원근 보정용 OpenCV는 무거우므로, 버튼을 누를 때만 로드한다.)
 */
const DocumentCorrection: React.FC<DocumentCorrectionProps> = ({
  rawDataUrl,
  onConfirm,
  onRetake,
}) => {
  const [status, setStatus] = useState<Status>('idle');
  const [correctedUrl, setCorrectedUrl] = useState<string | null>(null);
  const [useCorrected, setUseCorrected] = useState(false);
  const [note, setNote] = useState('');

  const runCorrection = async () => {
    setStatus('processing');
    setNote('');
    try {
      const result = await scanDocument(rawDataUrl);
      if (result.corrected) {
        setCorrectedUrl(result.dataUrl);
        setUseCorrected(true);
        setNote('설문지 영역을 자동으로 펼쳤습니다.');
      } else {
        setUseCorrected(false);
        setNote('문서 외곽을 찾지 못했습니다. 원본을 사용하세요.');
      }
      setStatus('done');
    } catch (err) {
      console.error('원근 보정 실패:', err);
      setUseCorrected(false);
      setNote('자동 보정을 사용할 수 없습니다. 원본을 사용하세요.');
      setStatus('failed');
    }
  };

  const displayUrl = useCorrected && correctedUrl ? correctedUrl : rawDataUrl;
  const processing = status === 'processing';

  return (
    <div className="doc-correction">
      <h2 className="doc-correction-title">촬영 결과 확인</h2>

      <div className="doc-correction-preview">
        {processing ? (
          <div className="doc-correction-loading">
            <div className="doc-spinner" />
            <p>설문지를 펼치는 중…</p>
          </div>
        ) : (
          <img src={displayUrl} alt="미리보기" />
        )}
      </div>

      {!processing && note && <p className="doc-correction-note">{note}</p>}

      {/* 보정본이 있으면 원본/보정본 토글 */}
      {correctedUrl && !processing && (
        <div className="doc-correction-toggle">
          <button
            className={useCorrected ? 'toggle-on' : 'toggle-off'}
            onClick={() => setUseCorrected(true)}
          >
            보정본
          </button>
          <button
            className={!useCorrected ? 'toggle-on' : 'toggle-off'}
            onClick={() => setUseCorrected(false)}
          >
            원본
          </button>
        </div>
      )}

      <div className="doc-correction-actions">
        <button className="btn-secondary" onClick={onRetake} disabled={processing}>
          다시
        </button>
        {/* 아직 보정 안 했을 때만 노출 (선택 사항) */}
        {!correctedUrl && (
          <button className="btn-secondary" onClick={runCorrection} disabled={processing}>
            📐 자동으로 펼치기
          </button>
        )}
        <button className="btn-primary" onClick={() => onConfirm(displayUrl)} disabled={processing}>
          보드에 올리기
        </button>
      </div>
    </div>
  );
};

export default DocumentCorrection;

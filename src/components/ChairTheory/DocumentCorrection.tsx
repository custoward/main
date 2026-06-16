import React, { useEffect, useState } from 'react';
import { scanDocument } from '../../utils/documentScan';

interface DocumentCorrectionProps {
  /** 웹캠으로 막 촬영한 원본 이미지 */
  rawDataUrl: string;
  /** 사용자가 보드에 올리기로 한 최종 이미지 */
  onConfirm: (finalDataUrl: string) => void;
  /** 다시 촬영 */
  onRetake: () => void;
}

type Status = 'processing' | 'done' | 'failed';

/**
 * 촬영 직후 단계: 설문지를 자동으로 펼쳐(원근 보정) 보여주고,
 * 보정본/원본 중 하나를 골라 보드에 올린다.
 */
const DocumentCorrection: React.FC<DocumentCorrectionProps> = ({
  rawDataUrl,
  onConfirm,
  onRetake,
}) => {
  const [status, setStatus] = useState<Status>('processing');
  const [correctedUrl, setCorrectedUrl] = useState<string | null>(null);
  const [useCorrected, setUseCorrected] = useState(true);
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    let active = true;
    setStatus('processing');
    setCorrectedUrl(null);
    setNote('');

    scanDocument(rawDataUrl)
      .then((result) => {
        if (!active) return;
        if (result.corrected) {
          setCorrectedUrl(result.dataUrl);
          setUseCorrected(true);
          setNote('설문지 영역을 자동으로 펼쳤습니다.');
        } else {
          setUseCorrected(false);
          setNote('문서 외곽을 찾지 못해 원본을 사용합니다.');
        }
        setStatus('done');
      })
      .catch((err) => {
        console.error('원근 보정 실패:', err);
        if (!active) return;
        setUseCorrected(false);
        setNote('자동 보정을 사용할 수 없어 원본을 사용합니다.');
        setStatus('failed');
      });

    return () => {
      active = false;
    };
  }, [rawDataUrl]);

  const displayUrl = useCorrected && correctedUrl ? correctedUrl : rawDataUrl;

  const handleConfirm = () => {
    onConfirm(displayUrl);
  };

  return (
    <div className="doc-correction">
      <h2 className="doc-correction-title">촬영 결과 확인</h2>

      <div className="doc-correction-preview">
        {status === 'processing' ? (
          <div className="doc-correction-loading">
            <div className="doc-spinner" />
            <p>설문지를 펼치는 중…</p>
          </div>
        ) : (
          <img src={displayUrl} alt="보정 미리보기" />
        )}
      </div>

      {status !== 'processing' && note && <p className="doc-correction-note">{note}</p>}

      {/* 보정본이 있을 때만 원본/보정본 선택 토글 노출 */}
      {status === 'done' && correctedUrl && (
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
        <button className="btn-secondary" onClick={onRetake} disabled={status === 'processing'}>
          다시 촬영
        </button>
        <button className="btn-primary" onClick={handleConfirm} disabled={status === 'processing'}>
          보드에 올리기
        </button>
      </div>
    </div>
  );
};

export default DocumentCorrection;

import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useLang } from '../../i18n';

// 전시 컴퓨터 오프라인 동작을 위해 public/vendor 의 로컬 worker를 사용한다.
// (node_modules/pdfjs-dist/build/pdf.worker.min.js 를 복사한 파일)
pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/vendor/pdf.worker.min.js`;

interface PDFViewerProps {
  /** 표시할 PDF의 URL (public 경로 또는 외부 URL) */
  url: string;
}

type Status = 'loading' | 'done' | 'error';

const PDFViewer: React.FC<PDFViewerProps> = ({ url }) => {
  const { t } = useLang();
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
    let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
    setStatus('loading');

    (async () => {
      try {
        const task = pdfjsLib.getDocument(url);
        pdfDoc = await task.promise;
        if (cancelled) return;

        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = '';

        // 컨테이너 폭에 맞춰 스케일 계산
        const baseWidth = container.clientWidth || 600;

        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          if (cancelled) return;

          const unscaled = page.getViewport({ scale: 1 });
          const scale = Math.min(2, baseWidth / unscaled.width);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.className = 'pdf-page';
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          container.appendChild(canvas);

          await page.render({ canvasContext: ctx, viewport }).promise;
        }

        if (!cancelled) setStatus('done');
      } catch (err) {
        console.error('PDF 로드 실패:', err);
        if (!cancelled) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      if (pdfDoc) pdfDoc.destroy();
    };
  }, [url]);

  return (
    <div className="pdf-viewer">
      {status === 'loading' && (
        <div className="pdf-status">
          <div className="doc-spinner" />
          <p>{t('pdfLoading')}</p>
        </div>
      )}
      {status === 'error' && (
        <div className="pdf-status">
          <p>{t('pdfError')}</p>
          <p className="pdf-status-hint">{t('pdfHint')}</p>
        </div>
      )}
      <div className="pdf-pages" ref={containerRef} />
    </div>
  );
};

export default PDFViewer;

import React, { useRef, useEffect, useState } from 'react';
import { useLang } from '../../i18n';

interface WebcamCaptureProps {
  onCapture: (imageData: string) => void;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture }) => {
  const { t } = useLang();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setIsCameraReady(true);
        }
      } catch (err) {
        setError(t('cameraUnavailable'));
        console.error('Camera error:', err);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 타이머 시작
  const startCapture = () => {
    setCountdown(5);
  };

  // 카운트다운 실행
  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      captureImage();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL('image/jpeg', 0.8);
        onCapture(imageData);
      }
    }
    setCountdown(null);
  };

  // 파일(폰카 촬영 또는 앨범) 업로드 처리
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onCapture(reader.result);
      }
    };
    reader.readAsDataURL(file);
    // 같은 파일을 다시 선택해도 onChange가 다시 발생하도록 초기화
    e.target.value = '';
  };

  const openFilePicker = () => fileInputRef.current?.click();

  // accept="image/*" + capture 미지정 → 모바일에서 "사진 찍기 / 앨범에서 선택" 모두 가능
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      onChange={handleFileChange}
      style={{ display: 'none' }}
    />
  );

  // 카메라를 못 쓰는 경우(권한 거부/미지원): 파일 업로드만 제공
  if (error) {
    return (
      <div className="webcam-capture">
        <div className="webcam-error">
          <p>{error}</p>
        </div>
        {fileInput}
        <div className="webcam-controls">
          <button className="btn-primary" onClick={openFilePicker}>
            {t('takeOrChoose')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="webcam-capture">
      <div className="webcam-preview">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* 타이머 오버레이 */}
        {countdown !== null && (
          <div className="countdown-overlay">
            <div className="countdown-number">{countdown}</div>
          </div>
        )}

        {/* 설명 텍스트 */}
        {!countdown && (
          <div className="webcam-instruction">
            <p>{t('pointSurvey')}</p>
          </div>
        )}
      </div>

      {fileInput}

      {/* 제어 버튼 */}
      <div className="webcam-controls">
        <button
          className="btn-primary"
          onClick={startCapture}
          disabled={!isCameraReady || countdown !== null}
        >
          {countdown !== null ? t('capturing') : t('timerCapture')}
        </button>
        <button
          className="btn-secondary"
          onClick={captureImage}
          disabled={!isCameraReady || countdown !== null}
        >
          {t('captureNow')}
        </button>
        <button className="btn-secondary" onClick={openFilePicker}>
          {t('chooseFromAlbum')}
        </button>
      </div>
    </div>
  );
};

export default WebcamCapture;

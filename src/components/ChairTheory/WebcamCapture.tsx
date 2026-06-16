import React, { useRef, useEffect, useState } from 'react';

interface WebcamCaptureProps {
  onCapture: (imageData: string) => void;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
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
        setError('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
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

  if (error) {
    return (
      <div className="webcam-error">
        <p>{error}</p>
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
            <p>설문지를 카메라에 대세요</p>
          </div>
        )}
      </div>

      {/* 제어 버튼 */}
      <div className="webcam-controls">
        <button
          className="btn-primary"
          onClick={startCapture}
          disabled={!isCameraReady || countdown !== null}
        >
          {countdown !== null ? '촬영 중...' : '5초 타이머로 촬영'}
        </button>
        <button
          className="btn-secondary"
          onClick={captureImage}
          disabled={!isCameraReady || countdown !== null}
        >
          지금 촬영
        </button>
      </div>
    </div>
  );
};

export default WebcamCapture;

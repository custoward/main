// OpenCV.js를 런타임에 동적 로드한다.
// CRA의 webpack 설정을 건드리지 않기 위해 <script> 주입 방식을 사용한다.
// 전시 컴퓨터에서 오프라인/일정한 속도로 동작하도록 public/vendor 의 로컬 파일을 사용한다.
// (CDN으로 되돌리려면 OPENCV_URL만 'https://docs.opencv.org/4.9.0/opencv.js' 로 바꾸면 됨)

declare global {
  // eslint-disable-next-line no-var
  var cv: any;
  interface Window {
    cv?: any;
  }
}

const OPENCV_URL = `${process.env.PUBLIC_URL}/vendor/opencv.js`;
const SCRIPT_ID = 'opencv-js';

let loaderPromise: Promise<any> | null = null;

function waitForRuntime(resolve: (cv: any) => void, reject: (e: Error) => void) {
  const cv = window.cv;

  // 이미 초기화 완료
  if (cv && cv.Mat) {
    resolve(cv);
    return;
  }
  // 일부 빌드는 promise 형태로 노출
  if (cv && typeof cv.then === 'function') {
    cv.then(resolve).catch((e: Error) => reject(e));
    return;
  }
  // Emscripten 모듈: 런타임 초기화 콜백 등록
  if (cv) {
    cv.onRuntimeInitialized = () => resolve(window.cv);
    return;
  }

  // 폴링 폴백 (최대 ~10초)
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (window.cv && window.cv.Mat) {
      clearInterval(timer);
      resolve(window.cv);
    } else if (tries > 200) {
      clearInterval(timer);
      reject(new Error('OpenCV 초기화 시간 초과'));
    }
  }, 50);
}

export function loadOpenCV(): Promise<any> {
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<any>((resolve, reject) => {
    if (window.cv && window.cv.Mat) {
      resolve(window.cv);
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      waitForRuntime(resolve, reject);
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = OPENCV_URL;
    script.async = true;
    script.onload = () => waitForRuntime(resolve, reject);
    script.onerror = () => {
      loaderPromise = null; // 재시도 가능하도록 초기화
      reject(new Error('OpenCV 스크립트를 불러오지 못했습니다. (네트워크 확인)'));
    };
    document.body.appendChild(script);
  });

  return loaderPromise;
}

export function isOpenCVReady(): boolean {
  return !!(window.cv && window.cv.Mat);
}

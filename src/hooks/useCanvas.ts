import { useRef, useEffect } from "react";

const useCanvas = (setCanvas: (canvas: HTMLCanvasElement) => void) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas && setCanvas(canvas);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return canvasRef;
};

export default useCanvas;

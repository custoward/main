import React from 'react';
import { useCanvas } from '../../hooks';
import Wrapper from './style';
// Use centralized assets barrel
import { background as MAP_BACKGROUND } from '../../assets/';

const WIDTH = 500;
const HEIGHT = 1000;


const Canvas = () => {
  const canvasRef = useCanvas((canvas) => {
    // make the canvas fill the viewport but sit behind content
    canvas.height = window.innerHeight + 50;
    canvas.width = window.innerWidth;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
  canvas.style.zIndex = '-2';
    canvas.style.pointerEvents = 'none';
    
    window.addEventListener('resize', () => {
      canvas.height = window.innerHeight + 50;
      canvas.width = window.innerWidth;
    });

    // Use the imported image (bundled) so the visual stays the same
    canvas.style.background = `url(${MAP_BACKGROUND})`;
  });

  return (
    <Wrapper>
      <canvas ref={canvasRef} />
    </Wrapper>
  );
};



export default Canvas;
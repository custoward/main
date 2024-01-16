import React from 'react';
import useCanvas from '../../hook/usecanvas';
import Wrapper from './style';
import mapBackground from '../../public/images/map_background.jpeg';

const WIDTH = 500;
const HEIGHT = 1000;


const Canvas = () => {
  const canvasRef = useCanvas((canvas) => {
    canvas.height = window.innerHeight+50
    canvas.width = window.innerWidth
    
    window.addEventListener('resize', () => {  
      canvas.height = window.innerHeight+50
      canvas.width = window.innerWidth
    })
    canvas.style.background = `url(${mapBackground})`;
  });

  return (
    <Wrapper>
      <canvas ref={canvasRef} />
    </Wrapper>
  );
};



export default Canvas;
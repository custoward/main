import React, { RefObject, useEffect, useRef, useState } from "react";

const Canvas: React.FC = () => {
	const canvasRef: RefObject<HTMLCanvasElement> =
		useRef<HTMLCanvasElement>(null);
    const [btx, setBtx] = useState<CanvasRenderingContext2D | null>(null);
	const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

    const Width = 500;
    const Height = 500;

	// 컨텍스트 셋팅
	useEffect(() => {
		if (canvasRef?.current) {
			const canvas = canvasRef.current;
			const context = canvas.getContext("2d");

            setBtx(context);
			setCtx(context);
		}
	}, [canvasRef]);

	useEffect(() => {
		let requestAnimationId: number;
        
		// 애니메이션 처리
		const onAnimation = () => {
            if (btx) {
                btx.fillStyle = "rgb(10,100,200)";
				btx.fillRect(0, 0, Width, Height);
			}
			if (ctx) {
                ctx.fillStyle = "rgb(10,250,30)";
				ctx.fillRect(20, 20, 30, 30);
			}
			requestAnimationId = window.requestAnimationFrame(onAnimation);
		};

		// 리퀘스트 애니메이션 초기화
		requestAnimationId = window.requestAnimationFrame(onAnimation);

		return () => {
			// 기존 리퀘스트 애니메이션 캔슬
			window.cancelAnimationFrame(requestAnimationId);
		};
	}, [btx, ctx]);

	return <canvas ref={canvasRef} width={Width} height={Height} />;
};

export default Canvas;
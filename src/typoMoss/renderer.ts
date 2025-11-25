/**
 * 타이포 이끼 — Canvas 렌더러
 * 
 * 1920×1080 Canvas에서 요소들을 관리하고 렌더링
 */

import {
  RenderConfig,
  RenderInstance,
  VectorElement,
} from './types';
import { DEFAULT_RENDER_CONFIG, ANIMATION_MODE_DEFAULTS } from './config';
import {
  getAnimationProperties,
} from './animationModes';
import { getVectorPath } from './vectorLoader';

export class TypoMossRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: RenderConfig;
  private instances: Map<string, RenderInstance> = new Map();
  private elements: VectorElement[] = [];
  private frameCount: number = 0;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private instanceIdCounter: number = 0;

  constructor(canvas: HTMLCanvasElement, config?: Partial<RenderConfig>) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.config = { ...DEFAULT_RENDER_CONFIG, ...config };
    this.setupCanvas();
  }

  /**
   * Canvas 초기화
   */
  private setupCanvas(): void {
    this.canvas.width = this.config.canvasWidth;
    this.canvas.height = this.config.canvasHeight;
    this.ctx.fillStyle = this.config.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 벡터 요소 설정
   */
  public setElements(elements: VectorElement[]): void {
    console.log(`[Renderer] 요소 설정: ${elements.length}개`);
    this.elements = elements;
    elements.forEach((el) => {
      console.log(`  - ${el.name} (${el.id})`);
    });
  }

  /**
   * 설정 업데이트
   */
  public updateConfig(config: Partial<RenderConfig>): void {
    this.config = { ...this.config, ...config };
    this.setupCanvas();
  }

  /**
   * 새로운 인스턴스 생성
   */
  private createInstance(element: VectorElement): RenderInstance {
    const mode = element.animationMode;
    const modeConfig = ANIMATION_MODE_DEFAULTS[mode];

    const instance: RenderInstance = {
      id: `inst-${this.instanceIdCounter++}`,
      elementId: element.id,
      elementName: element.name,
      x: Math.random() * this.config.canvasWidth,
      y: Math.random() * this.config.canvasHeight,
      size: this.config.minSize + Math.random() * (this.config.maxSize - this.config.minSize),
      rotation: Math.random() * Math.PI * 2,
      opacity: 1,
      animationMode: mode,
      age: 0,
      lifespan: modeConfig.duration,
      seed: Math.random(),
      customProps: {},
    };

    return instance;
  }

  /**
   * 프레임 업데이트: 새 요소 스폰, 기존 요소 업데이트
   */
  private update(): void {
    // 1) 새로운 요소 스폰 (낮은 제거율 = 천천히 누적)
    if (
      this.instances.size < this.config.maxInstances &&
      Math.random() < this.config.spawnRate * (this.config.density || 1)
    ) {
      if (this.elements.length > 0) {
        const randomElement = this.elements[Math.floor(Math.random() * this.elements.length)];
        const newInstance = this.createInstance(randomElement);
        this.instances.set(newInstance.id, newInstance);
      }
    }

    // 2) 기존 요소 업데이트 및 제거 (90% 유지 = 매우 낮은 제거율)
    const idsToDelete: string[] = [];
    this.instances.forEach((instance, id) => {
      instance.age++;

      // 매우 낮은 제거율: 0.1% (거의 안 사라짐)
      // lifespan 만료 또는 매우 낮은 확률로만 제거
      if (instance.age >= instance.lifespan || Math.random() < 0.001) {
        idsToDelete.push(id);
      }
    });
    idsToDelete.forEach((id) => this.instances.delete(id));

    this.frameCount++;
  }

  /**
   * Canvas에 요소 렌더링
   */
  private render(): void {
    // 배경 초기화
    this.ctx.fillStyle = this.config.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 각 인스턴스 렌더링
    this.instances.forEach((instance) => {
      const element = this.elements.find((e) => e.id === instance.elementId);
      if (!element) return;

      const animProps = getAnimationProperties(
        instance,
        1 / 60, // deltaTime (assumed 60 FPS)
        instance.animationMode,
        instance.elementName
      );

      // 애니메이션 속성 적용
      const scale = (animProps.scale as number) || 1;
      const opacity = (animProps.opacity as number) || 1;

      this.renderInstance(instance, element, scale, opacity, animProps);
    });
  }

  /**
   * 단일 인스턴스 렌더링
   */
  private renderInstance(
    instance: RenderInstance,
    element: VectorElement,
    scale: number,
    opacity: number,
    animProps: Record<string, unknown>
  ): void {
    this.ctx.save();

    // 위치 및 회전 설정
    this.ctx.translate(instance.x, instance.y);
    const rotation = (animProps.rotation as number) || instance.rotation;
    this.ctx.rotate(rotation);

    // 스케일 적용
    this.ctx.scale(scale, scale);

    // 불투명도 설정
    this.ctx.globalAlpha = opacity;

    // 색상 설정
    this.ctx.fillStyle = element.color || '#1AB551';
    this.ctx.strokeStyle = element.color || '#1AB551';
    this.ctx.lineWidth = element.weight || 2;

    // 벡터 경로 가져오기
    const path = getVectorPath(element);

    if (path.type === 'svg' && path.data instanceof HTMLImageElement) {
      // SVG 이미지 렌더링 (Aspect Ratio 유지)
      const img = path.data as HTMLImageElement;
      if (img.width > 0 && img.height > 0) {
        const size = instance.size;
        // Aspect Ratio 계산
        const aspectRatio = img.width / img.height;
        let drawWidth = size;
        let drawHeight = size / aspectRatio;

        // 높이가 크기를 초과하면 높이 기준으로 조정
        if (drawHeight > size) {
          drawHeight = size;
          drawWidth = size * aspectRatio;
        }

        // 이미지를 중앙 기준으로 그리기 (aspect ratio 유지)
        this.ctx.drawImage(
          img,
          -drawWidth / 2,
          -drawHeight / 2,
          drawWidth,
          drawHeight
        );
      } else {
        console.warn(`[Render] 이미지 크기 없음: ${element.name} (${img.width}x${img.height})`);
      }
    } else if (path.type === 'text') {
      // Fallback: 텍스트 렌더링
      console.warn(`[Render] SVG 로드 실패, 텍스트 렌더링: ${element.name}`);
      this.ctx.font = `bold ${instance.size * 0.6}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(path.data as string, 0, 0);
    } else if (path.type === 'path' && path.data instanceof Path2D) {
      // SVG Path 렌더링 (나중 확장)
      this.ctx.fill(path.data as Path2D);
    }

    this.ctx.restore();
  }

  /**
   * 메인 루프
   */
  private mainLoop = (): void => {
    this.update();
    this.render();

    if (this.isRunning) {
      this.animationFrameId = requestAnimationFrame(this.mainLoop);
    }
  };

  /**
   * 렌더링 시작
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.mainLoop();
  }

  /**
   * 렌더링 중지
   */
  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * 초기화
   */
  public reset(): void {
    this.stop();
    this.instances.clear();
    this.frameCount = 0;
    this.instanceIdCounter = 0;
    this.setupCanvas();
  }

  /**
   * 현재 상태 반환 (디버깅용)
   */
  public getStats(): {
    frameCount: number;
    instanceCount: number;
    maxInstances: number;
  } {
    return {
      frameCount: this.frameCount,
      instanceCount: this.instances.size,
      maxInstances: this.config.maxInstances,
    };
  }
}

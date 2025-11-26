/**
 * 타이포 이끼 — Canvas 렌더러
 * 
 * 1920×1080 Canvas에서 요소들을 관리하고 렌더링
 */

import {
  RenderConfig,
  RenderInstance,
  VectorElement,
  ElementConfig,
} from './types';
import { DEFAULT_RENDER_CONFIG, ANIMATION_MODE_DEFAULTS, ELEMENT_CONFIGS } from './config';
import { getAnimationProperties } from './animationModes';
import { getVectorPath } from './vectorLoader';

export class TypoMossRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: RenderConfig;
  private instances: Map<string, RenderInstance> = new Map();
  private elements: VectorElement[] = [];
  private elementConfigs: Map<string, ElementConfig> = new Map();
  private frameCount: number = 0;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private instanceIdCounter: number = 0;
  private startTime: number = Date.now(); // 시작 시간 기록

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
    this.elementConfigs.clear();
    elements.forEach((el) => {
      console.log(`  - ${el.name} (${el.id})`);
      // 각 요소에 대한 설정 로드
      const config = ELEMENT_CONFIGS[el.id];
      if (config) {
        this.elementConfigs.set(el.id, config);
      } else {
        // 기본 설정 자동 생성 (파일명 기반)
        console.log(`  - 기본 설정 생성: ${el.id}, name: ${el.name}, mode: ${el.animationMode}`);
        
        // 파일명에서 자동으로 빈도 결정
        let frequency = 0.1; // 기본값
        if (el.name.includes('sticker')) {
          frequency = 0.8; // sticker는 높은 빈도
          console.log(`    → sticker 감지: frequency = 0.8`);
        } else if (el.name.includes('circle')) {
          frequency = 0.12; // circle은 중간 빈도
          console.log(`    → circle 감지: frequency = 0.12`);
        } else {
          console.log(`    → 기본값: frequency = 0.1`);
        }
        
        const defaultConfig: ElementConfig = {
          elementId: el.id,
          frequency: frequency,
          maxSize: 100,
          animationMode: el.animationMode,
          animationSpeed: 1.0,
        };
        console.log(`    → 최종 설정:`, defaultConfig);
        this.elementConfigs.set(el.id, defaultConfig);
      }
    });
  }

  /**
   * 요소별 설정 업데이트
   */
  public updateElementConfig(elementId: string, config: Partial<ElementConfig>): void {
    const existing = this.elementConfigs.get(elementId);
    if (existing) {
      this.elementConfigs.set(elementId, { ...existing, ...config });
      console.log(`[Renderer] 요소 설정 업데이트: ${elementId}`, config);
      
      // 기존 인스턴스들의 애니메이션 모드도 업데이트
      if (config.animationMode) {
        const newMode = config.animationMode;
        this.instances.forEach((instance) => {
          if (instance.elementId === elementId) {
            instance.animationMode = newMode;
            // lifespan도 새 모드에 맞게 재계산
            const modeConfig = ANIMATION_MODE_DEFAULTS[newMode];
            const speed = (config.animationSpeed || instance.customProps?.animationSpeed || 1) as number;
            instance.lifespan = Math.round(modeConfig.duration / speed);
          }
        });
      }
    }
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
    const elementConfig = this.elementConfigs.get(element.id);
    const mode = elementConfig?.animationMode || element.animationMode;
    const modeConfig = ANIMATION_MODE_DEFAULTS[mode];
    const maxSize = elementConfig?.maxSize || this.config.maxSize;

    let x: number;
    let y: number;
    let rotation: number = Math.random() * Math.PI * 2; // 기본 회전값
    let customProps: Record<string, unknown> = { animationSpeed: elementConfig?.animationSpeed || 1 };

    // layered 모드: 같은 요소들이 일정한 방향과 각도로 쌓임
    if (mode === 'layered') {
      const sameElementInstances = Array.from(this.instances.values())
        .filter(inst => inst.elementId === element.id && inst.animationMode === 'layered');
      
      // 현재 뭉치의 레이어 개수 확인
      let currentClusterId = 0;
      let currentLayerIndex = 0;
      
      if (sameElementInstances.length > 0) {
        const recent = sameElementInstances[sameElementInstances.length - 1];
        currentClusterId = (recent.customProps?.clusterId as number) || 0;
        currentLayerIndex = (recent.customProps?.layerIndex as number) || 0;
        
        // 현재 뭉치의 최대 레이어 수 (5-7개)
        const maxLayersInCluster = (recent.customProps?.maxLayersInCluster as number) || 6;
        
        // 현재 뭉치가 가득 찼으면 새 뭉치 시작
        if (currentLayerIndex >= maxLayersInCluster - 1) {
          currentClusterId++;
          currentLayerIndex = 0;
          
          // 새 위치와 크기
          x = Math.random() * this.config.canvasWidth;
          y = Math.random() * this.config.canvasHeight;
          
          const stackDirection = Math.random() * Math.PI * 2;
          
          // 회전 증가량과 위치 편차 확률 분포
          // 40% 확률로 작은 회전값 & 큰 편차 (0-3도 회전, 15-20px 편차)
          // 60% 확률로 큰 회전값 & 작은 편차 (6-20도 회전, 5-10px 편차)
          const useSmallRotation = Math.random() < 0.4;
          
          let rotationDegrees: number;
          let stackSpacingValue: number;
          
          if (useSmallRotation) {
            // 작은 회전값 (0-3도, 3도 미만이면 0으로)
            const rawRotation = Math.random() * 3; // 0-3도
            rotationDegrees = rawRotation < 3 ? 0 : rawRotation;
            // 큰 위치 편차 (15-20px)
            stackSpacingValue = 15 + Math.random() * 5;
          } else {
            // 큰 회전값 (6-20도)
            rotationDegrees = 6 + Math.random() * 14;
            // 작은 위치 편차 (5-10px)
            stackSpacingValue = 5 + Math.random() * 5;
          }
          
          const stackRotation = (rotationDegrees * Math.PI) / 180; // 라디안으로 변환
          const fixedSize = this.config.minSize + Math.random() * (maxSize - this.config.minSize);
          const maxLayersInCluster = Math.floor(Math.random() * 3) + 5; // 5-7개
          const baseRotation = Math.random() * Math.PI * 2; // 뭉치의 기본 회전값 고정
          
          rotation = baseRotation; // 기본 회전값 사용
          
          customProps = {
            ...customProps,
            baseX: x,
            baseY: y,
            stackDirection,
            stackRotation,
            fixedSize,
            layerIndex: 0,
            clusterId: currentClusterId,
            maxLayersInCluster,
            baseRotation, // 뭉치의 기본 회전값 저장
            stackSpacing: stackSpacingValue, // 이 뭉치의 고유 간격
          };
        } else {
          // 기존 뭉치에 계속 쌓기
          const first = sameElementInstances.find(inst => 
            (inst.customProps?.clusterId as number) === currentClusterId
          ) || sameElementInstances[0];
          
          const baseX = first.customProps?.baseX as number;
          const baseY = first.customProps?.baseY as number;
          const stackDirection = first.customProps?.stackDirection as number;
          const stackRotation = first.customProps?.stackRotation as number;
          const fixedSize = first.customProps?.fixedSize as number;
          const maxLayersInCluster = first.customProps?.maxLayersInCluster as number;
          const baseRotation = first.customProps?.baseRotation as number;
          const stackSpacing = (first.customProps?.stackSpacing as number) || 10;
          
          currentLayerIndex++;
          
          x = baseX + Math.cos(stackDirection) * stackSpacing * currentLayerIndex;
          y = baseY + Math.sin(stackDirection) * stackSpacing * currentLayerIndex;
          
          // 기본 회전값 + (레이어 인덱스 * 회전 증가량)
          rotation = baseRotation + (stackRotation * currentLayerIndex);
          
          customProps = {
            ...customProps,
            baseX,
            baseY,
            stackDirection,
            stackRotation,
            fixedSize,
            layerIndex: currentLayerIndex,
            clusterId: currentClusterId,
            maxLayersInCluster,
            baseRotation,
            stackSpacing,
          };
        }
      } else {
        // 첫 번째 인스턴스: 기준점 설정
        x = Math.random() * this.config.canvasWidth;
        y = Math.random() * this.config.canvasHeight;
        
        const stackDirection = Math.random() * Math.PI * 2;
        
        // 회전 증가량과 위치 편차 확률 분포
        // 40% 확률로 작은 회전값 & 큰 편차
        // 60% 확률로 큰 회전값 & 작은 편차
        const useSmallRotation = Math.random() < 0.4;
        
        let rotationDegrees: number;
        let stackSpacingValue: number;
        
        if (useSmallRotation) {
          // 작은 회전값 (0-3도, 3도 미만이면 0으로)
          const rawRotation = Math.random() * 3;
          rotationDegrees = rawRotation < 3 ? 0 : rawRotation;
          // 큰 위치 편차 (15-20px)
          stackSpacingValue = 15 + Math.random() * 5;
        } else {
          // 큰 회전값 (6-20도)
          rotationDegrees = 6 + Math.random() * 14;
          // 작은 위치 편차 (5-10px)
          stackSpacingValue = 5 + Math.random() * 5;
        }
        
        const stackRotation = (rotationDegrees * Math.PI) / 180;
        const fixedSize = this.config.minSize + Math.random() * (maxSize - this.config.minSize);
        const maxLayersInCluster = Math.floor(Math.random() * 3) + 5; // 5-7개
        const baseRotation = Math.random() * Math.PI * 2; // 뭉치의 기본 회전값 고정
        
        rotation = baseRotation;
        
        customProps = {
          ...customProps,
          baseX: x,
          baseY: y,
          stackDirection,
          stackRotation,
          fixedSize,
          layerIndex: 0,
          clusterId: 0,
          maxLayersInCluster,
          baseRotation,
          stackSpacing: stackSpacingValue,
        };
      }
    } else {
      // 다른 모드: 완전히 랜덤 위치
      x = Math.random() * this.config.canvasWidth;
      y = Math.random() * this.config.canvasHeight;
    }

    const size = mode === 'layered' && customProps.fixedSize 
      ? customProps.fixedSize as number
      : this.config.minSize + Math.random() * (maxSize - this.config.minSize);

    // rotate 모드의 회전 방향 랜덤 결정
    const rotationDirection = mode === 'rotate' ? (Math.random() < 0.5 ? 1 : -1) : 1;

    const instance: RenderInstance = {
      id: `inst-${this.instanceIdCounter++}`,
      elementId: element.id,
      elementName: element.name,
      x,
      y,
      size,
      rotation, // 고정된 회전값 사용
      opacity: 1,
      animationMode: mode,
      age: 0,
      lifespan: mode === 'layered' ? 999999 : Math.round(modeConfig.duration / (elementConfig?.animationSpeed || 1)), // layered는 매우 긴 lifespan
      seed: Math.random(),
      customProps: {
        ...customProps,
        rotationDirection, // 회전 방향 저장
      },
    };

    return instance;
  }

  /**
   * 프레임 업데이트: 새 요소 스폰, 기존 요소 업데이트
   */
  private update(): void {
    // 초반 가속 모드 (처음 10초 동안 5배 빠르게)
    const elapsedSeconds = (Date.now() - this.startTime) / 1000;
    const speedMultiplier = elapsedSeconds < 10 ? 5 : 1;
    
    // 밀도에 따른 동적 최대 개수 계산 (0.1 → 80개, 0.6 → 200개, 1.0 → 280개)
    const dynamicMaxInstances = Math.floor(80 + (this.config.density || 1) * 200);
    
    // 1) 새로운 요소 스폰 (빈도 기반)
    for (let i = 0; i < speedMultiplier; i++) {
      if (this.instances.size < dynamicMaxInstances && this.elements.length > 0) {
        const randomElement = this.elements[Math.floor(Math.random() * this.elements.length)];
        const elementConfig = this.elementConfigs.get(randomElement.id);
        const frequency = elementConfig?.frequency || 0.1;
        
        // layered 모드는 density 영향 없이 일정한 속도로 생성
        const spawnChance = randomElement.animationMode === 'layered' 
          ? frequency 
          : frequency * (this.config.density || 1);
        
        if (Math.random() < spawnChance) {
          const newInstance = this.createInstance(randomElement);
          this.instances.set(newInstance.id, newInstance);
        }
      }
    }

    // 2) 기존 요소 업데이트
    this.instances.forEach((instance) => {
      instance.age++;
    });

    // 3) 최대 인스턴스 수의 70%를 넘으면 layered 뭉치 제거 (더 일찍, 더 자주 제거)
    const removalThreshold = dynamicMaxInstances * 0.7; // 70%만 채워도 제거 시작
    if (this.instances.size > removalThreshold) {
      const layeredInstances = Array.from(this.instances.values())
        .filter(inst => inst.animationMode === 'layered');
      
      if (layeredInstances.length > 0) {
        // 가장 오래된 뭉치 찾기
        const oldestInstance = layeredInstances.reduce((oldest, current) => {
          return current.age > oldest.age ? current : oldest;
        });
        
        const clusterToRemove = oldestInstance.customProps?.clusterId as number;
        const elementToRemove = oldestInstance.elementId;
        
        // 같은 clusterId와 elementId를 가진 모든 인스턴스 제거
        const idsToDelete: string[] = [];
        this.instances.forEach((inst, id) => {
          if (inst.animationMode === 'layered' && 
              inst.elementId === elementToRemove &&
              (inst.customProps?.clusterId as number) === clusterToRemove) {
            idsToDelete.push(id);
          }
        });
        idsToDelete.forEach((id) => this.instances.delete(id));
      }
    }

    // 4) 다른 모드는 lifespan 기반으로 제거
    const idsToDelete: string[] = [];
    this.instances.forEach((instance, id) => {
      if (instance.animationMode !== 'layered' && instance.age >= instance.lifespan) {
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

    // 애니메이션에서 넘어온 위치 오프셋과 회전값
    const offsetX = (animProps.offsetX as number) || 0;
    const offsetY = (animProps.offsetY as number) || 0;

    // 위치 및 회전 설정 (오프셋 적용)
    this.ctx.translate(instance.x + offsetX, instance.y + offsetY);
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
        const size = instance.size * 2; // 이미지 크기 2배
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
      this.ctx.font = `bold ${instance.size * 0.6 * 2}px Arial`;
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
    const wasRunning = this.isRunning;
    this.stop();
    this.instances.clear();
    this.frameCount = 0;
    this.instanceIdCounter = 0;
    this.startTime = Date.now(); // 시작 시간 초기화
    this.setupCanvas();
    if (wasRunning) {
      this.start();
    }
  }

  /**
   * 현재 상태 반환 (디버깅용)
   */
  public getStats(): {
    frameCount: number;
    instanceCount: number;
    maxInstances: number;
  } {
    // 밀도에 따른 동적 최대 개수 계산
    const dynamicMaxInstances = Math.floor(80 + (this.config.density || 1) * 200);
    
    return {
      frameCount: this.frameCount,
      instanceCount: this.instances.size,
      maxInstances: dynamicMaxInstances,
    };
  }
}

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
  AnimationMode,
} from './types';
import { DEFAULT_RENDER_CONFIG, ANIMATION_MODE_DEFAULTS, ELEMENT_CONFIGS, DEFAULT_RANDOM_MODE_CONFIG } from './config';
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
    this.elements = elements;
    this.elementConfigs.clear();
    elements.forEach((el) => {
      // 각 요소에 대한 설정 로드
      const config = ELEMENT_CONFIGS[el.id];
      if (config) {
        this.elementConfigs.set(el.id, config);
      } else {
        // 기본 설정 자동 생성 (파일명 기반)
        
        // 파일명에서 자동으로 빈도 결정
        let frequency = 0.1; // 기본값
        if (el.name.includes('sticker')) {
          frequency = 0.8; // sticker는 높은 빈도
        } else if (el.name.includes('circle')) {
          frequency = 0.12; // circle은 중간 빈도
        }
        
        const defaultConfig: ElementConfig = {
          elementId: el.id,
          frequency: frequency,
          maxSize: 100,
          animationMode: el.animationMode,
          animationSpeed: 1.0,
        };
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
   * Random 모드에서 실제 모드 선택
   */
  private selectRandomMode(config: { layered: number; rotate: number; pulse: number; flicker: number; grow: number }): AnimationMode {
    const rand = Math.random();
    let cumulative = 0;
    
    const modes: (keyof typeof config)[] = ['layered', 'rotate', 'pulse', 'flicker', 'grow'];
    for (const mode of modes) {
      cumulative += config[mode];
      if (rand < cumulative) {
        return mode as AnimationMode;
      }
    }
    
    return 'pulse'; // 기본값
  }

  /**
   * 새로운 인스턴스 생성
   */
  private createInstance(element: VectorElement): RenderInstance {
    const elementConfig = this.elementConfigs.get(element.id);
    let mode = elementConfig?.animationMode || element.animationMode;
    
    // random 모드인 경우 실제 모드 선택
    let actualMode: AnimationMode = mode;
    if (mode === 'random') {
      const randomConfig = elementConfig?.randomModeConfig || DEFAULT_RANDOM_MODE_CONFIG;
      actualMode = this.selectRandomMode(randomConfig);
    }
    
    const modeConfig = ANIMATION_MODE_DEFAULTS[actualMode === 'random' ? 'rotate' : actualMode];
    const maxSize = elementConfig?.maxSize || this.config.maxSize;

    let x: number;
    let y: number;
    let rotation: number = Math.random() * Math.PI * 2; // 기본 회전값
    let customProps: Record<string, unknown> = { 
      animationSpeed: elementConfig?.animationSpeed || 1,
      actualMode: actualMode, // random 모드일 때 실제 선택된 모드 저장
    };

    // layered 모드: 같은 요소들이 일정한 방향과 각도로 쌓임
    if (actualMode === 'layered') {
      const sameElementInstances = Array.from(this.instances.values())
        .filter(inst => inst.elementId === element.id && (inst.customProps?.actualMode === 'layered' || inst.animationMode === 'layered'));
      
      if (sameElementInstances.length > 0) {
        // 기존 클러스터들을 분석하여 가장 최근 클러스터 찾기
        const clusterMap = new Map<number, RenderInstance[]>();
        sameElementInstances.forEach(inst => {
          const cId = (inst.customProps?.clusterId as number) || 0;
          if (!clusterMap.has(cId)) {
            clusterMap.set(cId, []);
          }
          clusterMap.get(cId)!.push(inst);
        });
        
        // 가장 큰 clusterId 찾기
        const maxClusterId = Math.max(...Array.from(clusterMap.keys()));
        const currentCluster = clusterMap.get(maxClusterId)!;
        
        // 현재 클러스터의 최대 레이어 수
        const firstInCluster = currentCluster[0];
        const maxLayersInCluster = (firstInCluster.customProps?.maxLayersInCluster as number) || 6;
        
        // 현재 클러스터가 가득 찼는지 확인
        if (currentCluster.length >= maxLayersInCluster) {
          // 새 클러스터 시작
          const newClusterId = maxClusterId + 1;
          
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
            clusterId: newClusterId,
            maxLayersInCluster,
            baseRotation, // 뭉치의 기본 회전값 저장
            stackSpacing: stackSpacingValue, // 이 뭉치의 고유 간격
          };
        } else {
          // 기존 클러스터에 계속 쌓기
          const baseX = firstInCluster.customProps?.baseX as number;
          const baseY = firstInCluster.customProps?.baseY as number;
          const stackDirection = firstInCluster.customProps?.stackDirection as number;
          const stackRotation = firstInCluster.customProps?.stackRotation as number;
          const fixedSize = firstInCluster.customProps?.fixedSize as number;
          const baseRotation = firstInCluster.customProps?.baseRotation as number;
          const stackSpacing = (firstInCluster.customProps?.stackSpacing as number) || 10;
          
          const currentLayerIndex = currentCluster.length;
          
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
            clusterId: maxClusterId,
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

    // size 먼저 계산
    let size = this.config.minSize + Math.random() * (maxSize - this.config.minSize);
    
    // grow 모드의 경우 단방향 쌓임 설정
    if (actualMode === 'grow') {
      const sameElementInstances = Array.from(this.instances.values()).filter(
        inst => inst.elementId === element.id && (inst.customProps?.actualMode === 'grow' || inst.animationMode === 'grow')
      );
      
      // 기존 스택 중에서 화면 밖으로 나가지 않은 것만 필터링
      const activeStacks = new Map<number, RenderInstance[]>();
      
      sameElementInstances.forEach(inst => {
        const stackId = (inst.customProps?.stackId as number) || 0;
        if (!activeStacks.has(stackId)) {
          activeStacks.set(stackId, []);
        }
        activeStacks.get(stackId)!.push(inst);
      });
      
      // 각 스택의 마지막 인스턴스가 화면 밖으로 완전히 나갔는지 확인
      let availableStack: RenderInstance[] | undefined;
      activeStacks.forEach(stack => {
        if (availableStack) return; // 이미 찾았으면 스킵
        
        const lastInstance = stack[stack.length - 1];
        const margin = size * 2; // 여유값
        const isOutOfBounds = 
          lastInstance.x < -margin || 
          lastInstance.x > this.config.canvasWidth + margin ||
          lastInstance.y < -margin || 
          lastInstance.y > this.config.canvasHeight + margin;
        
        if (!isOutOfBounds) {
          availableStack = stack;
        }
      });
      
      if (availableStack && availableStack.length > 0) {
        // 기존 스택에 추가
        const first = availableStack[0];
        const baseX = first.customProps?.baseX as number;
        const baseY = first.customProps?.baseY as number;
        const growDirection = first.customProps?.growDirection as number;
        const growSpacing = first.customProps?.growSpacing as number;
        const growRotation = first.customProps?.growRotation as number;
        const stackId = first.customProps?.stackId as number;
        const layerIndex = availableStack.length;
        
        x = baseX + Math.cos(growDirection) * growSpacing * layerIndex;
        y = baseY + Math.sin(growDirection) * growSpacing * layerIndex;
        rotation = growRotation; // 회전값 고정
        
        customProps = {
          ...customProps,
          baseX,
          baseY,
          growDirection,
          growSpacing,
          growRotation,
          layerIndex,
          stackId,
        };
      } else {
        // 새로운 스택 시작
        const newStackId = activeStacks.size;
        
        // 최대 2개 스택까지만 허용 (더 빠른 삭제)
        if (newStackId >= 2) {
          // 가장 오래된 스택 제거
          const oldestStackId = Math.min(...Array.from(activeStacks.keys()));
          const oldestStack = activeStacks.get(oldestStackId);
          if (oldestStack) {
            oldestStack.forEach(inst => this.instances.delete(inst.id));
          }
        }
        
        const edge = Math.floor(Math.random() * 4); // 0: 위, 1: 오른쪽, 2: 아래, 3: 왼쪽
        let growDirection: number;
        
        switch (edge) {
          case 0: // 위쪽에서 아래로 (대각선)
            x = Math.random() * this.config.canvasWidth;
            y = -size;
            growDirection = Math.PI / 2 + (Math.random() * 0.8 - 0.4); // 90° ± 23°
            break;
          case 1: // 오른쪽에서 왼쪽으로 (대각선)
            x = this.config.canvasWidth + size;
            y = Math.random() * this.config.canvasHeight;
            growDirection = Math.PI + (Math.random() * 0.8 - 0.4); // 180° ± 23°
            break;
          case 2: // 아래쪽에서 위로 (대각선)
            x = Math.random() * this.config.canvasWidth;
            y = this.config.canvasHeight + size;
            growDirection = -Math.PI / 2 + (Math.random() * 0.8 - 0.4); // -90° ± 23°
            break;
          case 3: // 왼쪽에서 오른쪽으로 (대각선)
          default:
            x = -size;
            y = Math.random() * this.config.canvasHeight;
            growDirection = (Math.random() * 0.8 - 0.4); // 0° ± 23°
            break;
        }
        const growSpacing = size; // 이미지 크기만큼 간격
        const growRotation = growDirection; // 방향과 동일한 회전값
        
        rotation = growRotation;
        
        customProps = {
          ...customProps,
          baseX: x,
          baseY: y,
          growDirection,
          growSpacing,
          growRotation,
          layerIndex: 0,
          stackId: newStackId,
        };
      }
    }

    // layered 모드는 고정 크기 사용
    if (mode === 'layered' && customProps.fixedSize) {
      size = customProps.fixedSize as number;
    }

    // rotate 모드의 회전 방향 랜덤 결정
    const rotationDirection = actualMode === 'rotate' ? (Math.random() < 0.5 ? 1 : -1) : 1;
    
    // flicker 모드의 깜빡임 횟수 랜덤 결정 (3-7번)
    const flickerCount = actualMode === 'flicker' 
      ? Math.floor(Math.random() * 5) + 3 
      : undefined;

    const instance: RenderInstance = {
      id: `inst-${this.instanceIdCounter++}`,
      elementId: element.id,
      elementName: element.name,
      x,
      y,
      size,
      rotation, // 고정된 회전값 사용
      opacity: 1,
      animationMode: mode, // 원본 모드 저장 (random 또는 실제 모드)
      age: 0,
      lifespan: (actualMode === 'layered' || actualMode === 'grow') ? 999999 : Math.round(modeConfig.duration / (elementConfig?.animationSpeed || 1)), // layered와 grow는 매우 긴 lifespan
      seed: Math.random(),
      customProps: {
        ...customProps,
        rotationDirection, // 회전 방향 저장
        flickerCount, // 점멸 횟수 저장
      },
    };

    return instance;
  }

  /**
   * 프레임 업데이트: 새 요소 스폰, 기존 요소 업데이트
   */
  private update(): void {
    // 초반 가속 모드 (처음 10초 동안 2배 빠르게)
    const elapsedSeconds = (Date.now() - this.startTime) / 1000;
    const speedMultiplier = elapsedSeconds < 10 ? 2 : 1;
    
    // 밀도에 따른 동적 최대 개수 계산 (성능 최적화: 대폭 감소)
    const dynamicMaxInstances = Math.floor(20 + (this.config.density || 1) * 60);
    
    // 0) 각 요소가 최소 1개씩 존재하도록 보장 (layered는 제외 - 3프레임마다만 체크)
    if (this.frameCount % 3 === 0) {
      this.elements.forEach((element) => {
        // layered는 자연스럽게 쌓이도록 강제 생성 제외
        if (element.animationMode === 'layered') return;
        
        const hasInstance = Array.from(this.instances.values()).some(
          inst => inst.elementId === element.id
        );
        
        if (!hasInstance) {
          // 해당 요소의 인스턴스가 없으면 강제 생성
          const newInstance = this.createInstance(element);
          this.instances.set(newInstance.id, newInstance);
        }
      });
    }
    
    // 1) 새로운 요소 스폰 (빈도 기반)
    for (let i = 0; i < speedMultiplier; i++) {
      if (this.instances.size < dynamicMaxInstances && this.elements.length > 0) {
        const randomElement = this.elements[Math.floor(Math.random() * this.elements.length)];
        const elementConfig = this.elementConfigs.get(randomElement.id);
        const frequency = elementConfig?.frequency || 0.1;
        
        // layered와 grow 모드는 density 영향 없이 일정한 속도로 생성
        const spawnChance = (randomElement.animationMode === 'layered' || randomElement.animationMode === 'grow')
          ? frequency * 1.5 // layered는 150%로 증가, grow는 100% 유지
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

    // 3) 최대 인스턴스 수의 90%를 넘으면 layered와 grow 제거 (빠르게 제거)
    // 하지만 85% 아래로 떨어지면 제거 중단
    const removalThreshold = dynamicMaxInstances * 0.90; // 90%에서 제거 시작
    const stopRemovalThreshold = dynamicMaxInstances * 0.85; // 85% 아래로 떨어지면 중단
    
    if (this.instances.size > removalThreshold) {
      const layeredInstances = Array.from(this.instances.values())
        .filter(inst => inst.animationMode === 'layered');
      const growInstances = Array.from(this.instances.values())
        .filter(inst => inst.animationMode === 'grow');
      
      // layered 제거 (15프레임마다만 제거하여 속도 감소, 그리고 85% 아래로만 제거)
      if (layeredInstances.length > 0 && 
          this.frameCount % 15 === 0 && 
          this.instances.size > stopRemovalThreshold) {
        // 가장 오래된 뭉치 찾기
        const oldestInstance = layeredInstances.reduce((oldest, current) => {
          return current.age > oldest.age ? current : oldest;
        });
        
        const clusterToRemove = oldestInstance.customProps?.clusterId as number;
        const elementToRemove = oldestInstance.elementId;
        
        // 같은 clusterId와 elementId를 가진 인스턴스들을 layerIndex 순으로 정렬
        const clusterInstances: RenderInstance[] = [];
        this.instances.forEach((inst) => {
          if (inst.animationMode === 'layered' && 
              inst.elementId === elementToRemove &&
              (inst.customProps?.clusterId as number) === clusterToRemove) {
            clusterInstances.push(inst);
          }
        });
        
        // layerIndex 기준 오름차순 정렬 (앞에 쌓인 것부터)
        clusterInstances.sort((a, b) => {
          const layerA = (a.customProps?.layerIndex as number) || 0;
          const layerB = (b.customProps?.layerIndex as number) || 0;
          return layerA - layerB;
        });
        
        // 첫 번째(가장 아래 레이어)만 제거
        if (clusterInstances.length > 0) {
          this.instances.delete(clusterInstances[0].id);
        }
      }
      
      // grow 제거 - 전체 스택 단위로 빠르게 제거
      if (growInstances.length > 0) {
        // 스택별로 그룹화
        const growStacks = new Map<string, RenderInstance[]>();
        growInstances.forEach(inst => {
          const key = `${inst.elementId}-${inst.customProps?.stackId || 0}`;
          if (!growStacks.has(key)) {
            growStacks.set(key, []);
          }
          growStacks.get(key)!.push(inst);
        });
        
        // 화면 밖으로 완전히 나간 스택 찾기
        let stackToRemove: RenderInstance[] | undefined;
        const margin = 100; // 고정 여유값 (최적화)
        
        growStacks.forEach(stack => {
          if (stackToRemove) return;
          
          const firstInst = stack[0];
          const isFullyOut = 
            firstInst.x < -margin || 
            firstInst.x > this.config.canvasWidth + margin ||
            firstInst.y < -margin || 
            firstInst.y > this.config.canvasHeight + margin;
          
          if (isFullyOut) {
            stackToRemove = stack;
          }
        });
        
        // 전체 스택 한번에 제거
        if (stackToRemove) {
          stackToRemove.forEach((inst: RenderInstance) => this.instances.delete(inst.id));
        }
      }
    }

    // 4) 다른 모드는 lifespan 기반으로 제거
    const idsToDelete: string[] = [];
    this.instances.forEach((instance, id) => {
      if (instance.animationMode !== 'layered' && instance.animationMode !== 'grow' && instance.age >= instance.lifespan) {
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

    // elements를 Map으로 캐싱 (최적화)
    const elementMap = new Map(this.elements.map(e => [e.id, e]));

    // 일반 인스턴스 렌더링
    this.instances.forEach((instance) => {
      const element = elementMap.get(instance.elementId);
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

      // 화면 밖 인스턴스는 렌더링 생략 (최적화)
      const margin = instance.size * scale;
      if (instance.x + margin < 0 || instance.x - margin > this.canvas.width ||
          instance.y + margin < 0 || instance.y - margin > this.canvas.height) {
        return;
      }

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
    
    // 이미지 스무딩 비활성화 (성능 향상)
    this.ctx.imageSmoothingEnabled = false;

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
      }
    } else if (path.type === 'text') {
      // Fallback: 텍스트 렌더링
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
    // 밀도에 따른 동적 최대 개수 계산 (update()와 동일한 공식)
    const dynamicMaxInstances = Math.floor(20 + (this.config.density || 1) * 60);
    
    return {
      frameCount: this.frameCount,
      instanceCount: this.instances.size,
      maxInstances: dynamicMaxInstances,
    };
  }
}

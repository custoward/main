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
  RandomModeConfig,
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
  private lastTimestamp: number = 0;
  private deltaTime: number = 1 / 60;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private instanceIdCounter: number = 0;
  private startTime: number = Date.now(); // 시작 시간 기록
  private titleElementsInitialized: Set<string> = new Set(); // title 요소 초기화 추적
  private titleInitOrder: string[] = []; // title 요소 순서
  private allowSpawning: boolean = false; // whether automatic spawning is enabled
  private rng: () => number; // 시드 기반 랜덤 함수

  constructor(canvas: HTMLCanvasElement, config?: Partial<RenderConfig>) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.config = { ...DEFAULT_RENDER_CONFIG, ...config };
    this.rng = this.createSeededRandom(this.config.seed || Date.now());
    this.setupCanvas();
  }

  /**
   * 시드 기반 랜덤 함수 생성 (Mulberry32)
   */
  private createSeededRandom(seed: number): () => number {
    let state = seed;
    return function() {
      state = (state + 0x6D2B79F5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
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
      // ensure we keep the original default color on customData for recoloring reference
      if (!el.customData) el.customData = {};
      if (!el.customData.defaultColor) el.customData.defaultColor = el.color || '#1AB551';
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
          size: 100,
          animationMode: el.animationMode,
          animationSpeed: 1.0,
        };
        this.elementConfigs.set(el.id, defaultConfig);
      }
    });
    
    // elementConfigs 설정 후 title 요소들을 정렬하여 순서 저장
    const titleElements = elements
      .filter(el => {
        const config = this.elementConfigs.get(el.id);
        const isTitle = config?.animationMode === 'title';
        if (isTitle) {
          console.log(`[TypoMossRenderer] Title 요소 발견: ${el.id}, mode: ${config?.animationMode}`);
        }
        return isTitle;
      })
      .sort((a, b) => a.id.localeCompare(b.id)); // ID 기준 정렬
    
    this.titleInitOrder = titleElements.map(el => el.id);
    console.log('[TypoMossRenderer] Title 요소 순서:', this.titleInitOrder);
    console.log('[TypoMossRenderer] ElementConfigs:', Array.from(this.elementConfigs.entries()).map(([id, cfg]) => `${id}: ${cfg.animationMode}`));
  }

  // Enable automatic spawning (call from external UI when ready)
  public enableSpawning(): void {
    this.allowSpawning = true;
    // reset startTime to make spawn progression consistent
    this.startTime = Date.now();
    // reset timing so titles/spawns are scheduled from now
    this.lastTimestamp = performance.now();
  }

  /**
   * Title 순서 재계산 (elementConfigs 업데이트 후 호출)
   */
  public recalculateTitleOrder(): void {
    const titleElements = this.elements
      .filter(el => {
        const config = this.elementConfigs.get(el.id);
        const isTitle = config?.animationMode === 'title';
        if (isTitle) {
          console.log(`[TypoMossRenderer] Title 요소 재발견: ${el.id}, mode: ${config?.animationMode}`);
        }
        return isTitle;
      })
      .sort((a, b) => a.id.localeCompare(b.id));
    
    this.titleInitOrder = titleElements.map(el => el.id);
    console.log('[TypoMossRenderer] Title 요소 순서 재계산:', this.titleInitOrder);
  }

  /**
   * 요소별 설정 업데이트
   */
  public updateElementConfig(elementId: string, config: Partial<ElementConfig>): void {
    const existing = this.elementConfigs.get(elementId);
    if (existing) {
      this.elementConfigs.set(elementId, { ...existing, ...config });
      // If a color override was provided in the element config, update the underlying VectorElement
      if (config.color !== undefined) {
        const idx = this.elements.findIndex(e => e.id === elementId);
        console.log('[updateElementConfig] Color update:', {
          elementId,
          newColor: config.color,
          foundIndex: idx,
          oldColor: idx !== -1 ? this.elements[idx].color : 'N/A'
        });
        if (idx !== -1) {
          this.elements[idx].color = config.color;
          // clear element map cache so render picks up new color
          this.elementMapCache = null;
          // clear any colored canvas cache entries for this element so recolor regenerates
          const prefix = `${elementId}::`;
          Array.from(this.coloredCanvasCache.keys()).forEach(k => {
            if (k.startsWith(prefix)) this.coloredCanvasCache.delete(k);
          });
          // clear recolored image cache
          const svgPath = this.elements[idx].customData?.svgPath as string;
          if (svgPath) {
            Array.from(this.recoloredImageCache.keys()).forEach(k => {
              if (k.startsWith(`${svgPath}::`)) this.recoloredImageCache.delete(k);
            });
          }
          console.log('[updateElementConfig] Color updated successfully, caches cleared');
        }
      }
      
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
      if (config.animationSpeed !== undefined) {
        console.log(`[TypoMossRenderer] updateElementConfig: propagating animationSpeed ${config.animationSpeed} to instances of ${elementId}`);
      }
      // propagate animationSpeed to existing instances for this element
      if (config.animationSpeed !== undefined) {
        this.instances.forEach((instance) => {
          if (instance.elementId === elementId) {
            if (!instance.customProps) instance.customProps = {};
            instance.customProps.animationSpeed = config.animationSpeed;
            // adjust lifespan if mode has duration
            const modeConfig = ANIMATION_MODE_DEFAULTS[instance.animationMode as AnimationMode];
            if (modeConfig && (modeConfig as any).duration) {
              const speedVal = (config.animationSpeed as number) || 1;
              instance.lifespan = Math.round(((modeConfig as any).duration || 999999) / speedVal);
            }
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
    // 시드가 변경되면 랜덤 함수 재생성
    if (config.seed !== undefined) {
      console.log('[TypoMossRenderer] updateConfig: new seed set', config.seed);
      this.rng = this.createSeededRandom(config.seed);
    }
    this.setupCanvas();
  }

  /**
   * Random 모드에서 실제 모드 선택
   */
  private selectRandomMode(config: Partial<RandomModeConfig>): AnimationMode {
    // Accept numeric strings as well as numbers. If a value is missing or invalid,
    // fall back to DEFAULT_RANDOM_MODE_CONFIG. Ensure 0 means "never chosen".
    const modes: (keyof RandomModeConfig)[] = ['layered', 'rotate', 'pulse', 'flicker', 'grow'];
    const fullConfig: Record<string, number> = {};

    const parseProb = (rawVal: any): number => {
      if (rawVal === undefined || rawVal === null) return NaN;
      if (typeof rawVal === 'number') return rawVal;
      if (typeof rawVal === 'string') {
        const s = rawVal.trim();
        // percent string like '20%'
        if (s.endsWith('%')) {
          const n = parseFloat(s.slice(0, -1));
          return isFinite(n) ? n / 100 : NaN;
        }
        // bare numeric string
        const n = Number(s);
        if (isFinite(n)) return n;
        // try parseFloat fallback
        const f = parseFloat(s);
        return isFinite(f) ? f : NaN;
      }
      return NaN;
    };

    const hasAnyProvided = Object.keys(config || {}).length > 0;
    modes.forEach((m) => {
      const rawVal = (config as any)[m];
      let parsed = parseProb(rawVal);
      // If a user supplied values in 0-100 scale (e.g. 20 for 20%), normalize
      if (isFinite(parsed) && parsed > 1) parsed = parsed / 100;
      // If the user provided at least one key in randomModeConfig, treat unspecified keys as 0
      const val = isFinite(parsed) ? parsed : (hasAnyProvided ? 0 : DEFAULT_RANDOM_MODE_CONFIG[m]);
      fullConfig[m] = Math.max(0, val);
    });

    // Exclude zero-probability modes so 0% is respected
    const positiveModes = modes.filter(m => (fullConfig[m] || 0) > 0);
    if (positiveModes.length === 0) {
      console.warn('[TypoMossRenderer] selectRandomMode: all random-mode probabilities are zero or invalid, falling back to pulse', fullConfig);
      return 'pulse';
    }

    const total = positiveModes.reduce((s, m) => s + (fullConfig[m] || 0), 0);
    console.log('[TypoMossRenderer] selectRandomMode parsed config', fullConfig, 'positiveModes', positiveModes, 'total', total);
    const r = this.rng() * total;
    let cumulative = 0;
    for (const mode of positiveModes) {
      cumulative += fullConfig[mode];
      if (r < cumulative) {
        return mode as AnimationMode;
      }
    }

    return positiveModes[positiveModes.length - 1] as AnimationMode;
  }

  /**
   * title 요소를 가로축 순서대로 생성
   */
  private createTitleInstance(element: VectorElement, orderIndex: number): RenderInstance {
    const elementConfig = this.elementConfigs.get(element.id);
    const baseSize = elementConfig?.size || 100;
    const sizeVariation = baseSize * 0.3;
    const randomSize = baseSize + (this.rng() - 0.5) * 2 * sizeVariation;
    
    // 가로축 위치 계산 (화면을 균등 분할)
    const totalTitles = this.titleInitOrder.length;
    const spacing = this.config.canvasWidth / (totalTitles + 1);
    const x = spacing * (orderIndex + 1);
    
    // 세로축은 화면 중앙 ±20% 범위에 랜덤 분포
    const centerY = this.config.canvasHeight / 2;
    const yVariation = this.config.canvasHeight * 0.2;
    const y = centerY + (this.rng() - 0.5) * 2 * yVariation;
    
    console.log(`[TypoMossRenderer] Title 인스턴스 생성: ${element.id}, 위치: (${x.toFixed(0)}, ${y.toFixed(0)}), 크기: ${randomSize.toFixed(0)}`);
    
    const lifespan = 999999; // keep indefinitely
    const flickerCount = Math.floor(this.rng() * 5) + 3; // 3-7번
    
    return {
      id: `inst-${this.instanceIdCounter++}`,
      elementId: element.id,
      elementName: element.name,
      x,
      y,
      size: randomSize,
      rotation: 0, // title은 회전 없음
      opacity: 1.0,
      animationMode: 'title',
      age: 0,
      lifespan,
      seed: this.rng(),
      customProps: {
        actualMode: 'title',
        flickerCount,
        currentFlicker: 0,
      },
    };
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
      const randomConfig = elementConfig?.randomModeConfig ?? {};
      actualMode = this.selectRandomMode(randomConfig);
      console.log('[TypoMossRenderer] createInstance random selection', { elementId: element.id, randomConfig, selected: actualMode });
      // keep last selection for on-canvas debug overlay
      (this as any).lastRandomSelection = { elementId: element.id, randomConfig, selected: actualMode };
    }

    // Extra safeguard logging: if rotate was selected but the element's randomConfig explicitly sets rotate to 0-ish, warn
    const isExplicitZero = (raw: any) => {
      if (raw === undefined || raw === null) return false;
      if (typeof raw === 'number') return raw === 0;
      const s = String(raw).trim();
      if (s === '0' || s === '0.0' || s === '0%') return true;
      // '0.00%' etc
      if (s.endsWith('%')) {
        const n = parseFloat(s.slice(0, -1));
        return isFinite(n) && n === 0;
      }
      const n = Number(s);
      return isFinite(n) && n === 0;
    };
    if (actualMode === 'rotate' && elementConfig?.randomModeConfig && isExplicitZero(elementConfig.randomModeConfig.rotate)) {
      console.warn('[TypoMossRenderer] rotate selected but element.randomModeConfig.rotate appears to be zero-ish', { elementId: element.id, randomModeConfig: elementConfig.randomModeConfig });
    }
    
    const modeConfig = ANIMATION_MODE_DEFAULTS[actualMode === 'random' ? 'rotate' : actualMode];
    const baseSize = elementConfig?.size || 100; // 기본 크기
    
    // 크기를 baseSize ±30% 범위로 랜덤 설정
    const sizeVariation = baseSize * 0.3;
    const randomSize = baseSize + (this.rng() - 0.5) * 2 * sizeVariation; // baseSize * 0.7 ~ baseSize * 1.3

    let x: number;
    let y: number;
    let rotation: number = actualMode === 'title' ? 0 : this.rng() * Math.PI * 2; // title은 각도 0 고정
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
          x = this.rng() * this.config.canvasWidth;
          y = this.rng() * this.config.canvasHeight;
          
          const stackDirection = this.rng() * Math.PI * 2;
          
          // 회전 증가량과 위치 편차 확률 분포
          // 40% 확률로 작은 회전값 & 큰 편차 (0-3도 회전, 15-20px 편차)
          // 60% 확률로 큰 회전값 & 작은 편차 (6-20도 회전, 5-10px 편차)
          const useSmallRotation = this.rng() < 0.4;
          
          let rotationDegrees: number;
          let stackSpacingValue: number;
          
          if (useSmallRotation) {
            // 작은 회전값 (0-3도, 3도 미만이면 0으로)
            const rawRotation = this.rng() * 3; // 0-3도
            rotationDegrees = rawRotation < 3 ? 0 : rawRotation;
            // 큰 위치 편차 (15-20px)
            stackSpacingValue = 15 + this.rng() * 5;
          } else {
            // 큰 회전값 (6-20도)
            rotationDegrees = 6 + this.rng() * 14;
            // 작은 위치 편차 (5-10px)
            stackSpacingValue = 5 + this.rng() * 5;
          }
          
          const stackRotation = (rotationDegrees * Math.PI) / 180; // 라디안으로 변환
          const fixedSize = baseSize + (this.rng() - 0.5) * 2 * sizeVariation;
          const maxLayersInCluster = Math.floor(this.rng() * 3) + 5; // 5-7개
          const baseRotation = this.rng() * Math.PI * 2; // 뭉치의 기본 회전값 고정
          
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
        x = this.rng() * this.config.canvasWidth;
        y = this.rng() * this.config.canvasHeight;
        
        const stackDirection = this.rng() * Math.PI * 2;
        
        // 회전 증가량과 위치 편차 확률 분포
        // 40% 확률로 작은 회전값 & 큰 편차
        // 60% 확률로 큰 회전값 & 작은 편차
        const useSmallRotation = this.rng() < 0.4;
        
        let rotationDegrees: number;
        let stackSpacingValue: number;
        
        if (useSmallRotation) {
          // 작은 회전값 (0-3도, 3도 미만이면 0으로)
          const rawRotation = this.rng() * 3;
          rotationDegrees = rawRotation < 3 ? 0 : rawRotation;
          // 큰 위치 편차 (15-20px)
          stackSpacingValue = 15 + this.rng() * 5;
        } else {
          // 큰 회전값 (6-20도)
          rotationDegrees = 6 + this.rng() * 14;
          // 작은 위치 편차 (5-10px)
          stackSpacingValue = 5 + this.rng() * 5;
        }
        
        const stackRotation = (rotationDegrees * Math.PI) / 180;
        const fixedSize = baseSize + (this.rng() - 0.5) * 2 * sizeVariation;
        const maxLayersInCluster = Math.floor(this.rng() * 3) + 5; // 5-7개
        const baseRotation = this.rng() * Math.PI * 2; // 뭉치의 기본 회전값 고정
        
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
      x = this.rng() * this.config.canvasWidth;
      y = this.rng() * this.config.canvasHeight;
    }

    // size 먼저 계산 (baseSize ±30%)
    let size = baseSize + (this.rng() - 0.5) * 2 * sizeVariation;
    
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
        // NOTE: do NOT delete oldest stacks — keep elements indefinitely per user request
        
        const edge = Math.floor(this.rng() * 4); // 0: 위, 1: 오른쪽, 2: 아래, 3: 왼쪽
        let growDirection: number;
        
        switch (edge) {
          case 0: // 위쪽에서 아래로 (대각선)
            x = this.rng() * this.config.canvasWidth;
            y = -size;
            growDirection = Math.PI / 2 + (this.rng() * 0.8 - 0.4); // 90° ± 23°
            break;
          case 1: // 오른쪽에서 왼쪽으로 (대각선)
            x = this.config.canvasWidth + size;
            y = this.rng() * this.config.canvasHeight;
            growDirection = Math.PI + (this.rng() * 0.8 - 0.4); // 180° ± 23°
            break;
          case 2: // 아래쪽에서 위로 (대각선)
            x = this.rng() * this.config.canvasWidth;
            y = this.config.canvasHeight + size;
            growDirection = -Math.PI / 2 + (this.rng() * 0.8 - 0.4); // -90° ± 23°
            break;
          case 3: // 왼쪽에서 오른쪽으로 (대각선)
          default:
            x = -size;
            y = this.rng() * this.config.canvasHeight;
            growDirection = (this.rng() * 0.8 - 0.4); // 0° ± 23°
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
    const rotationDirection = actualMode === 'rotate' ? (this.rng() < 0.5 ? 1 : -1) : 1;
    
    // flicker 모드의 깜빡임 횟수 랜덤 결정 (3-7번)
    const flickerCount = (actualMode === 'flicker' || actualMode === 'title')
      ? Math.floor(this.rng() * 5) + 3 
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
      // Keep instances indefinitely per user request (no automatic deletion)
      lifespan: 999999,
      seed: this.rng(),
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
    // maxInstances 설정 사용 (기본값 80)
    const dynamicMaxInstances = this.config.maxInstances || 80;
    
    // 0) 초기 강제 생성 로직을 제거했습니다.
    // 요소는 이제 `allowSpawning`이 활성화된 이후에도 자연 스폰 규칙에 따라
    // 한두 개씩 점진적으로 생성됩니다.
    
    // 1) title 요소 최초 순차 생성 (비활성화 unless spawning enabled)
    // Title sequential creation: spawn one title every N frames once spawning is enabled
    if (this.allowSpawning && this.titleInitOrder.length > 0 && this.titleElementsInitialized.size < this.titleInitOrder.length) {
      const nextTitleId = this.titleInitOrder[this.titleElementsInitialized.size];
      const titleElement = this.elements.find(el => el.id === nextTitleId);
      if (titleElement) {
        // Make title spawn timing scale with global spawnSpeed so increasing spawnSpeed
        // makes title appear earlier and at shorter intervals.
        const spawnSpeed = Math.max(0.01, this.config.spawnSpeed || 1);
        const TITLE_SPAWN_START_FRAME_BASE = 4; // base small delay to allow canvas to settle
        const TITLE_SPAWN_INTERVAL_BASE = 12; // base frames between title spawns (~12 @60fps = 0.2s)

        // Use sqrt scaling so large spawnSpeed values have a less-aggressive effect
        const speedFactor = Math.sqrt(spawnSpeed);
        const titleStartFrame = Math.max(0, Math.floor(TITLE_SPAWN_START_FRAME_BASE / speedFactor));
        // enforce a small minimum interval to avoid instant flooding
        const titleInterval = Math.max(2, Math.round(TITLE_SPAWN_INTERVAL_BASE / speedFactor));

        if (this.frameCount >= titleStartFrame && (this.frameCount - titleStartFrame) % titleInterval === 0) {
          const titleInstance = this.createTitleInstance(titleElement, this.titleElementsInitialized.size);
          this.instances.set(titleInstance.id, titleInstance);
          this.titleElementsInitialized.add(nextTitleId);
        }
      } else {
        // if element missing, mark as initialized to avoid infinite loop
        this.titleElementsInitialized.add(nextTitleId);
      }
    }
    
    // 2) 새로운 요소 스폰 (빈도 기반)
    // Only spawn when spawning has been enabled externally (keeps initial canvas empty)
    if (this.allowSpawning && this.instances.size < dynamicMaxInstances && this.elements.length > 0) {
      const randomElement = this.elements[Math.floor(this.rng() * this.elements.length)];
      const elementConfig = this.elementConfigs.get(randomElement.id);
      const frequency = elementConfig?.frequency || 0.1;
      
      // 전역 생성 속도 배율 적용 (지수 함수로 점진적 증가)
      const elapsedSeconds = (Date.now() - this.startTime) / 1000;
      // Determine ramp duration: if a resetIntervalSeconds is provided by the host, use
      // resetIntervalSeconds - 2 so that ramp reaches max 2 seconds before reset.
      const configuredReset = (this.config as any).resetIntervalSeconds;
      // reach max 1 second before reset (user requested) -- use resetIntervalSeconds - 1
      const rampTotal = (typeof configuredReset === 'number' && configuredReset > 1)
        ? Math.max(0.1, configuredReset - 1)
        : 12;
      const progressRatio = Math.min(elapsedSeconds / rampTotal, 1.0);
      // Use squared growth and a lower base multiplier so initial spawning is much slower
      const exponentialGrowth = Math.pow(progressRatio, 2);
      let dynamicSpeedMultiplier = 0.01 + exponentialGrowth * 0.99; // 0.01배에서 시작 → 1.0배까지
      
      // 타이틀 생성 중일 때 (2.5초 이내) 다른 요소들의 생성 속도를 20%로 감소
      const isTitleSpawning = this.titleInitOrder.length > 0 && 
                              this.titleElementsInitialized.size < this.titleInitOrder.length && 
                              elapsedSeconds < 2.5;
      if (isTitleSpawning) {
        dynamicSpeedMultiplier *= 0.2;
      }
      
      const globalSpeedMultiplier = (this.config.spawnSpeed || 1.0) * dynamicSpeedMultiplier;
      
      // title 요소는 최초 순차 생성으로만 등장하므로 일반 스폰에서 제외
      if (randomElement.animationMode === 'title') {
        return;
      }
      
      // layered와 grow 모드는 density 영향 없이 일정한 속도로 생성
      const baseSpawnChance = randomElement.animationMode === 'layered'
        ? frequency * 2.0 // layered는 200%로 증가
        : randomElement.animationMode === 'grow'
        ? frequency * 1.5 // grow는 150%
        : frequency * 1.5; // 다른 모드는 150%
      
      const spawnChance = baseSpawnChance * globalSpeedMultiplier;

      // record last spawn info for debugging / overlay
      (this as any).lastSpawnInfo = {
        elementId: randomElement.id,
        frequency,
        baseSpawnChance,
        globalSpeedMultiplier,
        spawnChance,
      };
      
      if (this.rng() < spawnChance) {
        const newInstance = this.createInstance(randomElement);
        console.log('[TypoMossRenderer] spawn: element', randomElement.id, 'spawnChance', spawnChance.toFixed(4), 'globalSpeedMultiplier', globalSpeedMultiplier.toFixed(3));
        this.instances.set(newInstance.id, newInstance);
      }
    }

    // 2) 기존 요소 업데이트
    this.instances.forEach((instance) => {
      instance.age++;

      // Update persistent rotation for rotate-mode instances so rotation accumulates
      const actualMode = (instance.animationMode === 'random')
        ? ((instance.customProps?.actualMode as AnimationMode) || 'pulse')
        : instance.animationMode;

      if (actualMode === 'rotate') {
        const rotationSpeed = (ANIMATION_MODE_DEFAULTS.rotate.rotationSpeed || 1) as number;
        const rotationDirection = (instance.customProps?.rotationDirection as number) || 1;
        const speedMultiplier = (instance.customProps?.animationSpeed as number) || 1;
        const deltaRot = this.deltaTime * Math.PI * 2 * rotationSpeed * rotationDirection * speedMultiplier;
        instance.rotation = (instance.rotation || 0) + deltaRot;
      }
    });

    // 3) 제거 로직 비활성화: 사용자가 요청한대로 한번 생성된 요소는 삭제되지 않습니다.

    // 4) lifespan 기반 제거 비활성화 — 요소를 삭제하지 않습니다.

    this.frameCount++;
  }

  /**
   * Canvas에 요소 렌더링
   */
  private elementMapCache: Map<string, VectorElement> | null = null;
  private coloredCanvasCache: Map<string, HTMLCanvasElement> = new Map();
  private svgTextCache: Map<string, string> = new Map();
  private recoloredImageCache: Map<string, HTMLImageElement> = new Map();
  private recoloringInProgress: Set<string> | undefined;

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    if (!hex) return null;
    const h = hex.replace('#', '').trim();
    if (h.length === 3) {
      const r = parseInt(h[0] + h[0], 16);
      const g = parseInt(h[1] + h[1], 16);
      const b = parseInt(h[2] + h[2], 16);
      return { r, g, b };
    } else if (h.length === 6) {
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return { r, g, b };
    }
    return null;
  }

  private colorDistance(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) {
    const dr = a.r - b.r;
    const dg = a.g - b.g;
    const db = a.b - b.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  private async recolorSVG(svgPath: string, targetColor: string): Promise<HTMLImageElement | null> {
    const cacheKey = `${svgPath}::${targetColor}`;
    
    if (this.recoloredImageCache.has(cacheKey)) {
      return this.recoloredImageCache.get(cacheKey)!;
    }

    try {
      console.log('[recolorSVG] Starting recolor process:', svgPath, targetColor);
      
      // Fetch SVG text if not cached
      if (!this.svgTextCache.has(svgPath)) {
        console.log('[recolorSVG] Fetching SVG file:', svgPath);
        const response = await fetch(svgPath);
        if (!response.ok) {
          console.error('[recolorSVG] Fetch failed:', response.status, response.statusText);
          return null;
        }
        const svgText = await response.text();
        console.log('[recolorSVG] SVG fetched, length:', svgText.length);
        this.svgTextCache.set(svgPath, svgText);
      }

      let svgText = this.svgTextCache.get(svgPath)!;
      console.log('[recolorSVG] Original SVG preview:', svgText.substring(0, 200));
      
      // Replace fill colors in SVG
      // 1. Replace inline fill attributes
      // 2. Replace fill inside CSS <style> blocks (for class-based SVGs)
      const originalText = svgText;
      
      svgText = svgText
        // Inline fill attributes
        .replace(/fill="#[0-9a-fA-F]{6}"/gi, `fill="${targetColor}"`)
        .replace(/fill="#[0-9a-fA-F]{3}"/gi, `fill="${targetColor}"`)
        .replace(/fill='#[0-9a-fA-F]{6}'/gi, `fill='${targetColor}'`)
        .replace(/fill='#[0-9a-fA-F]{3}'/gi, `fill='${targetColor}'`)
        .replace(/fill="rgb\([^)]+\)"/gi, `fill="${targetColor}"`)
        // CSS style blocks - match fill: #color; or fill:#color;
        .replace(/fill:\s*#[0-9a-fA-F]{6};/gi, `fill: ${targetColor};`)
        .replace(/fill:\s*#[0-9a-fA-F]{3};/gi, `fill: ${targetColor};`)
        .replace(/fill:\s*rgb\([^)]+\);/gi, `fill: ${targetColor};`);
      
      const changed = svgText !== originalText;
      console.log('[recolorSVG] Text replacement done, changed:', changed);
      if (changed) {
        console.log('[recolorSVG] Modified SVG preview:', svgText.substring(0, 200));
      }

      // Create blob URL for the modified SVG
      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      console.log('[recolorSVG] Blob URL created:', url);

      // Load as image
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          console.log('[recolorSVG] Image loaded successfully:', img.width, 'x', img.height);
          URL.revokeObjectURL(url);
          this.recoloredImageCache.set(cacheKey, img);
          resolve(img);
        };
        img.onerror = (e) => {
          console.error('[recolorSVG] Image load error:', e);
          URL.revokeObjectURL(url);
          resolve(null);
        };
        img.src = url;
      });
    } catch (e) {
      console.error('[recolorSVG] Exception:', e);
      return null;
    }
  }
  
  private render(): void {
    // 배경 초기화
    this.ctx.fillStyle = this.config.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // elements를 Map으로 캐싱 (최적화 - 한 번만 생성)
    if (!this.elementMapCache) {
      this.elementMapCache = new Map(this.elements.map(e => [e.id, e]));
    }

    // 일반 인스턴스 렌더링
    this.instances.forEach((instance) => {
      const element = this.elementMapCache!.get(instance.elementId);
      if (!element) return;

      const animProps = getAnimationProperties(
        instance,
        this.deltaTime,
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
        const defaultColor = (element.customData?.defaultColor as string) || '#1AB551';
        const targetColor = element.color || defaultColor;
        const svgPath = (element.customData?.svgPath as string);

        // Check if recoloring is needed
        const needsRecolor = svgPath && targetColor && targetColor.toLowerCase() !== defaultColor.toLowerCase();

        // Debug: log first instance of each element once per 60 frames
        if (this.frameCount % 60 === 0 && svgPath) {
          const cacheKey = `${svgPath}::${targetColor}`;
          const hasCached = this.recoloredImageCache.has(cacheKey);
          console.log('[Recolor Debug]', {
            elementId: element.id,
            svgPath,
            targetColor,
            defaultColor,
            needsRecolor,
            hasCachedRecolor: hasCached,
          });
        }

        if (needsRecolor) {
          // Use SVG recoloring for better quality
          const cacheKey = `${svgPath}::${targetColor}`;
          const recoloredImg = this.recoloredImageCache.get(cacheKey);
          
          if (recoloredImg) {
            // Use cached recolored version
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.drawImage(recoloredImg, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
          } else {
            // Show original while recoloring
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
            // Trigger async recolor (will be ready next frame)
            // Only log once per cache key to avoid spam
            if (!this.recoloringInProgress) this.recoloringInProgress = new Set();
            if (!this.recoloringInProgress.has(cacheKey)) {
              this.recoloringInProgress.add(cacheKey);
              console.log('[Recolor] Triggering recolor:', svgPath, '→', targetColor);
              this.recolorSVG(svgPath, targetColor)
                .then(() => {
                  this.recoloringInProgress?.delete(cacheKey);
                })
                .catch((err) => {
                  console.error('[Recolor] Failed:', err);
                  this.recoloringInProgress?.delete(cacheKey);
                });
            }
          }
        } else {
          // No recoloring needed - draw original
          this.ctx.imageSmoothingEnabled = true;
          this.ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        }
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
  private mainLoop = (timestamp?: number): void => {
    if (!timestamp) timestamp = performance.now();
    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
    }
    // compute deltaTime (sec), cap to avoid large jumps
    const rawDelta = (timestamp - this.lastTimestamp) / 1000;
    this.deltaTime = Math.min(Math.max(rawDelta, 1 / 240), 1 / 30);
    this.lastTimestamp = timestamp;

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
    this.lastTimestamp = performance.now();
    this.animationFrameId = requestAnimationFrame(this.mainLoop);
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
    this.elementMapCache = null; // 캐시 초기화
    this.titleElementsInitialized.clear(); // title 초기화 상태 리셋
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
    // maxInstances 설정 사용
    const dynamicMaxInstances = this.config.maxInstances || 80;
    
    return {
      frameCount: this.frameCount,
      instanceCount: this.instances.size,
      maxInstances: dynamicMaxInstances,
    };
  }
}

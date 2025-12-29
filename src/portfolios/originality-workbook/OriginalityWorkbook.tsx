import React, { useEffect } from 'react';
import './OriginalityWorkbook.css';

const OriginalityWorkbook: React.FC = () => {
  useEffect(() => {
    const steps = Array.from(document.querySelectorAll<HTMLElement>('.ow-step'));
    const choiceButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[data-choice-key]')
    );
    const advanceButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[data-advance]')
    );
    const resetButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[data-reset]')
    );
    const progressBar = document.querySelector<HTMLElement>('[data-progress]');
    const progressWrap = document.querySelector<HTMLElement>('.ow-progress');

    const state = {
      make: '',
      refuse: '',
      protect: '',
      sacrifice: '',
    };

    const summaryFields: Record<string, HTMLElement | null> = {
      make: document.querySelector('[data-summary="make"]'),
      refuse: document.querySelector('[data-summary="refuse"]'),
      protect: document.querySelector('[data-summary="protect"]'),
      sacrifice: document.querySelector('[data-summary="sacrifice"]'),
    };

    const clampStep = (index: number) => Math.max(0, Math.min(index, steps.length - 1));

    const renderStep = (index: number) => {
      const safeIndex = clampStep(index);
      steps.forEach((step, idx) => {
        const isActive = idx === safeIndex;
        step.classList.toggle('is-active', isActive);
        step.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      });
      if (progressWrap) {
        const hidden = safeIndex === 0;
        progressWrap.style.visibility = hidden ? 'hidden' : 'visible';
        progressWrap.style.opacity = hidden ? '0' : '1';
      }
      if (progressBar) {
        const percent = ((safeIndex + 1) / steps.length) * 100;
        progressBar.style.width = `${percent}%`;
      }
      return safeIndex;
    };

    let currentStep = renderStep(0);

    const renderSummary = () => {
      Object.entries(summaryFields).forEach(([key, el]) => {
        if (!el) return;
        const value = state[key as keyof typeof state];
        el.textContent = value || '—';
      });
    };

    const handleChoice = (event: Event) => {
      const target = event.currentTarget as HTMLButtonElement;
      const key = target.dataset.choiceKey as keyof typeof state | undefined;
      const value = target.dataset.choiceValue;
      if (!key || !value) return;

      state[key] = value;
      renderSummary();
      currentStep = renderStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAdvance = () => {
      currentStep = renderStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleReset = () => {
      Object.keys(state).forEach((key) => {
        const typedKey = key as keyof typeof state;
        state[typedKey] = '';
      });
      renderSummary();
      currentStep = renderStep(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    choiceButtons.forEach((button) => button.addEventListener('click', handleChoice));
    advanceButtons.forEach((button) => button.addEventListener('click', handleAdvance));
    resetButtons.forEach((button) => button.addEventListener('click', handleReset));
    renderSummary();

    return () => {
      choiceButtons.forEach((button) => button.removeEventListener('click', handleChoice));
      advanceButtons.forEach((button) => button.removeEventListener('click', handleAdvance));
      resetButtons.forEach((button) => button.removeEventListener('click', handleReset));
    };
  }, []);

  return (
    <div className="ow-page">
      <div className="ow-frame">
        <div className="ow-progress">
          <div className="ow-progress-bar" data-progress />
        </div>
        <header className="ow-topbar">
          <div className="ow-title">
            <div className="ow-title-main">
              <p className="ow-kicker">애프터 오리지널리티</p>
              <h1 className="ow-headline">나의 오리지널리티를 위한 기준들.</h1>
            </div>
          </div>
        </header>

        <section className="ow-step is-active" aria-hidden="false">
          <p className="ow-label">지금 할 일</p>
          <h2>지금 작업에서 고를 것, 지킬 것, 내려놓을 것을 한 번에 정합니다.</h2>
          <p className="ow-body">여기서의 오리지널리티는 내가 세운 기준으로 고르는 상태입니다.</p>
          <p className="ow-body">질문은 짧습니다. 한 번에 하나씩 선택만 하면 됩니다.</p>
          <p className="ow-body">남기는 것은 지금 바로 적용할 기준입니다.</p>
          <p className="ow-bridge">준비됐다면, 지금 선택을 시작합니다.</p>
          <button className="ow-primary ow-primary-intro" data-advance>
            선택 시작하기
          </button>
        </section>

        <section className="ow-step" aria-hidden="true">
          <p className="ow-label">무엇을 만들 것인가</p>
          <h2>다른 사람이 빠르게 결과를 내더라도 끝까지 책임지고 다루고 싶은 작업을 하나 선택해 주세요.</h2>
          <div className="ow-choice-grid">
            <button
              className="ow-choice"
              data-choice-key="make"
              data-choice-value="작은 디테일까지 직접 책임지는 작업"
            >
              작은 디테일까지 직접 책임지는 작업입니다.
            </button>
            <button
              className="ow-choice"
              data-choice-key="make"
              data-choice-value="지시가 없어도 흐름이 유지되는 작업"
            >
              지시가 없어도 흐름이 유지되는 작업입니다.
            </button>
            <button
              className="ow-choice"
              data-choice-key="make"
              data-choice-value="내가 없어도 다른 사람이 이어서 쓸 수 있는 방식"
            >
              내가 없어도 다른 사람이 이어서 쓸 수 있는 방식입니다.
            </button>
          </div>
        </section>

        <section className="ow-step" aria-hidden="true">
          <p className="ow-label">무엇을 하지 않을 것인가</p>
          <h2>조건이 좋아 보여도 손대지 않기로 결정할 작업을 하나 선택해 주세요.</h2>
          <div className="ow-choice-grid">
            <button
              className="ow-choice"
              data-choice-key="refuse"
              data-choice-value="반응 숫자만 잘 나오게 설계된 작업"
            >
              반응 수치만 잘 나오도록 설계된 작업입니다.
            </button>
            <button
              className="ow-choice"
              data-choice-key="refuse"
              data-choice-value="이미 했던 방식을 그대로 반복하는 작업"
            >
              이미 했던 방식을 그대로 반복하는 작업입니다.
            </button>
            <button
              className="ow-choice"
              data-choice-key="refuse"
              data-choice-value="안쪽 문제를 겉모습으로 덮는 선택"
            >
              안쪽 문제를 겉모습으로 덮는 선택입니다.
            </button>
          </div>
        </section>

        <section className="ow-step" aria-hidden="true">
          <p className="ow-label">어떤 조건을 지킬 것인가</p>
          <h2>
            작업을 시작하기 전에 꼭 지켜져야 한다고 느끼는 조건을 하나 골라 주세요.
          </h2>
          <div className="ow-choice-grid">
            <button
              className="ow-choice"
              data-choice-key="protect"
              data-choice-value="왜 이 작업을 하는지 스스로 설명할 수 있는 상태"
            >
              왜 이 작업을 하는지 스스로 설명할 수 있는 상태입니다.
            </button>
            <button
              className="ow-choice"
              data-choice-key="protect"
              data-choice-value="작업 목적을 한 문장으로 말할 수 있는 상태"
            >
              작업 목적을 한 문장으로 말할 수 있는 상태입니다.
            </button>
            <button
              className="ow-choice"
              data-choice-key="protect"
              data-choice-value="필요하면 프로젝트를 거절할 수 있는 기준"
            >
              필요하면 프로젝트를 거절할 수 있는 기준입니다.
            </button>
            <button
              className="ow-choice"
              data-choice-key="protect"
              data-choice-value="작업 속도를 내가 정할 수 있는 여지"
            >
              작업 속도를 내가 정할 수 있는 여지입니다.
            </button>
          </div>
        </section>

        <section className="ow-step" aria-hidden="true">
          <p className="ow-label">무엇을 감수할 것인가</p>
          <h2>앞에서 선택한 기준을 지키기 위해 포기해도 괜찮다고 느끼는 것을 하나 선택해 주세요.</h2>
          <div className="ow-choice-grid">
            <button
              className="ow-choice"
              data-choice-key="sacrifice"
              data-choice-value="빠른 반응을 얻기 위한 속도"
            >
              빠른 반응을 얻기 위한 속도입니다.
            </button>
            <button
              className="ow-choice"
              data-choice-key="sacrifice"
              data-choice-value="어디서나 잘 작동하는 범용성"
            >
              어디서나 잘 작동하는 범용성입니다.
            </button>
            <button
              className="ow-choice"
              data-choice-key="sacrifice"
              data-choice-value="갈등을 피하기 위한 겉보기 완성도"
            >
              갈등을 피하기 위한 겉보기 완성도입니다.
            </button>
          </div>
        </section>

        <section className="ow-step" aria-hidden="true">
          <p className="ow-label">정리된 기준</p>
          <div className="ow-summary-lines">
            <p className="ow-summary-line">
              나는 앞으로 <span className="ow-inline-value" data-summary="make">—</span>을 우선합니다.
            </p>
            <p className="ow-summary-line">
              나는 <span className="ow-inline-value" data-summary="protect">—</span>을 지키기 위해{' '}
              <span className="ow-inline-value" data-summary="sacrifice">—</span>을 포기합니다.
            </p>
            <p className="ow-summary-line">
              나는 <span className="ow-inline-value" data-summary="refuse">—</span>은 선택하지 않습니다.
            </p>
          </div>
          <p className="ow-body">이 기준은 나를 설명하기 위한 문장이 아닙니다. 다음 선택을 정리하기 위한 기준입니다.</p>
          <p className="ow-note">필요할 때 다시 실행하여 기준을 새로 정리할 수 있습니다.</p>
          <button className="ow-secondary" data-reset>
            처음부터 다시 시작하기
          </button>
        </section>

        <footer className="ow-footer">
          <p className="ow-footer-text">이 워크북은 성향 테스트가 아닙니다.</p>
          <p className="ow-footer-text">언제든 처음부터 다시 선택할 수 있습니다.</p>
        </footer>
      </div>
    </div>
  );
};

export default OriginalityWorkbook;

import React, { useEffect } from 'react';
import './OriginalityWorkbook.css';

const OriginalityWorkbook: React.FC = () => {
  useEffect(() => {
    const steps = Array.from(document.querySelectorAll<HTMLElement>('.ow-step'));
    const choiceButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[data-choice-key]')
    );
    const nextButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[data-next]')
    );
    const prevButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[data-prev]')
    );
    const advanceButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[data-advance]')
    );
    const resetButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[data-reset]')
    );
    const progressBar = document.querySelector<HTMLElement>('[data-progress]');
    const progressWrap = document.querySelector<HTMLElement>('.ow-progress');

    const savedAnswers = localStorage.getItem('ow-answers');
    const parsed = savedAnswers ? JSON.parse(savedAnswers) : null;
    const state = {
      question1: parsed?.question1 ?? '',
      question2: parsed?.question2 ?? '',
      question3: parsed?.question3 ?? '',
      question4: parsed?.question4 ?? '',
      question5: parsed?.question5 ?? '',
      question6: parsed?.question6 ?? '',
      choice1: parsed?.choice1 ?? '',
      choice2: parsed?.choice2 ?? '',
      choice3: parsed?.choice3 ?? '',
      choice4: parsed?.choice4 ?? '',
      choice5: parsed?.choice5 ?? '',
      choice6: parsed?.choice6 ?? '',
    };

    const summaryFields: Record<string, HTMLElement | null> = {
      question1: document.querySelector('[data-summary="question1"]'),
      question2: document.querySelector('[data-summary="question2"]'),
      question3: document.querySelector('[data-summary="question3"]'),
      question4: document.querySelector('[data-summary="question4"]'),
      question5: document.querySelector('[data-summary="question5"]'),
      question6: document.querySelector('[data-summary="question6"]'),
      choice1: document.querySelector('[data-summary="choice1"]'),
      choice2: document.querySelector('[data-summary="choice2"]'),
      choice3: document.querySelector('[data-summary="choice3"]'),
      choice4: document.querySelector('[data-summary="choice4"]'),
      choice5: document.querySelector('[data-summary="choice5"]'),
      choice6: document.querySelector('[data-summary="choice6"]'),
    };

    const answerFields: Record<string, HTMLElement | null> = {
      question1: document.querySelector('[data-answer="question1"]'),
      question2: document.querySelector('[data-answer="question2"]'),
      question3: document.querySelector('[data-answer="question3"]'),
      question4: document.querySelector('[data-answer="question4"]'),
      question5: document.querySelector('[data-answer="question5"]'),
      question6: document.querySelector('[data-answer="question6"]'),
    };

    const clampStep = (index: number) => Math.max(0, Math.min(index, steps.length - 1));
    const requirements: Record<number, (keyof typeof state)[]> = {
      1: ['question1', 'choice1'],
      2: ['question2', 'choice2'],
      3: ['choice3'],
      4: ['question4', 'choice4'],
      5: ['question5', 'choice5'],
      6: ['question6', 'choice6'],
    };
    const choiceOptions: Record<string, string[]> = {
      choice1: [
        '결과보다 작업의 이유가 분명한 상태',
        '작은 디테일까지 직접 책임질 수 있는 과정',
        '남의 기준이 아니라 내 판단으로 결정할 수 있는 구조',
        '시간이 걸려도 완성까지 밀고 갈 수 있는 밀도',
        '설명 없이도 스스로 납득되는 작업의 감각',
      ],
      choice2: [
        '기준이 흐려진 채 조건만 좋아 보이는 선택',
        '내가 통제할 수 없는 외부 일정과 구조',
        '결과만 요구되고 과정은 중요하지 않은 상황',
        '이미 답이 정해져 있는 형식적인 작업',
        '계속 설명해야만 정당화되는 찜찜한 선택',
      ],
      choice3: [
        '시간에 대한 압박',
        '타인의 평가와 시선',
        '보상과 생계에 대한 불안',
        '관계가 깨질지도 모른다는 부담',
        '실패했을 때 감당해야 할 책임',
      ],
      choice4: [
        '이유를 끝까지 설명할 수 있어야 한다는 감각',
        '속도가 느려져도 밀도를 포기할 수 없다는 기준',
        '이 작업은 내가 아니면 안 된다는 책임감',
        '과정이 흔들리면 결과도 의미 없어진다는 생각',
        '이 감각이 없으면 작업을 시작할 수 없다는 확신',
      ],
      choice5: [
        '작업의 목적을 한 문장으로 말할 수 있는 상태',
        '중간에 멈추거나 거절할 수 있는 권한',
        '작업 속도를 스스로 조절할 수 있는 구조',
        '결과보다 판단 과정을 존중받는 환경',
        '내가 이 작업을 하는 이유에 스스로 납득하는 상태',
      ],
      choice6: [
        '남들보다 빠르게 결과를 내는 속도',
        '많은 사람에게 바로 이해되는 방식',
        '모든 플랫폼에 맞는 범용성',
        '안정적인 보상과 예측 가능한 경로',
        '관계에서의 무난함',
      ],
    };

    const updateNextButtons = () => {
      steps.forEach((step, idx) => {
        const nextBtn = step.querySelector<HTMLButtonElement>('[data-next]');
        if (!nextBtn) return;
        const req = requirements[idx] || [];
        const ok = req.every((key) => Boolean(state[key]));
        nextBtn.disabled = !ok;
        nextBtn.classList.toggle('is-disabled', !ok);
      });
    };

    const scrollTop = () => {
      const frame = document.querySelector<HTMLElement>('.ow-frame');
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      if (frame) frame.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        if (frame) frame.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }, 0);
    };

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

    const syncUI = () => {
      choiceButtons.forEach((btn) => {
        const key = btn.dataset.choiceKey as keyof typeof state | undefined;
        if (!key) {
          btn.classList.remove('is-selected');
          return;
        }
        const val = btn.dataset.choiceValue || btn.value;
        btn.classList.toggle('is-selected', Boolean(val && state[key] === val));
      });

      const textareas = Array.from(document.querySelectorAll<HTMLTextAreaElement>('.ow-textarea'));
      textareas.forEach((area) => {
        const key = area.dataset.choiceKey as keyof typeof state | undefined;
        if (!key) return;
        const isChoiceField = key.startsWith('choice');
        const val = state[key] || '';
        if (isChoiceField && choiceOptions[key] && choiceOptions[key].includes(val)) {
          area.value = '';
        } else {
          area.value = val;
        }
      });

      updateNextButtons();
    };

    const renderSummary = () => {
      Object.entries(summaryFields).forEach(([key, el]) => {
        if (!el) return;
        const value = state[key as keyof typeof state];
        el.textContent = value || '—';
      });
      const choice5El = summaryFields.choice5;
      if (choice5El) {
        const fallback = state.choice5 || state.question5;
        choice5El.textContent = fallback || '—';
      }
      Object.entries(answerFields).forEach(([key, el]) => {
        if (!el) return;
        const value = state[key as keyof typeof state];
        el.textContent = value || '—';
      });
      syncUI();
    };

    const saveState = () => {
      localStorage.setItem('ow-answers', JSON.stringify(state));
    };

    const updateFromInputs = () => {
      const current = steps[currentStep];
      if (!current) return;
      const areas = Array.from(current.querySelectorAll<HTMLTextAreaElement>('textarea'));
      areas.forEach((area) => {
        const key = area.dataset.choiceKey as keyof typeof state | undefined;
        if (!key) return;
        const value = area.value.trim();
        if (!value) return;
        state[key] = value;
      });
      saveState();
      renderSummary();
    };

    const performReset = () => {
      Object.keys(state).forEach((key) => {
        const typedKey = key as keyof typeof state;
        state[typedKey] = '';
      });
      const textareasAll = Array.from(document.querySelectorAll<HTMLTextAreaElement>('.ow-textarea'));
      textareasAll.forEach((area) => {
        area.value = '';
      });
      choiceButtons.forEach((btn) => btn.classList.remove('is-selected'));
      saveState();
      renderSummary();
      currentStep = renderStep(0);
      scrollTop();
    };

    const handleChoice = (event: Event) => {
      const target = event.currentTarget as HTMLButtonElement;
      const key = target.dataset.choiceKey as keyof typeof state | undefined;
      const value = target.dataset.choiceValue || target.value;
      if (!key || !value) return;

      state[key] = value;
      saveState();
      renderSummary();
    };

    const handleAdvance = () => {
      currentStep = renderStep(currentStep + 1);
      scrollTop();
    };

    choiceButtons.forEach((button) => button.addEventListener('click', handleChoice));
    const textareas = Array.from(document.querySelectorAll<HTMLTextAreaElement>('.ow-textarea'));
    textareas.forEach((area) =>
      area.addEventListener('blur', () => {
        const key = area.dataset.choiceKey as keyof typeof state | undefined;
        if (!key) return;
        const value = area.value.trim();
        if (!value) return;
        state[key] = value;
        saveState();
        renderSummary();
      })
    );
    nextButtons.forEach((btn) =>
      btn.addEventListener('click', () => {
        updateFromInputs();
        currentStep = renderStep(currentStep + 1);
        scrollTop();
      })
    );
    prevButtons.forEach((btn) =>
      btn.addEventListener('click', () => {
        updateFromInputs();
        currentStep = renderStep(currentStep - 1);
        scrollTop();
      })
    );
    advanceButtons.forEach((button) => button.addEventListener('click', handleAdvance));

    const modal = document.querySelector<HTMLElement>('.ow-modal');
    const modalConfirm = document.querySelector<HTMLButtonElement>('[data-modal-confirm]');
    const modalCancel = document.querySelector<HTMLButtonElement>('[data-modal-cancel]');
    const openModal = () => {
      if (!modal) return;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
    };
    const closeModal = () => {
      if (!modal) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
    };

    resetButtons.forEach((button) =>
      button.addEventListener('click', () => {
        if (modal) {
          openModal();
        } else {
          performReset();
        }
      })
    );
    if (modalConfirm) {
      modalConfirm.addEventListener('click', () => {
        performReset();
        closeModal();
      });
    }
    if (modalCancel) {
      modalCancel.addEventListener('click', () => {
        closeModal();
      });
    }

    const toggleButton = document.querySelector<HTMLButtonElement>('[data-toggle-answers]');
    const answersPanel = document.querySelector<HTMLElement>('.ow-answers-panel');
    if (toggleButton && answersPanel) {
      toggleButton.addEventListener('click', () => {
        const isOpen = answersPanel.classList.toggle('is-open');
        answersPanel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        toggleButton.textContent = isOpen ? '주관식 답변 접기' : '주관식 답변 보기';
      });
    }

    renderSummary();

    return () => {
      choiceButtons.forEach((button) => button.removeEventListener('click', handleChoice));
      nextButtons.forEach((button) => button.replaceWith(button.cloneNode(true)));
      prevButtons.forEach((button) => button.replaceWith(button.cloneNode(true)));
      advanceButtons.forEach((button) => button.removeEventListener('click', handleAdvance));
      resetButtons.forEach((button) => button.replaceWith(button.cloneNode(true)));
      if (modalConfirm) modalConfirm.replaceWith(modalConfirm.cloneNode(true));
      if (modalCancel) modalCancel.replaceWith(modalCancel.cloneNode(true));
      if (toggleButton) toggleButton.replaceWith(toggleButton.cloneNode(true));
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
              <h1 className="ow-headline">나의 오리지널리티를 찾기 위한 기록</h1>
            </div>
          </div>
        </header>

        <section className="ow-step is-active" aria-hidden="false">
          <p className="ow-label">이 워크북은</p>
          <h2>내가 왜 이런 방식으로 작업해 왔는지,<br></br> 어떤 순간들을 지나 지금에 도착했는지를 <br></br>차분히 돌아보는 도구입니다.</h2>
          <p className="ow-body">여기서 말하는 오리지널리티는 나의 삶과 경험에서 비롯된 기준이 선택과 판단에 작동하는 상태를 뜻합니다.</p>
          <p className="ow-body">짧은 질문을 따라가며 지금까지 반복되어 온 선택, 흔들렸던 순간, 끝내 남아 있던 감각을 하나씩 정리해보세요.</p>
          <p className="ow-body">그 과정에서 나만의 작업 방식이 어떻게 만들어졌는지,그리고 지금 무엇을 지키고 무엇을 내려놓아야 하는지가 자연스럽게 드러나게 됩니다</p>
          <p className="ow-bridge">준비되었다면 <br></br> 지금까지의 삶을 바탕으로 <br></br>나의 선택을 다시 정리해볼까요?.</p>
          <button className="ow-primary ow-primary-intro" data-advance>
            시작하기
          </button>
        </section>

        <section className="ow-step" aria-hidden="true">
          <p className="ow-label">질문 1</p>
          <h2>다른 사람이 더 빠르게 결과를 냈던 순간에도 끝까지 놓지 않고 싶었던 작업이 있다면 그 장면을 적어주세요.그 작업에서 특히 중요하게 지키고 싶었던 것은 무엇이었나요?</h2>
          <textarea
            className="ow-textarea"
            data-choice-key="question1"
            placeholder="예:
                        “다른 사람이 이미 끝냈어도, ○○만큼은 직접 확인하고 싶었다”
                        “효율이 떨어져도 이 부분만큼은 넘기고 싶지 않았다”
                        “이 작업을 할 때만큼은 ○○을 지키고 싶었다”
                        "
          />
          <div className="ow-choice-grid ow-followup">
            <p className="ow-label">Q1-1. 이 작업에서 가장 중요했던 기준은?</p>
            <button className="ow-choice" data-choice-key="choice1" data-choice-value="결과보다 작업의 이유가 분명한 상태">결과보다 작업의 이유가 분명한 상태</button>
            <button className="ow-choice" data-choice-key="choice1" data-choice-value="작은 디테일까지 직접 책임질 수 있는 과정">작은 디테일까지 직접 책임질 수 있는 과정</button>
            <button className="ow-choice" data-choice-key="choice1" data-choice-value="남의 기준이 아니라 내 판단으로 결정할 수 있는 구조">남의 기준이 아니라 내 판단으로 결정할 수 있는 구조</button>
            <button className="ow-choice" data-choice-key="choice1" data-choice-value="시간이 걸려도 완성까지 밀고 갈 수 있는 밀도">시간이 걸려도 완성까지 밀고 갈 수 있는 밀도</button>
            <button className="ow-choice" data-choice-key="choice1" data-choice-value="설명 없이도 스스로 납득되는 작업의 감각">설명 없이도 스스로 납득되는 작업의 감각</button>
            <textarea className="ow-textarea ow-textarea-inline" data-choice-key="choice1" placeholder="기타: 직접 적기" />
          </div>
          <div className="ow-nav">
            <button className="ow-secondary" data-prev>이전</button>
            <button className="ow-primary" data-next>다음</button>
          </div>
        </section>

        <section className="ow-step" aria-hidden="true">
          <p className="ow-label">질문 2</p>
          <h2>작업을 하다 비슷한 이유로 여러 번 멈추거나 방향을 바꾼 경험이 있다면, 그때 어떤 선택 앞에서 주로 멈췄나요?</h2>
          <textarea
            className="ow-textarea"
            data-choice-key="question2"
            placeholder="예:
                        “조건은 괜찮았지만 ○○ 때문에 계속 망설여졌다”
                        “이 방향으로 가면 ○○을 잃을 것 같았다”
                        “결정해야 할 순간마다 비슷한 이유로 멈췄다”
                        "
          />
          <div className="ow-choice-grid ow-followup">
            <p className="ow-label">Q2-1. 주로 어떤 선택 앞에서 멈추었나요?</p>
            <button className="ow-choice" data-choice-key="choice2" data-choice-value="기준이 흐려진 채 조건만 좋아 보이는 선택">기준이 흐려진 채 조건만 좋아 보이는 선택</button>
            <button className="ow-choice" data-choice-key="choice2" data-choice-value="내가 통제할 수 없는 외부 일정과 구조">내가 통제할 수 없는 외부 일정과 구조</button>
            <button className="ow-choice" data-choice-key="choice2" data-choice-value="결과만 요구되고 과정은 중요하지 않은 상황">결과만 요구되고 과정은 중요하지 않은 상황</button>
            <button className="ow-choice" data-choice-key="choice2" data-choice-value="이미 답이 정해져 있는 형식적인 작업">이미 답이 정해져 있는 형식적인 작업</button>
            <button className="ow-choice" data-choice-key="choice2" data-choice-value="계속 설명해야만 정당화되는 찜찜한 선택">계속 설명해야만 정당화되는 찜찜한 선택</button>
            <textarea className="ow-textarea ow-textarea-inline" data-choice-key="choice2" placeholder="기타: 직접 적기" />
          </div>
          <div className="ow-nav">
            <button className="ow-secondary" data-prev>이전</button>
            <button className="ow-primary" data-next>다음</button>
          </div>
        </section>

        <section className="ow-step" aria-hidden="true">
          <p className="ow-label">질문 3</p>
          <h2>그 선택 앞에서 망설일 때, 당시 당신의 결정을 가장 크게 흔들었던 요소는 무엇이었나요? 시간, 평가, 보상, 관계 등 무엇이든 좋습니다.</h2>
          <div className="ow-choice-grid ow-followup">
            <button className="ow-choice" data-choice-key="choice3" data-choice-value="시간에 대한 압박">시간에 대한 압박</button>
            <button className="ow-choice" data-choice-key="choice3" data-choice-value="타인의 평가와 시선">타인의 평가와 시선</button>
            <button className="ow-choice" data-choice-key="choice3" data-choice-value="보상과 생계에 대한 불안">보상과 생계에 대한 불안</button>
            <button className="ow-choice" data-choice-key="choice3" data-choice-value="관계가 깨질지도 모른다는 부담">관계가 깨질지도 모른다는 부담</button>
            <button className="ow-choice" data-choice-key="choice3" data-choice-value="실패했을 때 감당해야 할 책임">실패했을 때 감당해야 할 책임</button>
            <textarea className="ow-textarea ow-textarea-inline" data-choice-key="choice3" placeholder="기타: 직접 적기" />
          </div>
          <div className="ow-nav">
            <button className="ow-secondary" data-prev>이전</button>
            <button className="ow-primary" data-next>다음</button>
          </div>
        </section>

        <section className="ow-step" aria-hidden="true">
          <p className="ow-label">질문 4</p>
          <h2>여러 번 멈추고 돌아섰음에도 불구하고, 이상하게 계속 마음에 남아 있던 작업의 감각이 있다면 무엇이었나요? 구체적인 느낌이나 기준을 적어주세요.</h2>
          <textarea
            className="ow-textarea"
            data-choice-key="question4"
            placeholder="예:
                        “이 감각만큼은 놓치면 다시는 작업을 못 할 것 같았다”
                        “말로 설명하기 어렵지만, 계속 돌아오게 되는 기준이었다”
                        “이게 없으면 나답지 않다고 느꼈다”
                        "
          />
          <div className="ow-choice-grid ow-followup">
            <p className="ow-label">Q4-1. 가장 가까운 표현을 골라 주세요.</p>
            <button className="ow-choice" data-choice-key="choice4" data-choice-value="이유를 끝까지 설명할 수 있어야 한다는 감각">이유를 끝까지 설명할 수 있어야 한다는 감각</button>
            <button className="ow-choice" data-choice-key="choice4" data-choice-value="속도가 느려져도 밀도를 포기할 수 없다는 기준">속도가 느려져도 밀도를 포기할 수 없다는 기준</button>
            <button className="ow-choice" data-choice-key="choice4" data-choice-value="이 작업은 내가 아니면 안 된다는 책임감">이 작업은 내가 아니면 안 된다는 책임감</button>
            <button className="ow-choice" data-choice-key="choice4" data-choice-value="과정이 흔들리면 결과도 의미 없어진다는 생각">과정이 흔들리면 결과도 의미 없어진다는 생각</button>
            <button className="ow-choice" data-choice-key="choice4" data-choice-value="이 감각이 없으면 작업을 시작할 수 없다는 확신">이 감각이 없으면 작업을 시작할 수 없다는 확신</button>
            <textarea className="ow-textarea ow-textarea-inline" data-choice-key="choice4" placeholder="기타: 직접 적기" />
          </div>
          <div className="ow-nav">
            <button className="ow-secondary" data-prev>이전</button>
            <button className="ow-primary" data-next>다음</button>
          </div>
        </section>

        <section className="ow-step" aria-hidden="true">
          <p className="ow-label">질문 5</p>
          <h2>앞으로 작업을 시작할 때, 이것만큼은 지켜지지 않으면 시작하지 않겠다고 느끼는 조건은 무엇인가요? <br></br>
            지금의 당신에게 가장 중요한 기준 하나를 적어주세요.</h2>
          <textarea
            className="ow-textarea"
            data-choice-key="question5"
            placeholder="예:
                        “이게 지켜지지 않으면 시작하지 않겠다고 느낀다”
                        “지금의 나에게 가장 중요한 기준 하나다”
                        “이 기준만큼은 양보하지 않겠다고 정했다”
                        "
          />
          <div className="ow-choice-grid ow-followup">
            <p className="ow-label">Q5-1. 시작 전에 지켜져야 하는 조건은?</p>
            <button className="ow-choice" data-choice-key="choice5" data-choice-value="작업의 목적을 한 문장으로 말할 수 있는 상태">작업의 목적을 한 문장으로 말할 수 있는 상태</button>
            <button className="ow-choice" data-choice-key="choice5" data-choice-value="중간에 멈추거나 거절할 수 있는 권한">중간에 멈추거나 거절할 수 있는 권한</button>
            <button className="ow-choice" data-choice-key="choice5" data-choice-value="작업 속도를 스스로 조절할 수 있는 구조">작업 속도를 스스로 조절할 수 있는 구조</button>
            <button className="ow-choice" data-choice-key="choice5" data-choice-value="결과보다 판단 과정을 존중받는 환경">결과보다 판단 과정을 존중받는 환경</button>
            <button className="ow-choice" data-choice-key="choice5" data-choice-value="내가 이 작업을 하는 이유에 스스로 납득하는 상태">내가 이 작업을 하는 이유에 스스로 납득하는 상태</button>
            <textarea className="ow-textarea ow-textarea-inline" data-choice-key="choice5" placeholder="기타: 직접 적기" />
          </div>
          <div className="ow-nav">
            <button className="ow-secondary" data-prev>이전</button>
            <button className="ow-primary" data-next>다음</button>
          </div>
        </section>

        <section className="ow-step" aria-hidden="true">
          <p className="ow-label">질문 6</p>
          <h2>위의 조건을 지키기 위해서라면, 지금은 포기하거나 늦춰도 괜찮다고 느끼는 것은 무엇인가요?</h2>
          <textarea
            className="ow-textarea"
            data-choice-key="question6"
            placeholder="예:
                        “이 기준을 지키기 위해서라면 ○○은 감수할 수 있다”
                        “지금은 ○○을 내려놓아도 괜찮다고 느낀다”
                        "
          />
          <div className="ow-choice-grid ow-followup">
            <p className="ow-label">Q6-1. 어떤 것을 감수하기로 했나요?</p>
            <button className="ow-choice" data-choice-key="choice6" data-choice-value="남들보다 빠르게 결과를 내는 속도">남들보다 빠르게 결과를 내는 속도</button>
            <button className="ow-choice" data-choice-key="choice6" data-choice-value="많은 사람에게 바로 이해되는 방식">많은 사람에게 바로 이해되는 방식</button>
            <button className="ow-choice" data-choice-key="choice6" data-choice-value="모든 플랫폼에 맞는 범용성">모든 플랫폼에 맞는 범용성</button>
            <button className="ow-choice" data-choice-key="choice6" data-choice-value="안정적인 보상과 예측 가능한 경로">안정적인 보상과 예측 가능한 경로</button>
            <button className="ow-choice" data-choice-key="choice6" data-choice-value="관계에서의 무난함">관계에서의 무난함</button>
            <textarea className="ow-textarea ow-textarea-inline" data-choice-key="choice6" placeholder="기타: 직접 적기" />
          </div>
          <div className="ow-nav">
            <button className="ow-secondary" data-prev>이전</button>
            <button className="ow-primary" data-next>다음</button>
          </div>
        </section>

        <section className="ow-step" aria-hidden="true">
          <p className="ow-label">나의 오리지널리티 기록</p>
          <div className="ow-summary-lines">

            <p className="ow-summary-line">나는 여러 작업을 거치며<br></br> 반복해서 <span className="ow-inline-value" data-summary="choice2">—</span> 앞에서 자주 멈추거나 방향을 바꿔왔다.</p>
            <p className="ow-summary-line">그 선택 앞에서 <span className="ow-inline-value" data-summary="choice3">—</span>이 나를 가장 흔들었다.</p>
            <p className="ow-summary-line">그럼에도 사라지지 않고 계속 남아 있던 감각은 <span className="ow-inline-value" data-summary="choice4">—</span>이었다.</p>
            <p className="ow-summary-line">이 흐름을 지나 지금의 나는, 작업을 시작하기 위해 최소한 <span className="ow-inline-value" data-summary="choice5">—</span>이 지켜지기를 바라고 있다.</p>
            <p className="ow-summary-line">그래서 나는 <span className="ow-inline-value" data-summary="choice5">—</span>이 지켜지는 작업을 선택하고,</p>
             <p className="ow-summary-line">그 대신 <span className="ow-inline-value" data-summary="choice6">—</span>을 감수하는 쪽을 택한다.</p>
            <p className="ow-summary-line">이 기록은 나를 규정하는 결론이 아니라, <br></br>다음 작업 앞에서 다시 참고하기 위한 현재의 기준이다.</p>
          </div>
          <p className="ow-note">이 기록을 저장해 두고,
            새로운 작업을 시작하기 전이나 중요한 결정을 앞두었을 때
            다시 읽어보세요.

            지금 하려는 선택이
            이 기준과 이어지는지,
            아니면 다른 방향으로 흔들리고 있는지
            차분히 확인하는 데 도움이 됩니다.
          </p>
          <button className="ow-secondary" data-reset>
            처음부터 다시 시작하기
          </button>
          <div className="ow-answers">
            <button className="ow-tertiary" data-toggle-answers>주관식 답변 보기</button>
            <div className="ow-answers-panel" aria-hidden="true">
              <p className="ow-answer-line">Q1: <span data-answer="question1">—</span></p>
              <p className="ow-answer-line">Q2: <span data-answer="question2">—</span></p>
              <p className="ow-answer-line">Q3: <span data-answer="question3">—</span></p>
              <p className="ow-answer-line">Q4: <span data-answer="question4">—</span></p>
              <p className="ow-answer-line">Q5: <span data-answer="question5">—</span></p>
              <p className="ow-answer-line">Q6: <span data-answer="question6">—</span></p>
            </div>
          </div>
        </section>

        <footer className="ow-footer">
          <p className="ow-footer-text">이 워크북은 성향 테스트가 아닙니다.</p>
          <p className="ow-footer-text">언제든 처음부터 다시 선택할 수 있습니다.</p>
        </footer>
        <div className="ow-modal" aria-hidden="true">
          <div className="ow-modal-backdrop" />
          <div className="ow-modal-box" role="dialog" aria-modal="true">
            <p className="ow-modal-title">초기화하시겠어요?</p>
            <p className="ow-modal-body">작성한 내용을 모두 지우게 됩니다. 저장했는지 확인해 주세요.</p>
            <div className="ow-modal-actions">
              <button className="ow-secondary" data-modal-cancel>계속 작성</button>
              <button className="ow-primary" data-modal-confirm>내용 지우기</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OriginalityWorkbook;

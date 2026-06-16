import React, { createContext, useContext, useState } from 'react';

export type Lang = 'en' | 'ko';

type Dict = Record<string, string>;

const EN: Dict = {
  survey: 'Survey form',
  emptyTitle: 'No chairs yet.',
  emptyHint: 'Tap the button below to put the chair you imagine on the board.',
  addChair: '+ Add chair',
  remove: 'Remove from board',
  othersImage: "Someone else's chair",
  instructionsTitle: 'What is The Chair Theory?',
  step1Label: 'Step 1',
  step1Body:
    'On the survey, freely draw the chair you imagine, and write down why you drew it that way.',
  step2Label: 'Step 2',
  step2Body:
    "Tap “+ Add chair”. Point the camera at the survey and it captures automatically after 5 seconds — on a phone you can also take a photo or pick one from your album.",
  step3Label: 'Step 3',
  step3Body: 'Your drawing is placed at a random spot on the board.',
  step4Label: 'Step 4',
  step4Body: 'Tap a drawing on the board to see it larger.',
  instructionsClosing:
    "Chairs imagined differently by each person gather into a single board, connected like a spider’s web.",
  openInstructions: 'Open guide',
  close: 'Close',
  capturedAlt: 'a chair someone drew',
  enlargedAlt: 'enlarged chair drawing',
  loadError: "Couldn't load saved images.",
  // Webcam
  pointSurvey: 'Point the survey at the camera',
  timerCapture: 'Capture with 5s timer',
  capturing: 'Capturing…',
  captureNow: 'Capture now',
  chooseFromAlbum: '📷 Photo / Choose from album',
  takeOrChoose: '📷 Take a photo / Choose from album',
  cameraUnavailable: 'Camera unavailable. Please add a photo below instead.',
  // PDF
  pdfLoading: 'Loading the survey form…',
  pdfError: "Couldn't load the survey form.",
  pdfHint: 'Check public/the-chair-theory-survey.pdf',
  // Catalog
  back: '← The Chair Theory',
  catalogLoading: 'Loading…',
  catalogError: 'The catalog is being prepared.',
  // language toggle: single character showing the OTHER language
  toggle: '한',
};

const KO: Dict = {
  survey: '설문지 양식',
  emptyTitle: '아직 의자가 없습니다.',
  emptyHint: '아래 버튼을 눌러 당신이 생각하는 의자를 보드에 올려보세요.',
  addChair: '+ 의자 추가',
  remove: '보드에서 삭제',
  othersImage: '다른 참여자가 올린 의자예요',
  instructionsTitle: 'The Chair Theory란?',
  step1Label: '1단계',
  step1Body: '설문지에 당신이 생각하는 의자를 자유롭게 그리고, 그렇게 그린 이유를 적습니다.',
  step2Label: '2단계',
  step2Body:
    "“+ 의자 추가” 버튼을 누릅니다. 카메라로 설문지를 비추면 5초 후 자동 촬영되고, 휴대폰에서는 폰카로 찍거나 앨범에서 사진을 골라 올릴 수도 있습니다.",
  step3Label: '3단계',
  step3Body: '촬영된 그림이 보드의 무작위 위치에 놓입니다.',
  step4Label: '4단계',
  step4Body: '보드의 그림을 클릭하면 크게 볼 수 있습니다.',
  instructionsClosing: '사람마다 다르게 상상한 의자들이 모여, 거미줄처럼 연결된 하나의 보드를 만들어갑니다.',
  openInstructions: '설명서 열기',
  close: '닫기',
  capturedAlt: '누군가가 그린 의자',
  enlargedAlt: '확대된 의자 그림',
  loadError: '저장된 이미지를 불러오지 못했습니다.',
  pointSurvey: '설문지를 카메라에 대세요',
  timerCapture: '5초 타이머로 촬영',
  capturing: '촬영 중…',
  captureNow: '지금 촬영',
  chooseFromAlbum: '📷 사진 / 앨범에서 선택',
  takeOrChoose: '📷 사진 찍기 / 앨범에서 선택',
  cameraUnavailable: '카메라를 사용할 수 없습니다. 아래에서 사진을 직접 올려주세요.',
  pdfLoading: '설문지 양식을 불러오는 중…',
  pdfError: '설문지 양식을 불러오지 못했습니다.',
  pdfHint: 'public/the-chair-theory-survey.pdf 파일을 확인해주세요.',
  back: '← The Chair Theory',
  catalogLoading: '불러오는 중…',
  catalogError: '카탈로그를 준비 중입니다.',
  toggle: 'A',
};

const DICT: Record<Lang, Dict> = { en: EN, ko: KO };

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<Ctx>({
  lang: 'en',
  setLang: () => {},
  toggle: () => {},
  t: (k) => EN[k] ?? k,
});

const STORAGE_KEY = 'chair-lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === 'ko' ? 'ko' : 'en'; // 기본 영어
    } catch {
      return 'en';
    }
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* noop */
    }
  };

  const toggle = () => setLang(lang === 'en' ? 'ko' : 'en');
  const t = (key: string) => DICT[lang][key] ?? EN[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = (): Ctx => useContext(LanguageContext);

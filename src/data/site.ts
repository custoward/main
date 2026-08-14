/**
 * 사이트에 나오는 모든 문구.
 *
 * 고칠 일이 생기면 이 파일 하나만 열면 된다. 컴포넌트에는 문구를 두지 않았다.
 *
 * 빈 문자열('')이나 빈 배열([])로 둔 곳은 아직 안 채운 자리다.
 * 화면은 **채운 만큼만** 나온다 — 비어 있으면 그 블록이 통째로 빠지므로,
 * 자리표시자가 노출되거나 레이아웃이 깨지지 않는다. 천천히 채우면 된다.
 */

/** 언어를 안 타는 값들 */
export const brand = {
  name: "Davi Davi Design house",
  nameKo: "다비다비",
  url: "https://studiodavidavi.com",
  logo: "/logo.webp",

  /** TODO: OG는 "Since 2019", 옛 헤더는 "Since 2021" 이었다. 맞는 쪽으로 채울 것 */
  foundedYear: "",

  email: "m.kim@studiodavidavi.com",
  instagram: "https://www.instagram.com/davi_davi.design/",
  instagramHandle: "@davi_davi.design",
} as const;

export interface Service {
  title: string;
  body: string;
}

export interface ProcessStep {
  title: string;
  body: string;
}

export interface Copy {
  /** <html lang> 과 hreflang 에 쓰인다 */
  htmlLang: string;
  /** 언어 전환 버튼에 보일 상대 언어 이름 */
  switchTo: string;

  nav: { work: string; about: string; contact: string };

  meta: { title: string; description: string };

  home: {
    /** 첫 화면 큰 글자 */
    headline: string;
    /** 그 아래 붙는 문장들 */
    lead: string[];
    ctaLabel: string;
  };

  work: {
    heading: string;
    lead: string[];
    /** 작업이 아직 없을 때 대신 보여줄 한 줄 */
    empty: string;
  };

  about: {
    heading: string;
    lead: string[];
    servicesHeading: string;
    services: Service[];
    processHeading: string;
    process: ProcessStep[];
  };

  contact: {
    heading: string;
    lead: string[];
    /** 문의 메일에 담아주면 좋은 것들 */
    checklistHeading: string;
    checklist: string[];
    emailLabel: string;
    /** 메일 제목 기본값 */
    mailSubject: string;
  };

  footer: { note: string };

  notFound: { heading: string; body: string; back: string };
}

const ko: Copy = {
  htmlLang: "ko",
  switchTo: "EN",

  nav: { work: "작업", about: "소개", contact: "문의" },

  meta: {
    title: "",
    description: "디자인 스튜디오 다비다비. 지금은 사이트를 새로 만들고 있습니다.",
  },

  home: {
    headline: "사이트를 새로 만들고 있습니다",
    lead: ["곧 새 모습으로 찾아뵙겠습니다.", "그동안 문의는 메일로 주세요."],
    ctaLabel: "문의하기",
  },

  work: {
    heading: "작업",
    lead: [],
    empty: "곧 채워집니다.",
  },

  about: {
    heading: "소개",
    lead: [],
    servicesHeading: "하는 일",
    services: [],
    processHeading: "진행 방식",
    process: [],
  },

  contact: {
    heading: "문의",
    lead: ["프로젝트 문의는 메일로 주세요."],
    checklistHeading: "이런 내용을 주시면 빠릅니다",
    checklist: [],
    emailLabel: "메일 보내기",
    mailSubject: "프로젝트 문의",
  },

  footer: { note: "사이트 개편 중" },

  notFound: {
    heading: "없는 쪽입니다",
    body: "주소가 바뀌었거나 지워진 페이지입니다.",
    back: "처음으로",
  },
};

const en: Copy = {
  htmlLang: "en",
  switchTo: "KO",

  nav: { work: "Work", about: "About", contact: "Contact" },

  meta: {
    title: "",
    description: "Davi Davi Design house. This site is being rebuilt.",
  },

  home: {
    headline: "We are rebuilding this site",
    lead: ["A new version is on the way.", "Until then, please reach us by email."],
    ctaLabel: "Get in touch",
  },

  work: {
    heading: "Work",
    lead: [],
    empty: "Coming soon.",
  },

  about: {
    heading: "About",
    lead: [],
    servicesHeading: "Services",
    services: [],
    processHeading: "Process",
    process: [],
  },

  contact: {
    heading: "Contact",
    lead: ["For project inquiries, please email us."],
    checklistHeading: "Helpful to include",
    checklist: [],
    emailLabel: "Send an email",
    mailSubject: "Project inquiry",
  },

  footer: { note: "Site under renovation" },

  notFound: {
    heading: "Not found",
    body: "This page has moved or no longer exists.",
    back: "Back to home",
  },
};

export const LANGS = ["ko", "en"] as const;
export type Lang = (typeof LANGS)[number];

const COPY: Record<Lang, Copy> = { ko, en };

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

export function getCopy(lang: Lang): Copy {
  return COPY[lang];
}

/** 지금 언어의 반대편 — 전환 버튼이 쓴다 */
export function otherLang(lang: Lang): Lang {
  return lang === "ko" ? "en" : "ko";
}

/**
 * 소개 페이지에 보여줄 게 하나라도 있는가.
 *
 * 셋 다 비어 있으면 그 페이지는 제목만 남아서 덩그러니 비어 보인다.
 * 그럴 땐 헤더 내비에서도 빼서, 눌렀다가 빈 화면을 보는 일이 없게 한다.
 * about 을 채우면 링크는 저절로 다시 나타난다.
 */
export function hasAboutContent(copy: Copy): boolean {
  return (
    copy.about.lead.length > 0 ||
    copy.about.services.length > 0 ||
    copy.about.process.length > 0
  );
}

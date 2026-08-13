/**
 * 작업 사례.
 *
 * 아직 비어 있다. 비어 있으면 홈의 작업 영역과 /work 목록이 "곧 채워집니다"
 * 한 줄로 대체된다 — 빈 격자가 노출되지 않는다.
 *
 * 이미지는 public/work/<slug>/ 아래에 두고 '/work/<slug>/cover.jpg' 처럼 적는다.
 */

export interface WorkItem {
  /** 주소에 쓰인다. 영문 소문자와 하이픈만 */
  slug: string;
  /** 언어별 제목 — 한쪽만 채워도 된다 */
  title: { ko: string; en: string };
  client: string;
  /** 예: "2025" */
  year: string;
  /** 예: "브랜딩", "공간", "웹" */
  category: { ko: string; en: string };
  /** 목록 카드에 한 줄로 붙는 설명 */
  summary: { ko: string; en: string };
  /** 목록 카드 이미지. 없으면 글자만 나온다 */
  cover?: string;
}

export const works: WorkItem[] = [];

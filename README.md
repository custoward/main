# 다비다비 — studiodavidavi.com

디자인 외주 스튜디오 사이트. Next.js(App Router) · TypeScript · CSS Modules.

```bash
npm install
npm run dev      # http://localhost:3000 → /ko 로 이동
npm run build
npm run typecheck
```

## 문구를 고칠 때

**[`src/data/site.ts`](src/data/site.ts) 한 파일만 열면 된다.** 컴포넌트에는 문구를 두지 않았다.
한국어와 영어가 같은 파일 안에 나란히 있다.

비어 있는(`''`, `[]`) 자리는 아직 안 채운 곳이다. **화면은 채운 만큼만 나온다** — 비어 있으면
그 블록이 통째로 빠지므로 자리표시자가 노출되거나 레이아웃이 깨지지 않는다. 천천히 채우면 된다.

작업 사례는 [`src/data/work.ts`](src/data/work.ts) 에 넣는다. 배열이 비어 있는 동안에는
목록 자리에 "곧 채워집니다" 한 줄만 나온다.

## 구조

```
src/app/[lang]/          ko · en. 이 layout.tsx 가 루트 레이아웃이다
  page.tsx               홈
  work · about · contact
src/components/          헤더 · 푸터 · 섹션
src/data/                ★ 문구와 작업 목록
```

`/` 로 들어오면 `/ko` 로 보낸다 ([`next.config.ts`](next.config.ts)).

## 색

[`src/app/globals.css`](src/app/globals.css) 에 회색 계단(`--gray-*`)을 깔고, 컴포넌트는
역할 이름(`--bg` `--fg` `--line` `--accent`)만 쓴다. 지금은 모노톤이라 `--accent` 가 글자색과
같다. 색을 넣을 땐 그 한 줄만 바꾸면 된다.

다크모드는 넣지 않았다. 로고와 작업 이미지가 배경 따라 반전되지 않아서, 준비 없이 켜면
검정 로고가 검정 배경에 얹힌다. 토큰이 역할 이름이라 나중에 미디어쿼리 한 블록으로 붙는다.

## 남은 일

- [ ] `src/data/site.ts` 문구 채우기 (지금은 브랜드 이름과 메일만 들어 있다)
- [ ] `src/data/work.ts` 작업 사례 채우기
- [ ] 설립연도 확정 — 옛 OG 는 "Since 2019", 옛 헤더는 "Since 2021" 로 서로 달랐다
- [ ] **새 로고** — `public/logo.webp` 는 "FOR THE BETTER WORLD" 라고 적힌 이전 브랜드
      워드마크라 헤더에 못 쓴다. 지금은 글자로 두었다
- [ ] 파비콘 · OG 이미지 (지금 파비콘도 이전 브랜드 것)
- [ ] 의자이론 **새 QR** — 종이 설문지 QR 이 `studiodavidavi.com/thechair` 를 가리키는데
      그 주소는 이제 없다. 새 주소는 `minba.me/projects/chair-theory`
- [ ] 찰랑 데이트맵을 느즈러짐 사이트에 붙이기 — 붙기 전까지 `/datemap` 은 404

## 이전 사이트

2026-08 에 전면 리셋했다. 그 전 코드(영수증 컨셉 홈, typomoss · 의자이론 등 개인 작업물)는
`pre-nextjs-reset` 태그와 `archive/personal-portfolio` 브랜치에 남아 있다.
개인 작업물은 [minba.me](https://minba.me) 로 옮겼다.

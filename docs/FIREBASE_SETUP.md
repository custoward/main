# The Chair Theory — Firebase 공동 보드 설정 가이드

이 문서는 여러 전시 컴퓨터가 **같은 보드를 실시간으로 공유**하도록 Firebase(Firestore)를 연결하는 방법입니다.

> Firebase 설정을 하지 않으면 앱은 자동으로 **로컬 모드**(각 브라우저에만 저장)로 동작합니다. 공유가 필요 없으면 이 문서를 건너뛰어도 됩니다.

---

## 1. Firebase 프로젝트 만들기

1. https://console.firebase.google.com 접속 → **프로젝트 추가**
2. 프로젝트 이름 입력 (예: `the-chair-theory`) → 생성
3. Google 애널리틱스는 꺼도 됩니다.

## 2. 웹 앱 등록

1. 프로젝트 개요 화면에서 **`</>` (웹)** 아이콘 클릭
2. 앱 닉네임 입력 (예: `chair-web`) → **앱 등록**
3. 표시되는 `firebaseConfig` 값을 메모해 둡니다. 예:

   ```js
   const firebaseConfig = {
     apiKey: "AIza....",
     authDomain: "the-chair-theory.firebaseapp.com",
     projectId: "the-chair-theory",
     storageBucket: "the-chair-theory.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef...",
   };
   ```

## 3. Firestore 데이터베이스 생성

1. 왼쪽 메뉴 **빌드 → Firestore Database** → **데이터베이스 만들기**
2. 위치는 `asia-northeast3 (서울)` 권장
3. 처음에는 **프로덕션 모드**로 시작 → 아래 4번에서 규칙을 넣습니다.

## 4. 보안 규칙 설정

Firestore의 **규칙(Rules)** 탭에 아래를 붙여넣고 **게시**합니다.

전시처럼 **누구나 그림을 추가/조회**할 수 있어야 하므로 `chairImages` 컬렉션은 공개 읽기·쓰기로 둡니다.
(낙서/스팸이 걱정되면 나중에 App Check 또는 익명 인증으로 강화할 수 있습니다.)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /chairImages/{docId} {
      allow read: if true;
      allow create: if request.resource.data.dataUrl is string
                    && request.resource.data.dataUrl.size() < 1500000
                    && request.resource.data.timestamp is number
                    && request.resource.data.x is number
                    && request.resource.data.y is number;
      allow delete: if true;   // 전시 운영자가 정리할 수 있도록 허용 (필요 시 false)
      allow update: if false;
    }
  }
}
```

## 5. 환경변수 넣기

프로젝트 루트(`package.json`이 있는 폴더)에서:

```bash
cp .env.example .env.local
```

`.env.local` 을 열어 2번에서 받은 값으로 채웁니다:

```
REACT_APP_FIREBASE_API_KEY=AIza....
REACT_APP_FIREBASE_AUTH_DOMAIN=the-chair-theory.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=the-chair-theory
REACT_APP_FIREBASE_STORAGE_BUCKET=the-chair-theory.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=1234567890
REACT_APP_FIREBASE_APP_ID=1:1234567890:web:abcdef...
```

> ⚠️ `.env.local` 은 git에 올라가지 않습니다(이미 `.gitignore` 처리됨).
> CRA는 환경변수를 **빌드 시점에** 코드에 박아 넣으므로, 값을 바꾸면 dev 서버를 재시작하거나 다시 빌드해야 합니다.

## 6. 실행 / 확인

```bash
npm start          # 개발 미리보기 (http://localhost:3000/thechair)
# 또는
npm run build      # 배포용 정적 파일 생성 (build/)
```

- 헤더에 작은 **"공동 보드"** 표시가 보이면 서버 모드로 연결된 것입니다.
- 한 컴퓨터에서 그림을 추가하면 **다른 컴퓨터 화면에도 자동으로 나타납니다.**

---

## 동작 방식 요약

| 항목 | 내용 |
|------|------|
| 저장 위치 | Firestore `chairImages` 컬렉션 |
| 이미지 형식 | JPEG dataURL (업로드 전 최대 1280px / 품질 0.7로 축소) |
| 실시간 동기화 | `onSnapshot` 구독 — 모든 접속 기기에 즉시 반영 |
| 설정 없을 때 | IndexedDB 로컬 저장(기기별 개별 보드)으로 자동 폴백 |

## 비용 / 한도 (참고)

- Firestore 무료 한도: 문서 읽기 5만/일, 쓰기 2만/일, 저장 1GiB.
- 이미지를 문서에 base64로 담으므로 장당 약 0.2~0.5MB. 전시 규모(수백 장)면 무료 한도로 충분합니다.
- 더 큰 규모/원본 화질이 필요하면 **Firebase Storage**(이미지 파일) + Firestore(좌표·메타) 분리 방식으로 확장할 수 있습니다.

## 오프라인 전시 주의

- OpenCV(`public/vendor/opencv.js`)와 PDF 워커는 이미 로컬에 포함되어 인터넷 없이 동작합니다.
- 하지만 **Firebase 공동 보드는 인터넷 연결이 필요합니다.** 전시장 네트워크가 불안정하면 로컬 모드(설정 비움)로 운영하는 것도 방법입니다.

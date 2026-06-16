// Firebase(Firestore) 초기화.
// .env 에 REACT_APP_FIREBASE_* 값이 있으면 "공동 보드(서버)" 모드로 동작하고,
// 값이 없으면 firebaseEnabled === false 가 되어 자동으로 로컬(IndexedDB) 모드로 폴백한다.
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

/** 필수 설정(apiKey, projectId)이 있으면 서버(공동 보드) 모드 */
export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

/** Firestore 컬렉션 이름 */
export const CHAIR_COLLECTION = 'chairImages';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function getDb(): Firestore | null {
  if (!firebaseEnabled) return null;
  if (!db) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
  return db;
}

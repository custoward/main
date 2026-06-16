import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { CapturedImage } from '../components/ChairTheory/types';
import {
  initDB,
  getAllImages,
  saveImage,
  deleteImage as dbDeleteImage,
  clearAllImages,
} from '../utils/db';
import { firebaseEnabled, getDb, CHAIR_COLLECTION } from '../utils/firebase';
import { downscaleDataUrl } from '../utils/imageScale';
import { getClientId } from '../utils/clientId';

interface UseChairImagesResult {
  images: CapturedImage[];
  isLoading: boolean;
  error: string | null;
  /** 서버(공동 보드) 모드 여부 */
  isShared: boolean;
  /** 이 기기의 식별자 (본인 그림 판별용) */
  clientId: string;
  addImage: (image: CapturedImage) => Promise<void>;
  removeImage: (id: string) => Promise<void>;
  clearImages: () => Promise<void>;
}

const CLIENT_ID = getClientId();

/**
 * 보드 이미지 상태 관리 훅.
 * - Firebase 설정이 있으면 Firestore로 모든 기기가 같은 보드를 실시간 공유한다.
 * - 설정이 없으면 IndexedDB(브라우저 로컬)로 폴백한다.
 */
export function useChairImages(): UseChairImagesResult {
  const [images, setImages] = useState<CapturedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- 서버(Firestore) 실시간 구독 모드 ---
  useEffect(() => {
    if (!firebaseEnabled) return;
    const db = getDb();
    if (!db) return;

    const q = query(collection(db, CHAIR_COLLECTION), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items: CapturedImage[] = snap.docs.map((d) => {
          const data = d.data() as Omit<CapturedImage, 'id'>;
          return {
            id: d.id,
            dataUrl: data.dataUrl,
            timestamp: data.timestamp,
            x: data.x,
            y: data.y,
            ownerId: data.ownerId,
          };
        });
        setImages(items);
        setIsLoading(false);
      },
      (err) => {
        console.error('Firestore 구독 실패:', err);
        setError('서버에서 이미지를 불러오지 못했습니다.');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // --- 로컬(IndexedDB) 폴백 모드 ---
  useEffect(() => {
    if (firebaseEnabled) return;
    let active = true;

    (async () => {
      try {
        await initDB();
        const stored = await getAllImages();
        if (active) {
          setImages([...stored].sort((a, b) => a.timestamp - b.timestamp));
        }
      } catch (err) {
        console.error('이미지 불러오기 실패:', err);
        if (active) setError('저장된 이미지를 불러오지 못했습니다.');
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const addImage = useCallback(async (image: CapturedImage) => {
    if (firebaseEnabled) {
      const db = getDb();
      if (!db) return;
      try {
        // 용량을 줄여 Firestore 1MB 제한 안에 담는다. (목록은 onSnapshot이 갱신)
        const dataUrl = await downscaleDataUrl(image.dataUrl);
        await addDoc(collection(db, CHAIR_COLLECTION), {
          dataUrl,
          timestamp: image.timestamp,
          x: image.x,
          y: image.y,
          ownerId: CLIENT_ID,
        });
      } catch (err) {
        console.error('서버 저장 실패:', err);
        setError('서버에 저장하지 못했습니다.');
      }
      return;
    }

    // 로컬 모드: 낙관적 갱신 후 IndexedDB 저장
    const owned = { ...image, ownerId: CLIENT_ID };
    setImages((prev) => [...prev, owned]);
    try {
      await saveImage(owned);
    } catch (err) {
      console.error('이미지 저장 실패:', err);
    }
  }, []);

  const removeImage = useCallback(async (id: string) => {
    if (firebaseEnabled) {
      const db = getDb();
      if (!db) return;
      try {
        await deleteDoc(doc(db, CHAIR_COLLECTION, id));
      } catch (err) {
        console.error('서버 삭제 실패:', err);
      }
      return;
    }

    setImages((prev) => prev.filter((img) => img.id !== id));
    try {
      await dbDeleteImage(id);
    } catch (err) {
      console.error('이미지 삭제 실패:', err);
    }
  }, []);

  const clearImages = useCallback(async () => {
    // 안전을 위해 로컬 모드에서만 일괄 삭제를 지원한다.
    if (firebaseEnabled) return;
    setImages([]);
    try {
      await clearAllImages();
    } catch (err) {
      console.error('이미지 초기화 실패:', err);
    }
  }, []);

  return {
    images,
    isLoading,
    error,
    isShared: firebaseEnabled,
    clientId: CLIENT_ID,
    addImage,
    removeImage,
    clearImages,
  };
}

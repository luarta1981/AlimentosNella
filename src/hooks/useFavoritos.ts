import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useAuthUser } from '@/hooks/useAuthUser';
import { db } from '@/lib/firebase';

export function useFavoritos() {
  const { user } = useAuthUser();
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) { setFavoritos(new Set()); return; }
    const q = query(collection(db, 'favoritos'), where('uid', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setFavoritos(new Set(snap.docs.map((d) => d.data().productId as string)));
    });
    return unsub;
  }, [user?.uid]);

  const toggle = async (productId: string, productName: string) => {
    if (!user) return;
    const docId  = `${user.uid}_${productId}`;
    const docRef = doc(db, 'favoritos', docId);
    if (favoritos.has(productId)) {
      await deleteDoc(docRef);
    } else {
      await setDoc(docRef, {
        uid:         user.uid,
        productId,
        productName,
        createdAt:   Timestamp.now(),
      });
    }
  };

  return { favoritos, toggle };
}

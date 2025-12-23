import { auth, db } from '@/app/config/firebase.config';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

export type SavedRoute = {
  id: string;
  name: string;
  address: string;
  createdAt?: Date;
  lastUsed?: Date;
};

const userRoutesCollection = (uid: string) =>
  collection(db, 'users', uid, 'savedRoutes');

export async function listSavedRoutes(uid?: string): Promise<SavedRoute[]> {
  const userId = uid || auth.currentUser?.uid;
  if (!userId) return [];

  const q = query(userRoutesCollection(userId), orderBy('lastUsed', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name || data.address,
      address: data.address,
      createdAt: data.createdAt?.toDate?.(),
      lastUsed: data.lastUsed?.toDate?.(),
    };
  });
}

export async function saveRouteToCloud(address: string, name?: string, uid?: string) {
  const userId = uid || auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  const trimmedAddress = address.trim();
  const trimmedName = name?.trim() || trimmedAddress;

  await addDoc(userRoutesCollection(userId), {
    address: trimmedAddress,
    name: trimmedName,
    createdAt: serverTimestamp(),
    lastUsed: serverTimestamp(),
  });
}

export async function deleteRouteFromCloud(routeId: string, uid?: string) {
  const userId = uid || auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  await deleteDoc(doc(db, 'users', userId, 'savedRoutes', routeId));
}



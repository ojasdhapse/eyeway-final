import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SavedRoute = {
  id: string;
  name: string;
  address: string;
  icon: keyof typeof Ionicons.glyphMap;
  lastUsed?: string;
};

const STORAGE_KEY = 'eyeway:savedRoutes';
const ICONS: Array<keyof typeof Ionicons.glyphMap> = [
  'home',
  'briefcase',
  'star',
  'heart',
  'location',
  'pin',
  'car',
  'bus',
  'train',
  'walk',
  'bicycle',
  'navigate',
];

const pickIcon = (index: number) => ICONS[index % ICONS.length] ?? 'navigate';

export async function loadSavedRoutes(): Promise<SavedRoute[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    console.warn('Failed to load saved routes', error);
    return [];
  }
}

export async function saveRoute(address: string, name?: string): Promise<SavedRoute[]> {
  const existing = await loadSavedRoutes();
  const trimmedAddress = address.trim();
  const trimmedName = name?.trim() || trimmedAddress;

  // Avoid duplicates by address
  const already = existing.find((r) => r.address.toLowerCase() === trimmedAddress.toLowerCase());
  if (already) {
    const updated = [
      { ...already, name: trimmedName, lastUsed: new Date().toISOString() },
      ...existing.filter((r) => r.id !== already.id),
    ];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }

  const next: SavedRoute = {
    id: Date.now().toString(),
    name: trimmedName,
    address: trimmedAddress,
    icon: pickIcon(existing.length),
    lastUsed: new Date().toISOString(),
  };

  const updated = [next, ...existing];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function deleteRoute(id: string): Promise<SavedRoute[]> {
  const existing = await loadSavedRoutes();
  const updated = existing.filter((r) => r.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function clearRoutes() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}



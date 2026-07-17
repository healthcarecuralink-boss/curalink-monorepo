import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Supabase's auth session persistence just needs getItem/setItem/removeItem.
// AsyncStorage covers iOS/Android; on web (React Native Web) we use
// localStorage directly since there's no native module to bridge to there.
// Cast narrowly here -- RN's global type surface deliberately omits DOM
// globals, so this is the one place we reach for one conditionally.
type WebStorage = { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void };
const localStorage = (globalThis as unknown as { localStorage?: WebStorage }).localStorage;

const webStorage = {
  getItem: (key: string) => Promise.resolve(localStorage?.getItem(key) ?? null),
  setItem: (key: string, value: string) => {
    localStorage?.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    localStorage?.removeItem(key);
    return Promise.resolve();
  },
};

export const authStorageAdapter = Platform.OS === "web" ? webStorage : AsyncStorage;

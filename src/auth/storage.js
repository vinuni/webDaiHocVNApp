import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = '@auth_token';
const USER_KEY = '@auth_user';
const CREDENTIALS_KEY = '@auth_credentials';

const isNative = Platform.OS === 'android' || Platform.OS === 'ios';

async function secureGet(key) {
  if (!isNative) return AsyncStorage.getItem(key);
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function secureSet(key, value) {
  if (!isNative) {
    if (value != null) await AsyncStorage.setItem(key, value);
    else await AsyncStorage.removeItem(key);
    return;
  }
  try {
    if (value != null) await SecureStore.setItemAsync(key, value);
    else await SecureStore.deleteItemAsync(key);
  } catch (e) {
    if (__DEV__) console.warn('[auth/storage] SecureStore set failed:', e?.message);
  }
}

async function migrateFromAsyncStorage(key) {
  if (!isNative) return null;
  try {
    const value = await AsyncStorage.getItem(key);
    if (value != null) {
      await SecureStore.setItemAsync(key, value);
      await AsyncStorage.removeItem(key);
      return value;
    }
  } catch {}
  return null;
}

export const authStorage = {
  async getToken() {
    let value = await secureGet(TOKEN_KEY);
    if (value == null) value = await migrateFromAsyncStorage(TOKEN_KEY);
    return value;
  },
  async setToken(token) {
    await secureSet(TOKEN_KEY, token || null);
  },
  async getUser() {
    let raw = await secureGet(USER_KEY);
    if (raw == null) raw = await migrateFromAsyncStorage(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async setUser(user) {
    await secureSet(USER_KEY, user ? JSON.stringify(user) : null);
  },
  async getCredentials() {
    let raw = await secureGet(CREDENTIALS_KEY);
    if (raw == null) raw = await migrateFromAsyncStorage(CREDENTIALS_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async setCredentials(email, password) {
    if (email && password) {
      await secureSet(CREDENTIALS_KEY, JSON.stringify({ email, password }));
    } else {
      await secureSet(CREDENTIALS_KEY, null);
    }
  },
  async clearCredentials() {
    await secureSet(CREDENTIALS_KEY, null);
  },
  async clear() {
    await secureSet(TOKEN_KEY, null);
    await secureSet(USER_KEY, null);
  },
};

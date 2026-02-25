import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@auth_token';
const USER_KEY = '@auth_user';
const CREDENTIALS_KEY = '@auth_credentials'; // Stored credentials for auto-login

export const authStorage = {
  async getToken() {
    return AsyncStorage.getItem(TOKEN_KEY);
  },
  async setToken(token) {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    else await AsyncStorage.removeItem(TOKEN_KEY);
  },
  async getUser() {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async setUser(user) {
    if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    else await AsyncStorage.removeItem(USER_KEY);
  },
  async getCredentials() {
    const raw = await AsyncStorage.getItem(CREDENTIALS_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async setCredentials(email, password) {
    if (email && password) {
      await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ email, password }));
    } else {
      await AsyncStorage.removeItem(CREDENTIALS_KEY);
    }
  },
  async clearCredentials() {
    await AsyncStorage.removeItem(CREDENTIALS_KEY);
  },
  async clear() {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    // Note: credentials are NOT cleared on logout - only when user explicitly unchecks "Remember me"
  },
};

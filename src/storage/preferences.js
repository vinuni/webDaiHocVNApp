import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_SELECTED_MON_THI_ID = '@app/selectedMonThiId';

export const preferencesStorage = {
  async getSelectedMonThiId() {
    const raw = await AsyncStorage.getItem(KEY_SELECTED_MON_THI_ID);
    if (raw == null) return null;
    const id = parseInt(raw, 10);
    return Number.isNaN(id) ? null : id;
  },

  async setSelectedMonThiId(id) {
    if (id != null) await AsyncStorage.setItem(KEY_SELECTED_MON_THI_ID, String(id));
    else await AsyncStorage.removeItem(KEY_SELECTED_MON_THI_ID);
  },
};

/**
 * Pick default môn thi: prefer "Toán" (Math), else first in list.
 */
export function getDefaultMonThiId(monThis) {
  if (!monThis || monThis.length === 0) return null;
  const toan = monThis.find((m) => (m.tenmonthi || '').toLowerCase().includes('toán'));
  return toan ? toan.id : monThis[0].id;
}

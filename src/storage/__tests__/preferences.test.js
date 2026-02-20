/**
 * Preferences storage and getDefaultMonThiId (selected môn thi, default Toán).
 */
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { preferencesStorage, getDefaultMonThiId } from '../preferences';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getDefaultMonThiId', () => {
  it('returns id of item whose tenmonthi includes "toán"', () => {
    const list = [
      { id: 1, tenmonthi: 'Vật Lý' },
      { id: 2, tenmonthi: 'Toán' },
      { id: 3, tenmonthi: 'Hóa học' },
    ];
    expect(getDefaultMonThiId(list)).toBe(2);
  });

  it('is case-insensitive for toán', () => {
    const list = [
      { id: 10, tenmonthi: 'TOÁN' },
    ];
    expect(getDefaultMonThiId(list)).toBe(10);
  });

  it('returns first item id when no Toán in list', () => {
    const list = [
      { id: 5, tenmonthi: 'Vật Lý' },
      { id: 6, tenmonthi: 'Hóa' },
    ];
    expect(getDefaultMonThiId(list)).toBe(5);
  });

  it('returns null for empty array', () => {
    expect(getDefaultMonThiId([])).toBeNull();
  });

  it('returns null for null or undefined', () => {
    expect(getDefaultMonThiId(null)).toBeNull();
    expect(getDefaultMonThiId(undefined)).toBeNull();
  });

  it('handles missing tenmonthi (uses first)', () => {
    const list = [
      { id: 7 },
      { id: 8, tenmonthi: 'Toán' },
    ];
    expect(getDefaultMonThiId(list)).toBe(8);
  });
});

describe('preferencesStorage', () => {
  describe('getSelectedMonThiId', () => {
    it('returns parsed id when storage has a number string', async () => {
      AsyncStorage.getItem.mockResolvedValue('3');
      const id = await preferencesStorage.getSelectedMonThiId();
      expect(id).toBe(3);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@app/selectedMonThiId');
    });

    it('returns null when storage is empty', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      const id = await preferencesStorage.getSelectedMonThiId();
      expect(id).toBeNull();
    });

    it('returns null when stored value is invalid', async () => {
      AsyncStorage.getItem.mockResolvedValue('abc');
      const id = await preferencesStorage.getSelectedMonThiId();
      expect(id).toBeNull();
    });
  });

  describe('setSelectedMonThiId', () => {
    it('calls setItem with string id when id is provided', async () => {
      await preferencesStorage.setSelectedMonThiId(5);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@app/selectedMonThiId', '5');
      expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
    });

    it('calls removeItem when id is null', async () => {
      await preferencesStorage.setSelectedMonThiId(null);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@app/selectedMonThiId');
    });
  });
});

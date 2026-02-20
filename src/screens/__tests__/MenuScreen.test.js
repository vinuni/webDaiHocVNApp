/**
 * MenuScreen: smoke test and key labels (Tài khoản, Đăng xuất, etc.)
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import MenuScreen from '../MenuScreen';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    getParent: () => ({ navigate: jest.fn() }),
  }),
}));

jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ logout: jest.fn() }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

describe('MenuScreen', () => {
  it('renders without crashing', () => {
    render(<MenuScreen />);
  });

  it('shows Tài khoản section and link', () => {
    render(<MenuScreen />);
    const items = screen.getAllByText('Tài khoản');
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it('shows Ứng dụng section title', () => {
    render(<MenuScreen />);
    expect(screen.getByText('Ứng dụng')).toBeTruthy();
  });

  it('shows Đăng xuất', () => {
    render(<MenuScreen />);
    expect(screen.getByText('Đăng xuất')).toBeTruthy();
  });

  it('shows app footer text', () => {
    render(<MenuScreen />);
    expect(screen.getByText('Thi Thử Online')).toBeTruthy();
  });
});

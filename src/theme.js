import { Platform } from 'react-native';

/**
 * App-wide theme for a modern, consistent UI.
 * On web use boxShadow (react-native-web deprecates shadow*); on native use shadow* + elevation.
 */
export const colors = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  secondary: '#0EA5E9',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

/** Minimum touch target size (pt) for accessibility and one-handed use on phones. */
export const minTouchTargetSize = 44;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};

export const typography = {
  title: { fontSize: 24, fontWeight: '700' },
  titleSmall: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 15 },
  bodySmall: { fontSize: 13 },
  caption: { fontSize: 12 },
};

export const shadows = {
  card: Platform.select({
    web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  }),
  cardSm: Platform.select({
    web: { boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  }),
  buttonPrimary: Platform.select({
    web: { boxShadow: '0 2px 4px rgba(99,102,241,0.3)' },
    default: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 },
  }),
  buttonSuccess: Platform.select({
    web: { boxShadow: '0 2px 4px rgba(16,185,129,0.3)' },
    default: { shadowColor: colors.success, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  }),
};

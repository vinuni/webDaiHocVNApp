import { Platform } from 'react-native';

/**
 * App-wide theme for a modern, professional UI with gradients and enhanced visual design.
 * On web use boxShadow (react-native-web deprecates shadow*); on native use shadow* + elevation.
 */
export const colors = {
  // Primary brand colors
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  primaryUltraLight: '#A5B4FC',
  primaryTint: '#6366F118', // 10% opacity for subtle backgrounds
  
  // Secondary colors
  secondary: '#0EA5E9',
  secondaryLight: '#38BDF8',
  secondaryTint: '#0EA5E918',
  
  // Status colors
  success: '#10B981',
  successLight: '#34D399',
  successTint: '#10B98118',
  danger: '#EF4444',
  dangerLight: '#F87171',
  dangerTint: '#EF444418',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  warningTint: '#F59E0B18',
  info: '#3B82F6',
  infoLight: '#60A5FA',
  infoTint: '#3B82F618',
  
  // Neutrals
  background: '#F8FAFC',
  backgroundDark: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceTint: '#FAFBFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  
  // Text colors
  text: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textLight: '#CBD5E1',
  
  // Special colors for subjects (Vietnamese education)
  subjectMath: '#8B5CF6',      // Purple for Math (Toán)
  subjectPhysics: '#3B82F6',    // Blue for Physics (Vật Lý)
  subjectChemistry: '#10B981',  // Green for Chemistry (Hóa Học)
  subjectBiology: '#F59E0B',    // Amber for Biology (Sinh Học)
  subjectLiterature: '#EF4444', // Red for Literature (Văn)
  subjectEnglish: '#EC4899',    // Pink for English
  subjectHistory: '#6366F1',    // Indigo for History
};

// Gradient presets for modern UI
export const gradients = {
  primary: ['#6366F1', '#8B5CF6'],
  primaryVertical: ['#6366F1', '#4F46E5'],
  secondary: ['#0EA5E9', '#06B6D4'],
  success: ['#10B981', '#059669'],
  danger: ['#EF4444', '#DC2626'],
  warm: ['#F59E0B', '#EF4444'],
  cool: ['#3B82F6', '#8B5CF6'],
  vibrant: ['#EC4899', '#8B5CF6'],
  sunset: ['#F59E0B', '#EF4444', '#EC4899'],
  ocean: ['#0EA5E9', '#3B82F6', '#6366F1'],
  // Subtle gradients for backgrounds
  subtlePrimary: ['#6366F108', '#8B5CF608'],
  subtleSuccess: ['#10B98108', '#05966908'],
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

/** Minimum touch target size (pt) for accessibility and one-handed use on phones. */
export const minTouchTargetSize = 44;

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const typography = {
  // Headers
  hero: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
  titleSmall: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },
  subtitle: { fontSize: 16, fontWeight: '600' },
  
  // Body text
  body: { fontSize: 15, lineHeight: 22 },
  bodyLarge: { fontSize: 16, lineHeight: 24 },
  bodySmall: { fontSize: 13, lineHeight: 20 },
  
  // Small text
  caption: { fontSize: 12, lineHeight: 18 },
  captionSmall: { fontSize: 11, lineHeight: 16 },
  
  // Special
  button: { fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },
  buttonSmall: { fontSize: 14, fontWeight: '600', letterSpacing: 0.1 },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase' },
};

// Enhanced shadows with more depth options
export const shadows = {
  none: Platform.select({
    web: { boxShadow: 'none' },
    default: { shadowOpacity: 0, elevation: 0 },
  }),
  card: Platform.select({
    web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  }),
  cardSm: Platform.select({
    web: { boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  }),
  cardLg: Platform.select({
    web: { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 5 },
  }),
  cardXl: Platform.select({
    web: { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 8 },
  }),
  buttonPrimary: Platform.select({
    web: { boxShadow: '0 2px 4px rgba(99,102,241,0.3)' },
    default: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 },
  }),
  buttonSuccess: Platform.select({
    web: { boxShadow: '0 2px 4px rgba(16,185,129,0.3)' },
    default: { shadowColor: '#10B981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  }),
  floating: Platform.select({
    web: { boxShadow: '0 12px 32px rgba(0,0,0,0.15)' },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 32, elevation: 12 },
  }),
};

// Icon sizes for consistent icon usage
export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Animation durations (in ms)
export const animations = {
  fast: 150,
  normal: 250,
  slow: 350,
};

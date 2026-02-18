/**
 * Theme exports: colors, spacing, typography, etc.
 */
import { colors, spacing, gradients, borderRadius, typography, iconSizes, minTouchTargetSize, animations } from '../theme';

describe('theme', () => {
  describe('colors', () => {
    it('exports primary and status colors', () => {
      expect(colors.primary).toBe('#6366F1');
      expect(colors.success).toBe('#10B981');
      expect(colors.danger).toBe('#EF4444');
      expect(colors.warning).toBe('#F59E0B');
    });
    it('exports text and background', () => {
      expect(colors.text).toBe('#1E293B');
      expect(colors.background).toBe('#F8FAFC');
      expect(colors.surface).toBe('#FFFFFF');
    });
    it('exports subject colors', () => {
      expect(colors.subjectMath).toBe('#8B5CF6');
      expect(colors.subjectPhysics).toBe('#3B82F6');
      expect(colors.subjectChemistry).toBe('#10B981');
    });
  });

  describe('spacing', () => {
    it('exports spacing scale', () => {
      expect(spacing.xs).toBe(4);
      expect(spacing.sm).toBe(8);
      expect(spacing.md).toBe(16);
      expect(spacing.lg).toBe(24);
    });
  });

  describe('gradients', () => {
    it('exports gradient arrays', () => {
      expect(gradients.primary).toEqual(['#6366F1', '#8B5CF6']);
      expect(Array.isArray(gradients.success)).toBe(true);
      expect(gradients.success.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('borderRadius', () => {
    it('exports radius scale', () => {
      expect(borderRadius.sm).toBe(8);
      expect(borderRadius.full).toBe(9999);
    });
  });

  describe('typography', () => {
    it('exports typography with fontSize', () => {
      expect(typography.title.fontSize).toBe(24);
      expect(typography.body.fontSize).toBe(15);
      expect(typography.caption.fontSize).toBe(12);
    });
  });

  describe('iconSizes', () => {
    it('exports icon size scale', () => {
      expect(iconSizes.xs).toBe(12);
      expect(iconSizes.md).toBe(20);
      expect(iconSizes.xxl).toBe(48);
    });
  });

  describe('constants', () => {
    it('exports minTouchTargetSize', () => {
      expect(minTouchTargetSize).toBe(44);
    });
    it('exports animation durations', () => {
      expect(animations.fast).toBe(150);
      expect(animations.normal).toBe(250);
    });
  });
});

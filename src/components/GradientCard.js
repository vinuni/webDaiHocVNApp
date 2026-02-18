import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, shadows, spacing } from '../theme';

/**
 * GradientCard - A card component with optional gradient header
 * @param {Object} props
 * @param {string[]} props.gradientColors - Array of colors for gradient (optional)
 * @param {boolean} props.hasGradient - Whether to show gradient header
 * @param {React.ReactNode} props.children - Card content
 * @param {Object} props.style - Additional styles for the card
 * @param {Object} props.contentStyle - Styles for the content area
 * @param {number} props.gradientHeight - Height of gradient section (default: 120)
 */
export default function GradientCard({
  gradientColors = [colors.primary, colors.primaryDark],
  hasGradient = false,
  children,
  style,
  contentStyle,
  gradientHeight = 120,
}) {
  if (!hasGradient) {
    // Simple white card without gradient
    return (
      <View style={[styles.card, style]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.card, style]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientHeader, { height: gradientHeight }]}
      />
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  gradientHeader: {
    width: '100%',
  },
  content: {
    padding: spacing.lg,
  },
});

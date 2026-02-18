import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, iconSizes } from '../theme';

/**
 * StatBox - Display metric with icon, label, and value
 * @param {Object} props
 * @param {string} props.icon - Icon name from Ionicons
 * @param {string} props.label - Metric label
 * @param {string|number} props.value - Metric value
 * @param {string} props.color - Accent color (default: colors.primary)
 * @param {string} props.variant - 'default' | 'compact' | 'large'
 * @param {Object} props.style - Additional styles
 */
export default function StatBox({
  icon,
  label,
  value,
  color = colors.primary,
  variant = 'default',
  style,
}) {
  const isCompact = variant === 'compact';
  const isLarge = variant === 'large';

  return (
    <View style={[
      styles.container,
      isCompact && styles.containerCompact,
      isLarge && styles.containerLarge,
      style
    ]}>
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: color + '18' }]}>
          <Ionicons
            name={icon}
            size={isLarge ? iconSizes.lg : isCompact ? iconSizes.md : iconSizes.lg}
            color={color}
          />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={[
          styles.label,
          isCompact && styles.labelCompact,
          isLarge && styles.labelLarge
        ]}>
          {label}
        </Text>
        <Text style={[
          styles.value,
          isCompact && styles.valueCompact,
          isLarge && styles.valueLarge,
          { color }
        ]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  containerCompact: {
    padding: spacing.sm,
  },
  containerLarge: {
    padding: spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  labelCompact: {
    fontSize: 11,
  },
  labelLarge: {
    ...typography.bodySmall,
  },
  value: {
    ...typography.titleSmall,
    fontWeight: '700',
  },
  valueCompact: {
    fontSize: 16,
  },
  valueLarge: {
    ...typography.title,
  },
});

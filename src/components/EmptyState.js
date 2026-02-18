import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, iconSizes } from '../theme';

/**
 * EmptyState - Display for empty lists with icon and message
 * @param {Object} props
 * @param {string} props.icon - Icon name from Ionicons (default: 'folder-open-outline')
 * @param {string} props.title - Main message
 * @param {string} props.subtitle - Secondary message (optional)
 * @param {React.ReactNode} props.action - Action button/component (optional)
 * @param {Object} props.style - Additional styles
 */
export default function EmptyState({
  icon = 'folder-open-outline',
  title = 'Không có dữ liệu',
  subtitle,
  action,
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={iconSizes.xxl} color={colors.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.subtitle,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  action: {
    marginTop: spacing.md,
  },
});

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography, minTouchTargetSize, shadows, iconSizes } from '../theme';

/**
 * IconButton - Button with icon and optional label
 * @param {Object} props
 * @param {string} props.icon - Icon name from Ionicons
 * @param {string} props.label - Button label text (optional)
 * @param {Function} props.onPress - Press handler
 * @param {string} props.variant - 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost'
 * @param {string} props.size - 'small' | 'medium' | 'large'
 * @param {boolean} props.loading - Show loading spinner
 * @param {boolean} props.disabled - Disable button
 * @param {Object} props.style - Additional styles
 * @param {number} props.iconSize - Custom icon size
 */
export default function IconButton({
  icon,
  label,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  iconSize,
}) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.primary, color: '#fff', ...shadows.buttonPrimary };
      case 'secondary':
        return { backgroundColor: colors.secondary, color: '#fff' };
      case 'success':
        return { backgroundColor: colors.success, color: '#fff', ...shadows.buttonSuccess };
      case 'danger':
        return { backgroundColor: colors.danger, color: '#fff' };
      case 'outline':
        return { backgroundColor: 'transparent', borderColor: colors.primary, borderWidth: 1.5, color: colors.primary };
      case 'ghost':
        return { backgroundColor: colors.primaryTint, color: colors.primary };
      default:
        return { backgroundColor: colors.primary, color: '#fff' };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minHeight: 36 };
      case 'large':
        return { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, minHeight: 56 };
      default:
        return { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, minHeight: minTouchTargetSize };
    }
  };

  const getIconSize = () => {
    if (iconSize) return iconSize;
    switch (size) {
      case 'small': return iconSizes.sm;
      case 'large': return iconSizes.lg;
      default: return iconSizes.md;
    }
  };

  const variantStyle = getVariantStyle();
  const sizeStyle = getSizeStyle();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        sizeStyle,
        variantStyle,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={Boolean(disabled || loading)}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.color} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && (
            <Ionicons
              name={icon}
              size={getIconSize()}
              color={variantStyle.color}
              style={label ? styles.iconWithLabel : undefined}
            />
          )}
          {label && (
            <Text style={[
              size === 'small' ? typography.buttonSmall : typography.button,
              { color: variantStyle.color }
            ]}>
              {label}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWithLabel: {
    marginRight: spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
});

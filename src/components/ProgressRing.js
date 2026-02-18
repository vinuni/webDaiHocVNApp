import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography } from '../theme';

/**
 * ProgressRing - Circular progress indicator with percentage/value display
 * @param {Object} props
 * @param {number} props.progress - Progress value (0-100 for percentage, or absolute value)
 * @param {number} props.max - Maximum value (default: 100 for percentage)
 * @param {number} props.size - Diameter of the ring (default: 120)
 * @param {number} props.strokeWidth - Width of the ring stroke (default: 8)
 * @param {string} props.color - Color of the progress ring (default: colors.primary)
 * @param {string} props.backgroundColor - Color of the background ring (default: colors.border)
 * @param {string} props.label - Label text below the value (optional)
 * @param {boolean} props.showPercentage - Show % sign (default: true)
 */
export default function ProgressRing({
  progress = 0,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color = colors.primary,
  backgroundColor = colors.border,
  label,
  showPercentage = true,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = (progress / max) * 100;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          stroke={backgroundColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <Circle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={[styles.value, { fontSize: size * 0.25 }]}>
          {Math.round(progress)}
          {showPercentage && max === 100 && '%'}
        </Text>
        {label && <Text style={[styles.label, { fontSize: size * 0.1 }]}>{label}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontWeight: '700',
    color: colors.text,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

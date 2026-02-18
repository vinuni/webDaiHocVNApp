import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, iconSizes } from '../theme';

/**
 * CustomTabBar - Enhanced bottom tab bar with animated active indicator
 */
export default function CustomTabBar({ state, descriptors, navigation }) {
  const [animatedValues] = React.useState(
    state.routes.map(() => new Animated.Value(0))
  );

  React.useEffect(() => {
    // Animate the active tab
    animatedValues.forEach((value, index) => {
      Animated.spring(value, {
        toValue: state.index === index ? 1 : 0,
        useNativeDriver: false,
        tension: 68,
        friction: 10,
      }).start();
    });
  }, [state.index]);

  const getIconName = (routeName, isFocused) => {
    const iconMap = {
      Home: isFocused ? 'home' : 'home-outline',
      Topics: isFocused ? 'book' : 'book-outline',
      HoiAi: isFocused ? 'sparkles' : 'sparkles-outline',
      Gamification: isFocused ? 'trophy' : 'trophy-outline',
      Profile: isFocused ? 'person' : 'person-outline',
    };
    return iconMap[routeName] || 'ellipse-outline';
  };

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const animatedValue = animatedValues[index];
        const backgroundColor = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['transparent', colors.primaryTint],
        });

        const scale = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.05],
        });

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
            activeOpacity={0.7}
          >
            <Animated.View
              style={[
                styles.tabContent,
                { backgroundColor, transform: [{ scale }] },
              ]}
            >
              <Ionicons
                name={getIconName(route.name, isFocused)}
                size={iconSizes.lg}
                color={isFocused ? colors.primary : colors.textMuted}
              />
            </Animated.View>
            <Text
              style={[
                styles.label,
                { color: isFocused ? colors.primary : colors.textMuted },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
    paddingHorizontal: spacing.xs,
    height: Platform.OS === 'ios' ? 88 : 64,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    width: 48,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    marginBottom: 2,
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});

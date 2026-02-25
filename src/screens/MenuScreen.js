import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  iconSizes,
  shadows,
} from '../theme';

function MenuRow({ icon, iconColor, label, onPress, last }) {
  return (
    <TouchableOpacity
      style={[styles.row, last && styles.rowLast]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.rowIconWrap, iconColor && { backgroundColor: iconColor + '18' }]}>
        <Ionicons name={icon} size={iconSizes.md} color={iconColor || colors.textSecondary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={iconSizes.sm} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function SectionTitle({ title }) {
  return (
    <Text style={styles.sectionTitle}>{title}</Text>
  );
}

export default function MenuScreen() {
  const navigation = useNavigation();
  const { logout, isAuthenticated } = useAuth();

  const rootNav = navigation.getParent?.() ?? navigation;

  const goTo = (screenName) => {
    rootNav.navigate(screenName);
  };

  const goToTab = (tabName) => {
    navigation.navigate(tabName);
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          style: 'destructive', 
          onPress: async () => {
            await logout();
            navigation.navigate('MainTabs', { screen: 'Home' });
          }
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <SectionTitle title="Tài khoản" />
      <View style={styles.section}>
        <MenuRow
          icon="person-outline"
          iconColor={colors.primary}
          label="Tài khoản"
          onPress={() => goTo('Profile')}
          last
        />
      </View>

      <SectionTitle title="Ứng dụng" />
      <View style={styles.section}>
        <MenuRow
          icon="search-outline"
          iconColor={colors.info}
          label="Tìm kiếm"
          onPress={() => goTo('Search')}
        />
        <MenuRow
          icon="trophy-outline"
          iconColor={colors.warning}
          label="Thành tích"
          onPress={() => goTo('Profile')}
        />
        <MenuRow
          icon="podium-outline"
          iconColor={colors.secondary}
          label="Bảng điểm"
          onPress={() => goTo('Scoreboard')}
        />
        <MenuRow
          icon="shield-checkmark-outline"
          iconColor={colors.textSecondary}
          label="Giới hạn"
          onPress={() => goTo('Limits')}
          last
        />
      </View>

      {isAuthenticated && (
        <>
          <SectionTitle title="Khác" />
          <View style={styles.section}>
            <MenuRow
              icon="log-out-outline"
              iconColor={colors.danger}
              label="Đăng xuất"
              onPress={handleLogout}
              last
            />
          </View>
        </>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Thi Thử Online</Text>
        <Text style={styles.footerSub}>Nền tảng luyện thi THPT Quốc Gia</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.cardSm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    backgroundColor: colors.backgroundDark,
  },
  rowLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  footerSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});

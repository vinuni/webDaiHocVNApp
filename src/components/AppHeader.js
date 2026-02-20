import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { apiClient } from '../api/client';
import { colors, typography, iconSizes, spacing } from '../theme';

const logo = require('../../assets/logo.png');

/**
 * Left side of app header: logo + "THI THỬ ONLINE". Tapping navigates to Home.
 */
export function HeaderLeft() {
  const navigation = useNavigation();
  const goHome = () => navigation.navigate('Home');
  return (
    <TouchableOpacity style={styles.left} onPress={goHome} activeOpacity={0.7}>
      <Image source={logo} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>THI THỬ ONLINE</Text>
    </TouchableOpacity>
  );
}

/**
 * Right side: search icon + account block (avatar, name, email, level/XP). Tapping account navigates to Profile.
 */
export function HeaderRight() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [gamification, setGamification] = useState(null);

  const userData = user?.user ?? user;
  const name = userData?.name ?? userData?.profile?.nickname ?? '—';
  const avatarUri = userData?.profile?.avatar ?? null;

  useEffect(() => {
    let mounted = true;
    apiClient
      .get('/api/v1/gamification')
      .then((res) => {
        if (mounted && res) setGamification(res);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const level = gamification?.level ?? '—';
  const xp = gamification?.xp != null ? gamification.xp : '—';
  const levelXpText = typeof xp === 'number' ? `Cấp ${level} · ${xp.toLocaleString()} XP` : `Cấp ${level} · ${xp} XP`;

  const goProfile = () => {
    const root = navigation.getParent?.() ?? navigation;
    root.navigate('Profile');
  };

  return (
    <View style={styles.right}>
      <TouchableOpacity style={styles.accountBlock} onPress={goProfile} activeOpacity={0.7}>
        <View style={styles.avatarWrap}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={iconSizes.md} color={colors.success} />
            </View>
          )}
        </View>
        <View style={styles.accountText}>
          <Text style={styles.accountName} numberOfLines={1}>{name}</Text>
          <Text style={styles.accountLevelXp}>{levelXpText}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  logo: {
    width: 36,
    height: 36,
  },
  title: {
    ...typography.subtitle,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  accountBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.xs,
    maxWidth: 220,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.successTint,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.successTint,
  },
  accountText: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 2,
  },
  accountName: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text,
    fontSize: 10,
    lineHeight: 12,
  },
  accountLevelXp: {
    fontSize: 9,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '600',
    lineHeight: 12,
  },
});

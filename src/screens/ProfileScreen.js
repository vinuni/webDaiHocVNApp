import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { apiClient } from '../api/client';
import ProgressRing from '../components/ProgressRing';
import { colors, spacing, borderRadius, typography, minTouchTargetSize, gradients, iconSizes, shadows } from '../theme';

let ImagePicker = null;
try {
  ImagePicker = require('expo-image-picker');
} catch {}

export default function ProfileScreen({ navigation }) {
  const { user: authUser, logout, refreshUser } = useAuth();
  const [user, setUser] = useState(authUser);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [gamification, setGamification] = useState(null);

  const userData = user?.user ?? user;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get('/api/v1/user');
        const u = res?.user ?? res ?? null;
        if (mounted) setUser(u);
      } catch {
        if (mounted) setUser(authUser);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const loadGamification = () => {
    apiClient.get('/api/v1/gamification').then((res) => setGamification(res || null)).catch(() => setGamification(null));
  };

  useEffect(() => {
    loadGamification();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [userRes, gamRes] = await Promise.all([
        apiClient.get('/api/v1/user'),
        apiClient.get('/api/v1/gamification'),
      ]);
      setUser(userRes?.user ?? userRes ?? authUser);
      setGamification(gamRes || null);
    } catch {
      loadGamification();
    } finally {
      setRefreshing(false);
    }
  };

  const pickAndUploadAvatar = async () => {
    if (!ImagePicker) {
      Alert.alert('Thông báo', 'Tính năng đổi ảnh cần expo-image-picker.');
      return;
    }
    const { status } = await (ImagePicker.requestMediaLibraryPermissionsAsync?.() ?? Promise.resolve({ status: 'undetermined' }));
    if (status !== 'granted') {
      Alert.alert('Cần quyền', 'Vui lòng cho phép truy cập thư viện ảnh.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const formData = new FormData();
      if (userData?.name) formData.append('name', userData.name);
      if (userData?.email) formData.append('email', userData.email);
      if (userData?.profile?.nickname) formData.append('nickname', userData.profile.nickname);
      formData.append('avatar', {
        uri: asset.uri,
        name: asset.fileName || 'avatar.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
      const res = await apiClient.postFormData('/api/v1/user', formData);
      const updated = res?.user ?? res;
      setUser(updated);
      await refreshUser();
    } catch (e) {
      Alert.alert('Lỗi', e?.body?.message || e?.message || 'Cập nhật ảnh thất bại.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading && !userData) {
    return (<View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>);
  }

  const name = userData?.name ?? userData?.profile?.nickname ?? '—';
  const email = userData?.email ?? '—';
  const avatarUri = userData?.profile?.avatar ?? null;
  const emailUnverified = userData && !userData.email_verified_at;
  const level = gamification?.level ?? null;
  const xp = gamification?.xp != null ? gamification.xp : null;
  const xpText = xp != null ? (level != null ? `Cấp ${level} · ${xp.toLocaleString()} XP` : `${xp.toLocaleString()} XP`) : null;

  const g = gamification || {};
  const xpVal = g.xp ?? 0;
  const levelVal = g.level ?? 1;
  const badges = Array.isArray(g.badges) ? g.badges : [];
  const streak = g.streak || {};
  const challenges = Array.isArray(g.challenges) ? g.challenges : [];
  const leaderboard = Array.isArray(g.leaderboard) ? g.leaderboard : [];
  const earnedBadges = badges.filter((b) => b.earned);
  const activeChallenges = challenges.filter((c) => !c.completed);
  const xpPerLevel = 1000;
  const currentLevelXP = xpVal % xpPerLevel;
  const xpProgress = xpPerLevel > 0 ? (currentLevelXP / xpPerLevel) * 100 : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* Gradient Header with Avatar */}
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.avatarWrap} onPress={pickAndUploadAvatar} disabled={uploading}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{(name[0] || '?').toUpperCase()}</Text>
            </View>
          )}
          {uploading && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color="#fff" />
            </View>
          )}
          <View style={styles.cameraButton}>
            <Ionicons name="camera" size={iconSizes.sm} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerName}>{name}</Text>
        <Text style={styles.headerEmail}>{email}</Text>
        {xpText != null && <Text style={styles.headerXp}>{xpText}</Text>}
      </LinearGradient>

      {/* Email Verification Banner */}
      {emailUnverified && (
        <View style={styles.emailBanner}>
          <Ionicons name="alert-circle" size={iconSizes.md} color="#fff" style={styles.bannerIcon} />
          <Text style={styles.emailBannerText}>
            Vui lòng xác thực email. Kiểm tra hộp thư và nhấn link xác thực.
          </Text>
        </View>
      )}

      {/* Menu Card */}
      <View style={styles.menuCard}>
        <TouchableOpacity 
          style={styles.menuRow} 
          onPress={() => navigation.getParent()?.navigate('StudyMaterials')} 
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.infoTint }]}>
            <Ionicons name="book-outline" size={iconSizes.md} color={colors.info} />
          </View>
          <Text style={styles.menuRowText}>Tài liệu học</Text>
          <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuRow} 
          onPress={() => navigation.getParent()?.navigate('Comments')} 
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.successTint }]}>
            <Ionicons name="chatbubble-outline" size={iconSizes.md} color={colors.success} />
          </View>
          <Text style={styles.menuRowText}>Bình luận</Text>
          <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuRow} 
          onPress={() => navigation.getParent()?.navigate('Scoreboard')} 
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.warningTint }]}>
            <Ionicons name="bar-chart-outline" size={iconSizes.md} color={colors.warning} />
          </View>
          <Text style={styles.menuRowText}>Bảng điểm</Text>
          <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuRow, styles.menuRowLast]} 
          onPress={() => navigation.getParent()?.navigate('Limits')} 
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.secondaryTint }]}>
            <Ionicons name="settings-outline" size={iconSizes.md} color={colors.secondary} />
          </View>
          <Text style={styles.menuRowText}>Giới hạn & Gợi ý</Text>
          <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Thành tích (merged from GamificationScreen) */}
      <View style={styles.thanhTichCard}>
        <View style={styles.thanhTichHeader}>
          <ProgressRing
            progress={xpProgress}
            size={100}
            strokeWidth={8}
            color={colors.primary}
            backgroundColor={colors.border}
            showPercentage={false}
            hideCenterText
          />
          <View style={styles.thanhTichXpWrap}>
            <Text style={styles.thanhTichLevel}>Cấp {levelVal}</Text>
            <Text style={styles.thanhTichXp}>{xpVal.toLocaleString()} XP</Text>
            <Text style={styles.thanhTichXpSub}>{currentLevelXP}/{xpPerLevel} XP đến cấp {levelVal + 1}</Text>
          </View>
        </View>
      </View>

      {streak && (streak.current_streak != null || streak.longest_streak != null) && (
        <View style={[styles.thanhTichSection, shadows.card]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="flame" size={iconSizes.lg} color={colors.warning} />
            <Text style={styles.sectionTitle}>Chuỗi luyện tập</Text>
          </View>
          <View style={styles.streakRow}>
            <View style={styles.streakBox}>
              <View style={[styles.streakIcon, { backgroundColor: colors.primaryTint }]}>
                <Ionicons name="calendar" size={iconSizes.lg} color={colors.primary} />
              </View>
              <Text style={styles.streakValue}>{streak.current_streak ?? 0}</Text>
              <Text style={styles.streakLabel}>Hiện tại</Text>
            </View>
            <View style={styles.streakBox}>
              <View style={[styles.streakIcon, { backgroundColor: colors.warningTint }]}>
                <Ionicons name="trophy" size={iconSizes.lg} color={colors.warning} />
              </View>
              <Text style={styles.streakValue}>{streak.longest_streak ?? 0}</Text>
              <Text style={styles.streakLabel}>Dài nhất</Text>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.thanhTichSection, shadows.card]}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="ribbon" size={iconSizes.lg} color={colors.warning} />
          <Text style={styles.sectionTitle}>Huy hiệu</Text>
          <Text style={styles.badgeCount}>{earnedBadges.length}/{badges.length}</Text>
        </View>
        {badges.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có huy hiệu nào.</Text>
        ) : (
          <View style={styles.badgeWrap}>
            {badges.slice(0, 12).map((b) => (
              <View key={b.id} style={[styles.badgeItem, !b.earned && styles.badgeItemLocked]}>
                <View style={[styles.badgeIcon, b.earned && styles.badgeIconEarned]}>
                  <Text style={styles.badgeEmoji}>{b.icon === 'ti-trophy' ? '🏆' : '⭐'}</Text>
                </View>
                <Text style={styles.badgeName} numberOfLines={1}>{b.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={[styles.thanhTichSection, shadows.card]}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="flag" size={iconSizes.lg} color={colors.info} />
          <Text style={styles.sectionTitle}>Thử thách</Text>
        </View>
        {activeChallenges.length === 0 && challenges.filter((c) => c.completed).length === 0 ? (
          <Text style={styles.emptyText}>Chưa có thử thách.</Text>
        ) : (
          activeChallenges.slice(0, 5).map((c) => (
            <View key={c.id} style={styles.challengeItem}>
              <View style={styles.challengeHeader}>
                <Text style={styles.challengeName}>{c.name}</Text>
                <View style={styles.challengeRewardBadge}>
                  <Ionicons name="star" size={12} color={colors.success} />
                  <Text style={styles.challengeReward}>+{c.points_reward}</Text>
                </View>
              </View>
              <Text style={styles.challengeDesc} numberOfLines={2}>{c.description}</Text>
              <View style={styles.progressWrap}>
                <View style={[styles.progressBar, { width: `${Math.min(100, c.progress || 0)}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(c.progress || 0)}% hoàn thành</Text>
            </View>
          ))
        )}
      </View>

      <View style={[styles.thanhTichSection, styles.thanhTichSectionLast, shadows.card]}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="podium" size={iconSizes.lg} color={colors.warning} />
          <Text style={styles.sectionTitle}>Bảng xếp hạng</Text>
        </View>
        {leaderboard.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có dữ liệu.</Text>
        ) : (
          leaderboard.slice(0, 10).map((entry, index) => {
            const isTop3 = index < 3;
            const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
            return (
              <View key={entry.id || index} style={styles.leaderRow}>
                <View style={[styles.leaderRank, isTop3 && { backgroundColor: rankColors[index] + '20' }]}>
                  {isTop3 ? (
                    <Ionicons name="medal" size={iconSizes.lg} color={rankColors[index]} />
                  ) : (
                    <Text style={styles.leaderRankText}>#{index + 1}</Text>
                  )}
                </View>
                <View style={styles.leaderInfo}>
                  <Text style={styles.leaderName}>{entry.nickname || '—'}</Text>
                  <Text style={styles.leaderMeta}>Cấp {entry.level} · {entry.points ?? entry.total_points ?? 0} điểm</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={iconSizes.md} color={colors.danger} style={styles.logoutIcon} />
        <Text style={styles.logoutBtnText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  content: { 
    paddingBottom: spacing.xxl 
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: colors.background 
  },
  header: {
    paddingTop: spacing.xxl + 40,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  avatarWrap: { 
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarPlaceholder: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: 'rgba(255,255,255,0.3)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: { 
    fontSize: 40, 
    fontWeight: '700', 
    color: '#fff' 
  },
  avatarOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    borderRadius: 50, 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  headerName: {
    ...typography.title,
    color: '#fff',
    marginBottom: spacing.xs,
  },
  headerEmail: {
    ...typography.body,
    color: 'rgba(255,255,255,0.9)',
  },
  headerXp: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.95)',
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  emailBanner: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning, 
    padding: spacing.md, 
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
  },
  bannerIcon: {
    marginRight: spacing.sm,
  },
  emailBannerText: { 
    ...typography.bodySmall, 
    color: '#fff',
    flex: 1,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: spacing.md, 
    minHeight: minTouchTargetSize,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuRowText: { 
    ...typography.body, 
    color: colors.text,
    flex: 1,
    fontWeight: '500',
  },
  logoutBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface, 
    padding: spacing.md, 
    borderRadius: borderRadius.md, 
    minHeight: minTouchTargetSize,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  logoutIcon: {
    marginRight: spacing.sm,
  },
  logoutBtnText: { 
    color: colors.danger, 
    ...typography.button,
  },
  thanhTichCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  thanhTichHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  thanhTichXpWrap: { alignItems: 'center' },
  thanhTichLevel: { ...typography.subtitle, color: colors.primary, fontWeight: '700', marginBottom: spacing.xs },
  thanhTichXp: { ...typography.title, color: colors.text },
  thanhTichXpSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  thanhTichSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thanhTichSectionLast: { marginBottom: spacing.md },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: { ...typography.subtitle, color: colors.text, flex: 1 },
  badgeCount: {
    ...typography.caption,
    color: colors.primary,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    fontWeight: '600',
  },
  streakRow: { flexDirection: 'row', justifyContent: 'space-around' },
  streakBox: { alignItems: 'center', gap: spacing.xs },
  streakIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakValue: { fontSize: 24, fontWeight: '700', color: colors.text },
  streakLabel: { ...typography.caption, color: colors.textSecondary },
  badgeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badgeItem: {
    width: '30%',
    minWidth: 80,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundDark,
  },
  badgeItemLocked: { opacity: 0.4 },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  badgeIconEarned: { backgroundColor: colors.primaryTint },
  badgeEmoji: { fontSize: 28 },
  badgeName: { ...typography.caption, color: colors.text, textAlign: 'center' },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  challengeItem: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  challengeName: { ...typography.subtitle, color: colors.text, flex: 1 },
  challengeRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  challengeReward: { ...typography.caption, color: colors.success, fontWeight: '700' },
  challengeDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  progressWrap: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  progressText: { ...typography.caption, color: colors.textMuted },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    minHeight: minTouchTargetSize,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leaderRank: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  leaderRankText: { ...typography.subtitle, color: colors.textMuted, fontWeight: '700' },
  leaderInfo: { flex: 1 },
  leaderName: { ...typography.body, color: colors.text, fontWeight: '600' },
  leaderMeta: { ...typography.caption, color: colors.textSecondary },
});

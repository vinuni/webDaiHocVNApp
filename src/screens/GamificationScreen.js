import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../api/client';
import ProgressRing from '../components/ProgressRing';
import { colors, spacing, borderRadius, typography, shadows, minTouchTargetSize, gradients, iconSizes, screenPaddingHorizontal } from '../theme';

const DEFAULT_GAMIFICATION = { xp: 0, level: 1, badges: [], streak: {}, challenges: [], leaderboard: [] };

export default function GamificationScreen() {
  const [data, setData] = useState(DEFAULT_GAMIFICATION);
  const [refreshing, setRefreshing] = useState(false);

  const load = () => {
    apiClient
      .get('/api/v1/gamification')
      .then((res) => setData(res || DEFAULT_GAMIFICATION))
      .catch(() => setData(DEFAULT_GAMIFICATION));
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    apiClient
      .get('/api/v1/gamification')
      .then((res) => setData(res || DEFAULT_GAMIFICATION))
      .catch(() => {})
      .finally(() => setRefreshing(false));
  };

  const { xp = 0, level = 1, badges = [], streak = {}, challenges = [], leaderboard = [] } = data;
  const earnedBadges = badges.filter((b) => b.earned);
  const activeChallenges = challenges.filter((c) => !c.completed);

  // Calculate XP progress to next level (assuming 1000 XP per level)
  const xpPerLevel = 1000;
  const currentLevelXP = xp % xpPerLevel;
  const xpProgress = (currentLevelXP / xpPerLevel) * 100;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* XP & Level Header */}
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <ProgressRing
          progress={xpProgress}
          size={140}
          strokeWidth={10}
          color="#fff"
          backgroundColor="rgba(255,255,255,0.3)"
          label={`Cấp ${level}`}
          showPercentage={false}
        />
        <Text style={styles.xpText}>{xp.toLocaleString()} XP</Text>
        <Text style={styles.xpSubtext}>{currentLevelXP}/{xpPerLevel} XP đến cấp {level + 1}</Text>
      </LinearGradient>

      {/* Streak */}
      {streak && (streak.current_streak != null || streak.longest_streak != null) && (
        <View style={[styles.card, shadows.card]}>
          <View style={styles.cardHeader}>
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
            <View style={styles.streakBox}>
              <View style={[styles.streakIcon, { backgroundColor: colors.successTint }]}>
                <Ionicons name="star" size={iconSizes.lg} color={colors.success} />
              </View>
              <Text style={styles.streakValue}>{streak.reward_points ?? 0}</Text>
              <Text style={styles.streakLabel}>Điểm thưởng</Text>
            </View>
          </View>
        </View>
      )}

      {/* Badges */}
      <View style={[styles.card, shadows.card]}>
        <View style={styles.cardHeader}>
          <Ionicons name="ribbon" size={iconSizes.lg} color={colors.warning} />
          <Text style={styles.sectionTitle}>Huy hiệu</Text>
          <Text style={styles.badgeCount}>{earnedBadges.length}/{badges.length}</Text>
        </View>
        {badges.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có huy hiệu nào.</Text>
        ) : (
          <View style={styles.badgeWrap}>
            {badges.slice(0, 12).map((b) => (
              <View
                key={b.id}
                style={[styles.badgeItem, !b.earned && styles.badgeItemLocked]}
              >
                <View style={[styles.badgeIcon, b.earned && styles.badgeIconEarned]}>
                  <Text style={styles.badgeEmoji}>{b.icon === 'ti-trophy' ? '🏆' : '⭐'}</Text>
                </View>
                <Text style={styles.badgeName} numberOfLines={1}>{b.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Challenges */}
      <View style={[styles.card, shadows.card]}>
        <View style={styles.cardHeader}>
          <Ionicons name="flag" size={iconSizes.lg} color={colors.info} />
          <Text style={styles.sectionTitle}>Thử thách</Text>
        </View>
        {activeChallenges.length === 0 && challenges.filter((c) => c.completed).length === 0 ? (
          <Text style={styles.emptyText}>Chưa có thử thách.</Text>
        ) : (
          <>
            {activeChallenges.slice(0, 5).map((c) => (
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
                  <View style={[styles.progressBar, { width: `${Math.min(100, (c.progress || 0))}%` }]} />
                </View>
                <Text style={styles.progressText}>{Math.round(c.progress || 0)}% hoàn thành</Text>
              </View>
            ))}
          </>
        )}
      </View>

      {/* Leaderboard */}
      <View style={[styles.card, shadows.card]}>
        <View style={styles.cardHeader}>
          <Ionicons name="podium" size={iconSizes.lg} color={colors.warning} />
          <Text style={styles.sectionTitle}>Bảng xếp hạng</Text>
        </View>
        {leaderboard.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có dữ liệu.</Text>
        ) : (
          leaderboard.slice(0, 10).map((entry, index) => {
            const isTop3 = index < 3;
            const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze
            return (
              <View key={entry.id || index} style={styles.leaderRow}>
                <View style={[
                  styles.leaderRank,
                  isTop3 && { backgroundColor: rankColors[index] + '20' }
                ]}>
                  {isTop3 ? (
                    <Ionicons 
                      name="medal" 
                      size={iconSizes.lg} 
                      color={rankColors[index]} 
                    />
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: screenPaddingHorizontal,
    alignItems: 'center',
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
    marginBottom: spacing.lg,
  },
  xpText: {
    ...typography.title,
    color: '#fff',
    marginTop: spacing.md,
  },
  xpSubtext: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.9)',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: screenPaddingHorizontal,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: { 
    ...typography.subtitle, 
    color: colors.text,
    flex: 1,
  },
  badgeCount: {
    ...typography.caption,
    color: colors.primary,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    fontWeight: '600',
  },
  streakRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around' 
  },
  streakBox: { 
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakValue: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: colors.text 
  },
  streakLabel: { 
    ...typography.caption, 
    color: colors.textSecondary 
  },
  badgeWrap: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: spacing.sm 
  },
  badgeItem: {
    width: '30%',
    minWidth: 80,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundDark,
  },
  badgeItemLocked: { 
    opacity: 0.4 
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  badgeIconEarned: {
    backgroundColor: colors.primaryTint,
  },
  badgeEmoji: { 
    fontSize: 28 
  },
  badgeName: { 
    ...typography.caption, 
    color: colors.text,
    textAlign: 'center',
  },
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
    borderBottomColor: colors.border 
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  challengeName: { 
    ...typography.subtitle, 
    color: colors.text,
    flex: 1,
  },
  challengeRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  challengeReward: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
  },
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
    borderRadius: borderRadius.sm 
  },
  progressText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  leaderRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: spacing.sm, 
    minHeight: minTouchTargetSize, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border 
  },
  leaderRank: { 
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  leaderRankText: { 
    ...typography.subtitle, 
    color: colors.textMuted,
    fontWeight: '700',
  },
  leaderInfo: { 
    flex: 1 
  },
  leaderName: { 
    ...typography.body, 
    color: colors.text,
    fontWeight: '600',
  },
  leaderMeta: { 
    ...typography.caption, 
    color: colors.textSecondary 
  },
});

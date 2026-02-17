import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { apiClient } from '../api/client';
import { colors, spacing, borderRadius, typography, shadows, minTouchTargetSize } from '../theme';

export default function GamificationScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await apiClient.get('/api/v1/gamification');
      setData(res);
    } catch {
      setData({ xp: 0, level: 1, badges: [], streak: {}, challenges: [], leaderboard: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading && !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const { xp = 0, level = 1, badges = [], streak = {}, challenges = [], leaderboard = [] } = data || {};
  const earnedBadges = badges.filter((b) => b.earned);
  const activeChallenges = challenges.filter((c) => !c.completed);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* XP & Level */}
      <View style={[styles.card, shadows.card]}>
        <Text style={styles.sectionTitle}>Cấp độ</Text>
        <View style={styles.xpRow}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{level}</Text>
          </View>
          <View style={styles.xpInfo}>
            <Text style={styles.xpLabel}>Điểm kinh nghiệm</Text>
            <Text style={styles.xpValue}>{xp.toLocaleString()} XP</Text>
          </View>
        </View>
      </View>

      {/* Streak */}
      {streak && (streak.current_streak != null || streak.longest_streak != null) && (
        <View style={[styles.card, shadows.card]}>
          <Text style={styles.sectionTitle}>Chuỗi luyện tập</Text>
          <View style={styles.streakRow}>
            <View style={styles.streakBox}>
              <Text style={styles.streakValue}>{streak.current_streak ?? 0}</Text>
              <Text style={styles.streakLabel}>Hiện tại</Text>
            </View>
            <View style={styles.streakBox}>
              <Text style={styles.streakValue}>{streak.longest_streak ?? 0}</Text>
              <Text style={styles.streakLabel}>Dài nhất</Text>
            </View>
            <View style={styles.streakBox}>
              <Text style={styles.streakValue}>{streak.reward_points ?? 0}</Text>
              <Text style={styles.streakLabel}>Điểm thưởng</Text>
            </View>
          </View>
        </View>
      )}

      {/* Badges */}
      <View style={[styles.card, shadows.card]}>
        <Text style={styles.sectionTitle}>Huy hiệu ({earnedBadges.length}/{badges.length})</Text>
        {badges.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có huy hiệu nào.</Text>
        ) : (
          <View style={styles.badgeWrap}>
            {badges.slice(0, 12).map((b) => (
              <View
                key={b.id}
                style={[styles.badgeItem, !b.earned && styles.badgeItemLocked]}
              >
                <Text style={styles.badgeIcon}>{b.icon === 'ti-trophy' ? '🏆' : '⭐'}</Text>
                <Text style={styles.badgeName} numberOfLines={1}>{b.name}</Text>
                {b.earned && <Text style={styles.badgeEarned}>Đã đạt</Text>}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Challenges */}
      <View style={[styles.card, shadows.card]}>
        <Text style={styles.sectionTitle}>Thử thách</Text>
        {activeChallenges.length === 0 && challenges.filter((c) => c.completed).length === 0 ? (
          <Text style={styles.emptyText}>Chưa có thử thách.</Text>
        ) : (
          <>
            {activeChallenges.slice(0, 5).map((c) => (
              <View key={c.id} style={styles.challengeItem}>
                <Text style={styles.challengeName}>{c.name}</Text>
                <Text style={styles.challengeDesc} numberOfLines={2}>{c.description}</Text>
                <View style={styles.progressWrap}>
                  <View style={[styles.progressBar, { width: `${Math.min(100, (c.progress || 0))}%` }]} />
                </View>
                <Text style={styles.challengeReward}>+{c.points_reward} điểm</Text>
              </View>
            ))}
          </>
        )}
      </View>

      {/* Leaderboard */}
      <View style={[styles.card, shadows.card]}>
        <Text style={styles.sectionTitle}>Bảng xếp hạng</Text>
        {leaderboard.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có dữ liệu.</Text>
        ) : (
          leaderboard.slice(0, 10).map((entry, index) => (
            <View key={entry.id || index} style={styles.leaderRow}>
              <Text style={styles.leaderRank}>#{index + 1}</Text>
              <View style={styles.leaderInfo}>
                <Text style={styles.leaderName}>{entry.nickname || '—'}</Text>
                <Text style={styles.leaderMeta}>Cấp {entry.level} · {entry.points ?? entry.total_points ?? 0} điểm</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { ...typography.subtitle, color: colors.text, marginBottom: spacing.md },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  levelBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  xpInfo: { flex: 1 },
  xpLabel: { ...typography.caption, color: colors.textSecondary },
  xpValue: { ...typography.titleSmall, color: colors.text },
  streakRow: { flexDirection: 'row', justifyContent: 'space-around' },
  streakBox: { alignItems: 'center' },
  streakValue: { fontSize: 22, fontWeight: '700', color: colors.primary },
  streakLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  badgeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badgeItem: {
    width: '30%',
    minWidth: 80,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
  },
  badgeItemLocked: { opacity: 0.5 },
  badgeIcon: { fontSize: 24, marginBottom: 4 },
  badgeName: { ...typography.caption, color: colors.text },
  badgeEarned: { ...typography.caption, color: colors.success, marginTop: 2 },
  emptyText: { ...typography.bodySmall, color: colors.textMuted },
  challengeItem: { marginBottom: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  challengeName: { ...typography.subtitle, color: colors.text },
  challengeDesc: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  progressWrap: { height: 6, backgroundColor: colors.border, borderRadius: 3, marginTop: spacing.sm, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  challengeReward: { ...typography.caption, color: colors.success, marginTop: 4 },
  leaderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, minHeight: minTouchTargetSize, borderBottomWidth: 1, borderBottomColor: colors.border },
  leaderRank: { ...typography.subtitle, color: colors.textMuted, width: 32 },
  leaderInfo: { flex: 1 },
  leaderName: { ...typography.body, color: colors.text },
  leaderMeta: { ...typography.caption, color: colors.textSecondary },
});

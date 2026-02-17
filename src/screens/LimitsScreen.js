import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { apiClient } from '../api/client';
import { colors, spacing, borderRadius, typography, minTouchTargetSize } from '../theme';

export default function LimitsScreen() {
  const [limits, setLimits] = useState(null);
  const [recommendations, setRec] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [lim, rec] = await Promise.all([
        apiClient.get('/api/v1/limits'),
        apiClient.get('/api/v1/practice/recommendations').catch(() => []),
      ]);
      setLimits(lim);
      setRec(Array.isArray(rec) ? rec : []);
    } catch {
      setLimits(null);
      setRec([]);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (loading && !limits) return (<View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      <Text style={styles.title}>Giới hạn & Gợi ý</Text>
      {limits && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sử dụng hôm nay</Text>
          <View style={styles.row}>
            <Text style={styles.detail}>Đề dài:</Text>
            <Text style={styles.detailValue}>{limits.long_used ?? 0} / {limits.long_limit ?? 0}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.detail}>Đề ngắn:</Text>
            <Text style={styles.detailValue}>{limits.short_used ?? 0} / {limits.short_limit ?? 0}</Text>
          </View>
          <View style={[styles.badge, (limits.can_take_long || limits.can_take_short) ? styles.badgeOk : styles.badgeLimit]}>
            <Text style={styles.badgeText}>
              {(limits.can_take_long || limits.can_take_short) ? 'Bạn còn lượt làm đề' : 'Đã hết lượt hôm nay'}
            </Text>
          </View>
        </View>
      )}
      <Text style={styles.sectionTitle}>Gợi ý luyện tập</Text>
      {recommendations.length === 0 ? (
        <View style={styles.emptyCard}><Text style={styles.empty}>Không có gợi ý.</Text></View>
      ) : (
        recommendations.slice(0, 10).map((item, i) => (
          <View key={i} style={styles.recRow}>
            <Text style={styles.recText}>{item.tendethi || item.title || JSON.stringify(item)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  title: { ...typography.titleSmall, marginBottom: spacing.sm, color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { ...typography.subtitle, marginBottom: spacing.md, color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  detail: { ...typography.body, color: colors.textSecondary },
  detailValue: { ...typography.body, color: colors.text, fontWeight: '600' },
  badge: { marginTop: spacing.md, padding: spacing.sm, borderRadius: borderRadius.sm, alignItems: 'center' },
  badgeOk: { backgroundColor: colors.success + '20' },
  badgeLimit: { backgroundColor: colors.warning + '20' },
  badgeText: { ...typography.bodySmall, fontWeight: '600' },
  sectionTitle: { ...typography.subtitle, marginBottom: spacing.sm, color: colors.text },
  recRow: { padding: spacing.md, minHeight: minTouchTargetSize, justifyContent: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  recText: { ...typography.body },
  emptyCard: { padding: spacing.lg },
  empty: { ...typography.body, color: colors.textSecondary },
});

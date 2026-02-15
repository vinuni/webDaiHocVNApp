import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { apiClient } from '../api/client';
import { colors, spacing, borderRadius, typography } from '../theme';

export default function ScoreboardScreen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await apiClient.get('/api/v1/bang-diem');
      setData(res && res.attempts ? res.attempts : []);
    } catch {
      setData([]);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (loading && !data.length) return (<View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bang diem</Text>
      <FlatList
        data={data}
        keyExtractor={(item, idx) => String(item.de_thi_id || idx)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<View style={styles.emptyWrap}><Text style={styles.empty}>Chưa có kết quả.</Text></View>}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <View style={styles.rankBadge}><Text style={styles.rank}>{index + 1}</Text></View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>{item.tendethi || 'Đề thi'}</Text>
              <Text style={styles.rowMeta}>Điểm: {item.diem != null ? Number(item.diem).toFixed(1) : '–'}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  title: { ...typography.titleSmall, marginBottom: 16, color: colors.text },
  row: { flexDirection: 'row', padding: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  rankBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  rank: { ...typography.bodySmall, fontWeight: '700', color: '#fff' },
  rowContent: { flex: 1 },
  rowTitle: { ...typography.body, color: colors.text },
  rowMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  emptyWrap: { padding: 24, alignItems: 'center' },
  empty: { ...typography.body, color: colors.textSecondary },
});

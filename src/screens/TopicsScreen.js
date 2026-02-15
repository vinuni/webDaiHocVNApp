import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { apiClient } from '../api/client';
import { colors, spacing, borderRadius, typography } from '../theme';

export default function TopicsScreen({ navigation }) {
  const [monThis, setMonThis] = useState([]);
  const [hocPhans, setHocPhans] = useState([]);
  const [selectedMonThiId, setSelectedMonThiId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingHocPhan, setLoadingHocPhan] = useState(false);

  useEffect(() => {
    apiClient.get('/api/v1/home').then((res) => setMonThis(res && res.mon_this ? res.mon_this : [])).catch(() => setMonThis([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedMonThiId) { setHocPhans([]); return; }
    setLoadingHocPhan(true);
    apiClient.get('/api/v1/hoc-phan?mon_thi=' + selectedMonThiId).then((res) => setHocPhans(Array.isArray(res) ? res : [])).catch(() => setHocPhans([])).finally(() => setLoadingHocPhan(false));
  }, [selectedMonThiId]);

  if (loading) return (<View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Học phần</Text>
      <Text style={styles.subtitle}>Chọn môn thi</Text>
      <FlatList
        horizontal
        data={monThis}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.chipList}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, item.id === selectedMonThiId && styles.chipActive]}
            onPress={() => setSelectedMonThiId(item.id === selectedMonThiId ? null : item.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, item.id === selectedMonThiId && styles.chipTextActive]}>{item.tenmonthi}</Text>
          </TouchableOpacity>
        )}
      />
      <Text style={styles.subtitle}>Danh sách học phần</Text>
      {loadingHocPhan ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={hocPhans}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<View style={styles.emptyCard}><Text style={styles.empty}>{selectedMonThiId ? 'Không có học phần.' : 'Chọn môn thi.'}</Text></View>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('TopicDetail', { id: item.id })} activeOpacity={0.7}>
              <Text style={styles.rowTitle}>{item.tenhocphan}</Text>
              <Text style={styles.rowArrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  title: { ...typography.titleSmall, marginBottom: spacing.xs, color: colors.text },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm },
  chipList: { paddingVertical: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.bodySmall, color: colors.text },
  chipTextActive: { color: '#fff' },
  loader: { marginTop: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowTitle: { ...typography.body, flex: 1, color: colors.text },
  rowArrow: { fontSize: 20, color: colors.textMuted },
  emptyCard: { padding: spacing.xl, alignItems: 'center' },
  empty: { ...typography.body, color: colors.textSecondary },
});

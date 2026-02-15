import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { apiClient } from '../api/client';
import { colors, spacing, borderRadius, typography } from '../theme';

export default function HomeScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonThiId, setSelectedMonThiId] = useState(null);

  const load = async () => {
    try {
      const res = await apiClient.get('/api/v1/home');
      setData(res);
    } catch {
      setData({ mon_this: [] });
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

  const mon_this = data?.mon_this || [];
  const selected = selectedMonThiId ? mon_this.find((m) => m.id === selectedMonThiId) : null;
  const de_this = selected?.de_this || [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đề thi</Text>
      <Text style={styles.subtitle}>Chọn môn thi</Text>
      <FlatList
        horizontal
        data={mon_this}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.monList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.monChip, item.id === selectedMonThiId && styles.monChipActive]}
            onPress={() => setSelectedMonThiId(item.id === selectedMonThiId ? null : item.id)}
          >
            <Text style={[styles.monChipText, item.id === selectedMonThiId && styles.monChipTextActive]}>
              {item.tenmonthi}
            </Text>
          </TouchableOpacity>
        )}
      />
      <Text style={styles.subtitle}>Danh sách đề</Text>
      <FlatList
        data={de_this}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}><Text style={styles.empty}>
            {selectedMonThiId ? 'Không có đề nào.' : 'Chọn môn thi ở trên.'}
          </Text></View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.deThiRow}
            onPress={() => navigation.navigate('ExamTake', { deThiId: item.id, tendethi: item.tendethi })}
            activeOpacity={0.7}
          >
            <Text style={styles.deThiTitle}>{item.tendethi}</Text>
            <Text style={styles.deThiMeta}>{item.thoigian} phút</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  title: { ...typography.titleSmall, marginBottom: 4, color: colors.text },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: 8 },
  monList: { paddingVertical: 8 },
  monChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.surface, borderRadius: borderRadius.full, marginRight: 8, borderWidth: 1, borderColor: colors.border },
  monChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  monChipText: { ...typography.bodySmall, color: colors.text },
  monChipTextActive: { color: '#fff' },
  deThiRow: { padding: 16, backgroundColor: colors.surface, borderRadius: borderRadius.md, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  deThiTitle: { ...typography.subtitle, color: colors.text },
  deThiMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  emptyWrap: { padding: 24, alignItems: 'center' },
  empty: { ...typography.body, color: colors.textSecondary },
});

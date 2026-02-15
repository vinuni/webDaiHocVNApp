import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { apiClient } from '../api/client';

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
      setRec(Array.isArray(rec) ? rec : rec?.data || []);
    } catch {
      setLimits(null);
      setRec([]);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading && !limits) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Giới hạn & Gợi ý</Text>
      {limits && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sử dụng hôm nay</Text>
          <Text style={styles.detail}>
            Đề dài: {limits.long_used ?? 0} / {limits.long_limit ?? 0}
          </Text>
          <Text style={styles.detail}>
            Đề ngắn: {limits.short_used ?? 0} / {limits.short_limit ?? 0}
          </Text>
          <Text style={styles.detail}>
            {limits.can_take_long ? 'Có thể làm đề dài' : 'Đã hết lượt đề dài'}
          </Text>
          <Text style={styles.detail}>
            {limits.can_take_short ? 'Có thể làm đề ngắn' : 'Đã hết lượt đề ngắn'}
          </Text>
        </View>
      )}
      <Text style={styles.sectionTitle}>Gợi ý luyện tập</Text>
      {recommendations.length === 0 ? (
        <Text style={styles.empty}>Không có gợi ý.</Text>
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
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', margin: 16, marginBottom: 8 },
  card: { backgroundColor: '#f5f5f5', padding: 16, margin: 16, marginTop: 0, borderRadius: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  detail: { fontSize: 14, color: '#333', marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', margin: 16, marginTop: 24 },
  recRow: { padding: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  recText: { fontSize: 14 },
  empty: { padding: 16, color: '#666' },
});

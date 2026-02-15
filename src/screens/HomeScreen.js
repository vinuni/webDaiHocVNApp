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
        <ActivityIndicator size="large" />
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {selectedMonThiId ? 'Không có đề nào.' : 'Chọn môn thi ở trên.'}
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.deThiRow}
            onPress={() => navigation.navigate('ExamTake', { deThiId: item.id, tendethi: item.tendethi })}
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
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 8 },
  monList: { paddingVertical: 8, gap: 8 },
  monChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f0f0f0', borderRadius: 20, marginRight: 8 },
  monChipActive: { backgroundColor: '#007AFF' },
  monChipText: {},
  monChipTextActive: { color: '#fff' },
  deThiRow: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  deThiTitle: { fontSize: 16, fontWeight: '600' },
  deThiMeta: { fontSize: 12, color: '#666', marginTop: 4 },
  empty: { padding: 24, textAlign: 'center', color: '#666' },
});

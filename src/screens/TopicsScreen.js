import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { apiClient } from '../api/client';

export default function TopicsScreen({ navigation }) {
  const [monThis, setMonThis] = useState([]);
  const [hocPhans, setHocPhans] = useState([]);
  const [selectedMonThiId, setSelectedMonThiId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingHocPhan, setLoadingHocPhan] = useState(false);

  useEffect(() => {
    apiClient.get('/api/v1/home').then((res) => {
      setMonThis(res && res.mon_this ? res.mon_this : []);
    }).catch(() => setMonThis([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedMonThiId) {
      setHocPhans([]);
      return;
    }
    setLoadingHocPhan(true);
    apiClient.get('/api/v1/hoc-phan?mon_thi=' + selectedMonThiId).then((res) => {
      setHocPhans(Array.isArray(res) ? res : []);
    }).catch(() => setHocPhans([])).finally(() => setLoadingHocPhan(false));
  }, [selectedMonThiId]);

  if (loading) return (<View style={styles.centered}><ActivityIndicator size="large" /></View>);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hoc phan</Text>
      <Text style={styles.subtitle}>Chon mon thi</Text>
      <FlatList
        horizontal
        data={monThis}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.chipList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, item.id === selectedMonThiId && styles.chipActive]}
            onPress={() => setSelectedMonThiId(item.id === selectedMonThiId ? null : item.id)}
          >
            <Text style={[styles.chipText, item.id === selectedMonThiId && styles.chipTextActive]}>{item.tenmonthi}</Text>
          </TouchableOpacity>
        )}
      />
      <Text style={styles.subtitle}>Danh sach hoc phan</Text>
      {loadingHocPhan ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <FlatList
          data={hocPhans}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<Text style={styles.empty}>{selectedMonThiId ? 'Khong co hoc phan.' : 'Chon mon thi.'}</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('TopicDetail', { id: item.id })}>
              <Text style={styles.rowTitle}>{item.tenhocphan}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 8 },
  chipList: { paddingVertical: 8, gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f0f0f0', borderRadius: 20, marginRight: 8 },
  chipActive: { backgroundColor: '#007AFF' },
  chipText: {},
  chipTextActive: { color: '#fff' },
  loader: { marginTop: 16 },
  row: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowTitle: { fontSize: 16 },
  empty: { padding: 24, textAlign: 'center', color: '#666' },
});

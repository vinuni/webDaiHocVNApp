import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { apiClient } from '../api/client';

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

  if (loading && !data.length) return (<View style={styles.centered}><ActivityIndicator size="large" /></View>);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bang diem</Text>
      <FlatList
        data={data}
        keyExtractor={(item, idx) => String(item.de_thi_id || idx)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>Chua co ket qua.</Text>}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={styles.rank}>{index + 1}</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>{item.tendethi || 'De thi'}</Text>
              <Text style={styles.rowMeta}>Diem: {item.diem != null ? Number(item.diem).toFixed(1) : '-'}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  row: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  rank: { width: 28, fontSize: 16, fontWeight: '600' },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 15 },
  rowMeta: { fontSize: 12, color: '#666', marginTop: 2 },
  empty: { padding: 24, textAlign: 'center', color: '#666' },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { apiClient } from '../api/client';

export default function ResultScreen({ route, navigation }) {
  const { deThiId, tendethi, diem, correct, total } = route.params || {};
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let m = true;
    apiClient.get('/api/v1/ket-qua/' + deThiId).then((res) => { if (m) setDetail(res); }).catch(() => { if (m) setDetail(null); }).finally(() => { if (m) setLoading(false); });
    return () => { m = false; };
  }, [deThiId]);

  const d = diem != null ? diem : (detail && detail.diem);
  const c = correct != null ? correct : (detail && detail.correct);
  const t = total != null ? total : (detail && detail.total);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{tendethi || 'Ket qua'}</Text>
      {loading && d == null ? <ActivityIndicator size="large" /> : (
        <>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Diem</Text>
            <Text style={styles.scoreValue}>{d != null ? Number(d).toFixed(1) : '-'}</Text>
          </View>
          <Text style={styles.detail}>Dung {c ?? '-'} / {t ?? '-'} cau</Text>
        </>
      )}
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.buttonText}>Ve trang chu</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 24 },
  scoreBox: { alignItems: 'center', marginBottom: 8 },
  scoreLabel: { fontSize: 14, color: '#666' },
  scoreValue: { fontSize: 48, fontWeight: 'bold' },
  detail: { fontSize: 16, color: '#666', marginBottom: 32 },
  button: { backgroundColor: '#007AFF', padding: 14, paddingHorizontal: 32, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
});

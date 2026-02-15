import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { apiClient } from '../api/client';
import { colors, spacing, borderRadius, typography } from '../theme';

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
      <View style={styles.card}>
        <Text style={styles.title}>{tendethi || 'Kết quả'}</Text>
        {loading && d == null ? <ActivityIndicator size="large" color={colors.primary} style={styles.loader} /> : (
          <>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>{d != null ? Number(d).toFixed(1) : '–'}</Text>
              <Text style={styles.scoreLabel}>điểm</Text>
            </View>
            <Text style={styles.detail}>Đúng {c ?? '–'} / {t ?? '–'} câu</Text>
          </>
        )}
      </View>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Về trang chủ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.background },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 32, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  title: { ...typography.titleSmall, marginBottom: 24, color: colors.text },
  loader: { marginVertical: 24 },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.primary + '18', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  scoreValue: { fontSize: 42, fontWeight: '700', color: colors.primary },
  scoreLabel: { ...typography.caption, color: colors.textSecondary },
  detail: { ...typography.body, color: colors.textSecondary },
  button: { backgroundColor: colors.primary, paddingVertical: 16, paddingHorizontal: 32, borderRadius: borderRadius.md },
  buttonText: { color: '#fff', ...typography.subtitle },
});

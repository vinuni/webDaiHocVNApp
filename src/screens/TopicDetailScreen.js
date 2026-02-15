import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { apiClient } from '../api/client';
import { colors, spacing, typography } from '../theme';

export default function TopicDetailScreen({ route }) {
  const { id } = route.params || {};
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiClient.get('/api/v1/hoc-phan/' + id).then(setTopic).catch(() => setTopic(null)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (<View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>);
  if (!topic) return (<View style={styles.centered}><Text style={styles.empty}>Không tìm thấy.</Text></View>);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{topic.tenhocphan || topic.name}</Text>
        {topic.mon_thi && <Text style={styles.meta}>Môn: {topic.mon_thi.tenmonthi}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  title: { ...typography.titleSmall, color: colors.text },
  meta: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  empty: { ...typography.body, color: colors.textSecondary },
});

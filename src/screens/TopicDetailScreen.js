import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { apiClient } from '../api/client';
import { colors, spacing, typography } from '../theme';

export default function TopicDetailScreen({ route, navigation }) {
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
      <TouchableOpacity style={styles.section} onPress={() => navigation.navigate('StudyMaterials', { hocPhanId: id })} activeOpacity={0.8}>
        <Text style={styles.sectionTitle}>Tài liệu học</Text>
        <Text style={styles.placeholderText}>Xem tài liệu, video, công thức →</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.section} onPress={() => navigation.navigate('Comments')} activeOpacity={0.8}>
        <Text style={styles.sectionTitle}>Bình luận</Text>
        <Text style={styles.placeholderText}>Bình luận theo đề thi hoặc câu hỏi →</Text>
      </TouchableOpacity>
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
  section: { marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { ...typography.subtitle, color: colors.text },
  placeholderText: { ...typography.bodySmall, color: colors.textMuted, marginTop: 4 },
});

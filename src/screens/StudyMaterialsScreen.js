import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { apiClient } from '../api/client';
import MathText from '../components/MathText';
import { colors, spacing, borderRadius, typography, shadows, screenPaddingHorizontal } from '../theme';

export default function StudyMaterialsScreen({ route }) {
  const hocPhanId = route?.params?.hocPhanId ?? route?.params?.hoc_phan_id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!hocPhanId) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get(`/api/v1/hoc-phan/${hocPhanId}/study-materials`);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (hocPhanId) {
      setLoading(true);
      load();
    } else {
      setLoading(false);
    }
  }, [hocPhanId]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (!hocPhanId) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Tài liệu học tập</Text>
          <Text style={styles.emptyText}>Vào Học phần → chọn một chủ đề → nhấn "Tài liệu học" để xem tài liệu.</Text>
        </View>
      </View>
    );
  }

  if (loading && !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const hocPhan = data?.hoc_phan || {};
  const materials = data?.data || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      <View style={styles.header}>
        <Text style={styles.topicName}>{hocPhan.tenhocphan || 'Tài liệu'}</Text>
      </View>
      {materials.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyList}>
            {data?.message || 'Chưa có tài liệu cho học phần này.'}
          </Text>
          <Text style={styles.emptyHint}>
            Tài liệu học tập sẽ được tạo tự động khi có đủ câu hỏi trong học phần này.
          </Text>
        </View>
      ) : (
        materials.map((m) => (
          <View key={m.id} style={[styles.card, shadows.cardSm]}>
            <Text style={styles.cardTitle}>{m.title}</Text>
            {m.difficulty_level && (
              <Text style={styles.meta}>Độ khó: {m.difficulty_level}</Text>
            )}
            {m.type && <Text style={styles.meta}>Loại: {m.type}</Text>}
            {m.content_preview && (
              <Text style={styles.preview} numberOfLines={4}>{m.content_preview}</Text>
            )}
            {m.url ? (
              <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL(m.url)} activeOpacity={0.8}>
                <Text style={styles.linkBtnText}>Mở link</Text>
              </TouchableOpacity>
            ) : null}
            {m.content && !m.url && (() => {
              try {
                // Backend returns content as JSON-encoded string (like AI answers)
                // API client already parsed outer JSON, but content field is still JSON string
                const htmlContent = JSON.parse(m.content);
                return (
                  <View style={styles.contentWrapper}>
                    <MathText value={htmlContent} containerStyle={styles.mathContent} />
                  </View>
                );
              } catch (e) {
                // Fallback: show as plain text if JSON parse fails
                return (
                  <Text style={styles.body} numberOfLines={10}>
                    {typeof m.content === 'string' ? m.content.replace(/<[^>]*>/g, '') : String(m.content)}
                  </Text>
                );
              }
            })()}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingVertical: spacing.md, paddingHorizontal: screenPaddingHorizontal, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  emptyState: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  emptyTitle: { ...typography.titleSmall, color: colors.text, marginBottom: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSecondary },
  emptyState: { marginTop: spacing.lg, padding: spacing.md, alignItems: 'center' },
  emptyList: { ...typography.body, color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  emptyHint: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  header: { marginBottom: spacing.md },
  topicName: { ...typography.titleSmall, color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { ...typography.subtitle, color: colors.text, marginBottom: 4 },
  meta: { ...typography.caption, color: colors.textSecondary, marginBottom: 2 },
  preview: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  body: { ...typography.bodySmall, color: colors.text, marginTop: spacing.sm },
  linkBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  linkBtnText: { ...typography.body, color: colors.primary },
  contentWrapper: { marginTop: spacing.sm },
  mathContent: { backgroundColor: colors.backgroundDark, borderRadius: borderRadius.sm, padding: spacing.sm },
});

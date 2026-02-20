import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../api/client';
import { colors, spacing, borderRadius, typography, iconSizes, minTouchTargetSize, shadows } from '../theme';

const PER_PAGE = 10;

export default function TopicDetailScreen({ route, navigation }) {
  const { id } = route.params || {};
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deThisNhanh, setDeThisNhanh] = useState([]);
  const [deThisNhanhPage, setDeThisNhanhPage] = useState(1);
  const [hasMoreNhanh, setHasMoreNhanh] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadTopic = useCallback(async () => {
    if (!id) return;
    try {
      const res = await apiClient.get('/api/v1/hoc-phan/' + id);
      setTopic(res);
      setDeThisNhanh(res.de_this_nhanh || []);
      setDeThisNhanhPage(1);
      setHasMoreNhanh((res.de_this_nhanh_total || 0) > (res.de_this_nhanh || []).length);
    } catch {
      setTopic(null);
      setDeThisNhanh([]);
      setHasMoreNhanh(false);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTopic();
  }, [loadTopic]);

  const loadMoreDeThiNhanh = async () => {
    if (!id || loadingMore || !hasMoreNhanh) return;
    setLoadingMore(true);
    try {
      const nextPage = deThisNhanhPage + 1;
      const res = await apiClient.get(
        `/api/v1/hoc-phan/${id}/de-thi-nhanh?page=${nextPage}&per_page=${PER_PAGE}`
      );
      setDeThisNhanh((prev) => [...prev, ...(res.data || [])]);
      setDeThisNhanhPage(nextPage);
      setHasMoreNhanh(res.has_more === true);
    } catch (_) {
      setHasMoreNhanh(false);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!topic) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>Không tìm thấy.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>{topic.tenhocphan || topic.name}</Text>
        {topic.mon_thi && <Text style={styles.meta}>Môn: {topic.mon_thi.tenmonthi}</Text>}
      </View>

      <TouchableOpacity
        style={styles.section}
        onPress={() => navigation.navigate('StudyMaterials', { hocPhanId: id })}
        activeOpacity={0.8}
      >
        <View style={styles.sectionRow}>
          <Ionicons name="book-outline" size={iconSizes.md} color={colors.primary} />
          <View style={styles.sectionTextWrap}>
            <Text style={styles.sectionTitle}>Tài liệu học tập</Text>
            <Text style={styles.placeholderText}>Xem tài liệu, video, công thức →</Text>
          </View>
          <Ionicons name="chevron-forward" size={iconSizes.sm} color={colors.textMuted} />
        </View>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Đề thi nhanh</Text>
        <Text style={styles.placeholderText}>Đề 10 câu, luyện nhanh theo môn</Text>
        {deThisNhanh.length === 0 ? (
          <Text style={styles.emptyList}>Chưa có đề thi nhanh.</Text>
        ) : (
          <>
            {deThisNhanh.map((item, index) => {
              const attempted = item.user_attempted === true;
              const examColor = colors.primary;
              const onPress = () => {
                if (attempted) {
                  navigation.navigate('Result', {
                    deThiId: item.id,
                    tendethi: item.tendethi,
                    diem: item.user_diem,
                  });
                } else {
                  navigation.navigate('ExamTake', {
                    deThiId: item.id,
                    tendethi: item.tendethi,
                  });
                }
              };
              return (
                <TouchableOpacity
                  key={`de-thi-nhanh-${item.id}-${index}`}
                  style={styles.examCard}
                  onPress={onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.examAccent, { backgroundColor: examColor }]} />
                  <View style={styles.examContent}>
                    <View style={styles.examTitleRow}>
                      <Text style={styles.examTitle} numberOfLines={2}>
                        {item.tendethi}
                      </Text>
                      {attempted && (
                        <View style={styles.attemptedBadge}>
                          <Ionicons name="checkmark-circle" size={10} color={colors.success} />
                          <Text style={styles.attemptedBadgeText}>Đã làm</Text>
                        </View>
                      )}
                      {item.is_new && !attempted && (
                        <View style={styles.newBadge}>
                          <Ionicons name="flash" size={10} color={colors.warning} />
                          <Text style={styles.newBadgeText}>MỚI</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.examMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={iconSizes.sm} color={colors.primary} />
                        <Text style={styles.metaText}>{item.thoigian} phút</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="document-outline" size={iconSizes.sm} color={colors.secondary} />
                        <Text style={styles.metaText}>{item.cau_hois_count ?? '—'} câu</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="star" size={iconSizes.sm} color={colors.warning} />
                        <Text style={styles.metaText}>{(item.bestscore ?? item.user_diem ?? 0).toFixed(1)}</Text>
                      </View>
                    </View>
                    <View style={styles.examTypeIndicator}>
                      <Text style={[styles.examTypeText, { color: examColor }]}>⚡ Đề Nhanh</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })}
            {hasMoreNhanh && (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={loadMoreDeThiNhanh}
                disabled={loadingMore}
                activeOpacity={0.8}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.loadMoreText}>Tải thêm đề thi nhanh</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.section}
        onPress={() => navigation.navigate('Comments')}
        activeOpacity={0.8}
      >
        <View style={styles.sectionRow}>
          <Ionicons name="chatbubbles-outline" size={iconSizes.md} color={colors.primary} />
          <View style={styles.sectionTextWrap}>
            <Text style={styles.sectionTitle}>Bình luận</Text>
            <Text style={styles.placeholderText}>Bình luận theo đề thi hoặc câu hỏi →</Text>
          </View>
          <Ionicons name="chevron-forward" size={iconSizes.sm} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  title: { ...typography.titleSmall, color: colors.text },
  meta: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  empty: { ...typography.body, color: colors.textSecondary },
  section: { marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  sectionRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTextWrap: { flex: 1, marginLeft: spacing.sm },
  sectionTitle: { ...typography.subtitle, color: colors.text },
  placeholderText: { ...typography.bodySmall, color: colors.textMuted, marginTop: 4 },
  emptyList: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.sm },
  examCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    minHeight: minTouchTargetSize + 20,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.cardSm,
    overflow: 'hidden',
  },
  examAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary,
  },
  examContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  examTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.xxs,
  },
  examTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningTint,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    gap: 2,
  },
  newBadgeText: {
    ...typography.captionSmall,
    color: colors.warning,
    fontWeight: '700',
    fontSize: 9,
  },
  attemptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successTint,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    gap: 2,
  },
  attemptedBadgeText: {
    ...typography.captionSmall,
    color: colors.success,
    fontWeight: '700',
    fontSize: 9,
  },
  examMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxs,
  },
  examTypeIndicator: {
    marginTop: 2,
  },
  examTypeText: {
    ...typography.captionSmall,
    fontWeight: '600',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  loadMoreBtn: { marginTop: spacing.md, paddingVertical: spacing.sm, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  loadMoreText: { ...typography.body, color: colors.primary, fontWeight: '600' },
});

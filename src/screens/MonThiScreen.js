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
import EmptyState from '../components/EmptyState';
import { preferencesStorage, getDefaultMonThiId } from '../storage/preferences';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  minTouchTargetSize,
  shadows,
  iconSizes,
} from '../theme';

export default function MonThiScreen({ navigation }) {
  const [monThis, setMonThis] = useState([]);
  const [selectedMonThiId, setSelectedMonThiId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deThisNhanh, setDeThisNhanh] = useState([]);
  const [deThisFull, setDeThisFull] = useState([]);
  const [nhanhTotal, setNhanhTotal] = useState(0);
  const [fullTotal, setFullTotal] = useState(0);
  const [loadingMoreNhanh, setLoadingMoreNhanh] = useState(false);
  const [loadingMoreFull, setLoadingMoreFull] = useState(false);

  useEffect(() => {
    let mounted = true;
    apiClient
      .get('/api/v1/mon-thi')
      .then(async (res) => {
        const list = res?.mon_this ?? [];
        if (!mounted) return;
        setMonThis(list);
        const savedId = await preferencesStorage.getSelectedMonThiId();
        const validId = list.some((m) => m.id === savedId) ? savedId : null;
        const initialId = validId ?? getDefaultMonThiId(list);
        if (initialId != null) setSelectedMonThiId(initialId);
      })
      .catch(() => { if (mounted) setMonThis([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const loadDetail = useCallback(async (id) => {
    if (!id) {
      setDetail(null);
      setDeThisNhanh([]);
      setDeThisFull([]);
      setNhanhTotal(0);
      setFullTotal(0);
      return;
    }
    setDetailLoading(true);
    try {
      const res = await apiClient.get('/api/v1/mon-thi/' + id);
      setDetail(res);
      setDeThisNhanh(res.de_this_nhanh ?? []);
      setDeThisFull(res.de_this_full ?? []);
      setNhanhTotal(res.de_this_nhanh_total ?? 0);
      setFullTotal(res.de_this_full_total ?? 0);
    } catch {
      setDetail(null);
      setDeThisNhanh([]);
      setDeThisFull([]);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDetail(selectedMonThiId);
  }, [selectedMonThiId, loadDetail]);

  const selectMonThi = (id) => {
    const next = id === selectedMonThiId ? null : id;
    setSelectedMonThiId(next);
    preferencesStorage.setSelectedMonThiId(next);
  };

  const loadMoreNhanh = useCallback(async () => {
    if (!selectedMonThiId || loadingMoreNhanh || deThisNhanh.length >= nhanhTotal) return;
    setLoadingMoreNhanh(true);
    try {
      const res = await apiClient.get(
        `/api/v1/mon-thi/${selectedMonThiId}/de-thi-nhanh?offset=${deThisNhanh.length}&per_page=10`
      );
      setDeThisNhanh((prev) => [...prev, ...(res.data ?? [])]);
    } catch (_) {
      // keep current list
    } finally {
      setLoadingMoreNhanh(false);
    }
  }, [selectedMonThiId, loadingMoreNhanh, deThisNhanh.length, nhanhTotal]);

  const loadMoreFull = useCallback(async () => {
    if (!selectedMonThiId || loadingMoreFull || deThisFull.length >= fullTotal) return;
    setLoadingMoreFull(true);
    try {
      const res = await apiClient.get(
        `/api/v1/mon-thi/${selectedMonThiId}/de-thi-full?offset=${deThisFull.length}&per_page=10`
      );
      setDeThisFull((prev) => [...prev, ...(res.data ?? [])]);
    } catch (_) {
      // keep current list
    } finally {
      setLoadingMoreFull(false);
    }
  }, [selectedMonThiId, loadingMoreFull, deThisFull.length, fullTotal]);

  const getSubjectColor = (id) => {
    const subjectColors = [
      colors.subjectMath,
      colors.subjectPhysics,
      colors.subjectChemistry,
      colors.subjectBiology,
      colors.subjectLiterature,
      colors.subjectEnglish,
      colors.subjectHistory,
    ];
    return subjectColors[(id - 1) % subjectColors.length] || colors.primary;
  };

  const getSubjectIcon = (name) => {
    const lowerName = (name || '').toLowerCase();
    if (lowerName.includes('toán')) return 'calculator';
    if (lowerName.includes('vật') || lowerName.includes('lý')) return 'nuclear';
    if (lowerName.includes('hóa')) return 'flask';
    if (lowerName.includes('sinh')) return 'leaf';
    if (lowerName.includes('văn')) return 'book';
    if (lowerName.includes('anh') || lowerName.includes('english')) return 'language';
    if (lowerName.includes('sử')) return 'time';
    return 'document-text';
  };

  const renderExamCard = (item, examColor) => {
    const attempted = item.user_attempted === true;
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
        key={'exam-' + item.id}
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
            <Text style={[styles.examTypeText, { color: examColor }]}>
              {item.is_full ? '📝 Đề Full' : '⚡ Đề Nhanh'}
            </Text>
          </View>
        </View>
        <View style={styles.examAction}>
          {attempted ? (
            <View style={styles.resultButton}>
              <Ionicons name="checkmark-circle" size={iconSizes.sm} color={colors.success} />
              <Text style={styles.resultButtonText}>Kết Quả</Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.textMuted} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const hocPhansWithMaterials = (detail?.hoc_phans ?? []).filter(
    (hp) => (hp.study_materials_count ?? 0) > 0
  );
  const hasMoreNhanh = deThisNhanh.length < nhanhTotal;
  const hasMoreFull = deThisFull.length < fullTotal;
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.title}>Môn thi</Text>
        <Text style={styles.chipSectionLabel}>Chọn môn thi</Text>
        <ScrollView
          horizontal
          contentContainerStyle={styles.chipList}
          showsHorizontalScrollIndicator={false}
        >
          {monThis.map((item) => {
            const isSelected = item.id === selectedMonThiId;
            const chipColor = getSubjectColor(item.id);
            return (
              <TouchableOpacity
                key={String(item.id)}
                style={[styles.chip, isSelected && { backgroundColor: chipColor, borderColor: chipColor }]}
                onPress={() => selectMonThi(item.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={getSubjectIcon(item.tenmonthi)}
                  size={iconSizes.md}
                  color={isSelected ? '#fff' : chipColor}
                  style={styles.chipIcon}
                />
                <Text style={[styles.chipText, isSelected && { color: '#fff' }]}>
                  {item.short_name || item.tenmonthi}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {!selectedMonThiId ? (
          <EmptyState
            icon="school-outline"
            title="Chọn môn thi"
            subtitle="Chọn một môn thi ở trên để xem tài liệu, học phần và đề thi"
          />
        ) : detailLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
          {/* Study Materials */}
          {hocPhansWithMaterials.length > 0 && (
            <View style={[styles.section, styles.sectionFirst]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="book" size={iconSizes.md} color={colors.success} />
                <Text style={styles.sectionTitle}>Tài liệu học tập</Text>
              </View>
              {hocPhansWithMaterials.map((hp) => (
                <TouchableOpacity
                  key={'sm-' + hp.id}
                  style={[styles.studyMaterialCard, { borderLeftColor: colors.success }]}
                  onPress={() => navigation.navigate('StudyMaterials', { hocPhanId: hp.id })}
                  activeOpacity={0.8}
                >
                  <View style={styles.studyMaterialContent}>
                    <Text style={styles.studyMaterialTitle}>{hp.tenhocphan}</Text>
                    <Text style={styles.studyMaterialCount}>
                      <Ionicons name="book-outline" size={12} color={colors.textMuted} />{' '}
                      {hp.study_materials_count} tài liệu
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={iconSizes.sm} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* De Thi Nhanh */}
          <View style={[styles.section, hocPhansWithMaterials.length === 0 && styles.sectionFirst]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash" size={iconSizes.md} color={colors.primary} />
              <Text style={styles.sectionTitle}>Đề thi nhanh</Text>
            </View>
            {deThisNhanh.length === 0 ? (
              <Text style={styles.emptyList}>Chưa có đề thi nhanh.</Text>
            ) : (
              <>
                {deThisNhanh.map((item) => renderExamCard(item, colors.primary))}
                {hasMoreNhanh && (
                  <TouchableOpacity
                    style={styles.loadMoreBtn}
                    onPress={loadMoreNhanh}
                    disabled={loadingMoreNhanh}
                    activeOpacity={0.8}
                  >
                    {loadingMoreNhanh ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text style={styles.loadMoreText}>
                        Tải thêm đề thi nhanh ({deThisNhanh.length}/{nhanhTotal})
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* De Thi Full */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={iconSizes.md} color={colors.success} />
              <Text style={styles.sectionTitle}>Đề thi đầy đủ</Text>
            </View>
            {deThisFull.length === 0 ? (
              <Text style={styles.emptyList}>Chưa có đề thi đầy đủ.</Text>
            ) : (
              <>
                {deThisFull.map((item) => renderExamCard(item, colors.success))}
                {hasMoreFull && (
                  <TouchableOpacity
                    style={styles.loadMoreBtn}
                    onPress={loadMoreFull}
                    disabled={loadingMoreFull}
                    activeOpacity={0.8}
                  >
                    {loadingMoreFull ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text style={styles.loadMoreText}>
                        Tải thêm đề thi đầy đủ ({deThisFull.length}/{fullTotal})
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  title: { fontSize: 17, fontWeight: '700', marginBottom: spacing.xs, color: colors.text },
  chipSectionLabel: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.xs },
  chipList: { paddingBottom: spacing.xs, gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: minTouchTargetSize,
    height: minTouchTargetSize + 8,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.cardSm,
  },
  chipIcon: { marginRight: spacing.xs },
  chipText: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
  loaderWrap: { paddingVertical: spacing.xl, alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl },
  section: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.cardSm,
  },
  sectionFirst: { marginTop: spacing.xxs },
  loadMoreBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  loadMoreText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  sectionTitle: { ...typography.bodySmall, fontSize: 14, fontWeight: '600', color: colors.text },
  emptyList: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.xs },
  studyMaterialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 4,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  studyMaterialContent: { flex: 1 },
  studyMaterialTitle: {
    ...typography.bodySmall,
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 0,
  },
  studyMaterialCount: { ...typography.captionSmall, color: colors.textMuted },
  examCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    minHeight: minTouchTargetSize + 20,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
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
  examContent: { flex: 1, marginLeft: spacing.sm },
  examAction: {
    marginLeft: spacing.sm,
  },
  resultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  resultButtonText: {
    ...typography.bodySmall,
    color: colors.success,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  examTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.xxs,
  },
  examTitle: { ...typography.body, color: colors.text, fontWeight: '600', flex: 1 },
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
  examTypeIndicator: { marginTop: 2 },
  examTypeText: { ...typography.captionSmall, fontWeight: '600' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...typography.caption, color: colors.textSecondary },
});

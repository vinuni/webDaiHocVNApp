import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../api/client';
import EmptyState from '../components/EmptyState';
import { preferencesStorage, getDefaultMonThiId } from '../storage/preferences';
import { colors, spacing, borderRadius, typography, minTouchTargetSize, shadows, iconSizes } from '../theme';

export default function TopicsScreen({ navigation }) {
  const [monThis, setMonThis] = useState([]);
  const [hocPhans, setHocPhans] = useState([]);
  const [selectedMonThiId, setSelectedMonThiId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingHocPhan, setLoadingHocPhan] = useState(false);

  useEffect(() => {
    let mounted = true;
    apiClient
      .get('/api/v1/home')
      .then(async (res) => {
        const list = res && res.mon_this ? res.mon_this : [];
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

  useEffect(() => {
    if (!selectedMonThiId) { setHocPhans([]); return; }
    setLoadingHocPhan(true);
    apiClient.get('/api/v1/hoc-phan?mon_thi=' + selectedMonThiId).then((res) => setHocPhans(Array.isArray(res) ? res : [])).catch(() => setHocPhans([])).finally(() => setLoadingHocPhan(false));
  }, [selectedMonThiId]);

  const selectMonThi = (id) => {
    const next = id === selectedMonThiId ? null : id;
    setSelectedMonThiId(next);
    preferencesStorage.setSelectedMonThiId(next);
  };

  if (loading) return (<View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>);

  // Get subject color (use subjectColors array to avoid shadowing theme colors)
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

  // Get subject icon
  const getSubjectIcon = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('toán')) return 'calculator';
    if (lowerName.includes('vật') || lowerName.includes('lý')) return 'nuclear';
    if (lowerName.includes('hóa')) return 'flask';
    if (lowerName.includes('sinh')) return 'leaf';
    if (lowerName.includes('văn')) return 'book';
    if (lowerName.includes('anh') || lowerName.includes('english')) return 'language';
    if (lowerName.includes('sử')) return 'time';
    return 'document-text';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.title}>Học phần</Text>
        <Text style={styles.chipSectionLabel}>Chọn môn thi</Text>
        <ScrollView
          horizontal
          contentContainerStyle={styles.chipList}
          showsHorizontalScrollIndicator={false}
        >
          {monThis.map((item) => {
            const subjectColor = getSubjectColor(item.id);
            const isSelected = item.id === selectedMonThiId;
            return (
              <TouchableOpacity
                key={String(item.id)}
                style={[
                  styles.chip,
                  isSelected && { backgroundColor: subjectColor, borderColor: subjectColor }
                ]}
                onPress={() => selectMonThi(item.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={getSubjectIcon(item.tenmonthi)}
                  size={iconSizes.md}
                  color={isSelected ? '#fff' : subjectColor}
                  style={styles.chipIcon}
                />
                <Text style={[styles.chipText, isSelected && { color: '#fff' }]}>
                  {item.short_name || item.tenmonthi}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.listHeader}>
          <Text style={styles.subtitle}>Danh sách học phần</Text>
          {hocPhans.length > 0 && (
            <Text style={styles.countBadge}>{hocPhans.length}</Text>
          )}
        </View>

        {loadingHocPhan ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : hocPhans.length === 0 ? (
          <EmptyState
            icon="folder-open-outline"
            title={selectedMonThiId ? 'Không có học phần.' : 'Chọn môn thi.'}
            subtitle={!selectedMonThiId ? 'Chọn một môn thi ở trên để xem học phần' : undefined}
          />
        ) : (
          hocPhans.map((item) => {
            const subjectColor = selectedMonThiId ? getSubjectColor(selectedMonThiId) : colors.primary;
            return (
              <TouchableOpacity
                key={String(item.id)}
                style={styles.topicCard}
                onPress={() => navigation.navigate('TopicDetail', { id: item.id })}
                activeOpacity={0.7}
              >
                <View style={[styles.topicIcon, { backgroundColor: subjectColor + '18' }]}>
                  <Ionicons name="book-outline" size={iconSizes.lg} color={subjectColor} />
                </View>
                <View style={styles.topicContent}>
                  <Text style={styles.topicTitle}>{item.tenhocphan}</Text>
                  {item.socau && (
                    <View style={styles.topicMeta}>
                      <Ionicons name="document-text-outline" size={iconSizes.sm} color={colors.textMuted} />
                      <Text style={styles.topicMetaText}>{item.socau} câu hỏi</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.textMuted} />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  title: { fontSize: 17, fontWeight: '700', marginBottom: spacing.xs, color: colors.text },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.xs, flex: 1 },
  chipSectionLabel: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.xs },
  chipList: { paddingBottom: spacing.xs, gap: spacing.sm },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl },
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
  chipIcon: {
    marginRight: spacing.xs,
  },
  chipText: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  countBadge: {
    ...typography.caption,
    color: colors.primary,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  loader: { marginTop: spacing.md },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: 40,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.cardSm,
  },
  topicIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  topicContent: {
    flex: 1,
  },
  topicTitle: { ...typography.bodySmall, color: colors.text, fontWeight: '600', marginBottom: 2 },
  topicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topicMetaText: {
    ...typography.captionSmall,
    color: colors.textMuted,
  },
});

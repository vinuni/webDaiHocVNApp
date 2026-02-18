import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../api/client';
import EmptyState from '../components/EmptyState';
import { colors, spacing, borderRadius, typography, minTouchTargetSize, shadows, iconSizes } from '../theme';

export default function TopicsScreen({ navigation }) {
  const [monThis, setMonThis] = useState([]);
  const [hocPhans, setHocPhans] = useState([]);
  const [selectedMonThiId, setSelectedMonThiId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingHocPhan, setLoadingHocPhan] = useState(false);

  useEffect(() => {
    apiClient.get('/api/v1/home').then((res) => setMonThis(res && res.mon_this ? res.mon_this : [])).catch(() => setMonThis([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedMonThiId) { setHocPhans([]); return; }
    setLoadingHocPhan(true);
    apiClient.get('/api/v1/hoc-phan?mon_thi=' + selectedMonThiId).then((res) => setHocPhans(Array.isArray(res) ? res : [])).catch(() => setHocPhans([])).finally(() => setLoadingHocPhan(false));
  }, [selectedMonThiId]);

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
      <Text style={styles.title}>Học phần</Text>
      <Text style={styles.subtitle}>Chọn môn thi</Text>
      <FlatList
        horizontal
        data={monThis}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.chipList}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const subjectColor = getSubjectColor(item.id);
          const isSelected = item.id === selectedMonThiId;
          return (
            <TouchableOpacity
              style={[
                styles.chip,
                isSelected && { backgroundColor: subjectColor, borderColor: subjectColor }
              ]}
              onPress={() => setSelectedMonThiId(item.id === selectedMonThiId ? null : item.id)}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={getSubjectIcon(item.tenmonthi)} 
                size={iconSizes.md} 
                color={isSelected ? '#fff' : subjectColor} 
                style={styles.chipIcon}
              />
              <Text style={[styles.chipText, isSelected && { color: '#fff' }]}>
                {item.tenmonthi}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.listHeader}>
        <Text style={styles.subtitle}>Danh sách học phần</Text>
        {hocPhans.length > 0 && (
          <Text style={styles.countBadge}>{hocPhans.length}</Text>
        )}
      </View>

      {loadingHocPhan ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={hocPhans}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <EmptyState
              icon="folder-open-outline"
              title={selectedMonThiId ? 'Không có học phần.' : 'Chọn môn thi.'}
              subtitle={!selectedMonThiId ? 'Chọn một môn thi ở trên để xem học phần' : undefined}
            />
          }
          renderItem={({ item }) => {
            const subjectColor = selectedMonThiId ? getSubjectColor(selectedMonThiId) : colors.primary;
            return (
              <TouchableOpacity 
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
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  title: { ...typography.titleSmall, marginBottom: spacing.xs, color: colors.text },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm, flex: 1 },
  chipList: { paddingVertical: spacing.sm, gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
    justifyContent: 'center',
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
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
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
    padding: spacing.md,
    minHeight: minTouchTargetSize + 16,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.cardSm,
  },
  topicIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  topicContent: {
    flex: 1,
  },
  topicTitle: { ...typography.body, color: colors.text, fontWeight: '600', marginBottom: 4 },
  topicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topicMetaText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});

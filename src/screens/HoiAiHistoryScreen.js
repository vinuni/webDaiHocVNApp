import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { apiClient } from '../api/client';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

const PER_PAGE = 20;

export default function HoiAiHistoryScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const loadPage = useCallback(async (pageNum, append = false) => {
    try {
      const res = await apiClient.get(`/api/v1/ai-question/history?page=${pageNum}&per_page=${PER_PAGE}`);
      const list = res.data ?? [];
      const totalCount = res.total ?? 0;
      if (append) {
        setItems((prev) => [...prev, ...list]);
      } else {
        setItems(list);
      }
      setTotal(totalCount);
      setPage(pageNum);
    } catch {
      if (!append) setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadPage(1, false);
  }, [loadPage]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPage(1, false);
  };

  const onEndReached = () => {
    if (loadingMore || loading || items.length >= total) return;
    const nextPage = page + 1;
    if (items.length < total) {
      setLoadingMore(true);
      loadPage(nextPage, true);
    }
  };

  const renderItem = ({ item }) => {
    const isExpanded = expandedId === item.id;
    return (
      <TouchableOpacity
        style={[styles.card, shadows.cardSm]}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        activeOpacity={0.8}
      >
        <Text style={styles.date}>
          {item.created_at
            ? new Date(item.created_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
            : '—'}
        </Text>
        <Text style={styles.question} numberOfLines={isExpanded ? undefined : 2}>
          {item.question_text || '—'}
        </Text>
        <Text style={styles.response} numberOfLines={isExpanded ? undefined : 2}>
          {item.response_text || '—'}
        </Text>
        <View style={styles.meta}>
          {item.monthi_suggested ? (
            <View style={styles.chip}><Text style={styles.chipText}>{item.monthi_suggested}</Text></View>
          ) : null}
          {item.hocphan_suggested ? (
            <View style={styles.chip}><Text style={styles.chipText}>{item.hocphan_suggested}</Text></View>
          ) : null}
          {item.difficulty_level ? (
            <View style={styles.chip}><Text style={styles.chipText}>{item.difficulty_level}</Text></View>
          ) : null}
          {item.usefulness_score != null ? (
            <View style={styles.chip}><Text style={styles.chipText}>{item.usefulness_score}</Text></View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      ListEmptyComponent={
        <Text style={styles.empty}>Chưa có lịch sử hỏi đáp.</Text>
      }
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: spacing.md, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  date: { ...typography.caption, color: colors.textMuted, marginBottom: 4 },
  question: { ...typography.subtitle, color: colors.text, marginBottom: 4 },
  response: { ...typography.bodySmall, color: colors.textSecondary },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  chip: { backgroundColor: colors.background, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  chipText: { ...typography.caption, color: colors.textSecondary },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  footer: { padding: spacing.md, alignItems: 'center' },
});

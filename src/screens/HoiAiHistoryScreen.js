import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../api/client';
import MathText from '../components/MathText';
import { colors, spacing, borderRadius, typography, shadows, minTouchTargetSize } from '../theme';

const MINE_PER_PAGE = 3;
const ALL_PER_PAGE = 5;

function HistoryCard({ item, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.card, shadows.cardSm]}
      onPress={() => onPress(item.id)}
      activeOpacity={0.8}
    >
      {item.user_name ? (
        <Text style={styles.userName}>{item.user_name}</Text>
      ) : null}
      <Text style={styles.date}>
        {item.created_at
          ? new Date(item.created_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
          : '—'}
      </Text>
      <Text style={styles.question} numberOfLines={2}>
        {item.question_text || '—'}
      </Text>
      {(() => {
        if (!item.response_text) return <Text style={styles.response}>—</Text>;
        try {
          const htmlResponse = JSON.parse(item.response_text);
          return (
            <View style={styles.responseWrapper}>
              <MathText value={htmlResponse} containerStyle={styles.mathResponse} />
            </View>
          );
        } catch (e) {
          return (
            <Text style={styles.response} numberOfLines={2}>
              {String(item.response_text)}
            </Text>
          );
        }
      })()}
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
}

export default function HoiAiHistoryScreen({ navigation }) {
  const [mineItems, setMineItems] = useState([]);
  const [mineTotal, setMineTotal] = useState(0);
  const [minePage, setMinePage] = useState(1);
  const [mineLoading, setMineLoading] = useState(true);
  const [mineLoadingMore, setMineLoadingMore] = useState(false);

  const [allItems, setAllItems] = useState([]);
  const [allTotal, setAllTotal] = useState(0);
  const [allPage, setAllPage] = useState(1);
  const [allLoading, setAllLoading] = useState(true);
  const [allLoadingMore, setAllLoadingMore] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadMine = useCallback(async (pageNum, append = false) => {
    try {
      const res = await apiClient.get(
        `/api/v1/ai-question/history?scope=mine&page=${pageNum}&per_page=${MINE_PER_PAGE}`
      );
      const list = res.data ?? [];
      const total = res.total ?? 0;
      if (append) {
        setMineItems((prev) => [...prev, ...list]);
      } else {
        setMineItems(list);
      }
      setMineTotal(total);
      setMinePage(pageNum);
    } catch {
      if (!append) setMineItems([]);
    } finally {
      setMineLoading(false);
      setMineLoadingMore(false);
    }
  }, []);

  const loadAll = useCallback(async (pageNum, append = false) => {
    try {
      const res = await apiClient.get(
        `/api/v1/ai-question/history?scope=all&page=${pageNum}&per_page=${ALL_PER_PAGE}`
      );
      const list = res.data ?? [];
      const total = res.total ?? 0;
      if (append) {
        setAllItems((prev) => [...prev, ...list]);
      } else {
        setAllItems(list);
      }
      setAllTotal(total);
      setAllPage(pageNum);
    } catch {
      if (!append) setAllItems([]);
    } finally {
      setAllLoading(false);
      setAllLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setMineLoading(true);
    loadMine(1, false);
  }, [loadMine]);

  useEffect(() => {
    setAllLoading(true);
    loadAll(1, false);
  }, [loadAll]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([loadMine(1, false), loadAll(1, false)]).finally(() => setRefreshing(false));
  }, [loadMine, loadAll]);

  const loadMoreMine = useCallback(() => {
    if (mineLoadingMore || mineItems.length >= mineTotal) return;
    setMineLoadingMore(true);
    loadMine(minePage + 1, true);
  }, [mineLoadingMore, mineItems.length, mineTotal, minePage, loadMine]);

  const loadMoreAll = useCallback(() => {
    if (allLoadingMore || allItems.length >= allTotal) return;
    setAllLoadingMore(true);
    loadAll(allPage + 1, true);
  }, [allLoadingMore, allItems.length, allTotal, allPage, loadAll]);

  const openDetail = useCallback(async (id) => {
    setSelectedId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await apiClient.get(`/api/v1/ai-question/history/${id}`);
      setDetail(res);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedId(null);
    setDetail(null);
  }, []);

  const initialLoading = mineLoading && allLoading && mineItems.length === 0 && allItems.length === 0;

  if (initialLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        showsVerticalScrollIndicator={true}
      >
        {/* Lịch sử của tôi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch sử của tôi</Text>
          {mineLoading && mineItems.length === 0 ? (
            <View style={styles.sectionLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : mineItems.length === 0 ? (
            <Text style={styles.empty}>Chưa có lịch sử hỏi đáp của bạn.</Text>
          ) : (
            <>
              {mineItems.map((item) => (
                <HistoryCard key={item.id} item={item} onPress={openDetail} />
              ))}
              {mineItems.length < mineTotal && (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={loadMoreMine}
                  disabled={mineLoadingMore}
                  activeOpacity={0.8}
                >
                  {mineLoadingMore ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={styles.loadMoreText}>
                      Tải thêm ({mineItems.length}/{mineTotal})
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Lịch sử tất cả */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch sử tất cả người dùng</Text>
          {allLoading && allItems.length === 0 ? (
            <View style={styles.sectionLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : allItems.length === 0 ? (
            <Text style={styles.empty}>Chưa có lịch sử hỏi đáp.</Text>
          ) : (
            <>
              {allItems.map((item) => (
                <HistoryCard key={`all-${item.id}`} item={item} onPress={openDetail} />
              ))}
              {allItems.length < allTotal && (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={loadMoreAll}
                  disabled={allLoadingMore}
                  activeOpacity={0.8}
                >
                  {allLoadingMore ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={styles.loadMoreText}>
                      Tải thêm ({allItems.length}/{allTotal})
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={selectedId != null}
        transparent
        animationType="fade"
        onRequestClose={closeDetail}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeDetail}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết hỏi đáp</Text>
              <TouchableOpacity onPress={closeDetail} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {detailLoading ? (
              <View style={styles.detailLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : detail ? (
              <ScrollView
                style={styles.detailScroll}
                contentContainerStyle={styles.detailScrollContent}
                showsVerticalScrollIndicator={true}
              >
                {detail.user_name ? (
                  <Text style={styles.detailUserName}>{detail.user_name}</Text>
                ) : null}
                <Text style={styles.detailDate}>
                  {detail.created_at
                    ? new Date(detail.created_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
                    : '—'}
                </Text>
                <Text style={styles.detailQuestion}>{detail.question_text || '—'}</Text>
                {detail.photo_url ? (
                  <Image
                    source={{
                      uri: detail.photo_url.startsWith('http')
                        ? detail.photo_url
                        : `${apiClient.baseURL}${detail.photo_url.startsWith('/') ? '' : '/'}${detail.photo_url}`,
                    }}
                    style={styles.detailImage}
                    resizeMode="contain"
                  />
                ) : null}
                <Text style={styles.answerLabel}>Câu trả lời</Text>
                {detail.response_text ? (
                  (() => {
                    try {
                      const htmlResponse = JSON.parse(detail.response_text);
                      return (
                        <View style={styles.detailResponseWrapper}>
                          <MathText value={htmlResponse} containerStyle={styles.mathResponse} />
                        </View>
                      );
                    } catch (e) {
                      return <Text style={styles.detailResponse}>{String(detail.response_text)}</Text>;
                    }
                  })()
                ) : (
                  <Text style={styles.detailResponse}>—</Text>
                )}
                <View style={styles.meta}>
                  {detail.monthi_suggested ? (
                    <View style={styles.chip}><Text style={styles.chipText}>{detail.monthi_suggested}</Text></View>
                  ) : null}
                  {detail.hocphan_suggested ? (
                    <View style={styles.chip}><Text style={styles.chipText}>{detail.hocphan_suggested}</Text></View>
                  ) : null}
                  {detail.difficulty_level ? (
                    <View style={styles.chip}><Text style={styles.chipText}>{detail.difficulty_level}</Text></View>
                  ) : null}
                  {detail.usefulness_score != null ? (
                    <View style={styles.chip}><Text style={styles.chipText}>{detail.usefulness_score}</Text></View>
                  ) : null}
                </View>
              </ScrollView>
            ) : (
              <Text style={styles.detailError}>Không thể tải chi tiết.</Text>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: spacing.md, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  sectionLoader: { paddingVertical: spacing.md, alignItems: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: minTouchTargetSize,
  },
  userName: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  date: { ...typography.caption, color: colors.textMuted, marginBottom: 4 },
  question: { ...typography.subtitle, color: colors.text, marginBottom: 4 },
  response: { ...typography.bodySmall, color: colors.textSecondary },
  responseWrapper: { marginTop: 4 },
  mathResponse: { backgroundColor: 'transparent' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  chip: { backgroundColor: colors.background, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  chipText: { ...typography.caption, color: colors.textSecondary },
  empty: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.sm },
  loadMoreBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  loadMoreText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    maxWidth: '100%',
    maxHeight: '90%',
    width: '100%',
    overflow: 'hidden',
    ...shadows.cardSm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { ...typography.subtitle, color: colors.text, fontWeight: '600' },
  detailLoading: { padding: spacing.xl, alignItems: 'center' },
  detailScroll: { maxHeight: 400 },
  detailScrollContent: { padding: spacing.md, paddingBottom: spacing.xl },
  detailUserName: { ...typography.caption, color: colors.primary, fontWeight: '600', marginBottom: 2 },
  detailDate: { ...typography.caption, color: colors.textMuted, marginBottom: 4 },
  detailQuestion: { ...typography.subtitle, color: colors.text, marginBottom: spacing.sm },
  detailImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
  },
  answerLabel: { ...typography.caption, color: colors.textMuted, marginBottom: 4, fontWeight: '600' },
  detailResponseWrapper: { marginBottom: spacing.sm },
  detailResponse: { ...typography.bodySmall, color: colors.textSecondary },
  detailError: { ...typography.body, color: colors.danger, padding: spacing.md, textAlign: 'center' },
});

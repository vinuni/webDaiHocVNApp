import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { apiClient } from '../api/client';
import { colors, spacing, borderRadius, typography, shadows, minTouchTargetSize } from '../theme';

const PER_PAGE = 20;

export default function CommentsScreen({ route }) {
  const params = route?.params || {};
  const commentableType = params.commentableType || params.commentable_type;
  const commentableId = params.commentableId ?? params.commentable_id;
  const title = params.title || 'Bình luận';

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);

  const typeParam = commentableType === 'App\\Question' ? 'App\\Question' : 'App\\DeThi';

  const load = useCallback(async (pageNum = 1, append = false) => {
    if (!commentableType || commentableId == null) return;
    try {
      const res = await apiClient.get(
        `/api/v1/comments?commentable_type=${encodeURIComponent(typeParam)}&commentable_id=${commentableId}&page=${pageNum}&per_page=${PER_PAGE}`
      );
      const list = res.data || [];
      if (append) setItems((prev) => [...prev, ...list]);
      else setItems(list);
      setTotal(res.total ?? 0);
      setPage(pageNum);
    } catch {
      if (!append) setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [commentableType, commentableId, typeParam]);

  useEffect(() => {
    if (commentableType && commentableId != null) {
      setLoading(true);
      load(1, false);
    } else {
      setLoading(false);
    }
  }, [commentableType, commentableId, load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(1, false);
  };

  const onEndReached = () => {
    if (loadingMore || loading || items.length >= total) return;
    setLoadingMore(true);
    load(page + 1, true);
  };

  const submit = async () => {
    const text = (message || '').trim();
    if (!text || !commentableType || commentableId == null) return;
    setSubmitting(true);
    try {
      await apiClient.post('/api/v1/comments', {
        commentable_type: typeParam,
        commentable_id: Number(commentableId),
        message: text,
      });
      setMessage('');
      load(1, false);
    } catch (e) {
      // show error
    } finally {
      setSubmitting(false);
    }
  };

  const renderComment = ({ item }) => (
    <View style={[styles.card, shadows.cardSm]}>
      <View style={styles.commentHeader}>
        <Text style={styles.commenterName}>{item.commenter?.name || 'User'}</Text>
        <Text style={styles.commentDate}>
          {item.created_at ? new Date(item.created_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : ''}
        </Text>
      </View>
      <Text style={styles.commentText}>{item.comment}</Text>
      {Array.isArray(item.children) && item.children.length > 0 && (
        <View style={styles.children}>
          {item.children.map((ch) => (
            <View key={ch.id} style={styles.childCard}>
              <Text style={styles.commenterName}>{ch.commenter?.name || 'User'}</Text>
              <Text style={styles.commentText}>{ch.comment}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (!commentableType || commentableId == null) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Bình luận</Text>
          <Text style={styles.emptyText}>Vào đề thi hoặc câu hỏi và chọn "Bình luận" để xem và thêm bình luận.</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
      <FlatList
        data={items}
        renderItem={renderComment}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? (
            <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
          ) : (
            <Text style={styles.emptyList}>Chưa có bình luận. Hãy là người đầu tiên!</Text>
          )
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loadingMore ? <View style={styles.footer}><ActivityIndicator size="small" color={colors.primary} /></View> : null}
        ListHeaderComponent={
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Viết bình luận..."
              placeholderTextColor={colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={2000}
              editable={!submitting}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={submit} disabled={submitting || !message.trim()} activeOpacity={0.8}>
              {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.sendBtnText}>Gửi</Text>}
            </TouchableOpacity>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: spacing.md, paddingBottom: spacing.xl },
  centered: { padding: spacing.xl },
  emptyState: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  emptyTitle: { ...typography.titleSmall, color: colors.text, marginBottom: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSecondary },
  emptyList: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.md },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    ...typography.body,
    color: colors.text,
    minHeight: minTouchTargetSize,
    maxHeight: 120,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    minHeight: minTouchTargetSize,
  },
  sendBtnText: { color: '#fff', ...typography.subtitle },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: minTouchTargetSize,
  },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commenterName: { ...typography.subtitle, color: colors.text },
  commentDate: { ...typography.caption, color: colors.textMuted },
  commentText: { ...typography.body, color: colors.text },
  children: { marginTop: spacing.sm, marginLeft: spacing.md, borderLeftWidth: 2, borderLeftColor: colors.border, paddingLeft: spacing.sm },
  childCard: { marginBottom: spacing.xs },
  footer: { padding: spacing.md, alignItems: 'center' },
});

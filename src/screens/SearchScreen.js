import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { apiClient } from '../api/client';
import { colors, spacing, borderRadius, typography, shadows, minTouchTargetSize } from '../theme';

const PER_PAGE = 20;

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [monThis, setMonThis] = useState([]);
  const [history, setHistory] = useState([]);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [monThiId, setMonThiId] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const loadHomeAndHistory = useCallback(async () => {
    try {
      const [homeRes, historyRes] = await Promise.all([
        apiClient.get('/api/v1/home'),
        apiClient.get('/api/v1/search/history'),
      ]);
      setMonThis(homeRes?.mon_this ?? []);
      setHistory(historyRes?.data ?? []);
    } catch {
      setMonThis([]);
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    loadHomeAndHistory();
  }, [loadHomeAndHistory]);

  const runSearch = async (pageNum = 1, append = false, queryOverride = null) => {
    const q = ((queryOverride != null ? queryOverride : query) || '').trim();
    if (!q) return;
    setSearching(true);
    try {
      const params = new URLSearchParams({ q, per_page: String(PER_PAGE), page: String(pageNum) });
      if (monThiId) params.set('mon_thi', monThiId);
      if (difficulty) params.set('difficulty', difficulty);
      const res = await apiClient.get(`/api/v1/search?${params.toString()}`);
      const list = res.data ?? [];
      const totalCount = res.total ?? 0;
      if (append) {
        setResults((prev) => [...prev, ...list]);
      } else {
        setResults(list);
      }
      setTotal(totalCount);
      setPage(pageNum);
    } catch (e) {
      if (!append) setResults([]);
    } finally {
      setSearching(false);
      setRefreshing(false);
    }
  };

  const onSearch = () => {
    if (!query.trim()) return;
    setLoading(true);
    runSearch(1, false).finally(() => setLoading(false));
  };

  const onRefresh = () => {
    setRefreshing(true);
    runSearch(1, false);
  };

  const onHistoryPress = (item) => {
    const q = item.query || '';
    setQuery(q);
    setLoading(true);
    setResults([]);
    runSearch(1, false, q).finally(() => setLoading(false));
  };

  const onEndReached = () => {
    if (searching || loading || results.length >= total) return;
    if (results.length < total) runSearch(page + 1, true);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, shadows.cardSm]}>
      <Text style={styles.question} numberOfLines={4}>{item.cauhoi || '—'}</Text>
      {item.hoc_phan && <Text style={styles.meta}>Học phần: {item.hoc_phan.tenhocphan}</Text>}
      {item.do_kho && <Text style={styles.meta}>Độ khó: {item.do_kho}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Tìm câu hỏi..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={onSearch}
          returnKeyType="search"
          editable={!loading}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={onSearch} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.searchBtnText}>Tìm</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filtersContent}>
        <Text style={styles.filterLabel}>Môn:</Text>
        <TouchableOpacity style={[styles.chip, !monThiId && styles.chipActive]} onPress={() => setMonThiId('')}>
          <Text style={styles.chipText}>Tất cả</Text>
        </TouchableOpacity>
        {monThis.slice(0, 6).map((m) => (
          <TouchableOpacity key={m.id} style={[styles.chip, monThiId === String(m.id) && styles.chipActive]} onPress={() => setMonThiId(String(m.id))}>
            <Text style={styles.chipText} numberOfLines={1}>{m.tenmonthi}</Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.filterLabel}>Độ khó:</Text>
        {['', 'easy', 'medium', 'hard'].map((d) => (
          <TouchableOpacity key={d || 'all'} style={[styles.chip, difficulty === d && styles.chipActive]} onPress={() => setDifficulty(d)}>
            <Text style={styles.chipText}>{d || 'Tất cả'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {history.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch sử tìm kiếm</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyWrap}>
            {history.map((h) => (
              <TouchableOpacity key={h.id} style={styles.historyChip} onPress={() => onHistoryPress(h)}>
                <Text style={styles.historyChipText} numberOfLines={1}>{h.query}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            searching && results.length === 0 ? (
              <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
            ) : query.trim() && !searching ? (
              <Text style={styles.empty}>Nhập từ khóa và nhấn Tìm để tìm câu hỏi.</Text>
            ) : null
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={searching && results.length > 0 ? <View style={styles.footer}><ActivityIndicator size="small" color={colors.primary} /></View> : null}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  searchRow: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    minHeight: minTouchTargetSize,
  },
  searchBtnText: { color: '#fff', ...typography.subtitle },
  filters: { maxHeight: 44, marginBottom: spacing.sm },
  filtersContent: { paddingHorizontal: spacing.md, alignItems: 'center', gap: spacing.xs },
  filterLabel: { ...typography.caption, color: colors.textMuted, marginRight: spacing.xs },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: borderRadius.full, backgroundColor: colors.border, marginRight: spacing.xs },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...typography.caption, color: colors.text },
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  sectionTitle: { ...typography.caption, color: colors.textMuted, marginBottom: 4 },
  historyWrap: { flexDirection: 'row', gap: spacing.xs },
  historyChip: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: borderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  historyChipText: { ...typography.caption, color: colors.text },
  listContent: { padding: spacing.md, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: minTouchTargetSize,
  },
  question: { ...typography.body, color: colors.text },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  centered: { padding: spacing.xl },
  footer: { padding: spacing.md, alignItems: 'center' },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { colors, spacing, borderRadius, typography, minTouchTargetSize, gradients, shadows, iconSizes } from '../theme';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonThiId, setSelectedMonThiId] = useState(null);

  const userName = user?.user?.name || user?.name || 'Bạn';
  const firstName = userName.split(' ').pop();

  const load = async () => {
    try {
      const res = await apiClient.get('/api/v1/home');
      // Normalize: support both { mon_this, ... } and { data: { mon_this, ... } }
      const raw = res?.data ?? res;
      const normalized = {
        mon_this: Array.isArray(raw?.mon_this) ? raw.mon_this : [],
        study_materials_summary: Array.isArray(raw?.study_materials_summary) ? raw.study_materials_summary : [],
        leaderboard: Array.isArray(raw?.leaderboard) ? raw.leaderboard : [],
      };
      setData(normalized);
      setLoading(false);
    } catch (err) {
      setData({ mon_this: [], study_materials_summary: [], leaderboard: [] });
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading && !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const mon_this = data?.mon_this || [];
  const studyMaterialsSummary = data?.study_materials_summary || [];
  const leaderboard = data?.leaderboard || [];
  const selected = selectedMonThiId ? mon_this.find((m) => m.id === selectedMonThiId) : null;
  const de_this = selected?.de_this || [];

  const getSubjectEmoji = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('toán')) return '📐';
    if (lowerName.includes('vật') || lowerName.includes('lý')) return '⚛️';
    if (lowerName.includes('hóa')) return '⚗️';
    if (lowerName.includes('sinh')) return '🧬';
    if (lowerName.includes('văn')) return '📖';
    if (lowerName.includes('anh') || lowerName.includes('english')) return '🇬🇧';
    if (lowerName.includes('sử')) return '📜';
    return '📚';
  };

  const getSubjectColor = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('toán')) return colors.subjectMath;
    if (lowerName.includes('vật') || lowerName.includes('lý')) return colors.subjectPhysics;
    if (lowerName.includes('hóa')) return colors.subjectChemistry;
    if (lowerName.includes('sinh')) return colors.subjectBiology;
    if (lowerName.includes('văn')) return colors.subjectLiterature;
    if (lowerName.includes('anh') || lowerName.includes('english')) return colors.subjectEnglish;
    if (lowerName.includes('sử')) return colors.subjectHistory;
    return colors.primary;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Gradient Header Banner */}
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBanner}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Xin chào, {firstName}! 👋</Text>
            <Text style={styles.greetingSubtitle}>Sẵn sàng luyện tập hôm nay?</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={() => navigation.getParent()?.navigate('HoiAi')} 
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={iconSizes.md} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={() => navigation.getParent()?.navigate('Search')} 
              activeOpacity={0.8}
            >
              <Ionicons name="search" size={iconSizes.md} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Introduction Section */}
        <View style={styles.introCard}>
          <View style={styles.introHeader}>
            <Ionicons name="information-circle" size={iconSizes.lg} color={colors.primary} />
            <Text style={styles.introTitle}>Giới Thiệu</Text>
          </View>
          <Text style={styles.introText}>
            <Text style={styles.introBrand}>Thi Thử Online</Text> được thành lập để tạo ra một Thư Viện các Đề Thi Trung Học Phổ Thông (THPT) Quốc Gia. Các đề thi được tổng hợp và chọn lọc từ các đề thi chính thức, tham khảo của Bộ Giáo Dục, các Sở Giáo Dục và các Trường Chuyên trong cả nước.
          </Text>
          <Text style={styles.introText}>
            Hãy đăng ký thành viên và bắt đầu thi thử <Text style={styles.introHighlight}>hoàn toàn miễn phí</Text>. Bài làm sẽ được chấm điểm ngay và lưu trong Bảng Điểm của bạn.
          </Text>
          <Text style={styles.introText}>
            Tất cả các câu hỏi đều có <Text style={styles.introHighlight}>đáp án chi tiết</Text>. Bạn cũng có thể dùng <Text style={styles.introLink}>Hỏi AI</Text> ngay không cần đăng ký!
          </Text>
        </View>

        {/* Study Materials Summary */}
        {studyMaterialsSummary.length > 0 && (
          <View style={styles.studyMaterialsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="book" size={iconSizes.md} color={colors.success} />
                <Text style={styles.sectionTitle}>Tài Liệu Học Tập</Text>
              </View>
            </View>
            <View style={styles.studyMaterialsGrid}>
              {studyMaterialsSummary.map((sm) => (
                <TouchableOpacity
                  key={sm.mon_thi_id}
                  style={[styles.studyMaterialCard, { borderLeftColor: getSubjectColor(sm.tenmonthi) }]}
                  onPress={() => navigation.navigate('Topics', { screen: 'TopicsList', params: { monThiId: sm.mon_thi_id } })}
                  activeOpacity={0.8}
                >
                  <View style={styles.studyMaterialContent}>
                    <Text style={styles.studyMaterialTitle}>{sm.tenmonthi}</Text>
                    <Text style={styles.studyMaterialCount}>
                      <Ionicons name="book-outline" size={12} color={colors.textMuted} /> {sm.count} tài liệu
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={iconSizes.sm} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Leaderboard Widget */}
        {leaderboard.length > 0 && (
          <View style={styles.leaderboardSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="trophy" size={iconSizes.md} color={colors.warning} />
                <Text style={styles.sectionTitle}>Bảng Xếp Hạng</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Scoreboard')} activeOpacity={0.8}>
                <Text style={styles.seeAllLink}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.leaderboardCard}>
              {leaderboard.slice(0, 5).map((entry, idx) => {
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                return (
                  <View key={idx} style={[styles.leaderboardRow, idx > 0 && styles.leaderboardRowBorder]}>
                    <View style={styles.leaderboardLeft}>
                      {medal ? (
                        <Text style={styles.leaderboardMedal}>{medal}</Text>
                      ) : (
                        <Text style={styles.leaderboardRank}>{entry.rank}</Text>
                      )}
                      <Text style={styles.leaderboardName} numberOfLines={1}>{entry.name}</Text>
                    </View>
                    <View style={styles.leaderboardRight}>
                      <View style={styles.leaderboardScore}>
                        <Ionicons name="star" size={12} color={colors.warning} />
                        <Text style={styles.leaderboardScoreText}>{entry.total_points}</Text>
                      </View>
                      <Text style={styles.leaderboardLevel}>Cấp {entry.level}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Chọn môn thi - horizontal ScrollView so it renders reliably inside parent ScrollView */}
        <Text style={styles.sectionTitle}>Chọn môn thi</Text>
        <View style={styles.monListWrap}>
          <ScrollView
            horizontal
            contentContainerStyle={styles.monList}
            showsHorizontalScrollIndicator={false}
            scrollEnabled={mon_this.length > 0}
          >
            {mon_this.map((item) => (
              <TouchableOpacity
                key={String(item.id)}
                style={[styles.monChip, item.id === selectedMonThiId && styles.monChipActive]}
                onPress={() => setSelectedMonThiId(item.id === selectedMonThiId ? null : item.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.monEmoji}>{getSubjectEmoji(item.tenmonthi)}</Text>
                <Text style={[styles.monChipText, item.id === selectedMonThiId && styles.monChipTextActive]}>
                  {item.tenmonthi}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Danh sách đề thi</Text>
          {de_this.length > 0 && (
            <Text style={styles.countBadge}>{de_this.length} đề</Text>
          )}
        </View>

        {de_this.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Ionicons name="document-text-outline" size={iconSizes.xxl} color={colors.textMuted} />
            </View>
            <Text style={styles.empty}>
              {selectedMonThiId ? 'Không có đề thi nào.' : 'Chọn môn thi ở trên để xem đề.'}
            </Text>
          </View>
        ) : (
          de_this.map((item) => {
            const examColor = item.is_full ? colors.success : colors.primary;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.examCard}
                onPress={() => navigation.navigate('ExamTake', { deThiId: item.id, tendethi: item.tendethi })}
                activeOpacity={0.7}
              >
                <View style={[styles.examAccent, { backgroundColor: examColor }]} />
                <View style={styles.examContent}>
                  <View style={styles.examTitleRow}>
                    <Text style={styles.examTitle} numberOfLines={2}>{item.tendethi}</Text>
                    {item.is_new && (
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
                      <Text style={styles.metaText}>{item.cau_hois_count} câu</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="star" size={iconSizes.sm} color={colors.warning} />
                      <Text style={styles.metaText}>{(item.bestscore ?? 0).toFixed(1)}</Text>
                    </View>
                  </View>
                  <View style={styles.examTypeIndicator}>
                    <Text style={[styles.examTypeText, { color: examColor }]}>
                      {item.is_full ? '📝 Đề Full' : '⚡ Đề Nhanh'}
                    </Text>
                  </View>
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
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: colors.background 
  },
  headerBanner: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    ...typography.title,
    color: '#fff',
    marginBottom: spacing.xs,
  },
  greetingSubtitle: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.9)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.lg,
    paddingBottom: spacing.xl,
  },
  introCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  introTitle: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '700',
  },
  introText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.md,
    textAlign: 'justify',
  },
  introBrand: {
    color: colors.success,
    fontWeight: '700',
  },
  introHighlight: {
    color: colors.primary,
    fontWeight: '600',
  },
  introLink: {
    color: colors.info,
    fontWeight: '700',
  },
  studyMaterialsSection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  seeAllLink: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  studyMaterialsGrid: {
    gap: spacing.xs,
  },
  studyMaterialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  studyMaterialContent: {
    flex: 1,
  },
  studyMaterialTitle: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  studyMaterialCount: {
    ...typography.captionSmall,
    color: colors.textMuted,
  },
  leaderboardSection: {
    marginBottom: spacing.lg,
  },
  leaderboardCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  leaderboardRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  leaderboardMedal: {
    fontSize: 20,
    width: 28,
  },
  leaderboardRank: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    width: 28,
    textAlign: 'center',
  },
  leaderboardName: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  leaderboardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  leaderboardScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.warningTint,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  leaderboardScoreText: {
    ...typography.captionSmall,
    color: colors.warning,
    fontWeight: '700',
  },
  leaderboardLevel: {
    ...typography.captionSmall,
    color: colors.textSecondary,
  },
  sectionTitle: { 
    ...typography.subtitle, 
    color: colors.text, 
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  monListWrap: {
    height: 56,
    marginBottom: spacing.xs,
  },
  monList: { 
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  monChip: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md, 
    paddingVertical: spacing.sm, 
    backgroundColor: colors.surface, 
    borderRadius: borderRadius.full, 
    marginRight: spacing.sm, 
    borderWidth: 1.5, 
    borderColor: colors.border,
    minHeight: 40,
    ...shadows.cardSm,
  },
  monChipActive: { 
    backgroundColor: colors.primary, 
    borderColor: colors.primary 
  },
  monEmoji: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  monChipText: { 
    ...typography.bodySmall, 
    color: colors.text,
    fontWeight: '600',
  },
  monChipTextActive: { color: '#fff' },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  countBadge: {
    ...typography.caption,
    color: colors.primary,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    fontWeight: '600',
  },
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
    color: colors.textSecondary 
  },
  emptyWrap: { 
    padding: spacing.xxl, 
    alignItems: 'center' 
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  empty: { 
    ...typography.body, 
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

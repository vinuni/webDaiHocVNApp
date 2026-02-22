import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { colors, spacing, borderRadius, typography, minTouchTargetSize, gradients, shadows, iconSizes } from '../theme';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonThiId, setSelectedMonThiId] = useState(null);
  const [studyMaterialsExpanded, setStudyMaterialsExpanded] = useState(false);

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
      };
      setData(normalized);
      setLoading(false);
    } catch (err) {
      setData({ mon_this: [], study_materials_summary: [] });
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
    <View style={[styles.container, { paddingTop: 0, paddingBottom: insets.bottom }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Gradient Header Banner - scrolls away with content */}
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
                onPress={() => {
                  if (!isAuthenticated) {
                    Alert.alert(
                      'Yêu cầu đăng nhập',
                      'Bạn cần đăng nhập để sử dụng tính năng Hỏi AI.',
                      [
                        { text: 'Hủy', style: 'cancel' },
                        { 
                          text: 'Đăng nhập', 
                          onPress: () => navigation.navigate('Auth', { screen: 'Login' })
                        }
                      ]
                    );
                    return;
                  }
                  navigation.navigate('HoiAi');
                }} 
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

        {/* Introduction Section */}
        <View style={styles.introCard}>
          <View style={styles.introHeader}>
            <Ionicons name="information-circle" size={iconSizes.md} color={colors.primary} />
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

        {/* Study Materials Summary - foldable, collapsed by default */}
        {studyMaterialsSummary.length > 0 && (
          <View style={styles.studyMaterialsSection}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setStudyMaterialsExpanded((v) => !v)}
              activeOpacity={0.8}
            >
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="book" size={iconSizes.md} color={colors.success} />
                <Text style={styles.sectionTitle}>Tài Liệu Học Tập</Text>
              </View>
              <Ionicons
                name={studyMaterialsExpanded ? 'chevron-up' : 'chevron-down'}
                size={iconSizes.md}
                color={colors.textMuted}
              />
            </TouchableOpacity>
            {studyMaterialsExpanded && (
              <View style={styles.studyMaterialsGrid}>
                {studyMaterialsSummary.map((sm, idx) => (
                  <TouchableOpacity
                    key={`sm-${sm.mon_thi_id}-${idx}`}
                    style={[styles.studyMaterialCard, { borderLeftColor: getSubjectColor(sm.tenmonthi) }]}
                    onPress={() => {
                      if (!isAuthenticated) {
                        Alert.alert(
                          'Yêu cầu đăng nhập',
                          'Bạn cần đăng nhập để truy cập tài liệu học tập.',
                          [
                            { text: 'Hủy', style: 'cancel' },
                            { 
                              text: 'Đăng nhập', 
                              onPress: () => navigation.navigate('Auth', { screen: 'Login' })
                            }
                          ]
                        );
                        return;
                      }
                      navigation.navigate('Topics', { screen: 'TopicsList', params: { monThiId: sm.mon_thi_id } });
                    }}
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
            )}
          </View>
        )}

        {/* Chọn môn thi - horizontal ScrollView so it renders reliably inside parent ScrollView */}
        <Text style={styles.sectionTitle}>Chọn môn thi</Text>
        <View style={styles.monListWrap}>
          <ScrollView
            horizontal
            contentContainerStyle={styles.monList}
            showsHorizontalScrollIndicator={false}
            scrollEnabled={Boolean(mon_this && mon_this.length > 0)}
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
          de_this.map((item, index) => {
            const examColor = item.is_full ? colors.success : colors.primary;
            const attempted = item.user_attempted === true;
            const onPress = () => {
              if (!isAuthenticated) {
                Alert.alert(
                  'Yêu cầu đăng nhập',
                  'Bạn cần đăng nhập để làm bài thi. Đăng ký miễn phí ngay!',
                  [
                    { text: 'Hủy', style: 'cancel' },
                    { 
                      text: 'Đăng nhập', 
                      onPress: () => navigation.navigate('Auth', { screen: 'Login' })
                    }
                  ]
                );
                return;
              }
              if (attempted) {
                navigation.navigate('Result', {
                  deThiId: item.id,
                  tendethi: item.tendethi,
                  diem: item.user_diem,
                });
              } else {
                navigation.navigate('ExamTake', { deThiId: item.id, tendethi: item.tendethi });
              }
            };
            return (
              <TouchableOpacity
                key={`de-thi-${item.id}-${index}`}
                style={styles.examCard}
                onPress={onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.examAccent, { backgroundColor: examColor }]} />
                <View style={styles.examContent}>
                  <View style={styles.examTitleRow}>
                    <Text style={styles.examTitle} numberOfLines={2}>{item.tendethi}</Text>
                    {attempted && (
                      <View style={styles.attemptedBadge}>
                        <Ionicons name="checkmark-circle" size={10} color={colors.success} />
                        <Text style={styles.attemptedBadgeText}>Đã làm</Text>
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
                  <View style={styles.examTypeRow}>
                    <View style={[styles.examTypeChip, { backgroundColor: examColor + '18' }]}>
                      <Text style={[styles.examTypeText, { color: examColor }]}>
                        {item.is_full ? '📝 Đề Full' : '⚡ Đề Nhanh'}
                      </Text>
                    </View>
                    {item.is_new && !attempted && (
                      <View style={styles.newChip}>
                        <Text style={styles.newChipText}>MỚI</Text>
                      </View>
                    )}
                    {attempted && (
                      <View style={styles.daLamChip}>
                        <Text style={styles.daLamChipText}>Đã làm</Text>
                      </View>
                    )}
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
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
    fontSize: 18,
    color: '#fff',
    marginBottom: spacing.xs,
  },
  greetingSubtitle: {
    ...typography.bodySmall,
    fontSize: 12,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  introCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.cardSm,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  introTitle: {
    ...typography.body,
    fontSize: 15,
    color: colors.text,
    fontWeight: '700',
  },
  introText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
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
  examTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  examTypeChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  examTypeText: {
    ...typography.captionSmall,
    fontWeight: '600',
  },
  newChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.warningTint,
  },
  newChipText: {
    ...typography.captionSmall,
    fontWeight: '700',
    fontSize: 10,
    color: colors.warning,
  },
  daLamChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.successTint,
  },
  daLamChipText: {
    ...typography.captionSmall,
    fontWeight: '700',
    fontSize: 10,
    color: colors.success,
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

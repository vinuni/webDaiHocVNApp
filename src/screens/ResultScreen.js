import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../api/client';
import MathText from '../components/MathText';
import ProgressRing from '../components/ProgressRing';
import IconButton from '../components/IconButton';
import { colors, spacing, borderRadius, typography, minTouchTargetSize, gradients, shadows, iconSizes, screenPaddingHorizontal } from '../theme';

export default function ResultScreen({ route, navigation }) {
  const { deThiId, tendethi, diem, correct, total, thoigian: paramThoigian } = route.params || {};
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [fontSizeLevel, setFontSizeLevel] = useState(1);
  const [loadedAnswers, setLoadedAnswers] = useState({});
  const [loadingAnswers, setLoadingAnswers] = useState({});
  const contentFontSize = 16 + fontSizeLevel * 2;

  useEffect(() => {
    let m = true;
    apiClient.get('/api/v1/ket-qua/' + deThiId).then((res) => { if (m) setDetail(res); }).catch(() => { if (m) setDetail(null); }).finally(() => { if (m) setLoading(false); });
    return () => { m = false; };
  }, [deThiId]);

  const fetchAnswer = async (questionId) => {
    if (loadedAnswers[questionId] || loadingAnswers[questionId]) return;
    
    setLoadingAnswers(prev => ({ ...prev, [questionId]: true }));
    try {
      const res = await apiClient.get(`/api/v1/ket-qua/${deThiId}/answers/${questionId}`);
      setLoadedAnswers(prev => ({ ...prev, [questionId]: res }));
    } catch (e) {
      Alert.alert('Lỗi', 'Không tải được lời giải');
    } finally {
      setLoadingAnswers(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const toggleQuestion = useCallback((questionId) => {
    const wasExpanded = expandedQuestions[questionId];
    setExpandedQuestions(prev => ({ ...prev, [questionId]: !prev[questionId] }));
    
    if (!wasExpanded) {
      const bailam = bailams.find(b => b.question_id === questionId);
      if (bailam?.has_short_answer || bailam?.has_detailed_answer) {
        fetchAnswer(questionId);
      }
    }
  }, [expandedQuestions, deThiId]);

  const d = diem != null ? diem : (detail && detail.diem);
  const c = correct != null ? correct : (detail && detail.correct);
  const t = total != null ? total : (detail && detail.total);
  const totalSeconds = detail?.thoigian ?? paramThoigian ?? 0;
  const totalMinutes = totalSeconds > 0 ? (totalSeconds / 60).toFixed(1) : null;

  const score = d != null ? Number(d) : 0;
  const isPassed = score >= 5;
  const scorePercent = (score / 10) * 100;

  const bailams = detail?.bailams || [];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Compact header */}
        <LinearGradient
          colors={isPassed ? gradients.success : gradients.warm}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.resultIcon}>
            <Ionicons
              name={isPassed ? "checkmark-circle" : "close-circle"}
              size={iconSizes.xl}
              color="#fff"
            />
          </View>
          <Text style={styles.headerTitle}>
            {isPassed ? 'Chúc mừng!' : 'Cố gắng hơn!'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isPassed ? 'Bạn đã hoàn thành xuất sắc' : 'Hãy thử lại để cải thiện điểm số'}
          </Text>
        </LinearGradient>

        {/* Score Card - modern gradient border effect */}
        <View style={[styles.scoreCard, isPassed ? styles.scoreCardPass : styles.scoreCardFail]}>
          <Text style={styles.examTitle} numberOfLines={2}>{tendethi || 'Kết quả'}</Text>
          
          {loading && d == null ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <>
              <View style={styles.scoreCircleWrap}>
                <ProgressRing
                  progress={scorePercent}
                  size={150}
                  strokeWidth={12}
                  color={isPassed ? colors.success : colors.warning}
                  backgroundColor={isPassed ? colors.successTint : colors.warningTint}
                  showPercentage={false}
                  hideCenterText
                />
                <View style={styles.scoreCircleCenter}>
                  <Text style={[styles.scoreValue, { color: isPassed ? colors.success : colors.warning }]}>
                    {score.toFixed(1)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.statsRow}>
                <View style={[styles.statBox, styles.statBoxCorrect]}>
                  <View style={[styles.statIcon, { backgroundColor: colors.successTint }]}>
                    <Ionicons name="checkmark-circle" size={iconSizes.lg} color={colors.success} />
                  </View>
                  <Text style={[styles.statValue, { color: colors.success }]}>{c ?? '–'}</Text>
                  <Text style={styles.statLabel}>Đúng</Text>
                </View>
                <View style={[styles.statBox, styles.statBoxWrong]}>
                  <View style={[styles.statIcon, { backgroundColor: colors.dangerTint }]}>
                    <Ionicons name="close-circle" size={iconSizes.lg} color={colors.danger} />
                  </View>
                  <Text style={[styles.statValue, { color: colors.danger }]}>{t && c != null ? t - c : '–'}</Text>
                  <Text style={styles.statLabel}>Sai</Text>
                </View>
                <View style={[styles.statBox, styles.statBoxTotal]}>
                  <View style={[styles.statIcon, { backgroundColor: colors.infoTint }]}>
                    <Ionicons name="document-text" size={iconSizes.lg} color={colors.info} />
                  </View>
                  <Text style={[styles.statValue, { color: colors.info }]}>{t ?? '–'}</Text>
                  <Text style={styles.statLabel}>Tổng</Text>
                </View>
                {totalMinutes != null && (
                  <View style={[styles.statBox, styles.statBoxTime]}>
                    <View style={[styles.statIcon, { backgroundColor: colors.warningTint }]}>
                      <Ionicons name="time" size={iconSizes.lg} color={colors.warning} />
                    </View>
                    <Text style={[styles.statValue, { color: colors.warning }]}>{totalMinutes}</Text>
                    <Text style={styles.statLabel}>phút</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        {/* Question Results */}
        {!loading && bailams.length > 0 && (
          <View style={styles.questionsSection}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Chi tiết từng câu</Text>
              <View style={styles.fontSizeControls}>
                <TouchableOpacity
                  style={[styles.fontSizeBtn, fontSizeLevel <= 0 && styles.fontSizeBtnDisabled]}
                  onPress={() => setFontSizeLevel((l) => (l <= 0 ? 0 : l - 1))}
                  disabled={fontSizeLevel <= 0}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={iconSizes.md} color={fontSizeLevel <= 0 ? colors.textMuted : colors.primary} />
                </TouchableOpacity>
                <Text style={styles.fontSizeLabel}>A</Text>
                <TouchableOpacity
                  style={[styles.fontSizeBtn, fontSizeLevel >= 3 && styles.fontSizeBtnDisabled]}
                  onPress={() => setFontSizeLevel((l) => (l >= 3 ? 3 : l + 1))}
                  disabled={fontSizeLevel >= 3}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={iconSizes.md} color={fontSizeLevel >= 3 ? colors.textMuted : colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            {bailams.map((b, idx) => {
              const isCorrect = b.dung === true;
              const isExpanded = expandedQuestions[b.question_id];
              const choices = ['A', 'B', 'C', 'D', 'E'];
              
              return (
                <View key={b.question_id || idx} style={styles.questionResult}>
                  <TouchableOpacity 
                    style={styles.questionResultHeader}
                    onPress={() => toggleQuestion(b.question_id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.questionResultLeft}>
                      <View style={[styles.questionResultBadge, isCorrect ? styles.badgeCorrect : styles.badgeWrong]}>
                        <Text style={styles.questionResultNumber}>{idx + 1}</Text>
                      </View>
                      <View style={styles.questionResultStatus}>
                        <Ionicons 
                          name={isCorrect ? "checkmark-circle" : "close-circle"} 
                          size={18} 
                          color={isCorrect ? colors.success : colors.danger} 
                        />
                        <Text style={[styles.questionResultStatusText, { color: isCorrect ? colors.success : colors.danger }]}>
                          {isCorrect ? 'Đúng' : 'Sai'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.answersRowCompact}>
                      {b.thoigian > 0 && (
                        <View style={styles.answerItem}>
                          <Text style={styles.answerLabelCompact}>Thời gian:</Text>
                          <View style={styles.answerBadge}>
                            <Text style={styles.answerText}>{b.thoigian}s</Text>
                          </View>
                        </View>
                      )}
                      {b.traloi && (
                        <View style={styles.answerItem}>
                          <Text style={styles.answerLabelCompact}>Bạn:</Text>
                          <View style={[styles.answerBadge, !isCorrect && styles.answerBadgeWrong]}>
                            <Text style={[styles.answerText, !isCorrect && styles.answerTextWrong]}>
                              {b.traloi}
                            </Text>
                          </View>
                        </View>
                      )}
                      {b.dapan_dung && (
                        <View style={styles.answerItem}>
                          <Text style={styles.answerLabelCompact}>Đúng:</Text>
                          <View style={[styles.answerBadge, styles.answerBadgeCorrect]}>
                            <Text style={[styles.answerText, styles.answerTextCorrect]}>
                              {b.dapan_dung}
                            </Text>
                          </View>
                        </View>
                      )}
                      <Ionicons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={18} 
                        color={colors.textMuted} 
                      />
                    </View>
                  </TouchableOpacity>
                  
                  {isExpanded && (
                    <View style={styles.questionResultContent}>
                      {b.image && (
                        <Image
                          source={{ uri: b.image }}
                          style={styles.questionImage}
                          resizeMode="contain"
                        />
                      )}
                      {b.cauhoi && (
                        <View style={styles.questionTextWrap}>
                          <MathText value={b.cauhoi} contentFontSize={contentFontSize} />
                        </View>
                      )}
                      <View style={styles.optionsWrap}>
                        {choices.map((c) => {
                          const opt = b['dapan' + c];
                          if (!opt) return null;
                          const isUserChoice = b.traloi === c;
                          const isCorrectChoice = b.dapan_dung === c;
                          return (
                            <View
                              key={c}
                              style={[
                                styles.optionResult,
                                isCorrectChoice && styles.optionResultCorrect,
                                isUserChoice && !isCorrectChoice && styles.optionResultWrong,
                              ]}
                            >
                              <View style={[
                                styles.optionResultBadge,
                                isCorrectChoice && styles.optionResultBadgeCorrect,
                                isUserChoice && !isCorrectChoice && styles.optionResultBadgeWrong,
                              ]}>
                                <Text style={[
                                  styles.optionResultLetter,
                                  (isCorrectChoice || (isUserChoice && !isCorrectChoice)) && styles.optionResultLetterActive,
                                ]}>
                                  {c}
                                </Text>
                              </View>
                              <View style={styles.optionResultContent}>
                                <MathText value={opt} contentFontSize={contentFontSize} />
                              </View>
                              {isCorrectChoice && (
                                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                              )}
                              {isUserChoice && !isCorrectChoice && (
                                <Ionicons name="close-circle" size={16} color={colors.danger} />
                              )}
                            </View>
                          );
                        })}
                      </View>
                      
                      {/* Lazy-loaded answer explanations */}
                      {(b.has_short_answer || b.has_detailed_answer) && (
                        <View style={styles.answersSection}>
                          {loadingAnswers[b.question_id] ? (
                            <View style={styles.answerLoading}>
                              <ActivityIndicator size="small" color={colors.primary} />
                              <Text style={styles.answerLoadingText}>Đang tải lời giải...</Text>
                            </View>
                          ) : loadedAnswers[b.question_id] ? (
                            <>
                              {loadedAnswers[b.question_id].short_answer && (
                                <View style={styles.answerBox}>
                                  <View style={styles.answerHeader}>
                                    <Ionicons name="information-circle" size={iconSizes.md} color={colors.info} />
                                    <Text style={styles.answerTitle}>Lời giải ngắn</Text>
                                  </View>
                                  <MathText value={loadedAnswers[b.question_id].short_answer} contentFontSize={contentFontSize} />
                                </View>
                              )}
                              {loadedAnswers[b.question_id].detailed_answer && (
                                <View style={styles.answerBox}>
                                  <View style={styles.answerHeader}>
                                    <Ionicons name="book" size={iconSizes.md} color={colors.success} />
                                    <Text style={styles.answerTitle}>Lời giải chi tiết</Text>
                                  </View>
                                  <MathText value={loadedAnswers[b.question_id].detailed_answer} contentFontSize={contentFontSize} />
                                </View>
                              )}
                            </>
                          ) : (
                            <TouchableOpacity 
                              style={styles.loadAnswerBtn}
                              onPress={() => fetchAnswer(b.question_id)}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="eye" size={iconSizes.md} color={colors.primary} />
                              <Text style={styles.loadAnswerBtnText}>Xem lời giải</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {deThiId != null && (
            <IconButton
              icon="chatbubble-outline"
              label="Bình luận đề thi"
              variant="outline"
              size="large"
              onPress={() => navigation.navigate('Comments', { commentableType: 'App\\DeThi', commentableId: deThiId, title: tendethi })}
              style={styles.actionButton}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: screenPaddingHorizontal,
    alignItems: 'center',
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  resultIcon: {
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  scoreCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginHorizontal: screenPaddingHorizontal,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    ...shadows.cardLg,
  },
  scoreCardPass: {
    borderColor: colors.success,
    backgroundColor: colors.surface,
  },
  scoreCardFail: {
    borderColor: colors.warning,
    backgroundColor: colors.surface,
  },
  examTitle: { 
    ...typography.subtitle, 
    marginBottom: spacing.lg, 
    color: colors.text,
    textAlign: 'center',
    fontWeight: '700',
  },
  loader: { marginVertical: spacing.xl },
  scoreCircleWrap: {
    position: 'relative',
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  scoreCircleCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  scoreValue: { 
    fontSize: 48,
    fontWeight: '800',
    marginBottom: spacing.xxs,
  },
  scoreLabel: { 
    ...typography.body, 
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    width: '100%',
    justifyContent: 'center',
  },
  statBox: {
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statBoxCorrect: {
    backgroundColor: colors.successTint,
    borderColor: colors.success + '40',
  },
  statBoxWrong: {
    backgroundColor: colors.dangerTint,
    borderColor: colors.danger + '40',
  },
  statBoxTotal: {
    backgroundColor: colors.infoTint,
    borderColor: colors.info + '40',
  },
  statBoxTime: {
    backgroundColor: colors.warningTint,
    borderColor: colors.warning + '40',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  questionsSection: {
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '700',
    fontSize: 17,
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fontSizeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fontSizeBtnDisabled: { opacity: 0.5 },
  fontSizeLabel: { fontSize: 12, color: colors.textMuted, marginHorizontal: 2 },
  questionResult: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    overflow: 'hidden',
    ...shadows.cardSm,
  },
  questionResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  questionResultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  questionResultBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCorrect: {
    backgroundColor: colors.success,
  },
  badgeWrong: {
    backgroundColor: colors.danger,
  },
  questionResultNumber: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '700',
  },
  questionResultStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  questionResultStatusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  answersRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  answerLabelCompact: {
    ...typography.captionSmall,
    color: colors.textSecondary,
  },
  questionResultContent: {
    paddingHorizontal: screenPaddingHorizontal,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  questionImage: {
    width: '100%',
    height: 180,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.backgroundDark,
  },
  questionTextWrap: {
    marginBottom: spacing.md,
  },
  optionsWrap: {
    gap: 4,
  },
  optionResult: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  optionResultCorrect: {
    backgroundColor: colors.successTint,
    borderColor: colors.success,
  },
  optionResultWrong: {
    backgroundColor: colors.dangerTint,
    borderColor: colors.danger,
  },
  optionResultBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  optionResultBadgeCorrect: {
    backgroundColor: colors.success,
  },
  optionResultBadgeWrong: {
    backgroundColor: colors.danger,
  },
  optionResultLetter: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '700',
  },
  optionResultLetterActive: {
    color: '#fff',
  },
  optionResultContent: {
    flex: 1,
  },
  answersRow: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  answerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  answerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  answerBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.backgroundDark,
    minWidth: 28,
    alignItems: 'center',
  },
  answerBadgeCorrect: {
    backgroundColor: colors.successTint,
  },
  answerBadgeWrong: {
    backgroundColor: colors.dangerTint,
  },
  answerText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text,
  },
  answerTextCorrect: {
    color: colors.success,
  },
  answerTextWrong: {
    color: colors.danger,
  },
  actions: {
    padding: spacing.lg,
    paddingTop: 0,
    gap: spacing.md,
  },
  actionButton: {
    width: '100%',
  },
  answersSection: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  answerLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  answerLoadingText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  answerBox: {
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  answerTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text,
  },
  loadAnswerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: screenPaddingHorizontal,
    backgroundColor: colors.primaryTint,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    gap: spacing.sm,
    ...shadows.cardSm,
  },
  loadAnswerBtnText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
  },
});

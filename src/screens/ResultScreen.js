import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../api/client';
import MathText from '../components/MathText';
import ProgressRing from '../components/ProgressRing';
import IconButton from '../components/IconButton';
import { colors, spacing, borderRadius, typography, minTouchTargetSize, gradients, shadows, iconSizes } from '../theme';

export default function ResultScreen({ route, navigation }) {
  const { deThiId, tendethi, diem, correct, total } = route.params || {};
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState({});

  useEffect(() => {
    let m = true;
    apiClient.get('/api/v1/ket-qua/' + deThiId).then((res) => { if (m) setDetail(res); }).catch(() => { if (m) setDetail(null); }).finally(() => { if (m) setLoading(false); });
    return () => { m = false; };
  }, [deThiId]);

  const toggleQuestion = useCallback((questionId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  }, []);

  const d = diem != null ? diem : (detail && detail.diem);
  const c = correct != null ? correct : (detail && detail.correct);
  const t = total != null ? total : (detail && detail.total);

  const score = d != null ? Number(d) : 0;
  const isPassed = score >= 5;
  const scorePercent = (score / 10) * 100;

  const bailams = detail?.bailams || [];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={isPassed ? gradients.success : gradients.warm}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.resultIcon}>
            <Ionicons 
              name={isPassed ? "checkmark-circle" : "close-circle"} 
              size={iconSizes.xxl} 
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

        {/* Score Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.examTitle} numberOfLines={2}>{tendethi || 'Kết quả'}</Text>
          
          {loading && d == null ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <>
              <ProgressRing
                progress={scorePercent}
                size={140}
                strokeWidth={10}
                color={isPassed ? colors.success : colors.warning}
                showPercentage={false}
              />
              <Text style={[styles.scoreValue, { color: isPassed ? colors.success : colors.warning }]}>
                {score.toFixed(1)}
              </Text>
              <Text style={styles.scoreLabel}>điểm</Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <View style={[styles.statIcon, { backgroundColor: colors.successTint }]}>
                    <Ionicons name="checkmark" size={iconSizes.md} color={colors.success} />
                  </View>
                  <Text style={styles.statValue}>{c ?? '–'}</Text>
                  <Text style={styles.statLabel}>Đúng</Text>
                </View>
                <View style={styles.statBox}>
                  <View style={[styles.statIcon, { backgroundColor: colors.dangerTint }]}>
                    <Ionicons name="close" size={iconSizes.md} color={colors.danger} />
                  </View>
                  <Text style={styles.statValue}>{t && c != null ? t - c : '–'}</Text>
                  <Text style={styles.statLabel}>Sai</Text>
                </View>
                <View style={styles.statBox}>
                  <View style={[styles.statIcon, { backgroundColor: colors.infoTint }]}>
                    <Ionicons name="document-text" size={iconSizes.md} color={colors.info} />
                  </View>
                  <Text style={styles.statValue}>{t ?? '–'}</Text>
                  <Text style={styles.statLabel}>Tổng</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Question Results */}
        {!loading && bailams.length > 0 && (
          <View style={styles.questionsSection}>
            <Text style={styles.sectionTitle}>Chi tiết từng câu</Text>
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
                          <MathText value={b.cauhoi} />
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
                                <MathText value={opt} />
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
    paddingTop: spacing.xxl + 40,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  resultIcon: {
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.title,
    color: '#fff',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
  },
  scoreCard: { 
    backgroundColor: colors.surface, 
    borderRadius: borderRadius.xl, 
    padding: spacing.xl, 
    alignItems: 'center', 
    marginHorizontal: spacing.lg,
    marginTop: -spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1, 
    borderColor: colors.border,
    ...shadows.cardLg,
  },
  examTitle: { 
    ...typography.subtitle, 
    marginBottom: spacing.lg, 
    color: colors.text,
    textAlign: 'center',
  },
  loader: { marginVertical: spacing.xl },
  scoreValue: { 
    fontSize: 48,
    fontWeight: '800',
    marginTop: -spacing.xxl - spacing.md,
    marginBottom: spacing.xxs,
  },
  scoreLabel: { 
    ...typography.body, 
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    width: '100%',
    justifyContent: 'center',
  },
  statBox: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  questionsSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  questionResult: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
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
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  questionImage: {
    width: '100%',
    height: 180,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.backgroundDark,
  },
  questionTextWrap: {
    marginBottom: spacing.sm,
  },
  optionsWrap: {
    gap: 4,
  },
  optionResult: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
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
    fontSize: 11,
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
});

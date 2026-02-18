import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiClient } from '../api/client';
import MathText from '../components/MathText';
import { colors, spacing, borderRadius, typography, shadows, minTouchTargetSize, gradients, iconSizes } from '../theme';

export default function ExamTakeScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { deThiId, tendethi } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deThi, setDeThi] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [minutesLeft, setMinutesLeft] = useState(0);
  const [timerReady, setTimerReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get(`/api/v1/de-thi/${deThiId}/lam-bai`);
        if (mounted) {
          setDeThi(res.de_thi);
          setQuestions(res.questions || []);
          setMinutesLeft(res.de_thi?.thoigian || 60);
          setTimerReady(true);
        }
      } catch (e) {
        if (mounted) Alert.alert('Lỗi', e?.message || 'Không tải được đề thi.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [deThiId]);

  useEffect(() => {
    if (!timerReady || minutesLeft <= 0) return;
    const t = setInterval(() => setMinutesLeft((m) => (m <= 0 ? 0 : m - 1)), 60000);
    return () => clearInterval(t);
  }, [timerReady]);

  const setAnswer = (questionId, choice) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choice }));
  };

  const handleSubmit = async () => {
    const payload = questions.map((q) => ({ question_id: q.id, answer: answers[q.id] || '', duration_seconds: 0 }));
    setSubmitting(true);
    try {
      const res = await apiClient.post(`/api/v1/de-thi/${deThiId}/nop-bai`, { answers: payload });
      navigation.replace('Result', { deThiId, tendethi, ...res });
    } catch (e) {
      Alert.alert('Lỗi', e?.message || 'Nộp bài thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(currentQuestionIndex - 1);
  };

  const goToNext = () => {
    if (currentQuestionIndex < questions.length - 1) setCurrentQuestionIndex(currentQuestionIndex + 1);
  };

  if (loading) return (<View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>);
  if (!questions.length) return (<View style={styles.centered}><Text style={styles.emptyText}>Không có câu hỏi.</Text></View>);

  const choices = ['A', 'B', 'C', 'D', 'E'];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / questions.length) * 100;
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Progress Header */}
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.questionProgress}>{answeredCount}/{questions.length}</Text>
            <Text style={styles.progressLabel}>câu</Text>
          </View>
          <View style={styles.timerBadge}>
            <Ionicons name="time" size={iconSizes.sm} color="#fff" />
            <Text style={styles.timer}>{minutesLeft}′</Text>
          </View>
        </View>
        <View style={styles.progressBarWrap}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.examTitle} numberOfLines={1}>{tendethi || deThi?.tendethi}</Text>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.questionBlock}>
          <View style={styles.questionHeader}>
            <View style={[styles.questionNumber, answers[currentQuestion.id] != null && styles.questionNumberAnswered]}>
              <Text style={styles.questionNumberText}>{currentQuestionIndex + 1}</Text>
            </View>
            <Text style={styles.qLabel}>Câu {currentQuestionIndex + 1}</Text>
          </View>
          {currentQuestion.image && (
            <Image
              source={{ uri: currentQuestion.image }}
              style={styles.questionImage}
              resizeMode="contain"
            />
          )}
          <MathText value={currentQuestion.cauhoi} containerStyle={styles.mathQuestion} />
          <View style={styles.optionsWrap}>
            {choices.map((c) => {
              const opt = currentQuestion['dapan' + c];
              if (!opt) return null;
              const selected = answers[currentQuestion.id] === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => setAnswer(currentQuestion.id, c)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionBadge, selected && styles.optionBadgeSelected]}>
                    <Text style={[styles.optionLetter, selected && styles.optionLetterSelected]}>{c}</Text>
                  </View>
                  <View style={styles.optionContent}>
                    <MathText value={opt} containerStyle={selected ? styles.optionMathSelected : undefined} />
                  </View>
                  {selected && (
                    <View style={styles.checkIconWrap}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Question Navigation */}
        <View style={styles.navButtons}>
          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnPrev, currentQuestionIndex === 0 && styles.navBtnDisabled]}
            onPress={goToPrevious}
            disabled={currentQuestionIndex === 0}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={iconSizes.md} color={currentQuestionIndex === 0 ? colors.textMuted : colors.primary} />
            <Text style={[styles.navBtnText, currentQuestionIndex === 0 && styles.navBtnTextDisabled]}>Câu trước</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnNext, currentQuestionIndex === questions.length - 1 && styles.navBtnDisabled]}
            onPress={goToNext}
            disabled={currentQuestionIndex === questions.length - 1}
            activeOpacity={0.7}
          >
            <Text style={[styles.navBtnText, currentQuestionIndex === questions.length - 1 && styles.navBtnTextDisabled]}>Câu sau</Text>
            <Ionicons name="chevron-forward" size={iconSizes.md} color={currentQuestionIndex === questions.length - 1 ? colors.textMuted : colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Question Grid */}
        <View style={styles.questionGrid}>
          <Text style={styles.gridTitle}>Tất cả câu hỏi</Text>
          <View style={styles.gridWrap}>
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] != null;
              const isCurrent = idx === currentQuestionIndex;
              return (
                <TouchableOpacity
                  key={q.id}
                  style={[
                    styles.gridItem,
                    isAnswered && styles.gridItemAnswered,
                    isCurrent && styles.gridItemCurrent,
                  ]}
                  onPress={() => setCurrentQuestionIndex(idx)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.gridItemText,
                    isAnswered && styles.gridItemTextAnswered,
                    isCurrent && styles.gridItemTextCurrent,
                  ]}>
                    {idx + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={iconSizes.md} color="#fff" style={styles.submitIcon} />
              <Text style={styles.submitBtnText}>Nộp bài ({answeredCount}/{questions.length})</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  emptyText: { ...typography.body, color: colors.textSecondary },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  questionProgress: {
    ...typography.title,
    color: '#fff',
    fontWeight: '700',
  },
  progressLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.9)',
  },
  timerBadge: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: spacing.md, 
    paddingVertical: spacing.xs, 
    borderRadius: borderRadius.full,
    gap: 4,
  },
  timer: { ...typography.body, color: '#fff', fontWeight: '700' },
  progressBarWrap: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: borderRadius.full,
  },
  examTitle: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.95)',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  questionBlock: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  questionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionNumberAnswered: {
    backgroundColor: colors.success,
  },
  questionNumberText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '700',
  },
  qLabel: { ...typography.bodySmall, color: colors.primary, fontWeight: '700' },
  questionImage: {
    width: '100%',
    height: 200,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.backgroundDark,
  },
  mathQuestion: { marginBottom: spacing.sm },
  optionsWrap: {
    gap: 2,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.cardSm,
  },
  optionSelected: { 
    backgroundColor: colors.primaryTint, 
    borderColor: colors.primary,
    ...shadows.card,
  },
  optionBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  optionBadgeSelected: {
    backgroundColor: colors.primary,
  },
  optionLetter: { 
    fontSize: 11,
    color: colors.textMuted, 
    fontWeight: '700',
  },
  optionLetterSelected: { 
    color: '#fff',
  },
  optionContent: { flex: 1 },
  optionMathSelected: {},
  checkIconWrap: {
    marginLeft: 4,
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.xs,
  },
  navBtnPrev: {},
  navBtnNext: {},
  navBtnDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.backgroundDark,
  },
  navBtnText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  navBtnTextDisabled: {
    color: colors.textMuted,
  },
  questionGrid: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  gridItem: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridItemAnswered: {
    backgroundColor: colors.successTint,
    borderColor: colors.success,
  },
  gridItemCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  gridItemText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  gridItemTextAnswered: {
    color: colors.success,
  },
  gridItemTextCurrent: {
    color: '#fff',
    fontWeight: '700',
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: colors.success,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: minTouchTargetSize,
    borderRadius: borderRadius.md,
    ...shadows.buttonSuccess,
  },
  submitIcon: {
    marginRight: spacing.sm,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', ...typography.button },
});

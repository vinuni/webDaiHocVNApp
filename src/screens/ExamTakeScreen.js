import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiClient } from '../api/client';
import MathText from '../components/MathText';
import { colors, spacing, borderRadius, typography, shadows, minTouchTargetSize, gradients, iconSizes } from '../theme';
import { useRequireAuth } from '../hooks/useRequireAuth';

function ExamProgressHeader({ answers, questionsLength, minutesLeft, tendethi, deThiTendethi }) {
  const answeredCount = Object.keys(answers).length;
  const progressPercent = questionsLength > 0 ? (answeredCount / questionsLength) * 100 : 0;
  return (
    <LinearGradient
      colors={gradients.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.questionProgress}>{answeredCount}/{questionsLength}</Text>
          <Text style={styles.progressLabel}>câu</Text>
        </View>
        <View style={styles.timerBadge}>
          <Ionicons name="time" size={iconSizes.xs} color="#fff" />
          <Text style={styles.timer}>{minutesLeft}′</Text>
        </View>
      </View>
      <View style={styles.progressBarWrap}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>
      <Text style={styles.examTitle} numberOfLines={1}>{tendethi || deThiTendethi}</Text>
    </LinearGradient>
  );
}

export default function ExamTakeScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const isAuthenticated = useRequireAuth();
  const { deThiId, tendethi } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deThi, setDeThi] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [minutesLeft, setMinutesLeft] = useState(0);
  const [timerReady, setTimerReady] = useState(false);
  // Font size for question/options: 0 = 16, 1 = 18, 2 = 20, 3 = 22, 4 = 24
  const [fontSizeLevel, setFontSizeLevel] = useState(1);

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang chuyển đến đăng nhập...</Text>
      </View>
    );
  }
  const questionFontSize = 16 + fontSizeLevel * 2;

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
        if (!mounted) return;
        const body = e?.body;
        if (e?.status === 403 && body?.code === 'EXAM_COMPLETED' && body?.redirect === 'ket_qua') {
          navigation.replace('Result', {
            deThiId: body.dethi_id ?? deThiId,
            tendethi: tendethi || '',
            diem: body.user_diem,
          });
          return;
        }
        Alert.alert('Lỗi', e?.message || 'Không tải được đề thi.');
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

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 25 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderRelease: (_, g) => {
          if (g.dx > 55) goToPrevious();
          else if (g.dx < -55) goToNext();
        },
      }),
    [goToPrevious, goToNext]
  );

  if (loading) return (<View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>);
  if (!questions.length) return (<View style={styles.centered}><Text style={styles.emptyText}>Không có câu hỏi.</Text></View>);

  const choices = ['A', 'B', 'C', 'D', 'E'];
  const answeredCount = Object.keys(answers).length;
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ExamProgressHeader
        answers={answers}
        questionsLength={questions.length}
        minutesLeft={minutesLeft}
        tendethi={tendethi}
        deThiTendethi={deThi?.tendethi}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.questionBlock} {...panResponder.panHandlers}>
          <View style={styles.questionTopRow}>
            <View style={styles.questionHeader}>
              <LinearGradient
                colors={answers[currentQuestion.id] != null ? gradients.success : gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.questionNumberGradient}
              >
                <Text style={styles.questionNumberText}>{currentQuestionIndex + 1}</Text>
              </LinearGradient>
              <Text style={styles.qLabel}>Câu {currentQuestionIndex + 1}</Text>
            </View>
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
          {currentQuestion.image && (
            <Image
              source={{ uri: currentQuestion.image }}
              style={styles.questionImage}
              resizeMode="contain"
            />
          )}
          <MathText value={currentQuestion.cauhoi} containerStyle={styles.mathQuestion} contentFontSize={questionFontSize} />
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
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <View style={[styles.optionBadge, selected && styles.optionBadgeSelected]}>
                    <Text style={[styles.optionLetter, selected && styles.optionLetterSelected]}>{c}</Text>
                  </View>
                  <View style={styles.optionContent}>
                    <MathText value={opt} containerStyle={selected ? styles.optionMathSelected : undefined} contentFontSize={questionFontSize} />
                  </View>
                  {selected && (
                    <View style={styles.checkIconWrap}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.swipeHint}>
            <Ionicons name="swap-horizontal" size={14} color={colors.textMuted} /> Vuốt trái/phải để chuyển câu
          </Text>
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
          style={[styles.submitBtnWrap, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={gradients.success}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitBtn}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={iconSizes.md} color="#fff" style={styles.submitIcon} />
                <Text style={styles.submitBtnText}>Nộp bài ({answeredCount}/{questions.length})</Text>
              </>
            )}
          </LinearGradient>
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
    paddingHorizontal: spacing.md,
    paddingTop: 6,
    paddingBottom: 6,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  questionProgress: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  progressLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  timer: { fontSize: 14, color: '#fff', fontWeight: '700' },
  progressBarWrap: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: borderRadius.full,
  },
  examTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.95)',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.sm,
    paddingTop: 2,
    paddingBottom: spacing.xxl,
  },
  questionBlock: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.borderLight,
    ...shadows.cardLg,
  },
  questionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  questionNumberGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  questionNumberText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '700',
  },
  qLabel: { fontSize: 15, color: colors.primary, fontWeight: '700' },
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
  questionImage: {
    width: '100%',
    height: 200,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.backgroundDark,
  },
  mathQuestion: { marginBottom: spacing.md },
  optionsWrap: {
    gap: 2,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.xs,
    minHeight: minTouchTargetSize,
    alignSelf: 'stretch',
    ...shadows.cardSm,
  },
  optionSelected: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
    ...shadows.card,
  },
  optionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    pointerEvents: 'none',
  },
  optionBadgeSelected: {
    backgroundColor: colors.primary,
  },
  optionLetter: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '700',
  },
  optionLetterSelected: { 
    color: '#fff',
  },
  optionContent: { flex: 1, pointerEvents: 'none' },
  optionMathSelected: {},
  checkIconWrap: {
    marginLeft: spacing.xs,
    pointerEvents: 'none',
  },
  swipeHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    gap: spacing.xs,
    ...shadows.cardSm,
  },
  navBtnPrev: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  navBtnNext: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  navBtnDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.backgroundDark,
  },
  navBtnText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
  },
  navBtnTextDisabled: {
    color: colors.textMuted,
  },
  questionGrid: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.borderLight,
    ...shadows.card,
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
    gap: spacing.sm,
  },
  gridItem: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.md,
    borderWidth: 2,
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
    fontWeight: '700',
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
  submitBtnWrap: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.buttonSuccess,
  },
  submitBtn: {
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: minTouchTargetSize,
    borderRadius: borderRadius.md,
  },
  submitIcon: {
    marginRight: spacing.sm,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', ...typography.button },
});

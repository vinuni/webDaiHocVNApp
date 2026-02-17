import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiClient } from '../api/client';
import MathText from '../components/MathText';
import { colors, spacing, borderRadius, typography, shadows, minTouchTargetSize } from '../theme';

export default function ExamTakeScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { deThiId, tendethi } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deThi, setDeThi] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
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

  if (loading) return (<View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>);
  if (!questions.length) return (<View style={styles.centered}><Text style={styles.emptyText}>Không có câu hỏi.</Text></View>);

  const choices = ['A', 'B', 'C', 'D', 'E'];

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left + spacing.md, paddingRight: insets.right + spacing.md }]}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{tendethi || deThi?.tendethi}</Text>
        <View style={styles.timerBadge}>
          <Text style={styles.timer}>{minutesLeft} phút</Text>
        </View>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {questions.map((q, idx) => (
          <View key={q.id} style={styles.questionBlock}>
            <Text style={styles.qLabel}>Câu {idx + 1}</Text>
            <MathText value={q.cauhoi} containerStyle={styles.mathQuestion} />
            {choices.map((c) => {
              const opt = q['dapan' + c];
              if (!opt) return null;
              const selected = answers[q.id] === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => setAnswer(q.id, c)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionLetter, selected && styles.optionLetterSelected]}>{c}.</Text>
                  <View style={styles.optionContent}>
                    <MathText value={opt} containerStyle={selected ? styles.optionMathSelected : undefined} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
        activeOpacity={0.8}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Nộp bài</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  emptyText: { ...typography.body, color: colors.textSecondary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.cardSm,
  },
  title: { ...typography.subtitle, flex: 1, color: colors.text, marginRight: spacing.sm },
  timerBadge: { backgroundColor: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  timer: { ...typography.bodySmall, color: '#fff', fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xl },
  questionBlock: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qLabel: { ...typography.caption, color: colors.primary, fontWeight: '600', marginBottom: spacing.sm },
  mathQuestion: { marginBottom: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    minHeight: minTouchTargetSize,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: { backgroundColor: colors.primary + '18', borderColor: colors.primary },
  optionLetter: { ...typography.subtitle, color: colors.textSecondary, marginRight: spacing.sm, width: 24 },
  optionLetterSelected: { color: colors.primary },
  optionContent: { flex: 1 },
  optionMathSelected: {},
  submitBtn: {
    backgroundColor: colors.success,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: minTouchTargetSize,
    margin: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.buttonSuccess,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', ...typography.subtitle },
});

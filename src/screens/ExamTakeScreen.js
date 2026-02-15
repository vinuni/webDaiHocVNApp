import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { apiClient } from '../api/client';

export default function ExamTakeScreen({ route, navigation }) {
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

  if (loading) return (<View style={styles.centered}><ActivityIndicator size="large" /></View>);
  if (!questions.length) return (<View style={styles.centered}><Text>Không có câu hỏi.</Text></View>);

  const choices = ['A', 'B', 'C', 'D', 'E'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{tendethi || deThi?.tendethi}</Text>
        <Text style={styles.timer}>{minutesLeft} phút</Text>
      </View>
      <ScrollView style={styles.scroll}>
        {questions.map((q, idx) => (
          <View key={q.id} style={styles.questionBlock}>
            <Text style={styles.qText}>Câu {idx + 1}. {q.cauhoi}</Text>
            {choices.map((c) => {
              const opt = q['dapan' + c];
              if (!opt) return null;
              const selected = answers[q.id] === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => setAnswer(q.id, c)}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{c}. {opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Nộp bài</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 18, fontWeight: '600', flex: 1 },
  timer: { fontSize: 16, color: '#666' },
  scroll: { flex: 1, padding: 16 },
  questionBlock: { marginBottom: 24 },
  qText: { fontSize: 15, marginBottom: 12 },
  option: { padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 8 },
  optionSelected: { backgroundColor: '#007AFF' },
  optionText: {},
  optionTextSelected: { color: '#fff' },
  submitBtn: { backgroundColor: '#34C759', padding: 16, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontWeight: '600' },
});

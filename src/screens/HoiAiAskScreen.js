import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { apiClient } from '../api/client';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

let ImagePicker = null;
try {
  ImagePicker = require('expo-image-picker');
} catch {
  // expo-image-picker not installed
}

export default function HoiAiAskScreen({ navigation }) {
  const [question, setQuestion] = useState('');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const pickImage = async () => {
    if (!ImagePicker) {
      Alert.alert('Thông báo', 'Tính năng đính kèm ảnh cần cài đặt expo-image-picker.');
      return;
    }
    const { status } = await (ImagePicker.requestMediaLibraryPermissionsAsync?.() ?? Promise.resolve({ status: 'undetermined' }));
    if (status !== 'granted') {
      Alert.alert('Cần quyền', 'Vui lòng cho phép truy cập thư viện ảnh.');
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? 'images',
      allowsEditing: true,
      quality: 0.8,
    });
    if (!pickerResult.canceled && pickerResult.assets?.[0]) {
      setPhoto(pickerResult.assets[0]);
      setError(null);
    }
  };

  const removePhoto = () => setPhoto(null);

  const submit = async () => {
    const hasText = question.trim().length > 0;
    if (!hasText && !photo) {
      setError('Vui lòng nhập câu hỏi hoặc đính kèm ảnh.');
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      if (photo?.uri) {
        const formData = new FormData();
        if (hasText) formData.append('question_text', question.trim());
        formData.append('photo', {
          uri: photo.uri,
          name: photo.fileName || 'photo.jpg',
          type: photo.mimeType || 'image/jpeg',
        });
        const res = await apiClient.postFormData('/api/v1/ai-question', formData);
        setResult(res);
      } else {
        const res = await apiClient.post('/api/v1/ai-question', { question_text: question.trim() });
        setResult(res);
      }
    } catch (e) {
      if (e.status === 429) {
        setError(e.body?.message || 'Đã hết lượt hỏi hôm nay. Vui lòng thử lại vào ngày mai.');
      } else if (e.status === 503) {
        setError(e.body?.message || 'Hệ thống tạm thời quá tải. Vui lòng thử lại sau.');
      } else {
        setError(e.body?.message || e.message || 'Có lỗi xảy ra.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Câu hỏi</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập câu hỏi hoặc đính kèm ảnh câu hỏi..."
        placeholderTextColor={colors.textMuted}
        value={question}
        onChangeText={(t) => { setQuestion(t); setError(null); }}
        multiline
        numberOfLines={4}
        editable={!loading}
      />
      <View style={styles.photoRow}>
        <TouchableOpacity style={styles.btnSecondary} onPress={pickImage} disabled={loading}>
          <Text style={styles.btnSecondaryText}>Đính kèm ảnh</Text>
        </TouchableOpacity>
        {photo?.uri && (
          <View style={styles.photoPreview}>
            <Image source={{ uri: photo.uri }} style={styles.thumb} />
            <TouchableOpacity style={styles.removePhoto} onPress={removePhoto}>
              <Text style={styles.removePhotoText}>×</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity
        style={[styles.submitBtn, shadows.buttonPrimary]}
        onPress={submit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Gửi câu hỏi</Text>
        )}
      </TouchableOpacity>

      {result && (
        <View style={[styles.card, shadows.card]}>
          <Text style={styles.cardTitle}>Trả lời</Text>
          <Text style={styles.answer}>{result.answer ?? '—'}</Text>
          <View style={styles.meta}>
            {result.monthi_suggested ? (
              <View style={styles.chip}><Text style={styles.chipText}>Môn: {result.monthi_suggested}</Text></View>
            ) : null}
            {result.hocphan_suggested ? (
              <View style={styles.chip}><Text style={styles.chipText}>Học phần: {result.hocphan_suggested}</Text></View>
            ) : null}
            {result.difficulty_level ? (
              <View style={styles.chip}><Text style={styles.chipText}>Độ khó: {result.difficulty_level}</Text></View>
            ) : null}
            {result.usefulness_score != null ? (
              <View style={styles.chip}><Text style={styles.chipText}>Hữu ích: {result.usefulness_score}</Text></View>
            ) : null}
          </View>
          {result.remaining_today != null && (
            <Text style={styles.remaining}>Còn {result.remaining_today} lượt hỏi hôm nay.</Text>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.historyLink} onPress={() => navigation.navigate('HoiAiHistory')}>
        <Text style={styles.historyLinkText}>Xem lịch sử hỏi đáp</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  label: { ...typography.subtitle, color: colors.text, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  photoRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.md },
  btnSecondary: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.border,
  },
  btnSecondaryText: { ...typography.body, color: colors.text },
  photoPreview: { position: 'relative' },
  thumb: { width: 64, height: 64, borderRadius: borderRadius.sm },
  removePhoto: { position: 'absolute', top: -4, right: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.danger, justifyContent: 'center', alignItems: 'center' },
  removePhotoText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  error: { ...typography.bodySmall, color: colors.danger, marginTop: spacing.sm },
  submitBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  submitBtnText: { ...typography.subtitle, color: '#fff' },
  card: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { ...typography.subtitle, color: colors.text, marginBottom: spacing.sm },
  answer: { ...typography.body, color: colors.text, marginBottom: spacing.md },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { backgroundColor: colors.background, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
  chipText: { ...typography.caption, color: colors.textSecondary },
  remaining: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  historyLink: { marginTop: spacing.lg, alignItems: 'center' },
  historyLinkText: { ...typography.body, color: colors.primary },
});

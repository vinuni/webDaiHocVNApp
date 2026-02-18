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
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../api/client';
import { colors, spacing, borderRadius, typography, shadows, minTouchTargetSize, iconSizes } from '../theme';

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
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="sparkles" size={iconSizes.lg} color={colors.primary} />
          <Text style={styles.cardTitle}>Đặt câu hỏi cho AI</Text>
        </View>
        <Text style={styles.hint}>Nhập câu hỏi hoặc đính kèm ảnh câu hỏi</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: Giải phương trình x² + 5x + 6 = 0"
          placeholderTextColor={colors.textMuted}
          value={question}
          onChangeText={(t) => { setQuestion(t); setError(null); }}
          multiline
          numberOfLines={4}
          editable={!loading}
        />

        {photo?.uri && (
          <View style={styles.photoPreview}>
            <Image source={{ uri: photo.uri }} style={styles.photoImage} />
            <TouchableOpacity style={styles.removePhoto} onPress={removePhoto} disabled={loading}>
              <Ionicons name="close-circle" size={iconSizes.lg} color={colors.danger} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.photoButton} 
            onPress={pickImage} 
            disabled={loading}
            activeOpacity={0.8}
          >
            <Ionicons name="image-outline" size={iconSizes.md} color={colors.primary} />
            <Text style={styles.photoButtonText}>Đính kèm ảnh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={submit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={iconSizes.md} color="#fff" />
                <Text style={styles.submitBtnText}>Gửi</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={iconSizes.md} color={colors.danger} />
            <Text style={styles.error}>{error}</Text>
          </View>
        )}
      </View>

      {/* Answer */}
      {result && (
        <View style={styles.answerCard}>
          <View style={styles.answerHeader}>
            <View style={styles.aiAvatar}>
              <Ionicons name="sparkles" size={iconSizes.lg} color="#fff" />
            </View>
            <View style={styles.answerHeaderText}>
              <Text style={styles.answerTitle}>Trả lời từ AI</Text>
              {result.monthi_suggested && (
                <Text style={styles.answerMeta}>Môn: {result.monthi_suggested}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.answerBubble}>
            <Text style={styles.answer}>{result.answer ?? '—'}</Text>
          </View>

          {(result.hocphan_suggested || result.difficulty_level || result.usefulness_score != null) && (
            <View style={styles.meta}>
              {result.hocphan_suggested && (
                <View style={styles.chip}>
                  <Ionicons name="book" size={12} color={colors.info} />
                  <Text style={styles.chipText}>{result.hocphan_suggested}</Text>
                </View>
              )}
              {result.difficulty_level && (
                <View style={styles.chip}>
                  <Ionicons name="speedometer" size={12} color={colors.warning} />
                  <Text style={styles.chipText}>{result.difficulty_level}</Text>
                </View>
              )}
              {result.usefulness_score != null && (
                <View style={styles.chip}>
                  <Ionicons name="star" size={12} color={colors.success} />
                  <Text style={styles.chipText}>{result.usefulness_score}/5</Text>
                </View>
              )}
            </View>
          )}

          {result.remaining_today != null && (
            <Text style={styles.remaining}>
              <Ionicons name="information-circle" size={14} color={colors.textMuted} /> Còn {result.remaining_today} lượt hỏi hôm nay
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity 
        style={styles.historyLink} 
        onPress={() => navigation.navigate('HoiAiHistory')}
        activeOpacity={0.8}
      >
        <Ionicons name="time-outline" size={iconSizes.md} color={colors.primary} />
        <Text style={styles.historyLinkText}>Xem lịch sử hỏi đáp</Text>
        <Ionicons name="chevron-forward" size={iconSizes.sm} color={colors.primary} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  cardTitle: { ...typography.subtitle, color: colors.text, flex: 1 },
  hint: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  input: {
    backgroundColor: colors.backgroundDark,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  photoPreview: { 
    position: 'relative',
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  photoImage: { 
    width: 120, 
    height: 120, 
    borderRadius: borderRadius.md,
  },
  removePhoto: { 
    position: 'absolute', 
    top: -8, 
    right: -8,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryTint,
    borderWidth: 1.5,
    borderColor: colors.primary,
    gap: spacing.xs,
    minHeight: minTouchTargetSize,
  },
  photoButtonText: { 
    ...typography.body, 
    color: colors.primary,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: minTouchTargetSize,
    gap: spacing.xs,
    ...shadows.buttonPrimary,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { ...typography.button, color: '#fff' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerTint,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  error: { ...typography.bodySmall, color: colors.danger, flex: 1 },
  answerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  aiAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerHeaderText: {
    flex: 1,
  },
  answerTitle: { 
    ...typography.subtitle, 
    color: colors.text,
    marginBottom: 2,
  },
  answerMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  answerBubble: {
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  answer: { 
    ...typography.body, 
    color: colors.text,
    lineHeight: 24,
  },
  meta: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chip: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundDark, 
    paddingHorizontal: spacing.sm, 
    paddingVertical: 6, 
    borderRadius: borderRadius.full,
    gap: 4,
  },
  chipText: { ...typography.caption, color: colors.textSecondary },
  remaining: { 
    ...typography.caption, 
    color: colors.textMuted,
  },
  historyLink: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  historyLinkText: { 
    ...typography.body, 
    color: colors.primary,
    fontWeight: '600',
  },
});

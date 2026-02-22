import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { apiClient } from '../api/client';
import { colors, spacing, borderRadius, typography, shadows, minTouchTargetSize } from '../theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Lỗi', 'Vui lòng nhập email.');
      return;
    }
    setLoading(true);
    setSent(false);
    try {
      await apiClient.post('/api/v1/forgot-password', { email: trimmed });
      setSent(true);
    } catch (e) {
      const msg = e?.body?.message || e?.message || 'Gửi thất bại. Vui lòng thử lại.';
      Alert.alert('Thông báo', msg);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Kiểm tra email</Text>
          <Text style={styles.message}>
            Nếu tồn tại tài khoản với email này, bạn sẽ nhận được link đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (và thư mục spam).
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Quay lại đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 44 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Quên mật khẩu</Text>
          <Text style={styles.hint}>Nhập email đăng ký để nhận link đặt lại mật khẩu.</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Gửi link đặt lại mật khẩu</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Login')} disabled={loading}>
            <Text style={styles.linkText}>Quay lại đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, padding: spacing.lg, paddingBottom: 80 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  title: { ...typography.title, marginBottom: spacing.xs, color: colors.text },
  hint: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.lg },
  message: { ...typography.body, color: colors.text, marginBottom: spacing.lg },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: 16,
    color: colors.text,
    minHeight: minTouchTargetSize,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: minTouchTargetSize,
    marginTop: spacing.sm,
    ...shadows.buttonPrimary,
  },
  buttonText: { color: '#fff', ...typography.subtitle },
  link: { marginTop: spacing.lg, alignItems: 'center' },
  linkText: { color: colors.primary, ...typography.body },
});

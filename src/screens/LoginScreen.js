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
  Image,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { colors, spacing, borderRadius, typography, shadows, minTouchTargetSize } from '../theme';

const logo = require('../../assets/logo.png');

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const hasGoogleConfig = !!(webClientId || iosClientId || androidClientId);

function GoogleLoginButton() {
  const { socialLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  let useAuthRequest = () => [null, null, async () => {}];
  try {
    useAuthRequest = require('expo-auth-session/providers/google').useAuthRequest;
  } catch {}
  const config = React.useMemo(() => {
    const c = {};
    if (webClientId) c.webClientId = webClientId;
    if (iosClientId) c.iosClientId = iosClientId;
    if (androidClientId) c.androidClientId = androidClientId;
    return c;
  }, []);
  const [request, response, promptAsync] = useAuthRequest(config);

  React.useEffect(() => {
    if (!response || response.type !== 'success') return;
    const token = response.params?.access_token || response.authentication?.accessToken;
    if (!token) {
      Alert.alert('Lỗi', 'Không nhận được token từ Google.');
      setLoading(false);
      return;
    }
    setLoading(true);
    socialLogin('google', token).catch((e) => {
      Alert.alert('Đăng nhập thất bại', e?.body?.message || e?.message || 'Đăng nhập Google thất bại.');
    }).finally(() => setLoading(false));
  }, [response?.type]);

  const onPress = () => {
    setLoading(true);
    promptAsync();
  };

  return (
    <TouchableOpacity style={[styles.socialButton, loading && styles.socialButtonDisabled]} onPress={onPress} disabled={loading} activeOpacity={0.8}>
      {loading ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={styles.socialButtonText}>Đăng nhập bằng Google</Text>}
    </TouchableOpacity>
  );
}

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      const msg = e?.message || (e.status === 422 ? 'Email hoặc mật khẩu không đúng.' : 'Đăng nhập thất bại.');
      Alert.alert('Đăng nhập thất bại', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Đăng nhập</Text>
        <Text style={styles.hint}>Chào bạn, đăng nhập để tiếp tục</Text>
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
        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Đăng nhập</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('ForgotPassword')} disabled={loading}>
          <Text style={styles.linkText}>Quên mật khẩu?</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Register')} disabled={loading}>
          <Text style={styles.linkText}>Chưa có tài khoản? Đăng ký</Text>
        </TouchableOpacity>
        {hasGoogleConfig && <GoogleLoginButton />}
        {!hasGoogleConfig && (
          <View style={styles.socialRow}>
            <Text style={styles.socialHint}>Đăng nhập Facebook (sắp ra mắt)</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  logo: { width: 160, height: 48, alignSelf: 'center', marginBottom: spacing.lg },
  title: { ...typography.title, marginBottom: spacing.xs, color: colors.text },
  hint: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.lg },
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
  link: { marginTop: spacing.sm, alignItems: 'center' },
  linkText: { color: colors.primary, ...typography.body },
  socialRow: { marginTop: spacing.lg, alignItems: 'center' },
  socialHint: { ...typography.caption, color: colors.textMuted },
  socialButton: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: minTouchTargetSize,
  },
  socialButtonDisabled: { opacity: 0.7 },
  socialButtonText: { ...typography.body, color: colors.text },
});

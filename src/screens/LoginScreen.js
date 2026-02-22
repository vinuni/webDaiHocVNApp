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
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { colors, spacing, borderRadius, typography, shadows, minTouchTargetSize, gradients, iconSizes } from '../theme';

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

  const getLoginErrorMessage = (e) => {
    const isNetworkError =
      e?.message === 'Network request failed' ||
      (typeof e?.message === 'string' && (e.message.includes('fetch') || e.message.includes('Failed to load')));
    if (isNetworkError) {
      return 'Không kết nối được máy chủ. Kiểm tra kết nối mạng và đảm bảo backend đang chạy.';
    }
    const body = e?.body;
    if (body?.errors && typeof body.errors === 'object') {
      const emailMsg = Array.isArray(body.errors.email) ? body.errors.email[0] : null;
      const passwordMsg = Array.isArray(body.errors.password) ? body.errors.password[0] : null;
      if (emailMsg) return emailMsg;
      if (passwordMsg) return passwordMsg;
    }
    if (body?.message && typeof body.message === 'string') return body.message;
    if (e?.message && typeof e.message === 'string' && !e.message.startsWith('HTTP ')) return e.message;
    return 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.';
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      const msg = getLoginErrorMessage(e);
      Alert.alert('Đăng nhập thất bại', msg);
    } finally {
      setLoading(false);
    }
  };

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
        {/* Gradient Header */}
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo} resizeMode="contain" tintColor="#fff" />
          </View>
          <View style={styles.headerTitleRow}>
            <Ionicons name="document-text-outline" size={iconSizes.lg} color="#fff" style={styles.headerTitleIcon} />
            <Text style={styles.headerTitle}>Thi Thử Online</Text>
          </View>
          <Text style={styles.headerSubtitle}>Nền tảng luyện thi THPT Quốc Gia</Text>
        </LinearGradient>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.hint}>Chào mừng bạn trở lại!</Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={iconSizes.md} color={colors.textMuted} style={styles.inputIcon} />
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
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={iconSizes.md} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Đăng nhập</Text>
                <Ionicons name="arrow-forward" size={iconSizes.md} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('ForgotPassword')} disabled={loading}>
            <Text style={styles.linkText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          {hasGoogleConfig && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>hoặc</Text>
                <View style={styles.dividerLine} />
              </View>
              <GoogleLoginButton />
            </>
          )}

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={loading}>
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? spacing.xxl + 20 : spacing.xl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logo: { 
    width: 120, 
    height: 36,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerTitleIcon: {
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.title,
    color: '#fff',
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.9)',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    margin: spacing.lg,
    marginTop: -spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.cardLg,
  },
  title: { 
    ...typography.titleSmall, 
    marginBottom: spacing.xs, 
    color: colors.text 
  },
  hint: { 
    ...typography.bodySmall, 
    color: colors.textSecondary, 
    marginBottom: spacing.xl 
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceTint,
    minHeight: minTouchTargetSize,
  },
  inputIcon: {
    marginLeft: spacing.md,
  },
  input: {
    flex: 1,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: minTouchTargetSize,
    marginTop: spacing.md,
    ...shadows.buttonPrimary,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  buttonText: { 
    color: '#fff', 
    ...typography.button 
  },
  link: { 
    marginTop: spacing.md, 
    alignItems: 'center' 
  },
  linkText: { 
    color: colors.primary, 
    ...typography.body,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textMuted,
    marginHorizontal: spacing.md,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  registerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  registerLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
  socialButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: minTouchTargetSize,
    flexDirection: 'row',
  },
  socialButtonDisabled: { opacity: 0.7 },
  socialButtonText: { 
    ...typography.body, 
    color: colors.text,
    fontWeight: '600',
  },
});

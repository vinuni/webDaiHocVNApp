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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { colors, spacing, borderRadius, typography, shadows, minTouchTargetSize, iconSizes, screenPaddingHorizontal } from '../theme';

const logo = require('../../assets/logo.png');

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const hasGoogleConfig = !!(webClientId || iosClientId || androidClientId);

// Resolve redirect URI: on web use current origin + /oauthredirect (must be added in Google Cloud Console).
let useAuthRequest = () => [null, null, async () => { }];
let makeRedirectUri;
try {
  const authSession = require('expo-auth-session');
  useAuthRequest = require('expo-auth-session/providers/google').useAuthRequest;
  makeRedirectUri = authSession.makeRedirectUri;
} catch { }

function GoogleLoginButton() {
  const { socialLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const config = React.useMemo(() => {
    const redirectUri = Platform.OS === 'web' && makeRedirectUri
      ? makeRedirectUri({ path: 'oauthredirect' })
      : 'com.daihoc.vn1.webDaiHocVN73App:/oauthredirect';
    const c = {
      scopes: ['profile', 'email'],
      redirectUri,
    };
    if (webClientId) c.webClientId = webClientId;
    if (iosClientId) c.iosClientId = iosClientId;
    if (androidClientId) c.androidClientId = androidClientId;
    return c;
  }, []);
  const [request, response, promptAsync] = useAuthRequest(config);

  React.useEffect(() => {
    if (!response) {
      return;
    }
    if (__DEV__) {
      console.log('[GoogleLogin] response type:', response.type, 'response:', response);
    }
    if (response.type !== 'success') {
      // User cancelled or error before token
      setLoading(false);
      if (response.type !== 'dismiss') {
        Alert.alert('Đăng nhập Google thất bại', `Loại phản hồi: ${response.type}`);
      }
      return;
    }
    const accessToken =
      response.params?.access_token || response.authentication?.accessToken || null;
    const idToken =
      response.params?.id_token || response.authentication?.idToken || null;
    const token = accessToken || idToken;
    if (__DEV__) {
      console.log('[GoogleLogin] tokens:', { hasAccess: !!accessToken, hasId: !!idToken }, 'params:', response.params);
    }
    if (!token) {
      Alert.alert('Lỗi', 'Không nhận được token từ Google.');
      setLoading(false);
      return;
    }
    setLoading(true);
    socialLogin('google', accessToken || undefined, idToken || undefined)
      .catch((e) => {
        if (__DEV__) {
          console.log('[GoogleLogin] socialLogin error:', e);
        }
        Alert.alert('Đăng nhập thất bại', e?.body?.message || e?.message || 'Đăng nhập Google thất bại.');
      })
      .finally(() => setLoading(false));
  }, [response]);

  const onPress = () => {
    if (__DEV__) {
      console.log('[GoogleLogin] onPress, request ready:', !!request);
      console.log('[GoogleLogin] config:', config);
    }
    if (!request) {
      Alert.alert('Lỗi', 'Google chưa sẵn sàng, vui lòng thử lại.');
      return;
    }
    setLoading(true);
    promptAsync().catch((e) => {
      setLoading(false);
      if (__DEV__) {
        console.log('[GoogleLogin] promptAsync error:', e);
      }
      Alert.alert('Đăng nhập Google thất bại', e?.message || 'Không thể mở màn hình đăng nhập Google.');
    });
  };

  return (
    <TouchableOpacity style={[styles.socialButton, styles.googleButton, loading && styles.socialButtonDisabled]} onPress={onPress} disabled={loading} activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator size="small" color="#4285F4" />
      ) : (
        <>
          <View style={styles.googleIconWrap}>
            <Text style={styles.googleIconText}>G</Text>
          </View>
          <Text style={styles.googleButtonText}>Đăng nhập bằng Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export default function LoginScreen({ navigation, route }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true); // Default: remember credentials
  const [loading, setLoading] = useState(false);

  // Get message from route params if any
  const message = route?.params?.message;

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
      await login(email.trim(), password, rememberMe);
      // Always go to Home to avoid NAVIGATE errors (Auth stack has no Profile/MainTabs).
      navigation.navigate('Main', { screen: 'MainTabs', params: { screen: 'Home' } });
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
        {/* Login Card - logo at top like Register */}
        <View style={styles.card}>
          <View style={styles.brandRow}>
            <Image source={logo} style={styles.logoInBrand} resizeMode="contain" />
            <Text style={styles.brandTitle}>Thi Thử Online</Text>
          </View>
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.hint}>Chào mừng bạn trở lại!</Text>

          {message && (
            <View style={styles.messageContainer}>
              <Text style={styles.messageText}>{message}</Text>
            </View>
          )}

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

          <TouchableOpacity
            style={styles.rememberMeContainer}
            onPress={() => setRememberMe(!rememberMe)}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Ionicons
              name={rememberMe ? "checkbox" : "square-outline"}
              size={iconSizes.md}
              color={rememberMe ? colors.primary : colors.textMuted}
            />
            <Text style={styles.rememberMeText}>Ghi nhớ đăng nhập</Text>
          </TouchableOpacity>

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
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.cardLg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: spacing.md,
    gap: 2,
  },
  logoInBrand: {
    width: 120,
    height: 36,
  },
  brandTitle: { fontSize: 18, fontWeight: '700', color: colors.primary },
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
  googleButton: {
    backgroundColor: '#fff',
    borderColor: '#dadce0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  googleIconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: 14,
    color: '#3c4043',
    fontWeight: '600',
  },
  socialButtonDisabled: { opacity: 0.7 },
  socialButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  rememberMeText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  messageContainer: {
    padding: spacing.md,
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    marginBottom: spacing.md,
  },
  messageText: {
    ...typography.body,
    color: colors.text,
  },
});

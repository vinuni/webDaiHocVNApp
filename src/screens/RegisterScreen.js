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
import { colors, spacing, borderRadius, typography, minTouchTargetSize, iconSizes, screenPaddingHorizontal } from '../theme';

const logo = require('../../assets/logo.png');

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const hasGoogleConfig = !!(webClientId || iosClientId || androidClientId);

let useAuthRequest = () => [null, null, async () => { }];
let makeRedirectUri;
try {
  const authSession = require('expo-auth-session');
  useAuthRequest = require('expo-auth-session/providers/google').useAuthRequest;
  makeRedirectUri = authSession.makeRedirectUri;
} catch { }

function GoogleRegisterButton({ navigation, disabled }) {
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
      console.log('[GoogleRegister] response type:', response.type, 'response:', response);
    }
    if (response.type !== 'success') {
      setLoading(false);
      if (response.type !== 'dismiss') {
        Alert.alert('Đăng ký Google thất bại', `Loại phản hồi: ${response.type}`);
      }
      return;
    }
    const accessToken =
      response.params?.access_token || response.authentication?.accessToken || null;
    const idToken =
      response.params?.id_token || response.authentication?.idToken || null;
    const token = accessToken || idToken;
    if (__DEV__) {
      console.log('[GoogleRegister] tokens:', { hasAccess: !!accessToken, hasId: !!idToken }, 'params:', response.params);
    }
    if (!token) {
      Alert.alert('Lỗi', 'Không nhận được token từ Google.');
      setLoading(false);
      return;
    }
    setLoading(true);
    socialLogin('google', accessToken || undefined, idToken || undefined)
      .then(() => {
        navigation.navigate('Main', { screen: 'MainTabs', params: { screen: 'Home' } });
      })
      .catch((e) => {
        if (__DEV__) {
          console.log('[GoogleRegister] socialLogin error:', e);
        }
        Alert.alert('Đăng ký thất bại', e?.body?.message || e?.message || 'Đăng ký bằng Google thất bại.');
      })
      .finally(() => setLoading(false));
  }, [response]);

  const onPress = () => {
    if (__DEV__) {
      console.log('[GoogleRegister] onPress, request ready:', !!request);
      console.log('[GoogleRegister] config:', config);
    }
    if (!request) {
      Alert.alert('Lỗi', 'Google chưa sẵn sàng, vui lòng thử lại.');
      return;
    }
    setLoading(true);
    promptAsync().catch((e) => {
      setLoading(false);
      if (__DEV__) {
        console.log('[GoogleRegister] promptAsync error:', e);
      }
      Alert.alert('Đăng ký Google thất bại', e?.message || 'Không thể mở màn hình đăng ký Google.');
    });
  };

  return (
    <TouchableOpacity
      style={[styles.socialButton, styles.googleButton, (loading || disabled) && styles.socialButtonDisabled]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#4285F4" />
      ) : (
        <>
          <View style={styles.googleIconWrap}>
            <Text style={styles.googleIconText}>G</Text>
          </View>
          <Text style={styles.googleButtonText}>Đăng ký bằng Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  const getRegisterErrorMessage = (e) => {
    const isNetworkError =
      e?.message === 'Network request failed' ||
      (typeof e?.message === 'string' && (e.message.includes('fetch') || e.message.includes('Failed to load')));
    if (isNetworkError) {
      return 'Không kết nối được máy chủ. Kiểm tra kết nối mạng và thử lại.';
    }
    const body = e?.body;
    if (body?.errors && typeof body.errors === 'object') {
      const emailMsg = Array.isArray(body.errors.email) ? body.errors.email[0] : null;
      const passwordMsg = Array.isArray(body.errors.password) ? body.errors.password[0] : null;
      const nameMsg = Array.isArray(body.errors.name) ? body.errors.name[0] : null;
      if (emailMsg) return emailMsg;
      if (passwordMsg) return passwordMsg;
      if (nameMsg) return nameMsg;
    }
    if (body?.message && typeof body.message === 'string') return body.message;
    if (e?.message && typeof e.message === 'string' && !e.message.startsWith('HTTP ')) return e.message;
    if (e?.status === 422) return 'Email có thể đã được sử dụng hoặc dữ liệu không hợp lệ.';
    if (e?.status === 500) return 'Lỗi máy chủ. Vui lòng thử lại sau.';
    return 'Đăng ký thất bại. Vui lòng thử lại.';
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !passwordConfirmation) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (password !== passwordConfirmation) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu tối thiểu 6 ký tự.');
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password, passwordConfirmation);
      // Redirect to home screen
      navigation.navigate('Main', { screen: 'MainTabs', params: { screen: 'Home' } });
    } catch (e) {
      const msg = getRegisterErrorMessage(e);
      Alert.alert('Đăng ký thất bại', msg);
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
        <View style={styles.card}>
          <View style={styles.brandRow}>
            <Ionicons name="document-text-outline" size={iconSizes.xl} color={colors.primary} style={styles.brandIcon} />
            <Text style={styles.brandTitle}>Thi Thử Online</Text>
          </View>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Đăng ký</Text>
          <Text style={styles.hint}>Tạo tài khoản để lưu tiến độ</Text>
          <TextInput style={styles.input} placeholder="Họ tên" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} editable={!loading} />
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
            placeholder="Mật khẩu (tối thiểu 6 ký tự)"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Xác nhận mật khẩu"
            placeholderTextColor={colors.textMuted}
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
            secureTextEntry
            editable={!loading}
          />
          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Đăng ký</Text>}
          </TouchableOpacity>

          {hasGoogleConfig && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>hoặc</Text>
                <View style={styles.dividerLine} />
              </View>
              <GoogleRegisterButton navigation={navigation} disabled={loading} />
            </>
          )}

          <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Login')} disabled={loading}>
            <Text style={styles.linkText}>Đã có tài khoản? Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { flexGrow: 1, paddingHorizontal: screenPaddingHorizontal, paddingTop: 24, paddingBottom: 80 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginHorizontal: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  brandIcon: { marginRight: 8 },
  brandTitle: { fontSize: 18, fontWeight: '700', color: colors.primary },
  logo: { width: 160, height: 48, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4, color: '#1E293B' },
  hint: { fontSize: 13, color: '#64748B', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, marginBottom: 12, fontSize: 16, minHeight: minTouchTargetSize },
  button: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: minTouchTargetSize, marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { fontSize: 13, color: '#64748B', marginHorizontal: 12 },
  socialButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: minTouchTargetSize,
    flexDirection: 'row',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderColor: '#dadce0',
    gap: spacing.sm,
  },
  googleIconWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  googleIconText: { fontSize: 24, fontWeight: '700', color: '#4285F4' },
  googleButtonText: { fontSize: 14, color: '#3c4043', fontWeight: '600' },
  socialButtonDisabled: { opacity: 0.7 },
  link: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#6366F1' },
});

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
import { colors, spacing, borderRadius, typography, minTouchTargetSize, iconSizes } from '../theme';

const logo = require('../../assets/logo.png');

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
  scrollContent: { flexGrow: 1, padding: 24, paddingBottom: 80 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginHorizontal: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  brandIcon: { marginRight: 8 },
  brandTitle: { fontSize: 18, fontWeight: '700', color: colors.primary },
  logo: { width: 160, height: 48, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4, color: '#1E293B' },
  hint: { fontSize: 13, color: '#64748B', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, marginBottom: 12, fontSize: 16, minHeight: minTouchTargetSize },
  button: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: minTouchTargetSize, marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  link: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#6366F1' },
});

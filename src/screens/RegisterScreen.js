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
import { colors, spacing, borderRadius, typography, minTouchTargetSize } from '../theme';

const logo = require('../../assets/logo.png');

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !passwordConfirmation) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (password !== passwordConfirmation) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Lỗi', 'Mật khẩu tối thiểu 8 ký tự.');
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password, passwordConfirmation);
    } catch (e) {
      const msg = e?.message || (e.status === 422 ? 'Email có thể đã được sử dụng.' : 'Đăng ký thất bại.');
      Alert.alert('Đăng ký thất bại', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
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
        placeholder="Mật khẩu (tối thiểu 8 ký tự)"
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginHorizontal: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  logo: { width: 160, height: 48, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4, color: '#1E293B' },
  hint: { fontSize: 13, color: '#64748B', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, marginBottom: 12, fontSize: 16, minHeight: minTouchTargetSize },
  button: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: minTouchTargetSize, marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  link: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#6366F1' },
});

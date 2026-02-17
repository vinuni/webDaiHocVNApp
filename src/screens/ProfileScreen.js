import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { apiClient } from '../api/client';
import { colors, spacing, borderRadius, typography, minTouchTargetSize } from '../theme';

let ImagePicker = null;
try {
  ImagePicker = require('expo-image-picker');
} catch {}

export default function ProfileScreen({ navigation }) {
  const { user: authUser, logout, refreshUser } = useAuth();
  const [user, setUser] = useState(authUser);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const userData = user?.user ?? user;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get('/api/v1/user');
        const u = res?.user ?? res ?? null;
        if (mounted) setUser(u);
      } catch {
        if (mounted) setUser(authUser);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const pickAndUploadAvatar = async () => {
    if (!ImagePicker) {
      Alert.alert('Thông báo', 'Tính năng đổi ảnh cần expo-image-picker.');
      return;
    }
    const { status } = await (ImagePicker.requestMediaLibraryPermissionsAsync?.() ?? Promise.resolve({ status: 'undetermined' }));
    if (status !== 'granted') {
      Alert.alert('Cần quyền', 'Vui lòng cho phép truy cập thư viện ảnh.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const formData = new FormData();
      if (userData?.name) formData.append('name', userData.name);
      if (userData?.email) formData.append('email', userData.email);
      if (userData?.profile?.nickname) formData.append('nickname', userData.profile.nickname);
      formData.append('avatar', {
        uri: asset.uri,
        name: asset.fileName || 'avatar.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
      const res = await apiClient.postFormData('/api/v1/user', formData);
      const updated = res?.user ?? res;
      setUser(updated);
      await refreshUser();
    } catch (e) {
      Alert.alert('Lỗi', e?.body?.message || e?.message || 'Cập nhật ảnh thất bại.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading && !userData) {
    return (<View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>);
  }

  const name = userData?.name ?? userData?.profile?.nickname ?? '—';
  const email = userData?.email ?? '—';
  const avatarUri = userData?.profile?.avatar ?? null;
  const emailUnverified = userData && !userData.email_verified_at;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {emailUnverified && (
        <View style={styles.emailBanner}>
          <Text style={styles.emailBannerText}>Vui lòng xác thực email. Kiểm tra hộp thư và nhấn link xác thực.</Text>
        </View>
      )}
      <Text style={styles.title}>Tài khoản</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.avatarWrap} onPress={pickAndUploadAvatar} disabled={uploading}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>{(name[0] || '?').toUpperCase()}</Text></View>
          )}
          {uploading && <View style={styles.avatarOverlay}><ActivityIndicator color="#fff" /></View>}
          <Text style={styles.changePhotoText}>{uploading ? 'Đang tải...' : 'Đổi ảnh'}</Text>
        </TouchableOpacity>
        <Text style={styles.label}>Họ tên</Text>
        <Text style={styles.value}>{name}</Text>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{email}</Text>
        <TouchableOpacity style={styles.menuRow} onPress={() => navigation.getParent()?.navigate('StudyMaterials')} activeOpacity={0.8}>
          <Text style={styles.menuRowText}>Tài liệu học</Text>
          <Text style={styles.menuRowArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuRow} onPress={() => navigation.getParent()?.navigate('Comments')} activeOpacity={0.8}>
          <Text style={styles.menuRowText}>Bình luận</Text>
          <Text style={styles.menuRowArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuRow} onPress={() => navigation.getParent()?.navigate('Scoreboard')} activeOpacity={0.8}>
          <Text style={styles.menuRowText}>Bảng điểm</Text>
          <Text style={styles.menuRowArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuRow} onPress={() => navigation.getParent()?.navigate('Limits')} activeOpacity={0.8}>
          <Text style={styles.menuRowText}>Giới hạn & Gợi ý</Text>
          <Text style={styles.menuRowArrow}>›</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.logoutBtnText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  title: { ...typography.titleSmall, marginBottom: 16, color: colors.text },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  avatarWrap: { alignSelf: 'center', marginBottom: spacing.md, position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  avatarOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 40, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  changePhotoText: { ...typography.caption, color: colors.primary, textAlign: 'center', marginTop: 4 },
  label: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
  value: { ...typography.body, color: colors.text, marginBottom: 4 },
  logoutBtn: { backgroundColor: colors.danger, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', minHeight: minTouchTargetSize },
  logoutBtnText: { color: '#fff', ...typography.subtitle },
  emailBanner: { backgroundColor: colors.warning, padding: spacing.sm, borderRadius: borderRadius.sm, marginBottom: spacing.md },
  emailBannerText: { ...typography.caption, color: '#fff', textAlign: 'center' },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, minHeight: minTouchTargetSize, marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  menuRowText: { ...typography.body, color: colors.text },
  menuRowArrow: { ...typography.body, color: colors.textMuted },
});

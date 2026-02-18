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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { apiClient } from '../api/client';
import { colors, spacing, borderRadius, typography, minTouchTargetSize, gradients, iconSizes } from '../theme';

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
      {/* Gradient Header with Avatar */}
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.avatarWrap} onPress={pickAndUploadAvatar} disabled={uploading}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{(name[0] || '?').toUpperCase()}</Text>
            </View>
          )}
          {uploading && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color="#fff" />
            </View>
          )}
          <View style={styles.cameraButton}>
            <Ionicons name="camera" size={iconSizes.sm} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerName}>{name}</Text>
        <Text style={styles.headerEmail}>{email}</Text>
      </LinearGradient>

      {/* Email Verification Banner */}
      {emailUnverified && (
        <View style={styles.emailBanner}>
          <Ionicons name="alert-circle" size={iconSizes.md} color="#fff" style={styles.bannerIcon} />
          <Text style={styles.emailBannerText}>
            Vui lòng xác thực email. Kiểm tra hộp thư và nhấn link xác thực.
          </Text>
        </View>
      )}

      {/* Menu Card */}
      <View style={styles.menuCard}>
        <TouchableOpacity 
          style={styles.menuRow} 
          onPress={() => navigation.getParent()?.navigate('StudyMaterials')} 
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.infoTint }]}>
            <Ionicons name="book-outline" size={iconSizes.md} color={colors.info} />
          </View>
          <Text style={styles.menuRowText}>Tài liệu học</Text>
          <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuRow} 
          onPress={() => navigation.getParent()?.navigate('Comments')} 
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.successTint }]}>
            <Ionicons name="chatbubble-outline" size={iconSizes.md} color={colors.success} />
          </View>
          <Text style={styles.menuRowText}>Bình luận</Text>
          <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuRow} 
          onPress={() => navigation.getParent()?.navigate('Scoreboard')} 
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.warningTint }]}>
            <Ionicons name="bar-chart-outline" size={iconSizes.md} color={colors.warning} />
          </View>
          <Text style={styles.menuRowText}>Bảng điểm</Text>
          <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuRow, styles.menuRowLast]} 
          onPress={() => navigation.getParent()?.navigate('Limits')} 
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.secondaryTint }]}>
            <Ionicons name="settings-outline" size={iconSizes.md} color={colors.secondary} />
          </View>
          <Text style={styles.menuRowText}>Giới hạn & Gợi ý</Text>
          <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={iconSizes.md} color={colors.danger} style={styles.logoutIcon} />
        <Text style={styles.logoutBtnText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  content: { 
    paddingBottom: spacing.xxl 
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: colors.background 
  },
  header: {
    paddingTop: spacing.xxl + 40,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  avatarWrap: { 
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarPlaceholder: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: 'rgba(255,255,255,0.3)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: { 
    fontSize: 40, 
    fontWeight: '700', 
    color: '#fff' 
  },
  avatarOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    borderRadius: 50, 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  headerName: {
    ...typography.title,
    color: '#fff',
    marginBottom: spacing.xs,
  },
  headerEmail: {
    ...typography.body,
    color: 'rgba(255,255,255,0.9)',
  },
  emailBanner: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning, 
    padding: spacing.md, 
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
  },
  bannerIcon: {
    marginRight: spacing.sm,
  },
  emailBannerText: { 
    ...typography.bodySmall, 
    color: '#fff',
    flex: 1,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: spacing.md, 
    minHeight: minTouchTargetSize,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuRowText: { 
    ...typography.body, 
    color: colors.text,
    flex: 1,
    fontWeight: '500',
  },
  logoutBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface, 
    padding: spacing.md, 
    borderRadius: borderRadius.md, 
    minHeight: minTouchTargetSize,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  logoutIcon: {
    marginRight: spacing.sm,
  },
  logoutBtnText: { 
    color: colors.danger, 
    ...typography.button,
  },
});

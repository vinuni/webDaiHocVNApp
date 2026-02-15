import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { apiClient } from '../api/client';
import { colors, spacing, borderRadius, typography } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState(authUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await apiClient.get('/api/v1/user');
        if (mounted) setUser(u);
      } catch {
        if (mounted) setUser(authUser);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  if (loading && !user) {
    return (<View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>);
  }

  const name = (user && user.name) || (user && user.profile && user.profile.name) || '—';
  const email = (user && user.email) || '—';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tài khoản</Text>
      <View style={styles.card}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(name[0] || '?').toUpperCase()}</Text></View>
        <Text style={styles.label}>Họ tên</Text>
        <Text style={styles.value}>{name}</Text>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{email}</Text>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.logoutBtnText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  title: { ...typography.titleSmall, marginBottom: 16, color: colors.text },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  label: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
  value: { ...typography.body, color: colors.text, marginBottom: 4 },
  logoutBtn: { backgroundColor: colors.danger, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  logoutBtnText: { color: '#fff', ...typography.subtitle },
});

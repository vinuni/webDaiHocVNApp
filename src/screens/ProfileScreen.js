import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { apiClient } from '../api/client';

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
    return (<View style={styles.centered}><ActivityIndicator size="large" /></View>);
  }

  const name = (user && user.name) || (user && user.profile && user.profile.name) || '—';
  const email = (user && user.email) || '—';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tài khoản</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Họ tên</Text>
        <Text style={styles.value}>{name}</Text>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{email}</Text>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 24 },
  label: { fontSize: 12, color: '#666', marginTop: 8 },
  value: { fontSize: 16, marginBottom: 4 },
  logoutBtn: { backgroundColor: '#FF3B30', padding: 14, borderRadius: 8, alignItems: 'center' },
  logoutBtnText: { color: '#fff', fontWeight: '600' },
});

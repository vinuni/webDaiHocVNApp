import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { apiClient } from './src/api/client';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function App() {
  const [apiStatus, setApiStatus] = useState('checking...');

  useEffect(() => {
    apiClient.get('/api/v1/ping')
      .then(() => setApiStatus('OK'))
      .catch((e) => setApiStatus(`Error: ${e.status || e.message}`));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>webDaiHocVN73 App</Text>
      <Text style={styles.label}>API base (env):</Text>
      <Text style={styles.mono}>{API_BASE}</Text>
      <Text style={styles.label}>API check:</Text>
      <Text style={styles.mono}>{apiStatus}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 14, color: '#666', marginTop: 12 },
  mono: { fontFamily: 'monospace', marginTop: 4 },
});

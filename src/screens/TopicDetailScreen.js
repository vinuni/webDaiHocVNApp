import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { apiClient } from '../api/client';

export default function TopicDetailScreen({ route }) {
  const { id } = route.params || {};
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiClient.get('/api/v1/hoc-phan/' + id).then(setTopic).catch(() => setTopic(null)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (<View style={styles.centered}><ActivityIndicator size="large" /></View>);
  if (!topic) return (<View style={styles.centered}><Text>Khong tim thay.</Text></View>);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{topic.tenhocphan || topic.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold' },
});

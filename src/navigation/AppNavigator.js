import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../auth/AuthContext';
import { View, ActivityIndicator, Text } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import TopicsScreen from '../screens/TopicsScreen';
import TopicDetailScreen from '../screens/TopicDetailScreen';
import ExamTakeScreen from '../screens/ExamTakeScreen';
import ResultScreen from '../screens/ResultScreen';
import ScoreboardScreen from '../screens/ScoreboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LimitsScreen from '../screens/LimitsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Dang nhap' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Dang ky' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Trang chu' }} />
      <Tab.Screen name="Topics" component={TopicsScreen} options={{ title: 'Hoc phan' }} />
      <Tab.Screen name="Scoreboard" component={ScoreboardScreen} options={{ title: 'Bang diem' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Tai khoan' }} />
      <Tab.Screen name="Limits" component={LimitsScreen} options={{ title: 'Gioi han' }} />
    </Tab.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="TopicDetail" component={TopicDetailScreen} options={{ title: 'Chi tiet' }} />
      <Stack.Screen name="ExamTake" component={ExamTakeScreen} options={{ title: 'Lam bai' }} />
      <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Ket qua' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Dang tai...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

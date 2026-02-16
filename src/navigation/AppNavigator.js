import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../auth/AuthContext';
import { View, ActivityIndicator, Text, Image } from 'react-native';
import { colors, typography } from '../theme';

const logo = require('../../assets/logo.png');

function HeaderLogo() {
  return <Image source={logo} style={{ width: 120, height: 32 }} resizeMode="contain" />;
}

const headerOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '600', fontSize: 18 },
  headerShadowVisible: true,
};

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
import GamificationScreen from '../screens/GamificationScreen';
import HoiAiAskScreen from '../screens/HoiAiAskScreen';
import HoiAiHistoryScreen from '../screens/HoiAiHistoryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ ...headerOptions, headerShown: true }}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Đăng nhập' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Đăng ký' }} />
    </Stack.Navigator>
  );
}

function HoiAiStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="HoiAiAsk" component={HoiAiAskScreen} options={{ title: 'Hỏi AI' }} />
      <Stack.Screen name="HoiAiHistory" component={HoiAiHistoryScreen} options={{ title: 'Lịch sử hỏi đáp' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        ...headerOptions,
        headerShown: true,
        headerTitle: () => <HeaderLogo />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Trang chủ', tabBarLabel: 'Trang chủ' }} />
      <Tab.Screen name="Topics" component={TopicsScreen} options={{ title: 'Học phần', tabBarLabel: 'Học phần' }} />
      <Tab.Screen name="Gamification" component={GamificationScreen} options={{ title: 'Thành tích', tabBarLabel: 'Thành tích' }} />
      <Tab.Screen name="HoiAi" component={HoiAiStack} options={{ title: 'Hỏi AI', tabBarLabel: 'Hỏi AI', headerShown: false }} />
      <Tab.Screen name="Scoreboard" component={ScoreboardScreen} options={{ title: 'Bảng điểm', tabBarLabel: 'Bảng điểm' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Tài khoản', tabBarLabel: 'Tài khoản' }} />
      <Tab.Screen name="Limits" component={LimitsScreen} options={{ title: 'Giới hạn', tabBarLabel: 'Giới hạn' }} />
    </Tab.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="TopicDetail" component={TopicDetailScreen} options={{ title: 'Chi tiết' }} />
      <Stack.Screen name="ExamTake" component={ExamTakeScreen} options={{ title: 'Làm bài' }} />
      <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Kết quả' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 8, color: colors.textSecondary }}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

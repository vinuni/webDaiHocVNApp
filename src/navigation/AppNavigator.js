import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../auth/AuthContext';
import { View, ActivityIndicator, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, iconSizes } from '../theme';
import { HeaderLeft, HeaderRight } from '../components/AppHeader';

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
import HoiAiAskScreen from '../screens/HoiAiAskScreen';
import HoiAiHistoryScreen from '../screens/HoiAiHistoryScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import SearchScreen from '../screens/SearchScreen';
import StudyMaterialsScreen from '../screens/StudyMaterialsScreen';
import CommentsScreen from '../screens/CommentsScreen';
import MonThiScreen from '../screens/MonThiScreen';
import MenuScreen from '../screens/MenuScreen';
import CustomTabBar from '../components/CustomTabBar';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ ...headerOptions, headerShown: true }}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Đăng nhập' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Đăng ký' }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Quên mật khẩu' }} />
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
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        ...headerOptions,
        headerShown: true,
        headerTitle: () => null,
        headerLeft: () => <HeaderLeft />,
        headerRight: () => <HeaderRight />,
        headerRightContainerStyle: { flex: 1, justifyContent: 'flex-end' },
        headerStyle: { ...headerOptions.headerStyle, minHeight: 60 },
        sceneContainerStyle: { paddingTop: 0 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Trang chủ', tabBarLabel: 'Trang chủ' }} />
      <Tab.Screen name="MonThi" component={MonThiScreen} options={{ title: 'Môn thi', tabBarLabel: 'Môn thi' }} />
      <Tab.Screen name="Topics" component={TopicsScreen} options={{ title: 'Học phần', tabBarLabel: 'Học phần' }} />
      <Tab.Screen name="HoiAi" component={HoiAiStack} options={{ title: 'Hỏi AI', tabBarLabel: 'Hỏi AI', headerShown: false }} />
      <Tab.Screen name="Menu" component={MenuScreen} options={{ title: 'Menu', tabBarLabel: 'Menu' }} />
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
      <Stack.Screen name="StudyMaterials" component={StudyMaterialsScreen} options={{ title: 'Tài liệu học' }} />
      <Stack.Screen name="Comments" component={CommentsScreen} options={{ title: 'Bình luận' }} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Tìm kiếm' }} />
      <Stack.Screen name="Scoreboard" component={ScoreboardScreen} options={{ title: 'Bảng điểm' }} />
      <Stack.Screen name="Limits" component={LimitsScreen} options={{ title: 'Giới hạn' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Tài khoản' }} />
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
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainStack} />
        <Stack.Screen name="Auth" component={AuthStack} />
      </Stack.Navigator>
      {Platform.OS === 'web' && typeof document !== 'undefined' ? <BlurWhenTabHidden /> : null}
    </NavigationContainer>
  );
}

function BlurWhenTabHidden() {
  useEffect(() => {
    document.body.setAttribute('tabindex', '-1');
    const moveFocusAway = () => {
      const el = document.activeElement;
      if (!el || !el.closest || el === document.body) return;
      const inHidden = el.closest('[aria-hidden="true"]');
      if (!inHidden) return;
      el.blur?.();
      if (document.activeElement === el) {
        document.body.focus({ preventScroll: true });
      }
    };
    const observer = new MutationObserver(() => {
      const el = document.activeElement;
      if (el && el.closest && el.closest('[aria-hidden="true"]')) {
        moveFocusAway();
      }
    });
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['aria-hidden'] });
    const interval = setInterval(moveFocusAway, 100);
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);
  return null;
}

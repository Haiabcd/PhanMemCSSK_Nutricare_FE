import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MealPlan from '../screens/MealPlan';
import Suggestion from '../screens/Suggestion';
import Profile from '../screens/Profile';
import Guide from '../screens/Guide';
import Track from '../screens/Track';
import { colors } from '../constants/colors';

export type MainTabParamList = {
  MealPlan: undefined;
  Suggestions: undefined;
  Track: undefined;
  Guide: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function BottomTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true, // các tab khác vẫn có label
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.slate600,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: {
          height: 65,
          paddingBottom: 6,
          overflow: 'visible', // cho phép nút giữa tràn ra ngoài
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: string;
          switch (route.name) {
            case 'MealPlan':
              iconName = 'event-note';
              break;
            case 'Suggestions':
              iconName = 'restaurant';
              break;
            case 'Guide':
              iconName = 'menu-book';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            case 'Track':
              iconName = 'center-focus-strong';
              break;
            default:
              iconName = 'circle';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="MealPlan"
        component={MealPlan}
        options={{ tabBarLabel: 'Kế hoạch' }}
      />
      <Tab.Screen
        name="Suggestions"
        component={Suggestion}
        options={{ tabBarLabel: 'Gợi ý' }}
      />

      {/* Nút giữa nổi bật */}
      <Tab.Screen
        name="Track"
        component={Track}
        options={{
          tabBarLabel: () => null, // ẩn label riêng tab giữa
          tabBarIcon: () => (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.green,
                justifyContent: 'center',
                alignItems: 'center',
                transform: [{ translateY: -14 }], // trồi lên
                borderWidth: 3,
                borderColor: '#fff',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 10,
              }}
            >
              {/* Dùng 'add' giống ảnh demo; muốn cảm giác scan thì đổi thành 'center-focus-strong' */}
              <Icon name="add" size={28} color="#fff" />
            </View>
          ),
          tabBarItemStyle: { overflow: 'visible' },
        }}
      />

      <Tab.Screen
        name="Guide"
        component={Guide}
        options={{ tabBarLabel: 'Cẩm nang' }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{ tabBarLabel: 'Hồ sơ' }}
      />
    </Tab.Navigator>
  );
}

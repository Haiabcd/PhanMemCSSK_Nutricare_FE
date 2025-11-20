import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PlanNavigator from './PlanNavigator';
import SuggestionNavigator from './SuggestionNavigator';
import ProfileNavigator from './ProfileNavigator';
import TrackNavigator from './TrackNavigator';
import { colors } from '../constants/colors';
import GuideNavigator from './GuideNavigator';

export type MainTabParamList = {
  MealPlan: undefined;
  SuggestionNavigator: undefined;
  TrackNavigator: undefined;
  GuideNavigator: undefined;
  ProfileNavigator: undefined;
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
            case 'SuggestionNavigator':
              iconName = 'restaurant';
              break;
            case 'GuideNavigator':
              iconName = 'menu-book';
              break;
            case 'ProfileNavigator':
              iconName = 'person';
              break;
            case 'TrackNavigator':
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
        component={PlanNavigator}
        options={{ tabBarLabel: 'Kế hoạch' }}
      />

      <Tab.Screen
        name="SuggestionNavigator"
        component={SuggestionNavigator}
        options={{ tabBarLabel: 'Gợi ý' }}
      />

      {/* Nút giữa nổi bật */}
      <Tab.Screen
        name="TrackNavigator"
        component={TrackNavigator}
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
        name="GuideNavigator"
        component={GuideNavigator}
        options={{ tabBarLabel: 'Cẩm nang' }}
      />
      <Tab.Screen
        name="ProfileNavigator"
        component={ProfileNavigator}
        options={{ tabBarLabel: 'Hồ sơ' }}
      />
    </Tab.Navigator>
  );
}

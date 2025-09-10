import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from 'react-native-vector-icons/MaterialIcons';
import MealPlan from "../screens/MealPlan";
import Suggestion from "../screens/Suggestion";
import Profile from "../screens/Profile";
import Guide from "../screens/Guide";
import { colors } from "../constants/colors";

export type MainTabParamList = {
    MealPlan: undefined;
    Suggestions: undefined;
    Guide: undefined;
    Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function BottomTabsNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: colors.green,
                tabBarInactiveTintColor: colors.slate600,
                tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
                tabBarStyle: { height: 65, paddingBottom: 6 },
                tabBarIcon: ({ focused, color, size }) => {
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
                        default:
                            iconName = 'circle';
                    }
                    return <Icon name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="MealPlan" component={MealPlan} options={{tabBarLabel: "Thực đơn"}} />
            <Tab.Screen name="Suggestions" component={Suggestion} options={{tabBarLabel: "Gợi ý" }} />
            <Tab.Screen name="Guide" component={Guide} options={{tabBarLabel: "Cẩm nang" }} />
            <Tab.Screen name="Profile" component={Profile} options={{tabBarLabel: "Hồ sơ" }} />
        </Tab.Navigator>
    );
}
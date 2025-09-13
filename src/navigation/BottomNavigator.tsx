import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import Ionicons from "react-native-vector-icons/Ionicons";
import MealPlan from "../screens/MealPlan";
import Suggestion from "../screens/Suggestion";
import Profile from "../screens/Profile";
import Guide from "../screens/Guide";
import Track from "../screens/Track";


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
            // screenOptions={({ route }) => ({
            screenOptions={() => ({
                headerShown: false,
                tabBarActiveTintColor: "#16a34a",
                tabBarInactiveTintColor: "#94a3b8",
                tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
                tabBarStyle: { height: 60, paddingBottom: 6 },
                // tabBarIcon: ({ color, size, focused }) => {
                //     let name: string = "ios-home-outline";
                //     switch (route.name) {
                //         case "MealPlan":
                //             name = focused ? "ios-restaurant" : "ios-restaurant-outline";
                //             break;
                //         case "Track":
                //             name = focused ? "ios-walk" : "ios-walk-outline";
                //             break;
                //         case "Suggestions":
                //             name = focused ? "ios-search" : "ios-search-outline";
                //             break;
                //         case "Progress":
                //             name = focused ? "ios-stats" : "ios-stats-outline";
                //             break;
                //         case "Profile":
                //             name = focused ? "ios-person" : "ios-person-outline";
                //             break;
                //     }
                //     return <Ionicons name={name} size={size ?? 22} color={color} />;
                // }
            })}
        >
            <Tab.Screen name="MealPlan" component={MealPlan} options={{ title: "Meal Plan" }} />
            <Tab.Screen name="Suggestions" component={Suggestion} options={{ title: "Suggestions" }} />
            <Tab.Screen name="Track" component={Track} options={{ title: "Track" }} />
            <Tab.Screen name="Guide" component={Guide} options={{ title: "Guide" }} />
            <Tab.Screen name="Profile" component={Profile} options={{ title: "Profile" }} />
        </Tab.Navigator>
    );
}

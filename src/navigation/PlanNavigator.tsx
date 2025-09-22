
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MealPlan from '../screens/MealPlan';
import NotificationScreen from '../screens/Notifications';
import Statistics from '../screens/Statistics';


export type PlanStackParamList = {
    Plan: undefined;
    Notification: undefined;
    Statistics: undefined;
};

const Stack = createNativeStackNavigator<PlanStackParamList>();

export default function PlanNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName="Plan"
        >
            <Stack.Screen name="Plan" component={MealPlan} />
            <Stack.Screen name="Notification" component={NotificationScreen} />
            <Stack.Screen name="Statistics" component={Statistics} />
        </Stack.Navigator>
    );
}

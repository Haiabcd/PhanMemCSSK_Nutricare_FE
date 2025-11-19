import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MealPlan from '../screens/MealPlan';
import NotificationScreen from '../screens/Notifications';
import Statistics from '../screens/Statistics';
import MealLogDetail from '../screens/MealLogDetail';

export type PlanStackParamList = {
  Plan: undefined;
  Notification: undefined;
  Statistics: undefined;
  MealLogDetail: {
    id: string;
    suggestionDesc?: string;
    suggestionSwapText?: string;
  };
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
      <Stack.Screen name="MealLogDetail" component={MealLogDetail} />
    </Stack.Navigator>
  );
}

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Suggestion from '../screens/Suggestion';
import MealLogDetail from '../screens/MealLogDetail';
import NotificationScreen from '../screens/Notifications';

export type SuggestionStackParamList = {
  Suggest: undefined;
  MealLogDetail: {
    id: string;
    suggestionDesc?: string;
    suggestionSwapText?: string;
  };
  Notification: undefined;
};

const Stack = createNativeStackNavigator<SuggestionStackParamList>();

export default function GuideNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Suggest"
    >
      <Stack.Screen name="Suggest" component={Suggestion} />
      <Stack.Screen name="MealLogDetail" component={MealLogDetail} />
      <Stack.Screen name="Notification" component={NotificationScreen} />
    </Stack.Navigator>
  );
}

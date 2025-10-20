import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Guide from '../screens/Guide';
import ChatAI from '../screens/ChatAI';
import MealLogDetail from '../screens/MealLogDetail';
import Video from '../screens/Video';
import Newspaper from '../screens/Newspaper';
import NotificationScreen from '../screens/Notifications';

export type GuideStackParamList = {
  Guide: undefined;
  ChatAI: undefined;
  Video: undefined;
  MealLogDetail: undefined;
  Newspaper: undefined;
  Notification: undefined;
};

const Stack = createNativeStackNavigator<GuideStackParamList>();

export default function GuideNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Guide"
    >
      <Stack.Screen name="Guide" component={Guide} />
      <Stack.Screen name="ChatAI" component={ChatAI} />
      <Stack.Screen name="MealLogDetail" component={MealLogDetail} />
      <Stack.Screen name="Video" component={Video} />
      <Stack.Screen name="Newspaper" component={Newspaper} />
      <Stack.Screen name="Notification" component={NotificationScreen} />
    </Stack.Navigator>
  );
}

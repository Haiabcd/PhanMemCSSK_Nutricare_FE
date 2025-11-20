import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Track from '../screens/Track';
import NotificationScreen from '../screens/Notifications';

export type ProfileStackParamList = {
  Track: undefined;
  Notification: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function TrackeNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Track"
    >
      <Stack.Screen name="Track" component={Track} />
      <Stack.Screen name="Notification" component={NotificationScreen} />
    </Stack.Navigator>
  );
}

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Guide from '../screens/Guide';
import ChatAI from '../screens/ChatAI';


export type GuideStackParamList = {
    Guide: undefined;
    ChatAI: undefined;
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
        </Stack.Navigator>
    );
}

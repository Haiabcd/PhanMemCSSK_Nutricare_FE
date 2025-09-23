import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Suggestion from '../screens/Suggestion';
import MealLogDetail from '../screens/MealLogDetail';


export type SuggestionStackParamList = {
    Suggest: undefined;
    MealLogDetail: undefined;
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
        </Stack.Navigator>
    );
}

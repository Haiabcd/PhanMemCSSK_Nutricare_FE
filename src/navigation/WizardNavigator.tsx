// navigation/WizardNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { WizardProvider } from "../context/WizardContext";
import { StepGenderScreen } from "../screens/stepInit/StepGender";
import { StepNameScreen } from "../screens/stepInit/StepName";
import { StepAgeScreen } from "../screens/stepInit/StepAge";
import BottomNavigator from "./BottomNavigator";



export type WizardStackParamList = {
    StepName: undefined;
    StepAge: undefined;
    StepGender: undefined;
    StepHighWeigh: undefined;
    StepTarget: undefined;
    StepLevel: undefined;
    Home: undefined;
};

const Stack = createNativeStackNavigator<WizardStackParamList>();

export default function WizardNavigator() {
    return (
        <WizardProvider>
            <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="StepName">
                <Stack.Screen name="StepName" component={StepNameScreen} />
                <Stack.Screen name="StepAge" component={StepAgeScreen} />
                <Stack.Screen name="StepGender" component={StepGenderScreen} />
                <Stack.Screen name="Home" component={BottomNavigator} />
            </Stack.Navigator>
        </WizardProvider>
    );
}

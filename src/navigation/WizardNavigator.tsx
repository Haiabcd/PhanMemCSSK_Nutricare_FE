// navigation/WizardNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WizardProvider } from '../context/WizardContext';
import StepGenderScreen from '../screens/stepInit/StepGender';
import StepNameScreen from '../screens/stepInit/StepName';
import StepAgeScreen from '../screens/stepInit/StepAge';
import StepHeightScreen from '../screens/stepInit/StepHeight';
import StepWeightScreen from '../screens/stepInit/StepWeight';
import StepTargetScreen from '../screens/stepInit/StepTarget';
import StepLevelActivityScreen from '../screens/stepInit/StepLevelActivity';
import StepConditionScreen from '../screens/stepInit/StepCondition';
import StepAllergiesScreen from '../screens/stepInit/StepAllergy';
import StepDoneScreen from '../screens/stepInit/StepDone';

export type WizardStackParamList = {
  StepName: undefined;
  StepAge: undefined;
  StepGender: undefined;
  StepWeight: undefined;
  StepHeight: undefined;
  StepTarget: undefined;
  StepLevelActivity: undefined;
  StepCondition: undefined;
  StepAllergy: undefined;
  Done: undefined;
};

const Stack = createNativeStackNavigator<WizardStackParamList>();

export default function WizardNavigator() {
  return (
    <WizardProvider>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Done"
      >
        <Stack.Screen name="StepName" component={StepNameScreen} />
        <Stack.Screen name="StepGender" component={StepGenderScreen} />
        <Stack.Screen name="StepAge" component={StepAgeScreen} />
        <Stack.Screen name="StepHeight" component={StepHeightScreen} />
        <Stack.Screen name="StepWeight" component={StepWeightScreen} />
        <Stack.Screen name="StepCondition" component={StepConditionScreen} />
        <Stack.Screen name="StepAllergy" component={StepAllergiesScreen} />
        <Stack.Screen
          name="StepLevelActivity"
          component={StepLevelActivityScreen}
        />
        <Stack.Screen name="StepTarget" component={StepTargetScreen} />
        <Stack.Screen name="Done" component={StepDoneScreen} />
      </Stack.Navigator>
    </WizardProvider>
  );
}

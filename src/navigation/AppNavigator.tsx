import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Welcome from '../screens/Welcome';
import WizardNavigator from './WizardNavigator';
import BottomNavigator from './BottomNavigator';

export type RootStackParamList = {
  Welcome: undefined;
  Wizard: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Welcome">
      <Stack.Screen
        name="Welcome"
        component={Welcome}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Wizard"
        component={WizardNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Home"
        component={BottomNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

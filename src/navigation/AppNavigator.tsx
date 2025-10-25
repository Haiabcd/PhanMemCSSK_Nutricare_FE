import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Welcome from '../screens/Welcome';
import WizardNavigator from './WizardNavigator';
import BottomNavigator from './BottomNavigator';
import OAuthReturn from '../screens/OAuthReturn';
import OAuthError from '../screens/OAuthError';

export type RootStackParamList = {
  Welcome: undefined;
  Wizard: undefined;
  Home: undefined;
  OAuthReturn:
    | { kind?: 'first' | 'upgrade' | 'returning'; x?: string }
    | undefined;
  OAuthError: { reason?: string } | undefined;
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
      <Stack.Screen
        name="OAuthReturn"
        component={OAuthReturn}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OAuthError"
        component={OAuthError}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

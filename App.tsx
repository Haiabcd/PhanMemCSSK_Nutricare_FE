import './src/config/api';
import React, { useEffect, useState } from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import messaging from '@react-native-firebase/messaging';
import { AppNavigator } from './src/navigation/AppNavigator';
import BottomNavigator from './src/navigation/BottomNavigator';
import OAuthReturn from './src/screens/OAuthReturn';
import OAuthError from './src/screens/OAuthError';
import { FirebaseContext } from './src/context/FirebaseContext';


import {
  applyAuthHeaderFromKeychain,
  isTokenExpiredSecure,
  removeTokenSecure,
  hasTokenSecure,
  getTokenSecure,
} from './src/config/secureToken';
import { refreshWithStoredToken } from './src/services/auth.service';
import { HeaderProvider } from './src/context/HeaderProvider';
import {
  schedulePrePostRange,
  registerForegroundHandlers,
  registerBackgroundHandler,
  ensureNotificationReady,
} from './src/notifications/notifeeClient';
import {
  registerHydrationForeground,
  registerHydrationBackground,
  bootstrapHydrationSchedule,
} from './src/notifications/hydrationAuto';

import { navigationRef } from './src/navigation/RootNavigation';
import { AuthProvider, useAuth } from './src/context/AuthContext';

registerBackgroundHandler();

const RootStack = createNativeStackNavigator();

function AppInner() {
  const [ready, setReady] = useState(false);
  const { isAuthed, setIsAuthed } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);


  useEffect(() => {
    (async () => {
      await applyAuthHeaderFromKeychain();

      if (__DEV__) {
        try {
          const t = await getTokenSecure();
          console.log('[AUTH DEBUG] TokenData at startup:', t);
        } catch (e) {
          console.log('[AUTH DEBUG] Cannot read token from Keychain:', e);
        }
      }

      let authed = await hasTokenSecure();
      if (authed) {
        try {
          const willExpire = await isTokenExpiredSecure();
          if (willExpire) await refreshWithStoredToken();
          authed = true;
        } catch (e: any) {
          const status = e?.response?.status ?? e?.status;
          if (status === 400 || status === 401) {
            await removeTokenSecure();
            authed = false;
          } else {
            authed = await hasTokenSecure();
          }
        }
      }

      setIsAuthed(authed);
      setReady(true);
    })();
  }, [setIsAuthed]);

  //firebase
  useEffect(() => {
    (async () => {
      try {
        await messaging().requestPermission();
        const token = await messaging().getToken();
        setFcmToken(token);
      } catch (e) {
        console.warn('FCM error', e);
      }
    })();
  }, []);


  // Notifications giữ nguyên
  useEffect(() => {
    const unsub = registerForegroundHandlers();
    return () => unsub?.();
  }, []);

  useEffect(() => {
    if (!ready) return;
    ensureNotificationReady()
      .then(() => schedulePrePostRange(7))
      .catch(console.warn);
  }, [ready]);

  useEffect(() => {
    if (!ready || !isAuthed) return;

    const unsubFG = registerHydrationForeground();
    const unsubBG = registerHydrationBackground();

    bootstrapHydrationSchedule(7).catch(console.log);

    return () => {
      unsubFG && unsubFG();
    };
  }, [ready, isAuthed]);

  if (!ready) return null;

  const linking: LinkingOptions<any> = {
    prefixes: ['nutricare://'],
    config: {
      screens: {
        OAuthReturn: {
          path: 'oauth/:kind',
        },
        OAuthError: 'oauth/error',
      },
    },
  };

  return (
    <FirebaseContext.Provider value={{ fcmToken }}>
      <HeaderProvider>
        <NavigationContainer
          linking={linking}
          ref={navigationRef}
          onStateChange={() => {
            const r = navigationRef.getCurrentRoute();
          }}
        >
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            <RootStack.Screen name="Main">
              {(props: any) =>
                isAuthed ? (
                  <BottomNavigator {...props} />
                ) : (
                  <AppNavigator {...props} />
                )
              }
            </RootStack.Screen>
            <RootStack.Screen name="OAuthReturn" component={OAuthReturn} />
            <RootStack.Screen name="OAuthError" component={OAuthError} />
          </RootStack.Navigator>

        </NavigationContainer>
      </HeaderProvider>
    </FirebaseContext.Provider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

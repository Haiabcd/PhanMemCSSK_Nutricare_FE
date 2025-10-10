import './src/config/api';
import React, { useEffect, useState } from 'react';
import { AppNavigator } from './src/navigation/AppNavigator';
import BottomNavigator from './src/navigation/BottomNavigator';
import { NavigationContainer } from '@react-navigation/native';
import {
  applyAuthHeaderFromKeychain,
  isTokenExpiredSecure,
  removeTokenSecure,
  hasTokenSecure,
  getTokenSecure,
} from './src/config/secureToken';
import { refreshWithStoredToken } from './src/services/auth.service';

function App() {
  const [ready, setReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    (async () => {
      // 1) Gắn Authorization header nếu đã có token từ trước
      await applyAuthHeaderFromKeychain();

      // (DEBUG) In token đang lưu trong Keychain
      if (__DEV__) {
        try {
          const t = await getTokenSecure();
          console.log('[AUTH DEBUG] TokenData at startup:', t);
        } catch (e) {
          console.log('[AUTH DEBUG] Cannot read token from Keychain:', e);
        }
      }

      // 2) Kiểm tra đang có access token không
      let authed = await hasTokenSecure();

      // 3) Nếu có token nhưng sắp/hết hạn → thử refresh
      if (authed) {
        try {
          const willExpire = await isTokenExpiredSecure();
          if (willExpire) {
            await refreshWithStoredToken();
          }
          authed = true;
        } catch (e: any) {
          const status = e?.response?.status ?? e?.status;
          if (status === 400 || status === 401) {
            console.log('Gọi removeTokenSecure ở App.tsx');
            await removeTokenSecure();
            authed = false;
          } else {
            console.log('Lỗi không xác định khi refresh token:', e);
            authed = await hasTokenSecure();
          }
        }
      }
      setIsAuthed(authed);
      setReady(true);
    })();
  }, []);

  if (!ready) return null;

  return (
    <NavigationContainer>
      {isAuthed ? <BottomNavigator /> : <AppNavigator />}
    </NavigationContainer>
  );
}

export default App;

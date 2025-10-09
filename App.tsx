import React, { useEffect, useState } from 'react';
import { AppNavigator } from './src/navigation/AppNavigator';
import {
  applyAuthHeaderFromKeychain,
  isTokenExpiredSecure,
  removeTokenSecure,
} from './src/config/secureToken';
import { refreshWithStoredToken } from './src/services/auth.service';

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      // 1) Gắn Authorization header nếu đã có token từ trước
      await applyAuthHeaderFromKeychain();
      // 2) Nếu access token sắp/hết hạn -> thử refresh bằng refresh token đã lưu
      try {
        if (await isTokenExpiredSecure()) {
          await refreshWithStoredToken(); // tự lưu token mới + set header
        }
      } catch (e) {
        // refresh thất bại (hết hạn refresh/401/timeout, ...) -> xoá token để quay về màn hình login
        await removeTokenSecure();
      }

      setReady(true);
    })();
  }, []);

  if (!ready) return null;

  return <AppNavigator />;
}

export default App;

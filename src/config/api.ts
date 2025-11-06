import axios from 'axios';
import { Platform } from 'react-native';
import {
  removeTokenSecure,
  getTokenSecure, registerAuthHeaderSetter
} from './secureToken';
import { refreshWithStoredToken } from '../services/auth.service';


/**
 * ⚙️ BASE_URL cho React Native CLI:
 * - Android Emulator → 10.0.2.2
 * - iOS Simulator → localhost
 * - Thiết bị thật → IP LAN máy dev (vd: 192.168.1.15)
 */
// const LOCAL_IP = '192.168.110.253';
const LOCAL_IP = '192.168.110.187';  // Bo
// const LOCAL_IP = '10.0.2.2'; 
const PORT = 8080;

export const BASE_URL =
  Platform.OS === 'android'
    ? `http://${LOCAL_IP}:${PORT}`
    : `http://localhost:${PORT}`;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
  },
  timeout: 120000,
});




registerAuthHeaderSetter((auth?: string) => {
  if (auth) {
    api.defaults.headers.common.Authorization = auth;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
});

// Các endpoint không chạy refresh khi 401
const AUTH_WHITELIST = ['/auths/onboarding', '/auths/refresh', '/auths/logout','/auths/google/redeem'];


let isRefreshing = false;

let pendingQueue: Array<(newAccess?: string, err?: any, tokenType?: string) => void> = [];

function shouldSkipRefresh(url?: string) {
  if (!url) return false;
  return AUTH_WHITELIST.some(p => url.includes(p));
}


api.interceptors.response.use(
  res => res,
  async error => {
    const { response, config } = error || {};
    const status = response?.status;
    const reqUrl = config?.url as string | undefined;

    console.error(
      '❌ API error:',
      {
        url: config?.url,
        method: config?.method,
        status: response?.status,
        data: response?.data,
        code: error?.code,       // ERR_NETWORK / ECONNABORTED / ERR_CANCELED
        message: error?.message, // "Network Error" / "timeout exceeded"...
      }
    );

    // Không refresh cho endpoint public hoặc không phải 401
    if (status !== 401 || shouldSkipRefresh(reqUrl)) {
      return Promise.reject(error);
    }

    // Tránh lặp vô hạn trên cùng request
    if ((config as any).__isRetry) {
      return Promise.reject(error);
    }

    // Kiểm tra có refresh token không
    const cur = await getTokenSecure();
    console.log('[INTC] token from Keychain at 401:', cur);
    if (!cur?.refreshToken) {
      console.log('Gọi removeTokenSecure ở api.ts interceptor lỗi 401');
      await removeTokenSecure();
      return Promise.reject(new Error('No refresh token available'));
    }

    const originalRequest = config!;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((newAccess?: string, err?: any, tokenType?: string) => {
          if (err || !newAccess) {
            return reject(err ?? new Error('Token refresh failed'));
          }
          (originalRequest as any).__isRetry = true;

          const headers: any = originalRequest.headers || {};
          if (typeof headers.set === 'function') {
            headers.set('Authorization', `${tokenType ?? 'Bearer'} ${newAccess}`);
          } else {
            headers['Authorization'] = `${tokenType ?? 'Bearer'} ${newAccess}`;
          }
          originalRequest.headers = headers;

          resolve(api.request(originalRequest));
        });
      });
    }
    try {
      isRefreshing = true;

      const res = await refreshWithStoredToken();
      const newAccess = res.data?.accessToken;
      const newType = res.data?.tokenType ?? 'Bearer';

      pendingQueue.forEach(cb => cb(newAccess, undefined, newType));
      pendingQueue = [];

      (originalRequest as any).__isRetry = true;

      const headers: any = originalRequest.headers || {};
      if (typeof headers.set === 'function') {
        headers.set('Authorization', `${newType} ${newAccess}`);
      } else {
        headers['Authorization'] = `${newType} ${newAccess}`;
      }
      originalRequest.headers = headers;

      return api.request(originalRequest);

    } catch (e) {
      await removeTokenSecure();
      pendingQueue.forEach(cb => cb(undefined, e));
      pendingQueue = [];
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  },
);


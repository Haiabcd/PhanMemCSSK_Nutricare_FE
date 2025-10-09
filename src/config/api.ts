import axios from 'axios';
import { Platform } from 'react-native';
import { removeTokenSecure, getTokenSecure, saveTokenPairFromBE } from './secureToken';
import { refreshWithStoredToken } from '../services/auth.service';

/**
 * ⚙️ BASE_URL cho React Native CLI:
 * - Android Emulator → 10.0.2.2
 * - iOS Simulator → localhost
 * - Thiết bị thật → IP LAN máy dev (vd: 192.168.1.15)
 */

// const LOCAL_IP = '192.168.110.253';
const LOCAL_IP = '192.168.110.187';
const PORT = 8080;

export const BASE_URL =
  Platform.OS === 'android'
    ? `http://${LOCAL_IP}:${PORT}`
    : `http://localhost:${PORT}`;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Các endpoint không chạy refresh khi 401
const AUTH_WHITELIST = [
  '/auth/onboarding',
  '/auth/refresh',
  '/auth/google/start',
  '/auth/google/callback',
];

let isRefreshing = false;
let pendingQueue: Array<(token?: string) => void> = [];

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

    console.error('❌ API error:', response?.data || error.message || error);

    // Không refresh cho các endpoint public
    if (status !== 401 || shouldSkipRefresh(reqUrl)) {
      return Promise.reject(error);
    }

    // Tránh lặp vô hạn
    if ((config as any).__isRetry) {
      return Promise.reject(error);
    }

    // Không có refresh token -> xoá token & fail luôn
    const cur = await getTokenSecure();
    if (!cur?.refreshToken) {
      await removeTokenSecure();
      return Promise.reject(new Error('No refresh token available'));
    }

    // Hàng đợi nếu đang refresh
    const originalRequest = config!;
    if (isRefreshing) {
      return new Promise(resolve => {
        pendingQueue.push((newAccess?: string) => {
          if (newAccess) {
            (originalRequest as any).__isRetry = true;
            originalRequest.headers = {
              ...(originalRequest.headers || {}),
              Authorization: `${cur.tokenType ?? 'Bearer'} ${newAccess}`,
            };
          }
          resolve(api(originalRequest));
        });
      });
    }

    // Thực hiện refresh
    try {
      isRefreshing = true;
      const res = await refreshWithStoredToken();
      await saveTokenPairFromBE(res.data); // lưu cặp token mới

      // phát cho queue
      const newAccess = res.data?.accessToken;
      pendingQueue.forEach(cb => cb(newAccess));
      pendingQueue = [];

      // replay request cũ
      (originalRequest as any).__isRetry = true;
      originalRequest.headers = {
        ...(originalRequest.headers || {}),
        Authorization: `${res.data?.tokenType ?? 'Bearer'} ${newAccess}`,
      };
      return api(originalRequest);
    } catch (e) {
      await removeTokenSecure();
      pendingQueue.forEach(cb => cb());
      pendingQueue = [];
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  },
);

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
const LOCAL_IP = '192.168.110.253';
// const LOCAL_IP = '192.168.110.187';  // Bo
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
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

registerAuthHeaderSetter((auth?: string) => {
  if (auth) {
    api.defaults.headers.common.Authorization = auth;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
});

// Các endpoint không chạy refresh khi 401
const AUTH_WHITELIST = ['/auths/onboarding', '/auths/refresh'];

// Trạng thái refresh + hàng đợi khi refresh đang diễn ra
let isRefreshing = false;
/**
 * Callback: (newAccess?: string, err?: any, tokenType?: string) => void
 * - newAccess: access token mới (nếu refresh OK)
 * - err: lỗi refresh (nếu có)
 * - tokenType: loại token mới (mặc định 'Bearer' nếu BE không trả về)
 */
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

    // Nếu đang refresh, xếp request hiện tại vào hàng đợi
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((newAccess?: string, err?: any, tokenType?: string) => {
          if (err || !newAccess) {
            return reject(err ?? new Error('Token refresh failed'));
          }
          (originalRequest as any).__isRetry = true;

          // 👇 Set header kiểu Axios v1-safe
          const headers: any = originalRequest.headers || {};
          if (typeof headers.set === 'function') {
            headers.set('Authorization', `${tokenType ?? 'Bearer'} ${newAccess}`);
          } else {
            headers['Authorization'] = `${tokenType ?? 'Bearer'} ${newAccess}`;
          }
          originalRequest.headers = headers;

          // 👇 Dùng api.request thay vì api(originalRequest)
          resolve(api.request(originalRequest));
        });
      });
    }

    // Thực hiện refresh (chỉ 1 luồng)
    try {
      isRefreshing = true;

      // Gọi refresh
      const res = await refreshWithStoredToken();
      const newAccess = res.data?.accessToken;
      const newType = res.data?.tokenType ?? 'Bearer';

      // Phát token mới cho các request đang chờ (thành công)
      pendingQueue.forEach(cb => cb(newAccess, undefined, newType));
      pendingQueue = [];

      // Replay request cũ với header mới
      (originalRequest as any).__isRetry = true;

      // 👇 Set header kiểu Axios v1-safe
      const headers: any = originalRequest.headers || {};
      if (typeof headers.set === 'function') {
        headers.set('Authorization', `${newType} ${newAccess}`);
      } else {
        headers['Authorization'] = `${newType} ${newAccess}`;
      }
      originalRequest.headers = headers;

      // 👇 Dùng api.request
      return api.request(originalRequest);

    } catch (e) {
      // Refresh thất bại -> xóa token, báo fail cho toàn queue (không replay)
      console.log('Gọi removeTokenSecure ở api.ts interceptor lỗi 401 trong khối catch');
      // await removeTokenSecure();
      pendingQueue.forEach(cb => cb(undefined, e));
      pendingQueue = [];
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  },
);


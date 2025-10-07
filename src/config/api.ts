import axios from 'axios';
import { Platform } from 'react-native';

/**
 * ⚙️ BASE_URL cho React Native CLI:
 * - Android Emulator → dùng 10.0.2.2 (thay cho localhost)
 * - iOS Simulator → có thể dùng http://localhost
 * - Thiết bị thật → dùng IP LAN thật của máy tính (ví dụ: 192.168.1.15)
 *
 * Cách kiểm tra IP LAN:
 * - Windows: mở CMD → gõ `ipconfig` → lấy IPv4 Address (ví dụ 192.168.1.15)
 * - Mac/Linux: `ifconfig` hoặc `ip a`
 */

const LOCAL_IP = '192.168.110.253';
const PORT = 8080;

export const BASE_URL =
  Platform.OS === 'android'
    ? `http://${LOCAL_IP}:${PORT}` // thiết bị thật hoặc emulator Android
    : `http://localhost:${PORT}`; // iOS Simulator

// ⚙️ Tạo instance axios
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 10000, // tránh treo request
});

// 🧠 Optional: interceptor log hoặc token (có thể thêm sau)
api.interceptors.response.use(
  response => response,
  error => {
    console.error(
      '❌ API error:',
      error?.response?.data || error.message || error
    );
    return Promise.reject(error);
  }
);

import { api } from '../config/api';
import type {
  ApiResponse,
  OnboardingRequest,
  OnboardingResponse,
  RefreshRequest,
  TokenPairResponse
} from '../types/types';
import {
  saveTokenPairFromBE,
  removeTokenSecure,
  getTokenSecure, 
  applyAuthHeaderFromKeychain
} from '../config/secureToken';

// Bắt đầu ngay (onboarding)
export async function onboarding(
  payload: OnboardingRequest
): Promise<ApiResponse<OnboardingResponse>> {
  const res = await api.post<ApiResponse<OnboardingResponse>>('/auths/onboarding', payload);

  const tokenResponse = res.data?.data?.tokenResponse ?? null;
  console.log('Onboarding tokenResponse:', tokenResponse);
  if (tokenResponse) {
    await saveTokenPairFromBE(tokenResponse);
    await applyAuthHeaderFromKeychain();
  } else {
    console.log('Gọi removeTokenSecure ở auth.service.ts hàm onboarding');
    await removeTokenSecure();
    console.log('No token received from onboarding');
  }
  return res.data;
}

// Đổi token (refresh với refreshToken truyền vào)
export async function refreshTokens(
  payload: RefreshRequest
): Promise<ApiResponse<TokenPairResponse>> {
  const res = await api.post<ApiResponse<TokenPairResponse>>('/auths/refresh', payload, 
  {
    headers: { Authorization: undefined }, 
  });
  const pair = res.data?.data ?? null;
  console.log('Gọi refresh token:', pair);
  if (pair) {
    await saveTokenPairFromBE(pair);
    await applyAuthHeaderFromKeychain();
  } else {
    console.log('Gọi removeTokenSecure ở auth.service.ts hàm refreshTokens');
    await removeTokenSecure();
    console.log('No token received from refresh endpoint');
  }
  return res.data;
}

// Tự lấy refreshToken từ secure storage rồi gọi refreshTokens
export async function refreshWithStoredToken(): Promise<ApiResponse<TokenPairResponse>> {
  const cur = await getTokenSecure();
  console.log('Current token from secure storage:', cur);
  if (!cur?.refreshToken) {
    console.log('Gọi removeTokenSecure ở auth.service.ts hàm refreshWithStoredToken');
    await removeTokenSecure();
    throw new Error('No refresh token available');
  }
  return refreshTokens({ refreshToken: cur.refreshToken });
}

// export async function logout() {
//   // await removeTokenSecure();
//   console.log('Logged out, token removed from secure storage');
// }

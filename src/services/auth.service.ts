import { api } from '../config/api';
import type { ApiResponse, OnboardingRequest, OnboardingResponse, RefreshRequest, TokenPairResponse } from '../types/types';
import {
  saveTokenPairFromBE,
  removeTokenSecure,
  getTokenSecure
} from '../config/secureToken';

//Bắt đâu ngay
export async function onboarding(
  payload: OnboardingRequest
): Promise<ApiResponse<OnboardingResponse>> {
  const res = await api.post<ApiResponse<OnboardingResponse>>('/auths/onboarding', payload);

  const tokenResponse = res.data?.data?.tokenResponse ?? null;
  if (tokenResponse) {
    await saveTokenPairFromBE(tokenResponse);
  } else {
    await removeTokenSecure();
  }
  return res.data;
}

//Đổi token
export async function refreshTokens(
  payload: RefreshRequest
): Promise<ApiResponse<TokenPairResponse>> {
  const res = await api.post<ApiResponse<TokenPairResponse>>('/auths/refresh', payload);

  const pair = res.data?.data ?? null;
  if (pair) {
    await saveTokenPairFromBE(pair); 
  } else {
    await removeTokenSecure(); 
  }
  return res.data;
}

//Tự lấy refreshToken
export async function refreshWithStoredToken(): Promise<ApiResponse<TokenPairResponse>> {
  const cur = await getTokenSecure();
  if (!cur?.refreshToken) {
    await removeTokenSecure();
    throw new Error('No refresh token available');
  }
  return refreshTokens({ refreshToken: cur.refreshToken });
}

export async function logout() {
  await removeTokenSecure();
}

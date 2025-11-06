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
import type { GoogleStartData } from '../types/auth.type';

// Bắt đầu ngay (onboarding)
export async function onboarding(
  payload: OnboardingRequest
): Promise<ApiResponse<OnboardingResponse>> {
  const res = await api.post<ApiResponse<OnboardingResponse>>('/auths/onboarding', payload);

  const tokenResponse = res.data?.data?.tokenResponse ?? null;
  if (tokenResponse) {
    await saveTokenPairFromBE(tokenResponse);
    await applyAuthHeaderFromKeychain();
  } else {
    await removeTokenSecure();
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
  if (pair) {
    await saveTokenPairFromBE(pair);
    await applyAuthHeaderFromKeychain();
  } else {
    await removeTokenSecure();
  }
  return res.data;
}

// Tự lấy refreshToken từ secure storage rồi gọi refreshTokens
export async function refreshWithStoredToken(): Promise<ApiResponse<TokenPairResponse>> {
  const cur = await getTokenSecure();
  if (!cur?.refreshToken) {
    await removeTokenSecure();
    throw new Error('No refresh token available');
  }
  return refreshTokens({ refreshToken: cur.refreshToken });
}

export async function startGoogleOAuth(
  device?: string,
  upgrade?: boolean,      
  signal?: AbortSignal
): Promise<ApiResponse<GoogleStartData>> {
  const params: Record<string, any> = {};
  if (device) params.device = device;
  if (typeof upgrade === 'boolean') params.upgrade = upgrade;

  const res = await api.post<ApiResponse<GoogleStartData>>(
    '/auths/google/start',
    null,
    { params, signal }
  );
  return res.data;
}


// Đăng xuất (truyền refreshToken)
export async function logout(
  payload: RefreshRequest
): Promise<ApiResponse<void>> {
  try {
    const res = await api.post<ApiResponse<void>>('/auths/logout', payload, {
      headers: { Authorization: undefined },
    });
    return res.data;
  } finally {
    await removeTokenSecure();
    (api.defaults.headers.common as any).Authorization = undefined;
  }
}

// Đổi exchangeId (x) lấy TokenPair và lưu vào máy
export async function redeemGoogleExchange(
  x: string,
  signal?: AbortSignal
): Promise<ApiResponse<TokenPairResponse>> {
  const res = await api.get<ApiResponse<TokenPairResponse>>(
    '/auths/google/redeem',
    {
      params: { x },
      headers: { Authorization: undefined }, 
      signal,
    }
  );
  const pair = res.data?.data ?? null;
  if (pair) {
    await saveTokenPairFromBE(pair);    
    await applyAuthHeaderFromKeychain(); 
  } else {
    await removeTokenSecure();
    throw new Error('Redeem failed or expired');
  }

  return res.data;
}

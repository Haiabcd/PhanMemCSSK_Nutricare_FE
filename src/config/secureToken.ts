import * as Keychain from 'react-native-keychain';
import { TokenPairResponse } from '../types/types';

/** Token lưu trong Keychain */
export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  accessExpiresAt?: number;
  refreshExpiresAt?: number;
}

const SERVICE = 'com.nutrition.auth';
const USERNAME = 'auth_token';
const SKEW_SECONDS = 90; // bù lệch giờ nhỏ

/** Cache trong RAM để tránh I/O mỗi lần request */
let tokenCache: TokenData | null = null;


/** Thiết lâp Authorization header cho axios */
let setAuthHeaderFn: (auth?: string) => void = () => { };

export function registerAuthHeaderSetter(fn: (auth?: string) => void) {
  setAuthHeaderFn = fn;
}
function setAxiosAuthHeader(token: TokenData | null) {
  if (token?.accessToken) {
    const auth = `${token.tokenType ?? 'Bearer'} ${token.accessToken}`;
    setAuthHeaderFn(auth);
  } else {
    setAuthHeaderFn(undefined);
  }
}

/** Ghi bảo mật với fallback nếu thiết bị không hỗ trợ phần cứng */
async function setSecure(password: string) {
  try {
    await Keychain.setGenericPassword(USERNAME, password, {
      service: SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
      // accessControl: Keychain.ACCESS_CONTROL.USER_PRESENCE, // Yêu cầu xác thực sinh trắc học (nếu có) khi truy cập
    });
  } catch {
    // Fallback mềm
    await Keychain.setGenericPassword(USERNAME, password, {
      service: SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
      securityLevel: Keychain.SECURITY_LEVEL.ANY,
    });
  }
}

/* ================== PUBLIC API ================== */

/** Save TokenPairResponse BE*/
export async function saveTokenPairFromBE(pair: TokenPairResponse): Promise<void> {
  const token: TokenData = {
    accessToken: pair.accessToken,
    refreshToken: pair.refreshToken,
    tokenType: pair.tokenType ?? 'Bearer',
    accessExpiresAt: pair.accessExpiresAt,
    refreshExpiresAt: pair.refreshExpiresAt,
  };
  await saveTokenSecure(token);
}

/** Lưu/xoá token (nếu truyền null) vào Keychain + set header */
export async function saveTokenSecure(token: TokenData | null): Promise<void> {
  if (token) {
    tokenCache = token;
    await setSecure(JSON.stringify(token));
  } else {
    tokenCache = null;
    await Keychain.resetGenericPassword({ service: SERVICE });
  }
  setAxiosAuthHeader(tokenCache);
}

/** Đọc token từ Keychain (đã cache) */
export async function getTokenSecure(): Promise<TokenData | null> {
  if (tokenCache) return tokenCache;
  const creds = await Keychain.getGenericPassword({ service: SERVICE });
  if (!creds || !creds.password) return null;
  try {
    tokenCache = JSON.parse(creds.password) as TokenData;
    return tokenCache;
  } catch {
    await Keychain.resetGenericPassword({ service: SERVICE });
    tokenCache = null;
    return null;
  }
}

/** Xoá token khỏi Keychain + gỡ header */
export async function removeTokenSecure(): Promise<void> {
  tokenCache = null;
  await Keychain.resetGenericPassword({ service: SERVICE });
  setAxiosAuthHeader(null);
}

/** Có token hợp lệ trong Keychain không */
export async function hasTokenSecure(): Promise<boolean> {
  const t = await getTokenSecure();
  return !!t?.accessToken;
}

/** Cập nhật access token (khi refresh xong nhưng muốn giữ refresh token hiện tại) */
export async function updateAccessTokenSecure(
  newAccessToken: string,
  newAccessExp?: number
): Promise<void> {
  const cur = await getTokenSecure(); // TokenData | null
  const next: TokenData = {
    accessToken: newAccessToken,
    refreshToken: cur?.refreshToken,
    tokenType: cur?.tokenType ?? 'Bearer',
    accessExpiresAt: typeof newAccessExp === 'number'
      ? newAccessExp
      : cur?.accessExpiresAt,
    refreshExpiresAt: cur?.refreshExpiresAt,
  };
  await saveTokenSecure(next);
}

/** Kiểm tra access token đã/sắp hết hạn*/
export async function isTokenExpiredSecure(): Promise<boolean> {
  const t = await getTokenSecure();
  const exp = t?.accessExpiresAt;
  if (typeof exp !== 'number') return false; // nếu BE không cung cấp exp -> coi như chưa hết
  const now = Math.floor(Date.now() / 1000);
  return exp - now <= SKEW_SECONDS;
}

/** Gọi khi app khởi động để gắn Authorization header nếu có token */
export async function applyAuthHeaderFromKeychain(): Promise<void> {
  const t = await getTokenSecure();
  setAxiosAuthHeader(t);
}

/** Lấy hạn refresh token (để chủ động buộc đăng nhập lại nếu cần) */
export async function getRefreshExpiry(): Promise<number | undefined> {
  const t = await getTokenSecure();
  return t?.refreshExpiresAt;
}

/** Ghi đè toàn bộ bằng cặp token mới (rotation) */
export async function overwriteWithRotatedTokens(pair: TokenPairResponse): Promise<void> {
  await saveTokenPairFromBE(pair);
}

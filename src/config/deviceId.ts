// src/config/deviceId.ts
import * as Keychain from 'react-native-keychain';
import { Platform } from 'react-native';

const SERVICE = 'com.nutrition.deviceid';
const USERNAME = 'device_id';

function randomId() {
  // đủ phân biệt theo thiết bị cài app
  return (
    'rnd-' +
    (Platform.OS || 'na') +
    '-' +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}

async function setSecureDeviceId(id: string) {
  try {
    await Keychain.setGenericPassword(USERNAME, id, {
      service: SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
    });
  } catch {
    await Keychain.setGenericPassword(USERNAME, id, {
      service: SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
      securityLevel: Keychain.SECURITY_LEVEL.ANY,
    });
  }
}

export async function getOrCreateDeviceId(): Promise<string> {
  const creds = await Keychain.getGenericPassword({ service: SERVICE });
  if (creds && typeof creds !== 'boolean' && 'password' in creds) {
    return creds.password;
  }
  const candidate = randomId();
  await setSecureDeviceId(candidate);
  return candidate;
}

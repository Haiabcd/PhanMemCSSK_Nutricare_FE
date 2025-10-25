import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './AppNavigator';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function resetTo<Name extends keyof RootStackParamList>(
  name: Name,
  params?: RootStackParamList[Name]
) {
  if (!navigationRef.isReady()) return;
  navigationRef.resetRoot({
    index: 0,
    routes: [{ name: name as any, params }] as any, 
  });
}

export function navigate<Name extends keyof RootStackParamList>(name: Name): void;
export function navigate<Name extends keyof RootStackParamList>(
  name: Name,
  params: RootStackParamList[Name]
): void;
export function navigate(
  name: keyof RootStackParamList,
  params?: RootStackParamList[keyof RootStackParamList]
) {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate(name as any, params as any);
}

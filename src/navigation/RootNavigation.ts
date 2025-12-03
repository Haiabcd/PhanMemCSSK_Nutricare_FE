import { createNavigationContainerRef } from '@react-navigation/native';

export type RootStackParamList = {
  Main: undefined;
  OAuthReturn:
  | {
    kind?: 'first' | 'upgrade' | 'returning' | 'success';
    x?: string;
  }
  | undefined;
  OAuthError:
  | {
    message?: string;
  }
  | undefined;
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function resetTo<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName],
) {
  if (!navigationRef.isReady()) {
    return;
  }

  navigationRef.reset({
    index: 0,
    routes: [{ name, params } as any],
  });
}

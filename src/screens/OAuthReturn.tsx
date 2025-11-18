import React, { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import ViewComponent from '../components/ViewComponent';
import TextComponent from '../components/TextComponent';
import { redeemGoogleExchange } from '../services/auth.service';

type Params = {
  kind?: 'first' | 'upgrade' | 'returning' | 'success';
  x?: string;
};

export default function OAuthReturn() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { kind, x } = (route?.params ?? {}) as Params;

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        if (kind === 'returning') {
          if (!x) {
            if (!isMounted) return;
            navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
            return;
          }

          await redeemGoogleExchange(x);

          if (!isMounted) return;
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          return;
        }

        if (kind === 'upgrade') {
          if (!isMounted) return;
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'Home',
                params: {
                  screen: 'ProfileNavigator',
                  params: {
                    screen: 'Profile',
                    params: {
                      reloadAt: Date.now(),
                    },
                  },
                },
              },
            ],
          });
          return;
        }

        if (kind === 'first') {
          if (!isMounted) return;
          navigation.reset({ index: 0, routes: [{ name: 'Wizard' }] });
          return;
        }

        if (!isMounted) return;
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
        }
      } catch (e) {
        if (!isMounted) return;
        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [kind, x, navigation]);

  return (
    <ViewComponent center style={{ flex: 1, padding: 16 }}>
      <ActivityIndicator size="large" />
      <TextComponent
        text={
          kind === 'returning'
            ? 'Đang đăng nhập...'
            : kind === 'upgrade'
            ? 'Đang hoàn tất nâng cấp tài khoản...'
            : kind === 'first'
            ? 'Đang chuẩn bị trải nghiệm đầu tiên...'
            : 'Đang xử lý...'
        }
        style={{ marginTop: 12 }}
      />
    </ViewComponent>
  );
}

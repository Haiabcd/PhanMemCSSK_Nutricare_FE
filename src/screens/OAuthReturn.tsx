import React, { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import ViewComponent from '../components/ViewComponent';
import TextComponent from '../components/TextComponent';
import { redeemGoogleExchange } from '../services/auth.service';
import { useAuth } from '../context/AuthContext';

type Params = {
  kind?: 'first' | 'upgrade' | 'returning' | 'success';
  x?: string;
};

export default function OAuthReturn() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { kind, x } = (route?.params ?? {}) as Params;
  const { setIsAuthed } = useAuth();

  useEffect(() => {
    let isMounted = true;


    (async () => {
      try {
        if (kind === 'returning') {
          if (!x) {
            if (!isMounted) return;
            navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
            return;
          }
          await redeemGoogleExchange(x);
          if (!isMounted) return;
          setIsAuthed(true);
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
          return;
        }

        if (kind === 'upgrade') {
          if (!isMounted) return;
          setIsAuthed(true);

          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'Main',
                params: {
                  screen: 'ProfileNavigator',
                  params: {
                    screen: 'Profile',
                  },
                },
              },
            ],
          });

          return;
        }

        if (kind === 'first') {
          if (!isMounted) return;
          setIsAuthed(true);
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
          return;
        }
        if (!isMounted) return;
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      } catch (e) {
        if (!isMounted) return;
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [kind, x, navigation, setIsAuthed]);

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

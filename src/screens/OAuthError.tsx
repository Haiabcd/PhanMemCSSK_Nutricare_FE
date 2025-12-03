// src/screens/OAuthError.tsx
import { useRoute, useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { Text, ActivityIndicator } from 'react-native';
import ViewComponent from '../components/ViewComponent';

export default function OAuthError() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { reason } = route.params ?? {};

  useEffect(() => {
    console.log('[OAuthError effect] reason =', reason);


    if (reason) {
      const timer = setTimeout(() => {

        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'Main' as never,
              params: {
                screen: 'ProfileNavigator',
                params: {
                  screen: 'Profile',
                  params: { notice: reason },
                },
              } as never,
            },
          ],
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' as never }],
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation, reason]);

  return (
    <ViewComponent center style={{ flex: 1 }}>
      <ActivityIndicator size="large" color="#16a34a" />
      <Text style={{ marginTop: 12, color: '#6b7280', fontWeight: '500' }}>
        Đang xử lý, vui lòng chờ...
      </Text>
    </ViewComponent>
  );
}

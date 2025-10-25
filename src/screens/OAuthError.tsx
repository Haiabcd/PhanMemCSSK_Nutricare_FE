import { useRoute, useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { Text } from 'react-native';
import ViewComponent from '../components/ViewComponent';

export default function OAuthError() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { reason } = route.params ?? {};

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <ViewComponent center style={{ flex: 1 }}>
      <Text style={{ color: 'red', fontWeight: 'bold', textAlign: 'center' }}>
        {reason || 'Đăng nhập thất bại'}
      </Text>
    </ViewComponent>
  );
}

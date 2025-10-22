import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import ViewComponent from '../components/ViewComponent';
import TextComponent from '../components/TextComponent';

export default function OAuthReturn() {
  const navigation = useNavigation<any>();

  useEffect(() => {
    // Nếu đang ở trong app và còn stack trước đó → quay lại
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    // Trường hợp app mở bằng deep link (không có history):
    // reset về Home tab, và mở thẳng Profile
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Home', // RootStackParamList
          params: {
            screen: 'ProfileNavigator', // MainTabParamList
            params: {
              screen: 'Profile', // ProfileStackParamList
            },
          },
        },
      ],
    });
  }, [navigation]);

  return (
    <ViewComponent center style={{ flex: 1 }}>
      <TextComponent text="Đang quay lại..." />
    </ViewComponent>
  );
}

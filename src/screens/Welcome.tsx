import React from 'react';
import { View, Image, StatusBar, Text, Alert, Linking } from 'react-native';
import BounceButton from '../components/Welcome/BounceButton';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { s } from '../styles/Welcome.styles';
import { startGoogleOAuth } from '../services/auth.service';
import { getOrCreateDeviceId } from '../config/deviceId';

// ======= ẢNH NỀN DUY NHẤT =======
const BG_IMAGE = require('../assets/images/Welcome/Welcome1.png');

const Welcome = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loadingGoogle, setLoadingGoogle] = React.useState(false);

  const onPressGoogle = React.useCallback(async () => {
    try {
      setLoadingGoogle(true);
      const deviceId = await getOrCreateDeviceId();
      const res = await startGoogleOAuth(deviceId, false);
      const url = res?.data?.authorizeUrl;

      if (!url) {
        Alert.alert('Lỗi', 'Không nhận được liên kết đăng nhập Google.');
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      console.log('startGoogleOAuth error:', e);
      Alert.alert(
        'Lỗi',
        'Không thể bắt đầu đăng nhập Google. Vui lòng thử lại.',
      );
    } finally {
      setLoadingGoogle(false);
    }
  }, []);

  return (
    <View>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Ảnh nền tĩnh (không cuộn) */}
      <Image source={BG_IMAGE} style={s.bgImage} resizeMode="cover" />

      {/* Overlay content */}
      <ViewComponent style={s.bgList} px={15} pt={50}>
        {/* Top brand/title */}
        <ViewComponent mt={StatusBar.currentHeight ?? 40}>
          <TextComponent
            text="Nutricare"
            variant="h1"
            size={36}
            tone="primary"
            align="center"
          />
          <ViewComponent style={s.subtitleWrap}>
            <TextComponent
              text="Hành trình sức khỏe của bạn bắt đầu từ đây"
              variant="h2"
              size={22}
              tone="default"
              style={[s.title, s.subtitleText]}
              align="center"
            />
          </ViewComponent>
        </ViewComponent>

        {/* Bottom actions */}
        <ViewComponent style={s.bottom} gap={12}>
          <BounceButton
            label="Bắt đầu ngay"
            containerStyle={[s.btnPrimary]}
            labelStyle={s.btnPrimaryLabel}
            labelSize={18}
            onPress={() => navigation.navigate('Wizard')}
          />

          <TextComponent
            text="HOẶC"
            variant="subtitle"
            tone="inverse"
            align="center"
          />

          {/* ✅ Gắn handler Google + khóa nút khi loading */}
          <BounceButton
            label={loadingGoogle ? 'Đang mở Google...' : 'Tiếp tục với Google'}
            icon="google"
            labelSize={18}
            onPress={onPressGoogle}
            disabled={loadingGoogle}
          />

          <Text style={s.termsText}>
            Bằng cách tiếp tục, bạn đồng ý với{' '}
            <Text style={s.termsLink}>Điều khoản sử dụng</Text>
            {' và '}
            <Text style={s.termsLink}>Chính sách bảo mật</Text>
            {' của chúng tôi'}
          </Text>
        </ViewComponent>
      </ViewComponent>
    </View>
  );
};

export default Welcome;

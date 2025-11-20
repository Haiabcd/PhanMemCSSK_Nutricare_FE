import React from 'react';
import {
  StatusBar,
  Text,
  Alert,
  Linking,
  ImageBackground,
  StyleSheet,
  View,
} from 'react-native';
import BounceButton from '../components/Welcome/BounceButton';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { s } from '../styles/Welcome.styles';
import { startGoogleOAuth } from '../services/auth.service';
import { getOrCreateDeviceId } from '../config/deviceId';

const BG_IMAGE = require('../assets/images/Welcome/NUTRICARE.png');

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
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Ảnh nền full-screen */}
      <ImageBackground
        source={BG_IMAGE}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      {/* Overlay content */}
      <ViewComponent style={s.bgList} px={15} pt={50}>
        <ViewComponent style={s.bottom} gap={12}>
          <BounceButton
            label="Bắt đầu ngay"
            containerStyle={[s.btnPrimary]}
            labelStyle={s.btnPrimaryLabel}
            labelSize={18}
            onPress={() => navigation.navigate('Wizard')}
          />
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

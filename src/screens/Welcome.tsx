// Welcome.tsx
import React from 'react';
import { View, Image, StatusBar, Text } from 'react-native';
import { colors as C } from '../constants/colors';
import BounceButton from '../components/Welcome/BounceButton';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { s } from '../styles/Welcome.styles';

// ======= ẢNH NỀN DUY NHẤT =======
const BG_IMAGE = require('../assets/images/Welcome/Welcome1.png');

const Welcome = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
          <TextComponent
            text="Hành trình sức khỏe của bạn bắt đầu từ đây"
            variant="h2"
            size={22}
            tone="default"
            style={s.title}
            align="center"
          />
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

          <BounceButton
            label="Tiếp tục với Google"
            icon="google"
            labelSize={18}
          />

          <BounceButton
            label="Tiếp tục với Facebook"
            icon="facebook"
            iconStyle={{ color: C.blue }}
            labelSize={18}
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

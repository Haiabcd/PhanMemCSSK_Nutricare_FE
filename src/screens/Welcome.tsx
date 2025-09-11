// Welcome.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Image, FlatList, StatusBar, Text } from 'react-native';
import { colors as C, colors } from '../constants/colors';

import Container from '../components/Container';
import BounceButton from '../components/Welcome/BounceButton';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { s, width } from '../styles/Welcome.styles';

//------------List Image------------//
const IMAGES = [
  require('../assets/images/Welcome/Welcome1.png'),
  require('../assets/images/Welcome/Welcome2.jpg'),
  require('../assets/images/Welcome/Welcome3.png'),
  require('../assets/images/Welcome/Welcome4.jpg'),
];
//------------Image Transfer Time ------------//
const AUTO_PLAY_MS = 3000;

const Welcome = () => {
  const listRef = useRef<FlatList<number>>(null);
  const [index, setIndex] = useState(0);
  const DATA = useMemo(() => IMAGES.map((_, i) => i), []);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Auto play slider
  useEffect(() => {
    const id = setInterval(() => {
      const next = (index + 1) % DATA.length;
      listRef.current?.scrollToOffset({ offset: next * width, animated: true });
      setIndex(next);
    }, AUTO_PLAY_MS);
    return () => clearInterval(id);
  }, [index, DATA.length]);

  return (
    <Container>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Background slider */}
      <FlatList
        ref={listRef}
        data={DATA}
        keyExtractor={i => String(i)}
        renderItem={({ item }) => (
          <Image source={IMAGES[item]} style={s.bgImage} resizeMode="cover" />
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        onMomentumScrollEnd={e => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(newIndex);
        }}
        style={s.bgList}
      />

      {/* Overlay content */}
      <View style={s.bgList}>
        {/* Top brand/title */}
        <ViewComponent p={16} pt={70} mt={StatusBar.currentHeight ?? 40}>
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
          {/* Bắt đầu ngay */}
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

          {/* Tiếp tục với Google */}
          <BounceButton
            label="Tiếp tục với Google"
            icon="google"
            labelSize={18}
          />

          {/* Tiếp tục với Facebook */}
          <BounceButton
            label="Tiếp tục với Facebook"
            icon="facebook"
            iconStyle={{ color: C.blue }}
            labelSize={18}
          />

          {/* Terms */}
          <Text style={s.termsText}>
            Bằng cách tiếp tục, bạn đồng ý với{' '}
            <Text style={s.termsLink}>Điều khoản sử dụng</Text>
            {' và '}
            <Text style={s.termsLink}>Chính sách bảo mật</Text>
            {' của chúng tôi'}
          </Text>
        </ViewComponent>
      </View>
    </Container>
  );
};

export default Welcome;

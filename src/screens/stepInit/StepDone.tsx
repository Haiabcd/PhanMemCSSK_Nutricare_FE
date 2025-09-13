// features/StepDoneScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Platform,
  StatusBar,
  StyleSheet,
  useColorScheme,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { colors as c } from '../../constants/colors';
import TextComponent from '../../components/TextComponent';
import ViewComponent from '../../components/ViewComponent';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Safe-area thủ công
const TOP_INSET = Platform.select({
  ios: 44,
  android: StatusBar.currentHeight ?? 0,
  default: 0,
});

// Padding & max width cho card
const CONTENT_HPAD = 24;
const CONTENT_WIDTH = SCREEN_WIDTH - CONTENT_HPAD * 2;
const CARD_MAX_W = 520;
const CARD_W = Math.min(CONTENT_WIDTH, CARD_MAX_W);

// Viewport thực của Slider (bằng chiều rộng ScrollView do container có padding)
const PAGE_W = CONTENT_WIDTH;

/* --------------- Slides nội dung --------------- */
type Slide = { icon: string; title: string; points: string[] };
const SLIDES: Slide[] = [
  {
    icon: '🎯',
    title: 'Cá nhân hóa kế hoạch ăn uống',
    points: [
      'Tính TDEE & macro theo mục tiêu (giảm mỡ, tăng cơ, giữ cân)',
      'Khẩu phần & lịch ăn linh hoạt theo sở thích',
      'Nhập bệnh nền/dị ứng để loại trừ thực phẩm không phù hợp',
    ],
  },
  {
    icon: '📷',
    title: 'Ghi bữa ăn & kiểm tra dinh dưỡng bằng AI',
    points: [
      'Quét ảnh món ăn → ước lượng calo & vi chất',
      'Cảnh báo vượt ngưỡng macro trong ngày',
      'Gợi ý món thay thế khi bạn "ngán"',
    ],
  },
  {
    icon: '📊',
    title: 'Theo dõi tiến độ & nhắc nhở thông minh',
    points: [
      'Biểu đồ cân nặng, số đo, lịch sử bữa ăn',
      'Nhắc giờ ăn, uống nước, bổ sung chất còn thiếu',
      'Báo cáo tuần & mẹo nhỏ để duy trì thói quen',
    ],
  },
];

const StepDoneScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const scheme = useColorScheme();

  // Mount & progress
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(0.98)).current;
  const progress = useRef(new Animated.Value(0)).current;

  // Background blobs
  const blobA = useRef(new Animated.Value(0)).current;
  const blobB = useRef(new Animated.Value(0)).current;

  // Loading dots
  const [dots, setDots] = useState('');

  // Slide state
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);

  // cho bạn test lâu (đổi lại nếu cần)
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }, 6000);
    return () => clearTimeout(timer);
  }, [navigation]);

  useEffect(() => {
    const id = setInterval(
      () => setDots(p => (p.length >= 3 ? '' : p + '.')),
      450,
    );
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        toValue: 1,
        duration: 5600,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blobA, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(blobA, {
          toValue: 0,
          duration: 6000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      { resetBeforeIteration: true },
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blobB, {
          toValue: 1,
          duration: 5200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(blobB, {
          toValue: 0,
          duration: 5200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      { resetBeforeIteration: true },
    ).start();
  }, [fade, slide, scale, progress, blobA, blobB]);

  // Auto-rotate slides mỗi ~2s (dùng PAGE_W để đúng theo viewport)
  useEffect(() => {
    const id = setInterval(() => {
      const next = (index + 1) % SLIDES.length;
      setIndex(next);
      scrollRef.current?.scrollTo({ x: next * PAGE_W, y: 0, animated: true });
    }, 2000);
    return () => clearInterval(id);
  }, [index]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(x / PAGE_W);
    if (newIndex !== index) setIndex(newIndex);
  };

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const blobAStyle = useMemo(
    () => ({
      transform: [
        {
          translateX: blobA.interpolate({
            inputRange: [0, 1],
            outputRange: [-16, 12],
          }),
        },
        {
          translateY: blobA.interpolate({
            inputRange: [0, 1],
            outputRange: [-8, 10],
          }),
        },
        {
          scale: blobA.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.04],
          }),
        },
      ],
    }),
    [blobA],
  );

  const blobBStyle = useMemo(
    () => ({
      transform: [
        {
          translateX: blobB.interpolate({
            inputRange: [0, 1],
            outputRange: [14, -10],
          }),
        },
        {
          translateY: blobB.interpolate({
            inputRange: [0, 1],
            outputRange: [16, -8],
          }),
        },
        {
          scale: blobB.interpolate({
            inputRange: [0, 1],
            outputRange: [1.02, 0.98],
          }),
        },
      ],
    }),
    [blobB],
  );

  return (
    <ViewComponent
      flex={1}
      backgroundColor={c.bg}
      style={{ paddingTop: TOP_INSET }}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
      />

      {/* Background blobs (Animated) */}
      <Animated.View
        pointerEvents="none"
        style={StyleSheet.absoluteFillObject as any}
      >
        <Animated.View
          style={[
            styles.blob,
            {
              backgroundColor: c.primarySurface,
              opacity: 0.26,
              width: SCREEN_WIDTH * 0.9,
              height: SCREEN_WIDTH * 0.9,
              top: -SCREEN_WIDTH * 0.35,
              right: -SCREEN_WIDTH * 0.25,
              borderRadius: SCREEN_WIDTH,
            },
            blobAStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.blob,
            {
              backgroundColor: c.greenSurface,
              opacity: 0.18,
              width: SCREEN_WIDTH * 0.65,
              height: SCREEN_WIDTH * 0.65,
              bottom: -SCREEN_WIDTH * 0.25,
              left: -SCREEN_WIDTH * 0.2,
              borderRadius: SCREEN_WIDTH,
            },
            blobBStyle,
          ]}
        />
      </Animated.View>

      {/* Content (Animated container) */}
      <Animated.View
        style={[
          styles.container,
          { opacity: fade, transform: [{ translateY: slide }, { scale }] },
        ]}
      >
        {/* Header */}
        <ViewComponent
          alignItems="center"
          mt={SCREEN_HEIGHT * 0.05}
          mb={SCREEN_HEIGHT * 0.03}
        >
          <ViewComponent
            variant="card"
            radius={24}
            style={{
              width: 92,
              height: 92,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TextComponent text="🌿" size={34} />
          </ViewComponent>

          <ViewComponent alignItems="center" m={8} gap={15}>
            <TextComponent
              text="Chào mừng đến với"
              variant="caption"
              weight="semibold"
              tone="muted"
              size={20}
            />
            <TextComponent text="NutriCare" variant="h1" tone="primary" />
            <TextComponent
              text="Trong lúc chuẩn bị dữ liệu cá nhân hóa, đây là những gì NutriCare sẽ làm cho bạn:"
              variant="body"
              tone="muted"
              align="center"
              style={{ maxWidth: '90%' }}
            />
          </ViewComponent>
        </ViewComponent>

        {/* ---------------- Slides mô tả chức năng ---------------- */}
        <ViewComponent style={styles.sliderWrap}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            bounces={false}
            snapToInterval={Math.round(PAGE_W)} // snap đúng theo viewport
            snapToAlignment="start"
            scrollEventThrottle={16}
            onMomentumScrollEnd={onMomentumEnd}
          >
            {SLIDES.map((s, i) => (
              <ViewComponent
                key={i}
                style={styles.slidePage}
                alignItems="center"
                justifyContent="center"
              >
                <ViewComponent
                  variant="card"
                  radius={20}
                  style={{
                    width: CARD_W,
                    alignSelf: 'center',
                    padding: 24,
                    minHeight: SCREEN_HEIGHT * 0.32,
                    maxHeight: SCREEN_HEIGHT * 0.45,
                    borderColor: c.border,
                    borderWidth: StyleSheet.hairlineWidth,
                  }}
                >
                  <ViewComponent row alignItems="center" mb={20}>
                    <ViewComponent
                      radius={14}
                      border
                      borderColor={c.border}
                      backgroundColor={c.primarySurface}
                      style={{
                        width: 48,
                        height: 48,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 14,
                      }}
                    >
                      <TextComponent text={s.icon} size={20} />
                    </ViewComponent>

                    <TextComponent
                      text={s.title}
                      variant="h3"
                      style={{ flex: 1 }}
                    />
                  </ViewComponent>

                  <ViewComponent flex={1}>
                    {s.points.map((p, idx) => (
                      <ViewComponent
                        key={idx}
                        row
                        alignItems="flex-start"
                        mb={14}
                      >
                        <ViewComponent
                          radius={12}
                          backgroundColor={c.primarySurface}
                          style={{
                            width: 24,
                            height: 24,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                            marginTop: 1,
                          }}
                        >
                          <TextComponent
                            text="✓"
                            size={13}
                            weight="bold"
                            color={c.primary}
                          />
                        </ViewComponent>
                        <TextComponent
                          text={p}
                          variant="body"
                          tone="muted"
                          style={{ flex: 1 }}
                        />
                      </ViewComponent>
                    ))}
                  </ViewComponent>
                </ViewComponent>
              </ViewComponent>
            ))}
          </ScrollView>

          {/* Dots indicator */}
          <ViewComponent row center mt={24} style={{ gap: 10 }}>
            {SLIDES.map((_, i) => (
              <ViewComponent
                key={i}
                radius={4}
                backgroundColor={i === index ? c.primary : c.slate200}
                style={{
                  width: 8,
                  height: 8,
                  opacity: i === index ? 1 : 0.6,
                  transform: [{ scale: i === index ? 1.2 : 1 }],
                }}
              />
            ))}
          </ViewComponent>
        </ViewComponent>

        {/* Loading footer */}
        <ViewComponent
          alignItems="center"
          style={{ width: '100%' }}
          mt={SCREEN_HEIGHT * 0.02}
        >
          <ActivityIndicator size="small" color={c.accent} />
          <TextComponent
            text={`Đang tạo kế hoạch dinh dưỡng${dots}`}
            variant="subtitle"
            tone="muted"
            style={{ marginTop: 12, marginBottom: 16 }}
          />
          <ViewComponent
            style={{
              width: '70%',
              height: 6,
              borderRadius: 3,
              overflow: 'hidden',
              backgroundColor: c.greenSurface,
            }}
          >
            <Animated.View
              style={{
                height: '100%',
                borderRadius: 3,
                backgroundColor: c.accent,
                width: progressWidth as any,
              }}
            />
          </ViewComponent>
        </ViewComponent>
      </Animated.View>
    </ViewComponent>
  );
};

export default StepDoneScreen;

/* ---------------- Styles chỉ cho phần cần thiết ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: CONTENT_HPAD,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  blob: { position: 'absolute' },
  /* Slider */
  sliderWrap: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    maxHeight: SCREEN_HEIGHT * 0.55,
    minHeight: SCREEN_HEIGHT * 0.4,
  },
  slidePage: {
    width: PAGE_W,
  },
});

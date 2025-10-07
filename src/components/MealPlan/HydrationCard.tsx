import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Animated, Easing, Pressable } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ViewComponent from '../ViewComponent';
import TextComponent from '../TextComponent';
import { colors as AppColors } from '../../constants/colors';

/** ===== Props ===== */
type Props = {
  target: number;
  step?: number;
  initial?: number;
  palette?: Partial<typeof AppColors>;
  style?: any;
  titleStyle?: any;
  onChange?: (liters: number) => void;
};

/** ===== Thanh tiến trình animated ===== */
function AnimatedProgress({
  percent,
  tint,
  bg,
  height = 8,
  radius = 999,
}: {
  percent: number;
  tint: string;
  bg: string;
  height?: number;
  radius?: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.max(0, Math.min(100, percent)),
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent, anim]);

  const width = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <ViewComponent
      style={{ height, borderRadius: radius, overflow: 'hidden' }}
      backgroundColor={bg}
    >
      <Animated.View style={{ height: '100%', width, backgroundColor: tint }} />
    </ViewComponent>
  );
}

/** ===== Main ===== */
export default function HydrationSummaryCard({
  target,
  step = 0.25,
  initial = 0,
  palette,
  style,
  titleStyle,
  onChange,
}: Props) {
  const C = { ...AppColors, ...(palette ?? {}) };

  const WATER = C.blue;
  const FRAME_BG = C.primarySurface || C.greenSurface;
  const FRAME_BORDER = C.primaryBorder || C.greenBorder;
  const CARD_BG = FRAME_BG;
  const CARD_BORDER = FRAME_BORDER;

  const [water, setWater] = useState<number>(() =>
    Math.max(0, Math.min(target, +initial.toFixed(2))),
  );

  useEffect(() => {
    onChange?.(water);
  }, [water, onChange]);

  const pct = useMemo(
    () => (target <= 0 ? 0 : Math.max(0, Math.min(1, water / target))),
    [water, target],
  );
  const remain = Math.max(0, +(target - water).toFixed(2));

  // Icon chai: xám → xanh dần theo % hoàn thành
  const iconAnim = useRef(new Animated.Value(0)).current;
  const AnimatedIcon = Animated.createAnimatedComponent(MaterialCommunityIcons);

  useEffect(() => {
    Animated.timing(iconAnim, {
      toValue: pct,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct, iconAnim]);

  const bottleColor = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#94a3b8', WATER],
  });
  const glowOpacity = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 0.36],
  });

  const add = () => setWater(v => Math.min(target, +(v + step).toFixed(2)));
  const sub = () => setWater(v => Math.max(0, +(v - step).toFixed(2)));

  return (
    <ViewComponent
      variant="none"
      p={12}
      radius={16}
      border
      borderColor={CARD_BORDER}
      style={[styles.cardShadow, { backgroundColor: CARD_BG }, style]}
    >
      {/* Header */}
      <ViewComponent row between alignItems="center">
        <TextComponent
          text="Uống nước"
          variant="h3"
          weight="bold"
          tone="primary"
          style={titleStyle}
        />
        <ViewComponent
          row
          gap={6}
          px={10}
          py={6}
          radius={999}
          border
          borderColor={CARD_BORDER}
          backgroundColor={C.white}
          alignItems="center"
        >
          <MaterialCommunityIcons name="target" size={14} color={WATER} />
          <TextComponent
            text={`Mục tiêu ${target} L`}
            variant="caption"
            weight="semibold"
            tone="default"
          />
        </ViewComponent>
      </ViewComponent>

      {/* Body: –  [Bottle]  + */}
      <ViewComponent row mt={10} between alignItems="center">
        {/* – bên trái */}
        <ViewComponent alignItems="center" style={{ width: 70 }}>
          <Pressable
            onPress={sub}
            style={[
              styles.roundBtn,
              { backgroundColor: C.white, borderColor: CARD_BORDER },
            ]}
          >
            <MaterialCommunityIcons name="minus" size={18} color={C.sub} />
          </Pressable>
          <TextComponent
            text={`${step} L`}
            variant="caption"
            tone="muted"
            weight="semibold"
            style={{ marginTop: 6 }}
          />
        </ViewComponent>

        {/* Chai giữa */}
        <ViewComponent center>
          <ViewComponent center style={styles.heroWrap}>
            <Animated.View
              style={[
                styles.heroGlow,
                {
                  backgroundColor: 'rgba(59,130,246,0.22)',
                  opacity: glowOpacity,
                },
              ]}
            />
            <ViewComponent
              center
              radius={999}
              border
              borderColor={CARD_BORDER}
              style={{ width: 72, height: 72, backgroundColor: C.white }}
            >
              <AnimatedIcon
                name="bottle-soda"
                size={40}
                style={{ color: bottleColor as any }}
              />
            </ViewComponent>
          </ViewComponent>

          <TextComponent text="Đã uống" variant="caption" tone="muted" />
          <TextComponent
            text={`${water.toFixed(2)} L`}
            variant="h2"
            weight="bold"
            tone="default"
            style={{ marginTop: 2 }}
          />

          <ViewComponent style={{ width: 180 }} mt={10}>
            <AnimatedProgress percent={pct * 100} tint={WATER} bg="#DCEBFF" />
          </ViewComponent>
        </ViewComponent>

        {/* + bên phải */}
        <ViewComponent alignItems="center" style={{ width: 70 }}>
          <Pressable
            onPress={add}
            style={[
              styles.roundBtn,
              { backgroundColor: WATER, borderColor: WATER },
            ]}
          >
            <MaterialCommunityIcons name="plus" size={18} color={C.white} />
          </Pressable>
          <TextComponent
            text={`${step} L`}
            variant="caption"
            tone="muted"
            weight="semibold"
            style={{ marginTop: 6 }}
          />
        </ViewComponent>
      </ViewComponent>

      {/* Stats chips */}
      <ViewComponent row gap={10} justifyContent="center" mt={12} wrap>
        <ViewComponent
          row
          gap={6}
          px={10}
          py={6}
          radius={999}
          border
          borderColor={CARD_BORDER}
          backgroundColor={C.white}
          alignItems="center"
        >
          <MaterialCommunityIcons name="cup-water" size={16} color={WATER} />
          <TextComponent
            text={`Còn lại ${remain} L`}
            variant="caption"
            weight="semibold"
          />
        </ViewComponent>

        <ViewComponent
          row
          gap={6}
          px={10}
          py={6}
          radius={999}
          border
          borderColor={CARD_BORDER}
          backgroundColor={C.white}
          alignItems="center"
        >
          <MaterialCommunityIcons
            name="water-check"
            size={16}
            color={C.success}
          />
          <TextComponent
            text={`Hoàn thành ${Math.round(pct * 100)}%`}
            variant="caption"
            weight="semibold"
          />
        </ViewComponent>
      </ViewComponent>
    </ViewComponent>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  heroWrap: { width: 90, height: 90 },
  heroGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 999,
  },
});

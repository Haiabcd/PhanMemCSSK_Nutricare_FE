import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Animated, Easing, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ViewComponent from '../ViewComponent';
import TextComponent from '../TextComponent';
import { colors as AppColors } from '../../constants/colors';

/** ===== Props ===== */
type Props = {
  target: number;                 // mục tiêu ML
  initial?: number;               // đã uống ban đầu (ML)
  palette?: Partial<typeof AppColors>;
  style?: any;
  titleStyle?: any;
  onChange?: (ml: number) => void;

  /** Slider chọn lượng thêm */
  pickMin?: number;               // mặc định 100ml
  pickMax?: number;               // mặc định 1000ml
  pickStep?: number;              // mặc định 50ml
};

/** ===== Thanh tiến trình animated ===== */
function AnimatedProgress({
  percent, tint, bg, height = 8, radius = 999,
}: { percent: number; tint: string; bg: string; height?: number; radius?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.max(0, Math.min(100, percent)),
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent, anim]);
  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <ViewComponent style={{ height, borderRadius: radius, overflow: 'hidden' }} backgroundColor={bg}>
      <Animated.View style={{ height: '100%', width, backgroundColor: tint }} />
    </ViewComponent>
  );
}

/** ===== Main ===== */
export default function HydrationSummaryCard({
  target,
  initial = 0,
  palette,
  style,
  titleStyle,
  onChange,
  pickMin = 100,
  pickMax = 1000,
  pickStep = 50,
}: Props) {
  const C = { ...AppColors, ...(palette ?? {}) };

  const WATER = C.blue;
  const FRAME_BG = C.primarySurface || C.greenSurface;
  const FRAME_BORDER = C.primaryBorder || C.greenBorder;

  /** Tổng đã uống (ML) */
  const [water, setWater] = useState(() => Math.max(0, Math.min(target, Math.round(initial))));
  /** Lượng sẽ thêm (ML) – điều khiển bởi Slider */
  const [pick, setPick] = useState<number>(Math.min(Math.max(pickMin, 500), pickMax));

  useEffect(() => { onChange?.(water); }, [water, onChange]);

  const pct = useMemo(() => (target <= 0 ? 0 : Math.max(0, Math.min(1, water / target))), [water, target]);
  const remain = Math.max(0, Math.round(target - water));

  /** ====== ANIM – Bottle color & mực nước dâng ====== */
  const iconAnim = useRef(new Animated.Value(0)).current;
  const waterAnim = useRef(new Animated.Value(0)).current; // 0..1
  const AnimatedIcon = Animated.createAnimatedComponent(MaterialCommunityIcons);

  useEffect(() => {
    Animated.timing(iconAnim, {
      toValue: pct, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
    Animated.timing(waterAnim, {
      toValue: pct, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, [pct, iconAnim, waterAnim]);

  const bottleColor = iconAnim.interpolate({ inputRange: [0, 1], outputRange: ['#94a3b8', WATER] });
  const glowOpacity = iconAnim.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.36] });

  // Chiều cao mực nước trong khung 72px (điền từ đáy lên)
  const fillHeight = waterAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 72] });

  const addPick = () => setWater((v) => Math.min(target, v + pick));

  return (
    <ViewComponent
      variant="none"
      p={12}
      radius={16}
      border
      borderColor={FRAME_BORDER}
      style={[styles.cardShadow, { backgroundColor: FRAME_BG }, style]}
    >
      {/* Header */}
      <ViewComponent row between alignItems="center">
        <TextComponent text="Uống nước" variant="h3" weight="bold" tone="primary" style={titleStyle} />
        <ViewComponent row gap={6} px={10} py={6} radius={999} border borderColor={FRAME_BORDER} backgroundColor={C.white} alignItems="center">
          <MaterialCommunityIcons name="target" size={14} color={WATER} />
          <TextComponent text={`Mục tiêu ${target} ml`} variant="caption" weight="semibold" tone="default" />
        </ViewComponent>
      </ViewComponent>

      {/* ====== Slider + nút Thêm (nhỏ gọn hơn) ====== */}
      <ViewComponent mt={12}>
        <ViewComponent row between alignItems="center" mb={4} px={2}>
          <TextComponent text="Dung tích" variant="body" weight="bold" />
          <TextComponent text={`${pick} ml`} variant="body" weight="semibold" />
        </ViewComponent>

        {/* Slider nhỏ: track thấp, khoảng cách dọc ít lại */}
        <ViewComponent style={{ paddingHorizontal: 2 }}>
          <Slider
            value={pick}
            minimumValue={pickMin}
            maximumValue={pickMax}
            step={pickStep}
            onValueChange={(v) => setPick(Math.round(v))}
            minimumTrackTintColor={WATER}
            maximumTrackTintColor="#D5D8DE"
            thumbTintColor={C.white}
            style={{ height: 28 }} // thấp hơn
          />
        </ViewComponent>

        <Pressable
          onPress={addPick}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: WATER, opacity: pressed ? 0.92 : 1, shadowColor: WATER },
          ]}
        >
          <TextComponent text={`Thêm ${pick} ml`} variant="h3" weight="bold" tone="inverted" />
        </Pressable>
      </ViewComponent>

      {/* Bottle + tiến trình */}
      <ViewComponent center mt={6}>
        <ViewComponent center style={styles.heroWrap}>
          {/* Glow */}
          <Animated.View style={[styles.heroGlow, { backgroundColor: 'rgba(59,130,246,0.22)', opacity: glowOpacity }]} />
          {/* Khung tròn – dùng làm clip cho mực nước */}
          <ViewComponent
            style={styles.bottleFrame}
            center
            radius={999}
            border
            borderColor={FRAME_BORDER}
            backgroundColor={C.white}
          >
            {/* Mực nước dâng từ đáy lên, bị clip trong frame tròn */}
            <Animated.View
              style={[
                styles.waterFill,
                { backgroundColor: WATER, height: fillHeight },
              ]}
            />
            {/* Vẽ chai outline nằm trên cùng (để thấy đường viền) */}
            <AnimatedIcon
              name="bottle-soda-outline"
              size={46}
              style={styles.bottleIcon as any}
              color={bottleColor as any}
            />
          </ViewComponent>
        </ViewComponent>

        <TextComponent text="Đã uống" variant="caption" tone="muted" />
        <TextComponent text={`${water} ml`} variant="h2" weight="bold" tone="default" style={{ marginTop: 2 }} />

        <ViewComponent style={{ width: 200 }} mt={8}>
          <AnimatedProgress percent={pct * 100} tint={WATER} bg="#DCEBFF" />
        </ViewComponent>
      </ViewComponent>

      {/* Chips thống kê */}
      <ViewComponent row gap={10} justifyContent="center" mt={10} wrap>
        <ViewComponent row gap={6} px={10} py={6} radius={999} border borderColor={FRAME_BORDER} backgroundColor={C.white} alignItems="center">
          <MaterialCommunityIcons name="cup-water" size={16} color={WATER} />
          <TextComponent text={`Còn lại ${remain} ml`} variant="caption" weight="semibold" />
        </ViewComponent>
        <ViewComponent row gap={6} px={10} py={6} radius={999} border borderColor={FRAME_BORDER} backgroundColor={C.white} alignItems="center">
          <MaterialCommunityIcons name="water-check" size={16} color={C.success} />
          <TextComponent text={`Hoàn thành ${Math.round(pct * 100)}%`} variant="caption" weight="semibold" />
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
  addBtn: {
    height: 48,                  // nhỏ hơn 54
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,                // sát hơn
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  heroWrap: { width: 90, height: 90, marginTop: 6 },
  heroGlow: { position: 'absolute', width: 90, height: 90, borderRadius: 999 },
  bottleFrame: {
    width: 72, height: 72, overflow: 'hidden', // để clip mực nước
  },
  waterFill: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    opacity: 0.9,
  },
  bottleIcon: {
    position: 'absolute',
  },
});

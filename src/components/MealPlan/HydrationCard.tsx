import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { StyleSheet, Animated, Easing, Pressable, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ViewComponent from '../ViewComponent';
import TextComponent from '../TextComponent';
import { colors as AppColors } from '../../constants/colors';
import { createWaterLog, getTotalWaterByDate } from '../../services/waterLog.service';

/** ===== Helpers ===== */
const formatYMDLocal = (d = new Date()) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

/** ===== Progress Bar (safe & smooth) ===== */
function AnimatedProgress({
  percent, tint, bg, height = 8, radius = 999,
}: { percent: number; tint: string; bg: string; height?: number; radius?: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const safe = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0;
    anim.stopAnimation();
    Animated.timing(anim, {
      toValue: safe,
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

/** ===== Props ===== */
type Props = {
  target: number;
  initial?: number;
  palette?: Partial<typeof AppColors>;
  style?: any;
  titleStyle?: any;
  onChange?: (ml: number) => void;
  pickMin?: number;
  pickMax?: number;
  pickStep?: number;
};

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
  const C = useMemo(() => ({ ...AppColors, ...(palette ?? {}) }), [palette]);

  const WATER = C.blue;
  const FRAME_BG = C.primarySurface || C.greenSurface;
  const FRAME_BORDER = C.primaryBorder || C.greenBorder;

  /** Tổng đã uống (ML) – nguồn sự thật: Server */
  const [water, setWater] = useState<number>(() => Math.max(0, Math.round(initial)));
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /** Lượng sẽ thêm (ML) – điều khiển bởi Slider */
  const [pick, setPick] = useState<number>(() => Math.min(Math.max(pickMin, 500), pickMax));

  // notify parent khi water đổi
  useEffect(() => { onChange?.(water); }, [water, onChange]);

  // % hoàn thành (safe)
  const pct = useMemo(() => {
    const t = Number.isFinite(target) ? target : 0;
    const w = Number.isFinite(water) ? water : 0;
    if (t <= 0) return 0;
    return Math.max(0, Math.min(1, Math.min(w, t) / t));
  }, [water, target]);

  const remain = Math.max(0, Math.round(Math.max(target - (Number.isFinite(water) ? water : 0), 0)));

  /** ====== ANIM – Bottle color & mực nước dâng ====== */
  const iconAnim = useRef(new Animated.Value(0)).current;
  const waterAnim = useRef(new Animated.Value(0)).current; // 0..1
  const AnimatedIcon = useMemo(
    () => Animated.createAnimatedComponent(MaterialCommunityIcons),
    []
  );

  useEffect(() => {
    const safe = Number.isFinite(pct) ? pct : 0;
    iconAnim.stopAnimation();
    waterAnim.stopAnimation();

    Animated.timing(iconAnim, {
      toValue: safe,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    Animated.timing(waterAnim, {
      toValue: safe,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // anim height
    }).start();
  }, [pct, iconAnim, waterAnim]);

  const bottleColor = iconAnim.interpolate({ inputRange: [0, 1], outputRange: ['#94a3b8', WATER] });
  const glowOpacity = iconAnim.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.36] });
  const fillHeight = waterAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 72] });

  /** ========= API integration ========= */
  const today = useMemo(() => formatYMDLocal(), []);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const total = await getTotalWaterByDate(today, ac.signal);
        setWater(Number.isFinite(total) ? Math.max(0, Math.round(total)) : 0);
      } catch (e: any) {
        setWater(0); // fallback an toàn
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [today]);

  const onChangePick = useCallback((v: number) => setPick(Math.round(v)), []);
  const addPick = useCallback(async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      const before = water;
      setWater(v => v + pick);

      const ok = await createWaterLog({ drankAt: new Date().toISOString(), amountMl: pick });
      if (!ok) {
        setWater(before);
        Alert.alert('Không lưu được', 'Vui lòng thử lại.');
        return;
      }

      const total = await getTotalWaterByDate(today);
      if (Number.isFinite(total)) {
        const serverTotal = Math.max(0, Math.round(total));
        if (serverTotal !== before + pick) setWater(serverTotal);
      }
    } catch {
      setWater(v => Math.max(0, v - pick));
      Alert.alert('Lỗi mạng', 'Không thể lưu nước. Kiểm tra kết nối và thử lại.');
    } finally {
      setSubmitting(false);
    }
  }, [pick, submitting, today, water]);

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
          <TextComponent text={`Mục tiêu ${target} ml`} variant="caption" weight="semibold" />
        </ViewComponent>
      </ViewComponent>

      {/* Slider + nút Thêm */}
      <ViewComponent mt={12}>
        <ViewComponent row between alignItems="center" mb={4} px={2}>
          <TextComponent text="Dung tích" variant="body" weight="bold" />
          <TextComponent text={`${pick} ml`} variant="body" weight="semibold" />
        </ViewComponent>

        <ViewComponent style={{ paddingHorizontal: 2 }}>
          <Slider
            value={pick}
            minimumValue={pickMin}
            maximumValue={pickMax}
            step={pickStep}
            onValueChange={onChangePick}
            minimumTrackTintColor={WATER}
            maximumTrackTintColor="#D5D8DE"
            thumbTintColor={C.white}
            style={{ height: 28 }}
            disabled={loading || submitting}
          />
        </ViewComponent>

        <Pressable
          onPress={addPick}
          disabled={loading || submitting}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: WATER, opacity: pressed || loading || submitting ? 0.6 : 1, shadowColor: WATER },
          ]}
        >
          <TextComponent
            text={submitting ? 'Đang lưu...' : `Thêm ${pick} ml`}
            variant="h3"
            weight="bold"
          />
        </Pressable>
      </ViewComponent>

      {/* Bottle + tiến trình */}
      <ViewComponent center mt={6}>
        <ViewComponent center style={styles.heroWrap}>
          {/* Glow */}
          <Animated.View style={[styles.heroGlow, { backgroundColor: 'rgba(59,130,246,0.22)', opacity: glowOpacity }]} />
          {/* Khung tròn – clip mực nước */}
          <ViewComponent
            style={styles.bottleFrame}
            center
            radius={999}
            border
            borderColor={FRAME_BORDER}
            backgroundColor={C.white}
          >
            {/* Mực nước dâng từ đáy lên */}
            <Animated.View style={[styles.waterFill, { backgroundColor: WATER, height: fillHeight }]} />
            {/* Chai outline */}
            <AnimatedIcon name="bottle-soda-outline" size={46} style={styles.bottleIcon as any} color={bottleColor as any} />
          </ViewComponent>
        </ViewComponent>

        <TextComponent text="Đã uống" variant="caption" tone="muted" />
        <TextComponent text={loading ? '...' : `${water} ml`} variant="h2" weight="bold" style={{ marginTop: 2 }} />

        <ViewComponent style={{ width: 200 }} mt={8}>
          <AnimatedProgress percent={(Number.isFinite(pct) ? pct : 0) * 100} tint={WATER} bg="#DCEBFF" />
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
          <TextComponent text={`Hoàn thành ${Math.round((Number.isFinite(pct) ? pct : 0) * 100)}%`} variant="caption" weight="semibold" />
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
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  heroWrap: { width: 90, height: 90, marginTop: 6 },
  heroGlow: { position: 'absolute', width: 90, height: 90, borderRadius: 999 },
  bottleFrame: { width: 72, height: 72, overflow: 'hidden' },
  waterFill: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 10, borderTopRightRadius: 10, opacity: 0.9 },
  bottleIcon: { position: 'absolute' },
});

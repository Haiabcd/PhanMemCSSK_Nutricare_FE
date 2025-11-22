import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Easing, View, Pressable } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ViewComponent from '../ViewComponent';
import TextComponent from '../TextComponent';
import { colors as C } from '../../constants/colors';

const KCAL_MIN_RATIO = 0.95;
const KCAL_MAX_RATIO = 1.05;
const CARB_MIN_RATIO = 0.85;
const CARB_MAX_RATIO = 1.15;
const FIBER_MIN_RATIO = 0.95;
const FIBER_MAX_RATIO = 1.5;
const PROT_MIN_RATIO = 0.9;
const PROT_MAX_RATIO = 1.1;
const FAT_MIN_RATIO = 0.8;
const FAT_MAX_RATIO = 1.1;

function normalizeWithTolerance(
  cur: number,
  total: number,
  minRatio: number,
  maxRatio: number,
): number {
  if (!total || total <= 0) return 0;
  const ratio = cur / total;
  if (ratio >= minRatio && ratio <= maxRatio) {
    return 1;
  }
  if (ratio < minRatio) {
    return Math.max(0, Math.min(1, ratio / minRatio));
  }
  return 1;
}

type Macro = { cur: number; total: number };

export type CaloriesNutritionCardProps = {
  target: number;
  eaten: number;
  burned?: number;
  macros: {
    carbs: Macro;
    protein: Macro;
    fat: Macro;
    fiber: Macro;
  };
  style?: any;
  titleStyle?: any;
  onPressStatistics?: () => void;
  allLogged?: boolean;
};

/** ===== Animated horizontal progress ===== */
function AnimatedProgress({
  percent,
  tint,
  height = 8,
  radius = 999,
}: {
  percent: number;
  tint: string;
  height?: number;
  radius?: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.max(0, Math.min(100, percent)),
      duration: 750,
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
      backgroundColor={C.white}
    >
      <Animated.View style={{ height: '100%', width, backgroundColor: tint }} />
    </ViewComponent>
  );
}

/** ===== Macro Pill ===== */
function MacroPill({
  icon,
  label,
  cur,
  total,
  tint,
  minRatio,
  maxRatio,
  allLogged,
}: {
  icon: string;
  label: string;
  cur: number;
  total: number;
  tint: string;
  minRatio: number;
  maxRatio: number;
  allLogged?: boolean;
}) {
  const norm = allLogged
    ? 1
    : total
    ? normalizeWithTolerance(cur, total, minRatio, maxRatio)
    : 0;

  const pct = norm * 100;

  return (
    <ViewComponent
      px={8}
      py={8}
      radius={12}
      border
      borderColor={C.slate600}
      backgroundColor={C.slate700}
      style={{ width: '24%' }}
    >
      <ViewComponent
        row
        alignItems="center"
        gap={6}
        mb={6}
        flex={0}
        style={{ minWidth: 0 }}
      >
        <View style={{ width: 16, alignItems: 'center' }}>
          <TextComponent text={icon} size={12} />
        </View>

        <TextComponent
          text={label}
          color={C.textWhite}
          size={11}
          weight="bold"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ flexShrink: 1, minWidth: 0 }}
        />
      </ViewComponent>

      <AnimatedProgress percent={pct} tint={tint} />

      <TextComponent
        text={`${cur}g / ${total}g`}
        color={C.textWhite}
        size={11}
        align="center"
        style={{ marginTop: 6, opacity: 0.9 }}
      />
    </ViewComponent>
  );
}

/** ===== Main Card ===== */
export default function CaloriesNutritionCard({
  target,
  eaten,
  macros,
  style,
  titleStyle,
  onPressStatistics,
  allLogged,
}: CaloriesNutritionCardProps) {
  const remain = Math.max(0, target - eaten);
  const eatenNorm = target
    ? normalizeWithTolerance(eaten, target, KCAL_MIN_RATIO, KCAL_MAX_RATIO)
    : 0;

  const targetStr = Number.isFinite(target) ? target.toFixed(2) : '0.00';
  const remainStr = Number.isFinite(remain) ? remain.toFixed(2) : '0.00';

  // Táo: xám -> đỏ theo tiến độ ăn
  const appleAnim = useRef(new Animated.Value(0)).current;
  const AnimatedIcon = Animated.createAnimatedComponent(MaterialCommunityIcons);

  useEffect(() => {
    Animated.timing(appleAnim, {
      toValue: eatenNorm,
      duration: 850,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [eatenNorm, appleAnim]);

  const appleColor = appleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#94a3b8', C.red],
  });
  const glowOpacity = appleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.45],
  });

  // ====== Tính thông điệp “thiếu nhẹ nhưng không sao” khi đã log đủ ======
  let infoText: string | null = null;
  if (allLogged) {
    const missingBits: string[] = [];

    // kcal: chỉ quan tâm thiếu, không báo dư
    const kcalDiff = target - eaten; // > 0 là thiếu
    if (kcalDiff > 10) {
      missingBits.push(`${Math.round(kcalDiff)} kcal`);
    }

    const macroMissing = (
      cur: number,
      total: number,
      minRatio: number,
      label: string,
    ) => {
      if (!total || total <= 0) return null;
      const needMin = total * minRatio;
      if (cur >= needMin) return null; // trong/qua ngưỡng tối thiểu => không báo
      const diff = Math.round(needMin - cur);
      if (diff <= 0) return null;
      return `${diff}g ${label}`;
    };

    const mCarb = macroMissing(
      macros.carbs.cur,
      macros.carbs.total,
      CARB_MIN_RATIO,
      'carb',
    );
    const mProt = macroMissing(
      macros.protein.cur,
      macros.protein.total,
      PROT_MIN_RATIO,
      'đạm',
    );
    const mFat = macroMissing(
      macros.fat.cur,
      macros.fat.total,
      FAT_MIN_RATIO,
      'béo',
    );
    const mFiber = macroMissing(
      macros.fiber.cur,
      macros.fiber.total,
      FIBER_MIN_RATIO,
      'chất xơ',
    );

    [mCarb, mProt, mFat, mFiber].forEach(m => {
      if (m) missingBits.push(m);
    });

    if (missingBits.length > 0) {
      infoText =
        'Bạn đã ghi đầy đủ các bữa ăn hôm nay rồi. ' +
        'Dinh dưỡng chỉ lệch nhẹ so với mục tiêu nên bạn cứ yên tâm ăn theo đúng kế hoạch nhé. 💚';
    }
  }

  return (
    <ViewComponent
      p={12}
      radius={16}
      backgroundColor={C.slate800}
      style={[styles.cardShadow, style]}
    >
      {/* Header */}
      <ViewComponent row between alignItems="center" mb={8}>
        <TextComponent
          text="Calo & Dinh dưỡng"
          variant="h3"
          color={C.textWhite}
          style={titleStyle}
        />
        <Pressable onPress={onPressStatistics}>
          <ViewComponent
            px={10}
            py={6}
            radius={999}
            border
            borderColor={C.slate50}
          >
            <TextComponent
              text="Thống kê"
              color={C.textWhite}
              weight="bold"
              size={14}
            />
          </ViewComponent>
        </Pressable>
      </ViewComponent>

      {/* Body */}
      <ViewComponent row between>
        {/* Left: Apple + progress */}
        <ViewComponent alignItems="center" justifyContent="center" flex={1}>
          <ViewComponent center style={{ width: 84, height: 84 }}>
            <Animated.View
              style={{
                position: 'absolute',
                width: 84,
                height: 84,
                borderRadius: 999,
                backgroundColor: C.red,
                opacity: glowOpacity as any,
              }}
            />
            <ViewComponent
              center
              radius={999}
              border
              borderColor="rgba(255,255,255,0.25)"
              style={{
                width: 64,
                height: 64,
                backgroundColor: 'rgba(255,255,255,0.12)',
              }}
            >
              <AnimatedIcon
                name="food-apple"
                size={36}
                style={{ color: appleColor as any }}
              />
            </ViewComponent>
          </ViewComponent>

          <TextComponent
            text="Đã nạp"
            color={C.textWhite}
            size={12}
            style={{ marginTop: 4, opacity: 0.9 }}
          />
          <TextComponent
            text={String(eaten)}
            color={C.amber500}
            size={28}
            weight="bold"
          />

          <ViewComponent mt={8} style={{ width: 140 }}>
            <AnimatedProgress percent={eatenNorm * 100} tint={C.blue} />
          </ViewComponent>
        </ViewComponent>

        {/* Right: Stats */}
        <ViewComponent flex={1} pl={8} justifyContent="center">
          <ViewComponent row alignItems="center" gap={8} mb={8}>
            <MaterialCommunityIcons
              name="lightning-bolt"
              size={18}
              color={C.success}
            />
            <TextComponent
              text="Cần nạp"
              color={C.textWhite}
              style={{ flex: 1, opacity: 0.9 }}
            />
            <TextComponent text={targetStr} color={C.textWhite} weight="bold" />
          </ViewComponent>

          <ViewComponent row alignItems="center" gap={8} mb={8}>
            <MaterialCommunityIcons
              name="silverware-fork-knife"
              size={18}
              color={C.blue}
            />
            <TextComponent
              text="Còn lại"
              color={C.textWhite}
              style={{ flex: 1, opacity: 0.9 }}
            />
            <TextComponent text={remainStr} color={C.textWhite} weight="bold" />
          </ViewComponent>
        </ViewComponent>
      </ViewComponent>

      {/* Divider dashed */}
      <ViewComponent mt={10}>
        <View style={styles.dash} />
      </ViewComponent>

      {/* Macros */}
      <ViewComponent row justifyContent="space-between" mt={12}>
        <MacroPill
          icon="🌾"
          label="Carbs"
          cur={macros.carbs.cur}
          total={macros.carbs.total}
          tint={C.amber500}
          minRatio={CARB_MIN_RATIO}
          maxRatio={CARB_MAX_RATIO}
          allLogged={allLogged}
        />
        <MacroPill
          icon="🥩"
          label="Đạm"
          cur={macros.protein.cur}
          total={macros.protein.total}
          tint={C.violet500}
          minRatio={PROT_MIN_RATIO}
          maxRatio={PROT_MAX_RATIO}
          allLogged={allLogged}
        />
        <MacroPill
          icon="🥑"
          label="Béo"
          cur={macros.fat.cur}
          total={macros.fat.total}
          tint={C.success}
          minRatio={FAT_MIN_RATIO}
          maxRatio={FAT_MAX_RATIO}
          allLogged={allLogged}
        />
        <MacroPill
          icon="🥦"
          label="Xơ "
          cur={macros.fiber.cur}
          total={macros.fiber.total}
          tint={C.success}
          minRatio={FIBER_MIN_RATIO}
          maxRatio={FIBER_MAX_RATIO}
          allLogged={allLogged}
        />
      </ViewComponent>

      {/* Thông điệp tổng kết khi đã log hết bữa ăn */}
      {infoText && (
        <ViewComponent
          mt={10}
          px={10}
          py={8}
          radius={12}
          backgroundColor="rgba(148,163,184,0.18)"
          style={{
            borderWidth: 1,
            borderColor: 'rgba(148,163,184,0.6)',
          }}
        >
          <ViewComponent row gap={8} alignItems="flex-start">
            <MaterialCommunityIcons
              name="emoticon-happy-outline"
              size={18}
              color={C.amber400}
              style={{ marginTop: 2 }}
            />
            <TextComponent
              text={infoText}
              size={11}
              color={C.slate50}
              style={{ lineHeight: 16, flex: 1 }}
            />
          </ViewComponent>
        </ViewComponent>
      )}
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
  dash: {
    height: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.slate600,
  },
});

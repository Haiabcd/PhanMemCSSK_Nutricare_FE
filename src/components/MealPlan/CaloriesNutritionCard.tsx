import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Easing, View, Pressable } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ViewComponent from '../ViewComponent';
import TextComponent from '../TextComponent';
import { colors as C } from '../../constants/colors';
/** ===== Types ===== */
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
}: {
  icon: string;
  label: string;
  cur: number;
  total: number;
  tint: string;
}) {
  const pct = total ? (cur / total) * 100 : 0;

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
      {/* Header: icon + label (đồng hàng, không co chữ lệch cỡ) */}
      <ViewComponent
        row
        alignItems="center"
        gap={6}
        mb={6}
        flex={0}
        style={{ minWidth: 0 }}
      >
        {/* Khung icon cố định để điểm bắt đầu label thẳng hàng */}
        <View style={{ width: 16, alignItems: 'center' }}>
          <TextComponent text={icon} size={12} />
        </View>

        {/* Giữ cùng cỡ font, nếu thiếu chỗ thì cắt đuôi */}
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
  burned = 0,
  macros,
  style,
  titleStyle,
  onPressStatistics,
}: CaloriesNutritionCardProps) {
  const remain = Math.max(0, target - eaten);
  const eatenPct = target ? Math.max(0, Math.min(1, eaten / target)) : 0;

  // Táo: xám -> đỏ theo tiến độ ăn
  const appleAnim = useRef(new Animated.Value(0)).current;
  const AnimatedIcon = Animated.createAnimatedComponent(MaterialCommunityIcons);

  useEffect(() => {
    Animated.timing(appleAnim, {
      toValue: eatenPct,
      duration: 850,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [eatenPct, appleAnim]);

  const appleColor = appleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#94a3b8', C.red],
  });
  const glowOpacity = appleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.45],
  });

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
            <AnimatedProgress percent={eatenPct * 100} tint={C.blue} />
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
            <TextComponent
              text={String(target)}
              color={C.textWhite}
              weight="bold"
            />
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
            <TextComponent
              text={String(remain)}
              color={C.textWhite}
              weight="bold"
            />
          </ViewComponent>

          {/* <ViewComponent row alignItems="center" gap={8}>
            <MaterialCommunityIcons name="fire" size={18} color={C.red} />
            <TextComponent
              text="Tiêu hao"
              color={C.textWhite}
              style={{ flex: 1, opacity: 0.9 }}
            />
            <TextComponent
              text={String(burned)}
              color={C.textWhite}
              weight="bold"
            />
          </ViewComponent> */}
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
        />
        <MacroPill
          icon="🥩"
          label="Đạm"
          cur={macros.protein.cur}
          total={macros.protein.total}
          tint={C.violet500}
        />
        <MacroPill
          icon="🥑"
          label="Béo"
          cur={macros.fat.cur}
          total={macros.fat.total}
          tint={C.success}
        />
        <MacroPill
          icon="🥦"
          label="Xơ "
          cur={macros.fiber.cur}
          total={macros.fiber.total}
          tint={C.success}
        />
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
  dash: {
    height: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.slate600,
  },
});

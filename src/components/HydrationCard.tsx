import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

/** ===== Types ===== */
type Palette = {
  white: string;
  textWhite: string;
  blue: string;
  green: string;
  red: string;
  amber500: string;
  violet500: string;
  slate50: string;
  slate200: string;
  slate600: string;
  slate700: string;
  slate800: string;
  text?: string;
  sub?: string;
};
type Props = {
  target: number; // L mục tiêu
  step?: number; // L/bước (+/-)
  initial?: number; // L ban đầu
  palette?: Palette; // Dùng chung palette với app
  style?: ViewStyle;
  titleStyle?: TextStyle;
  onChange?: (liters: number) => void;
};

/** ===== Default palette (sáng) ===== */
const C0: Palette = {
  white: '#ffffff',
  textWhite: '#F5FEF2',
  blue: '#3B82F6',
  green: '#43B05C',
  red: '#EF4444',
  amber500: '#f59e0b',
  violet500: '#8b5cf6',
  slate50: '#f8fafc',
  slate200: '#e2e8f0',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  text: '#0f172a',
  sub: '#6b7280',
};

/** ===== Progress (animated) ===== */
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
      duration: 850,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent]);
  const width = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });
  return (
    <View
      style={{
        height,
        backgroundColor: bg,
        borderRadius: radius,
        overflow: 'hidden',
      }}
    >
      <Animated.View style={{ height: '100%', width, backgroundColor: tint }} />
    </View>
  );
}

/** ===== Main: HydrationSummaryCard (sáng, nút 2 bên, chai giữa) ===== */
export default function HydrationSummaryCard({
  target,
  step = 0.25,
  initial = 0,
  palette,
  style,
  titleStyle,
  onChange,
}: Props) {
  const C = { ...C0, ...(palette ?? {}) };

  const [water, setWater] = useState(() =>
    Math.max(0, Math.min(target, +initial.toFixed(2))),
  );
  useEffect(() => {
    onChange?.(water);
  }, [water]);

  const pct = useMemo(
    () => (target <= 0 ? 0 : Math.max(0, Math.min(1, water / target))),
    [water, target],
  );
  const remain = Math.max(0, +(target - water).toFixed(2));

  // Icon chai nước: xám -> xanh theo % hoàn thành
  const iconAnim = useRef(new Animated.Value(0)).current;
  const AnimatedIcon = Animated.createAnimatedComponent(MaterialCommunityIcons);
  useEffect(() => {
    Animated.timing(iconAnim, {
      toValue: pct,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const bottleColor = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#94a3b8', C.blue],
  });
  const glowOpacity = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.45],
  });

  const add = () => setWater(v => Math.min(target, +(v + step).toFixed(2)));
  const sub = () => setWater(v => Math.max(0, +(v - step).toFixed(2)));

  return (
    <View style={[s(C).card, style]}>
      {/* Header */}
      <View style={s(C).header}>
        <Text style={[s(C).title, titleStyle]}>Uống nước</Text>
        <View style={s(C).chip}>
          <MaterialCommunityIcons name="target" size={14} color={C.blue} />
          <Text style={s(C).chipText}>Mục tiêu {target} L</Text>
        </View>
      </View>

      {/* Body: –  [Bottle]  + */}
      <View style={s(C).bodyRow}>
        {/* – bên trái */}
        <View style={s(C).sideCol}>
          <Pressable
            onPress={sub}
            style={[
              s(C).roundBtn,
              { backgroundColor: C.white, borderColor: '#DBEAFE' },
            ]}
          >
            <MaterialCommunityIcons name="minus" size={18} color={C.sub} />
          </Pressable>
          <Text style={s(C).sideNote}>{step} L</Text>
        </View>

        {/* Chai giữa */}
        <View style={s(C).centerCol}>
          <View style={s(C).heroIconWrap}>
            <Animated.View style={[s(C).heroGlow, { opacity: glowOpacity }]} />
            <View style={s(C).heroIconCircle}>
              <AnimatedIcon
                name="bottle-soda"
                size={40}
                style={{ color: bottleColor }}
              />
            </View>
          </View>

          <Text style={s(C).labelSmall}>Đã uống</Text>
          <Text style={s(C).valueBig}>{water.toFixed(2)} L</Text>

          {/* progress dưới chai */}
          <View style={{ width: 180, marginTop: 10 }}>
            <AnimatedProgress
              percent={pct * 100}
              tint={C.blue}
              bg={'#DCEBFF'}
            />
          </View>
        </View>

        {/* + bên phải */}
        <View style={s(C).sideCol}>
          <Pressable
            onPress={add}
            style={[
              s(C).roundBtn,
              { backgroundColor: C.blue, borderColor: C.blue },
            ]}
          >
            <MaterialCommunityIcons name="plus" size={18} color={C.white} />
          </Pressable>
          <Text style={s(C).sideNote}>{step} L</Text>
        </View>
      </View>

      {/* Chips thống kê dưới cùng */}
      <View style={s(C).statsChips}>
        <View style={s(C).statChip}>
          <MaterialCommunityIcons name="cup-water" size={16} color={C.blue} />
          <Text style={s(C).statChipText}>Còn lại {remain} L</Text>
        </View>
        <View style={s(C).statChip}>
          <MaterialCommunityIcons
            name="water-check"
            size={16}
            color={C.green}
          />
          <Text style={s(C).statChipText}>
            Hoàn thành {Math.round(pct * 100)}%
          </Text>
        </View>
      </View>
    </View>
  );
}

const s = (C: Palette) =>
  StyleSheet.create({
    // Card sáng để nổi bật trên nền trắng
    card: {
      backgroundColor: '#E8F3FF', // xanh rất nhạt
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: '#DBEAFE',
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: { color: C.text!, fontWeight: '800', fontSize: 16 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: C.white,
      borderWidth: 1,
      borderColor: '#DBEAFE',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },
    chipText: { color: C.text!, fontWeight: '800', fontSize: 12 },

    // Body: –  [Bottle]  +
    bodyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    sideCol: { width: 70, alignItems: 'center' },
    roundBtn: {
      width: 44,
      height: 44,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    sideNote: { marginTop: 6, fontSize: 12, color: C.sub!, fontWeight: '700' },

    centerCol: { alignItems: 'center', flex: 1 },
    heroIconWrap: {
      width: 90,
      height: 90,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroGlow: {
      position: 'absolute',
      width: 90,
      height: 90,
      borderRadius: 999,
      backgroundColor: 'rgba(59,130,246,0.28)', // glow xanh nhạt
    },
    heroIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.white,
      borderWidth: 1,
      borderColor: '#DBEAFE',
    },
    labelSmall: { color: C.sub!, fontSize: 12, marginTop: 6 },
    valueBig: { color: C.text!, fontSize: 22, fontWeight: '900', marginTop: 2 },

    // Chips thống kê
    statsChips: {
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'center',
      marginTop: 12,
      flexWrap: 'wrap',
    },
    statChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: C.white,
      borderWidth: 1,
      borderColor: '#DBEAFE',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },
    statChipText: { color: C.text!, fontWeight: '800', fontSize: 12 },
  });

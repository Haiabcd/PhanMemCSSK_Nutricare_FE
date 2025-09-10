import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  TextStyle,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';

/** ===== Types ===== */
type Macro = { cur: number; total: number };
export type CaloriesNutritionCardProps = {
  target: number; // kcal cần nạp
  eaten: number; // kcal đã nạp
  burned?: number; // kcal tiêu hao (optional)
  macros: {
    carbs: Macro;
    protein: Macro;
    fat: Macro;
    fiber: Macro;
  };
  modeLabel?: string; // Ví dụ: "Cân Bằng"
  palette?: typeof defaultColors; // Nếu muốn dùng bảng màu app, truyền vào
  style?: ViewStyle;
  titleStyle?: TextStyle;
};

/** ===== Default palette ===== */
const defaultColors = {
  white: '#ffffff',
  textWhite: '#F5FEF2',
  blue: '#3B82F6',
  green: '#43B05C',
  success: '#16a34a',
  red: '#EF4444',
  amber500: '#f59e0b',
  violet500: '#8b5cf6',

  slate50: '#f8fafc',
  slate200: '#e2e8f0',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
};

/** ===== Animated horizontal progress ===== */
function AnimatedProgress({
  percent,
  tint,
  height = 8,
  bg,
  radius = 999,
}: {
  percent: number; // 0..100
  tint: string;
  height?: number;
  bg: string;
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

/** ===== Macro pill (compact, animated) ===== */
function MacroPill({
  icon,
  label,
  cur,
  total,
  tint,
  C,
}: {
  icon: React.ReactNode;
  label: string;
  cur: number;
  total: number;
  tint: string;
  C: typeof defaultColors;
}) {
  const pct = total ? (cur / total) * 100 : 0;
  return (
    <View style={styles(C).macroPill}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 6,
        }}
      >
        {icon}
        <Text style={styles(C).macroPillLabel}>{label}</Text>
      </View>
      <AnimatedProgress percent={pct} tint={tint} bg={C.slate700} height={6} />
      <Text style={styles(C).macroPillVal}>
        {cur}g / {total}g
      </Text>
    </View>
  );
}

/** ===== Main card component ===== */
export default function CaloriesNutritionCard({
  target,
  eaten,
  burned = 0,
  macros,
  modeLabel,
  palette,
  style,
  titleStyle,
}: CaloriesNutritionCardProps) {
  const C = palette ?? defaultColors;
  const remain = Math.max(0, target - eaten);
  const eatenPct = target ? Math.max(0, Math.min(1, eaten / target)) : 0;

  // Táo đổi màu từ xám -> đỏ theo eatenPct
  const appleAnim = useRef(new Animated.Value(0)).current;
  const AnimatedIcon = Animated.createAnimatedComponent(MaterialCommunityIcons);

  useEffect(() => {
    Animated.timing(appleAnim, {
      toValue: eatenPct,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [eatenPct]);

  const appleColor = appleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#94a3b8', C.red], // xám -> đỏ
  });
  const glowOpacity = appleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.45],
  });

  return (
    <View style={[styles(C).card, style]}>
      {/* Header */}
      <View style={styles(C).header}>
        <Text style={[styles(C).title, titleStyle]}>Calo & Dinh dưỡng</Text>
        <View style={styles(C).statBtn}>
          <Text style={styles(C).statBtnText}>Thống kê</Text>
        </View>
      </View>

      {/* Body: left eaten icon + bar, right stats */}
      <View style={styles(C).body}>
        <View style={styles(C).left}>
          <View style={styles(C).eatenIconWrap}>
            <Animated.View
              style={[styles(C).eatenGlow, { opacity: glowOpacity }]}
            />
            <View style={styles(C).eatenIconCircle}>
              <AnimatedIcon
                name="food-apple"
                size={36}
                style={{ color: appleColor }}
              />
            </View>
          </View>

          <Text style={styles(C).eatenSmall}>Đã nạp</Text>
          <Text style={styles(C).eatenBig}>{eaten}</Text>

          <View style={{ width: 140, marginTop: 8 }}>
            <AnimatedProgress
              percent={eatenPct * 100}
              tint={C.blue}
              bg={C.slate700}
            />
          </View>
        </View>

        <View style={styles(C).right}>
          <View style={styles(C).statRow}>
            <MaterialCommunityIcons
              name="lightning-bolt"
              size={18}
              color={C.green}
            />
            <Text style={styles(C).statLabel}>Cần nạp</Text>
            <Text style={styles(C).statValue}>{target}</Text>
          </View>
          <View style={styles(C).statRow}>
            <MaterialCommunityIcons
              name="silverware-fork-knife"
              size={18}
              color={C.blue}
            />
            <Text style={styles(C).statLabel}>Còn lại</Text>
            <Text style={styles(C).statValue}>{remain}</Text>
          </View>
          <View style={styles(C).statRow}>
            <MaterialCommunityIcons name="fire" size={18} color={C.red} />
            <Text style={styles(C).statLabel}>Tiêu hao</Text>
            <Text style={styles(C).statValue}>{burned}</Text>
          </View>
        </View>
      </View>

      {/* Divider dashed + help dot */}
      <View style={styles(C).dashedWrap}>
        <View style={styles(C).dashed} />
        <View style={styles(C).helpDot}>
          <MaterialCommunityIcons name="help" size={14} color={C.textWhite} />
        </View>
      </View>

      {/* 4 macro: compact in one row */}
      <View style={styles(C).macroRowCompact}>
        <MacroPill
          icon={
            <MaterialCommunityIcons name="wheat" size={14} color={C.amber500} />
          }
          label="Carbs"
          cur={macros.carbs.cur}
          total={macros.carbs.total}
          tint={C.amber500}
          C={C}
        />
        <MacroPill
          icon={
            <MaterialCommunityIcons
              name="egg-outline"
              size={14}
              color={C.violet500}
            />
          }
          label="Chất đạm"
          cur={macros.protein.cur}
          total={macros.protein.total}
          tint={C.violet500}
          C={C}
        />
        <MacroPill
          icon={
            <MaterialCommunityIcons
              name="peanut-outline"
              size={14}
              color={C.green}
            />
          }
          label="Chất béo"
          cur={macros.fat.cur}
          total={macros.fat.total}
          tint={C.green}
          C={C}
        />
        <MacroPill
          icon={<Entypo name="leaf" size={14} color={C.success} />}
          label="Chất xơ"
          cur={macros.fiber.cur}
          total={macros.fiber.total}
          tint={C.success}
          C={C}
        />
      </View>

      {/* Mode chip */}
      {modeLabel ? (
        <View style={styles(C).modeRow}>
          <Text style={styles(C).modeText}>Bạn đang ăn theo chế độ:</Text>
          <View style={styles(C).modeChip}>
            <Text style={styles(C).modeChipText}>{modeLabel}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

/** ===== Styles (factory theo palette) ===== */
const styles = (C: typeof defaultColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: C.slate800,
      borderRadius: 16,
      padding: 12,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: { color: C.textWhite, fontWeight: '800', fontSize: 16 },
    statBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: C.slate700,
      borderWidth: 1,
      borderColor: C.slate600,
    },
    statBtnText: { color: C.textWhite, fontWeight: '800', fontSize: 12 },

    body: { flexDirection: 'row', marginTop: 8 },
    left: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    eatenIconWrap: {
      width: 84,
      height: 84,
      alignItems: 'center',
      justifyContent: 'center',
    },
    eatenGlow: {
      position: 'absolute',
      width: 84,
      height: 84,
      borderRadius: 999,
      backgroundColor: C.red,
    },
    eatenIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
    },
    eatenSmall: {
      color: C.textWhite,
      opacity: 0.9,
      fontSize: 12,
      marginTop: 4,
    },
    eatenBig: {
      color: C.amber500,
      fontSize: 28,
      fontWeight: '900',
      marginTop: 2,
    },

    right: { flex: 1, paddingLeft: 8, justifyContent: 'center' },
    statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    statLabel: { color: C.textWhite, opacity: 0.9, flex: 1 },
    statValue: { color: C.textWhite, fontWeight: '900' },

    dashedWrap: { marginTop: 8, position: 'relative' },
    dashed: {
      height: 1,
      borderBottomWidth: 1,
      borderStyle: 'dashed',
      borderColor: C.slate600,
    },
    helpDot: {
      position: 'absolute',
      right: -2,
      top: -8,
      width: 22,
      height: 22,
      borderRadius: 999,
      backgroundColor: C.slate700,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.slate600,
    },

    /* Macro: compact row */
    macroRowCompact: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 10,
    },
    macroPill: {
      width: '24%',
      backgroundColor: C.slate700,
      borderWidth: 1,
      borderColor: C.slate600,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 8,
    },
    macroPillLabel: { color: C.textWhite, fontWeight: '800', fontSize: 11 },
    macroPillVal: {
      color: C.textWhite,
      opacity: 0.9,
      fontSize: 11,
      marginTop: 6,
      textAlign: 'center',
    },

    /* Mode chip */
    modeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
      justifyContent: 'center',
    },
    modeText: { color: C.textWhite, opacity: 0.9 },
    modeChip: {
      backgroundColor: '#BBF7D0',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: C.green,
    },
    modeChipText: { color: '#065f46', fontWeight: '900', fontSize: 12 },
  });

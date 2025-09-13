import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  TextInput,
  Pressable,
} from 'react-native';
import WizardFrame from '../../components/WizardFrame';
import { useWizard } from '../../context/WizardContext';
import { colors } from '../../constants/colors';

/* ===== Theme ===== */
const GREEN = colors?.green ?? '#22C55E';
const GREEN_DARK = '#16A34A';
const SLATE_700 = '#334155';
const SLATE_600 = '#475569';
const SLATE_500 = '#64748B';
const SLATE_400 = '#94A3B8';
const EMERALD_25 = '#F4FBF7';
const EMERALD_100 = '#D1FAE5';
const WHITE = colors?.white ?? '#FFFFFF';

/* ===== Config ===== */
const KG_MIN = 30;
const KG_MAX = 200;

const { width: SCREEN_W } = Dimensions.get('window');
const TICK_W = 22; // khoảng cách giữa từng kg
const PAD = Math.max(0, SCREEN_W * 0.5 - TICK_W * 0.5); // *** canh giữa đúng tâm vạch ***
const TICK_H_MINOR = 12;
const TICK_H_MED = 20;
const TICK_H_MAJOR = 32;

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const StepWeightScreen = () => {
  const { form, setWeightKg } = useWizard(); // cần có weightKg & setWeightKg trong context
  const scrollRef = useRef<ScrollView>(null);
  const isScrolling = useRef(false);
  const [initialized, setInitialized] = useState(false);

  // tap to edit
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(form.weightKg ?? 60));
  const inputRef = useRef<TextInput>(null);

  const display = useMemo(() => `${form.weightKg ?? 60} kg`, [form.weightKg]);

  /* ===== Initial position ===== */
  useEffect(() => {
    if (isScrolling.current || initialized) return;
    const current = clamp(Math.round(form.weightKg ?? 60), KG_MIN, KG_MAX);
    const idx = current - KG_MIN;
    requestAnimationFrame(() => {
      // Với PAD = SCREEN_W/2 - TICK_W/2, offset idx*TICK_W là tâm vạch ở giữa màn hình
      scrollRef.current?.scrollTo({ x: idx * TICK_W, animated: false });
      setInitialized(true);
    });
  }, [form.weightKg, initialized]);

  /* ===== Scroll handlers ===== */
  const onScrollBegin = () => {
    isScrolling.current = true;
  };

  const onScrollEnd = (x: number) => {
    isScrolling.current = false;
    const idx = Math.round(x / TICK_W);
    const kg = clamp(KG_MIN + idx, KG_MIN, KG_MAX);
    setWeightKg?.(kg);
  };

  /* ===== Tap readout to edit ===== */
  useEffect(() => {
    if (isEditing) {
      setInputVal(String(form.weightKg ?? 60));
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [isEditing, form.weightKg]);

  const onReadoutPress = () => setIsEditing(true);

  // Chỉ nhận số 0–3 ký tự
  const onChangeNumeric = (next: string) => {
    if (/^\d{0,3}$/.test(next)) setInputVal(next);
  };

  const commitInput = () => {
    const num = parseInt(inputVal, 10);
    if (!Number.isNaN(num)) {
      const kg = clamp(num, KG_MIN, KG_MAX);
      setWeightKg?.(kg);
      const idx = kg - KG_MIN;
      scrollRef.current?.scrollTo({ x: idx * TICK_W, animated: true });
    }
    setIsEditing(false);
  };

  /* ===== Ticks ===== */
  const renderTicks = () => {
    const total = KG_MAX - KG_MIN + 1;
    return Array.from({ length: total }, (_, i) => KG_MIN + i).map(kg => {
      const isMajor = kg % 10 === 0;
      const isMedium = kg % 5 === 0;
      const h = isMajor ? TICK_H_MAJOR : isMedium ? TICK_H_MED : TICK_H_MINOR;

      return (
        <View key={kg} style={styles.tickItem}>
          <View
            style={[
              styles.tickLine,
              { height: h },
              isMedium && styles.tickLineMed,
              isMajor && styles.tickLineMajor,
            ]}
          />
          {isMajor && (
            <View style={styles.labelWrap}>
              <Text style={styles.labelText}>{kg}</Text>
            </View>
          )}
        </View>
      );
    });
  };

  return (
    <WizardFrame
      title="Cân Nặng Của Bạn"
      subtitle="Cân nặng (kg) chính xác giúp tính toán nhu cầu dinh dưỡng phù hợp nhất"
    >
      <View style={styles.wrap}>
        {/* Readout (tap để nhập) */}
        <Pressable onPress={onReadoutPress}>
          <View style={styles.readoutCard}>
            {isEditing ? (
              <TextInput
                ref={inputRef}
                value={inputVal}
                onChangeText={onChangeNumeric}
                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                // @ts-ignore: gợi ý bàn phím numeric nếu RN hỗ trợ
                inputMode="numeric"
                returnKeyType="done"
                onSubmitEditing={commitInput}
                onBlur={commitInput}
                maxLength={3}
                selectionColor={GREEN_DARK}
                placeholder="Nhập kg"
                style={styles.readoutInput}
                selectTextOnFocus
              />
            ) : (
              <Text style={styles.readoutText}>{display}</Text>
            )}
          </View>
        </Pressable>

        {/* Ruler */}
        <View style={styles.rulerBox}>
          {/* Vạch giữa màu xanh — không bắt touch */}
          <View
            pointerEvents="none"
            style={[
              styles.centerIndicator,
              { left: Math.round(SCREEN_W / 2) - 1 }, // anti-blur, canh pixel
            ]}
          />

          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            snapToInterval={TICK_W}
            snapToAlignment="start"
            decelerationRate="fast"
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingHorizontal: PAD, // *** nửa màn - nửa ô ***
              paddingTop: 8,
              paddingBottom: 34, // chừa chỗ cho nhãn phía dưới
            }}
            onScrollBeginDrag={onScrollBegin}
            onMomentumScrollEnd={e =>
              onScrollEnd(e.nativeEvent.contentOffset.x)
            }
            onScrollEndDrag={e => onScrollEnd(e.nativeEvent.contentOffset.x)}
          >
            {renderTicks()}
          </ScrollView>
        </View>

        <Text style={styles.hint}>
          ↔️ Kéo để chọn — chạm vào số để nhập trực tiếp (chỉ số).
        </Text>
      </View>
    </WizardFrame>
  );
};

/* ===== Styles ===== */
const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: WHITE,
  },

  /* readout */
  readoutCard: {
    backgroundColor: EMERALD_25,
    borderColor: EMERALD_100,
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: GREEN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  readoutText: {
    fontSize: 36,
    fontWeight: '800',
    color: GREEN_DARK,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  readoutInput: {
    fontSize: 36,
    fontWeight: '800',
    color: GREEN_DARK,
    textAlign: 'center',
    padding: 0,
    margin: 0,
    minWidth: 120,
  },

  /* ruler */
  rulerBox: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },

  centerIndicator: {
    position: 'absolute',
    top: 10,
    bottom: 44, // chừa chỗ cho nhãn bên dưới
    width: 2,
    backgroundColor: GREEN,
    borderRadius: 2,
    zIndex: 2,
  },

  tickItem: {
    width: TICK_W,
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'visible',
  },
  tickLine: {
    width: 2,
    height: TICK_H_MINOR,
    backgroundColor: SLATE_400,
    borderRadius: 1,
    marginTop: 8,
  },
  tickLineMed: {
    height: TICK_H_MED,
    backgroundColor: SLATE_500,
  },
  tickLineMajor: {
    height: TICK_H_MAJOR,
    backgroundColor: SLATE_600,
    width: 3,
    borderRadius: 1.5,
  },

  labelWrap: {
    position: 'absolute',
    bottom: -28, // đẩy nhãn xuống dưới trục
    left: -TICK_W * 4.5, // căn giữa cụm 10 vạch
    right: -TICK_W * 4.5,
    alignItems: 'center',
  },
  labelText: {
    fontSize: 16,
    fontWeight: '800',
    color: SLATE_700,
    letterSpacing: 0.3,
  },

  hint: {
    color: SLATE_600,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default StepWeightScreen;

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  TextInput,
  Pressable,
  View,
} from 'react-native';
import WizardFrame from '../../components/WizardFrame';
import { useWizard } from '../../context/WizardContext';
import { colors } from '../../constants/colors';
import TextComponent from '../../components/TextComponent';
import ViewComponent from '../../components/ViewComponent';

/* ===== Config ===== */
const KG_MIN = 30;
const KG_MAX = 200;

const { width: SCREEN_W } = Dimensions.get('window');
const TICK_W = 22; // khoảng cách giữa từng kg
const PAD = Math.max(0, SCREEN_W * 0.5 - TICK_W * 0.5); // canh giữa tâm vạch
const TICK_H_MINOR = 12;
const TICK_H_MED = 20;
const TICK_H_MAJOR = 32;

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const StepWeightScreen = () => {
  const { form, setWeightKg } = useWizard(); // cần weightKg & setWeightKg trong context
  const scrollRef = useRef<ScrollView>(null);
  const isScrolling = useRef(false);
  const [initialized, setInitialized] = useState(false);

  // tap to edit
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(form.weightKg ?? 60));
  const inputRef = useRef<TextInput>(null);

  const display = useMemo(() => `${form.weightKg ?? 60} kg `, [form.weightKg]);

  /* ===== Initial position ===== */
  useEffect(() => {
    if (isScrolling.current || initialized) return;
    const current = clamp(Math.round(form.weightKg ?? 60), KG_MIN, KG_MAX);
    const idx = current - KG_MIN;
    requestAnimationFrame(() => {
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
        <ViewComponent key={kg} style={styles.tickItem}>
          <ViewComponent
            style={[
              styles.tickLine,
              { height: h },
              isMedium && styles.tickLineMed,
              isMajor && styles.tickLineMajor,
            ]}
          />
          {isMajor && (
            <ViewComponent style={styles.labelWrap} alignItems="center">
              <TextComponent
                text={String(kg)}
                size={16}
                weight="bold"
                color={colors.slate700}
              />
            </ViewComponent>
          )}
        </ViewComponent>
      );
    });
  };

  return (
    <WizardFrame
      title="Cân Nặng Của Bạn"
      subtitle="Cân nặng (kg) chính xác giúp tính toán nhu cầu dinh dưỡng phù hợp nhất"
    >
      <ViewComponent style={styles.wrap}>
        {/* Readout (tap để nhập) */}
        <Pressable onPress={onReadoutPress}>
          <ViewComponent px={24} py={14} radius={16} style={styles.readoutCard}>
            {isEditing ? (
              <TextInput
                ref={inputRef}
                value={inputVal}
                onChangeText={onChangeNumeric}
                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                // @ts-ignore
                inputMode="numeric"
                returnKeyType="done"
                onSubmitEditing={commitInput}
                onBlur={commitInput}
                maxLength={3}
                selectionColor={colors.success}
                placeholder="Nhập kg"
                style={styles.readoutInput}
                selectTextOnFocus
              />
            ) : (
              <TextComponent
                text={display}
                size={36}
                weight="bold"
                color={colors.success}
                align="center"
              />
            )}
          </ViewComponent>
        </Pressable>

        {/* Ruler */}
        <ViewComponent
          style={styles.rulerBox}
          alignItems="center"
          justifyContent="center"
        >
          {/* Vạch giữa (dùng View gốc để có pointerEvents) */}
          <View
            pointerEvents="none"
            style={[
              styles.centerIndicator,
              { left: Math.round(SCREEN_W / 2) - 1 },
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
              paddingHorizontal: PAD,
              paddingTop: 8,
              paddingBottom: 34,
            }}
            onScrollBeginDrag={onScrollBegin}
            onMomentumScrollEnd={e =>
              onScrollEnd(e.nativeEvent.contentOffset.x)
            }
            onScrollEndDrag={e => onScrollEnd(e.nativeEvent.contentOffset.x)}
          >
            {renderTicks()}
          </ScrollView>
        </ViewComponent>

        <TextComponent
          text="↔️ Kéo để chọn — chạm vào số để nhập trực tiếp (chỉ số)."
          size={14}
          color={colors.slate600}
          align="center"
        />
      </ViewComponent>
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
    backgroundColor: colors.white,
  },

  /* readout */
  readoutCard: {
    backgroundColor: colors.primarySurface,
    borderColor: colors.primaryBorder,
    borderWidth: 2,
    marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  readoutInput: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.success,
    textAlign: 'center',
    padding: 0,
    margin: 0,
    minWidth: 120,
  },

  /* ruler */
  rulerBox: {
    width: '100%',
    paddingVertical: 6,
  },
  centerIndicator: {
    position: 'absolute',
    top: 10,
    bottom: 44,
    width: 2,
    backgroundColor: colors.primary,
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
    backgroundColor: colors.slate300,
    borderRadius: 1,
    marginTop: 8,
  },
  tickLineMed: {
    height: TICK_H_MED,
    backgroundColor: colors.slate500,
  },
  tickLineMajor: {
    height: TICK_H_MAJOR,
    backgroundColor: colors.slate600,
    width: 3,
    borderRadius: 1.5,
  },

  labelWrap: {
    position: 'absolute',
    bottom: -28,
    left: -TICK_W * 4.5,
    right: -TICK_W * 4.5,
  },
});

export default StepWeightScreen;

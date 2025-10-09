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
const CM_MIN = 80;
const CM_MAX = 250;

const { width: SCREEN_W } = Dimensions.get('window');
const TICK_W = 22;
const PAD = Math.max(0, SCREEN_W * 0.5 - TICK_W * 0.5);
const TICK_H_MINOR = 12;
const TICK_H_MED = 20;
const TICK_H_MAJOR = 32;

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const StepHeightScreen = () => {
  const { form, setHeightCm } = useWizard();
  const scrollRef = useRef<ScrollView>(null);
  const isScrolling = useRef(false);
  const [initialized, setInitialized] = useState(false);

  // tap to edit
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(form.heightCm));
  const inputRef = useRef<TextInput>(null);

  const formatHeight = useMemo(() => `${form.heightCm} cm `, [form.heightCm]);

  /* ===== Initial position ===== */
  useEffect(() => {
    if (isScrolling.current || initialized) return;
    const idx = clamp(Math.round(form.heightCm), CM_MIN, CM_MAX) - CM_MIN;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: idx * TICK_W, animated: false });
      setInitialized(true);
    });
  }, [form.heightCm, initialized]);

  /* ===== Scroll handlers ===== */
  const onScrollBegin = () => {
    isScrolling.current = true;
  };

  const onScrollEnd = (x: number) => {
    isScrolling.current = false;
    const idx = Math.round(x / TICK_W);
    const cm = clamp(CM_MIN + idx, CM_MIN, CM_MAX);
    setHeightCm(cm);
  };

  /* ===== Tap readout to edit ===== */
  useEffect(() => {
    if (isEditing) {
      setInputVal(String(form.heightCm));
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [isEditing, form.heightCm]);

  const onReadoutPress = () => setIsEditing(true);
  const onChangeNumeric = (next: string) => {
    if (/^\d{0,3}$/.test(next)) setInputVal(next);
  };
  const commitInput = () => {
    const num = parseInt(inputVal, 10);
    if (!Number.isNaN(num)) {
      const cm = clamp(num, CM_MIN, CM_MAX);
      setHeightCm(cm);
      const idx = cm - CM_MIN;
      scrollRef.current?.scrollTo({ x: idx * TICK_W, animated: true });
    }
    setIsEditing(false);
  };

  /* ===== Ticks ===== */
  const renderTicks = () => {
    const total = CM_MAX - CM_MIN + 1;
    return Array.from({ length: total }, (_, i) => CM_MIN + i).map(cm => {
      const isMajor = cm % 10 === 0;
      const isMedium = cm % 5 === 0;
      const h = isMajor ? TICK_H_MAJOR : isMedium ? TICK_H_MED : TICK_H_MINOR;

      return (
        <ViewComponent key={cm} style={styles.tickItem}>
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
                text={String(cm)}
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
      title="Chiều Cao Của Bạn"
      subtitle="Chiều cao (cm) chính xác giúp tính toán nhu cầu calo chuẩn xác hơn"
    >
      <ViewComponent style={styles.wrap} center>
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
                placeholder="Nhập cm"
                style={styles.readoutInput}
                selectTextOnFocus
              />
            ) : (
              <TextComponent
                text={formatHeight}
                size={36}
                weight="bold"
                color={colors.success}
                align="center"
              />
            )}
          </ViewComponent>
        </Pressable>

        {/* Ruler */}
        <ViewComponent style={styles.rulerBox}>
          {/* Vạch giữa màu xanh */}
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
    justifyContent: 'space-around',
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
    paddingVertical: 10,
  },
  centerIndicator: {
    position: 'absolute',
    top: 10,
    bottom: 44,
    width: 2,
    backgroundColor: colors.primary,
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

export default StepHeightScreen;

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

/* ===== Config ===== */
const CM_MIN = 80;
const CM_MAX = 250;

const { width: SCREEN_W } = Dimensions.get('window');
const TICK_W = 22; // khoảng cách giữa từng cm
const PAD = Math.max(0, SCREEN_W * 0.5 - TICK_W * 0.5); // *** fix canh giữa ***
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

  const formatHeight = useMemo(() => `${form.heightCm} cm`, [form.heightCm]);

  /* ===== Initial position ===== */
  useEffect(() => {
    if (isScrolling.current || initialized) return;
    const idx = clamp(Math.round(form.heightCm), CM_MIN, CM_MAX) - CM_MIN;
    requestAnimationFrame(() => {
      // Với PAD đã trừ nửa ô, offset i*TICK_W sẽ đặt đúng tâm vạch
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
    // Vì snap là bội số của TICK_W nên chỉ cần round(x/TICK_W)
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

  // chỉ nhận số (0–3 chữ số)
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
        <View key={cm} style={styles.tickItem}>
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
              <Text style={styles.labelText}>{cm}</Text>
            </View>
          )}
        </View>
      );
    });
  };

  return (
    <WizardFrame
      title="Chiều Cao Của Bạn"
      subtitle="Chiều cao (cm) chính xác giúp tính toán nhu cầu calo chuẩn xác hơn"
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
                // @ts-ignore - giúp bàn phím ưu tiên layout số
                inputMode="numeric"
                returnKeyType="done"
                onSubmitEditing={commitInput}
                onBlur={commitInput}
                maxLength={3}
                selectionColor={GREEN_DARK}
                placeholder="Nhập cm"
                style={styles.readoutInput}
                selectTextOnFocus
              />
            ) : (
              <Text style={styles.readoutText}>{formatHeight}</Text>
            )}
          </View>
        </Pressable>

        {/* Ruler */}
        <View style={styles.rulerBox}>
          {/* Vạch giữa màu xanh */}
          <View
            pointerEvents="none"
            style={[
              styles.centerIndicator,
              { left: Math.round(SCREEN_W / 2) - 1 }, // canh pixel đẹp
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
              paddingHorizontal: PAD, // *** key: nửa màn - nửa ô ***
              paddingTop: 8,
              paddingBottom: 34, // chừa chỗ cho nhãn
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
    paddingVertical: 10,
  },

  centerIndicator: {
    position: 'absolute',
    top: 10,
    bottom: 44,
    width: 2,
    backgroundColor: GREEN,
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
    bottom: -28,
    left: -TICK_W * 4.5,
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

export default StepHeightScreen;

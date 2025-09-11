// features/WizardScreens.tsx — StepAllergiesScreen (custom green scrollbar)
import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Platform,
  Pressable,
  ScrollView,
  Keyboard,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import WizardFrame from '../../components/WizardFrame';
import { useWizard } from '../../context/WizardContext';
import { colors } from '../../constants/colors';

/* Tokens */
const GREEN = colors?.green ?? '#22C55E';
const GREEN_DARK = '#16A34A';
const SLATE_900 = '#0F172A';
const SLATE_700 = '#334155';
const SLATE_600 = colors?.slate600 ?? '#475569';
const SLATE_500 = colors?.slate500 ?? '#64748B';
const SLATE_400 = '#94A3B8';
const SLATE_200 = colors?.slate200 ?? '#E2E8F0';
const SLATE_100 = colors?.slate100 ?? '#F1F5F9';
const WHITE = colors?.white ?? '#FFFFFF';
const RED = '#EF4444';
const RED_LIGHT = '#FEE2E2';

/* Gợi ý mặc định */
const SUGGESTED_ALLERGIES = [
  'Hải sản',
  'Tôm',
  'Cua',
  'Cá biển',
  'Sữa bò',
  'Trứng',
  'Đậu phộng',
  'Hạt cây',
  'Đậu nành',
  'Lúa mì',
  'Gluten',
  'Phấn hoa',
  'Bụi nhà',
  'Động vật',
  'Thuốc',
  'Mỹ phẩm',
];

/* Thanh cuộn xanh — overlay */
const GreenScrollbar: React.FC<{
  visibleH: number;
  contentH: number;
  scrollY: number;
}> = ({ visibleH, contentH, scrollY }) => {
  if (contentH <= visibleH || visibleH <= 0) return null;

  const trackH = visibleH;
  const ratio = visibleH / contentH;
  const minThumb = 28; // tối thiểu để dễ thấy/chạm
  const thumbH = Math.max(minThumb, trackH * ratio);
  const maxScroll = contentH - visibleH;
  const maxThumbTravel = trackH - thumbH;
  const thumbY = maxScroll > 0 ? (scrollY / maxScroll) * maxThumbTravel : 0;

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { alignItems: 'flex-end' }]}
    >
      <View style={[styles.sbTrack, { height: trackH }]}>
        <View
          style={[
            styles.sbThumb,
            { height: thumbH, transform: [{ translateY: thumbY }] },
          ]}
        />
      </View>
    </View>
  );
};

const StepAllergiesScreen = () => {
  const { form, addAllergy, removeAllergy, clearAllergies } = useWizard();

  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Lọc gợi ý theo text
  const normalized = text.trim().toLowerCase();
  const suggestions = useMemo(() => {
    if (!normalized) return SUGGESTED_ALLERGIES;
    return SUGGESTED_ALLERGIES.filter(s =>
      s.toLowerCase().includes(normalized),
    );
  }, [normalized]);

  // Chống trùng (không phân biệt hoa/thường & dấu)
  const existsInsensitive = (v: string) =>
    form.allergies.some(
      a => a.localeCompare(v, undefined, { sensitivity: 'accent' }) === 0,
    );

  const handleAdd = (val?: string) => {
    const v = (val ?? text).trim();
    if (!v) return;
    if (existsInsensitive(v)) {
      setText('');
      Keyboard.dismiss();
      return;
    }
    addAllergy(v);
    setText('');
    Keyboard.dismiss();
  };

  /* ==== Scroll metrics cho Gợi ý & Đã chọn (để vẽ scrollbar xanh) ==== */
  const SUG_MAX = 170;
  const SEL_MAX = 200;

  const [sugVisibleH, setSugVisibleH] = useState(SUG_MAX);
  const [sugContentH, setSugContentH] = useState(0);
  const [sugScrollY, setSugScrollY] = useState(0);

  const [selVisibleH, setSelVisibleH] = useState(SEL_MAX);
  const [selContentH, setSelContentH] = useState(0);
  const [selScrollY, setSelScrollY] = useState(0);

  const onSugLayout = (e: LayoutChangeEvent) =>
    setSugVisibleH(Math.min(SUG_MAX, Math.round(e.nativeEvent.layout.height)));
  const onSelLayout = (e: LayoutChangeEvent) =>
    setSelVisibleH(Math.min(SEL_MAX, Math.round(e.nativeEvent.layout.height)));

  const onSugContentSizeChange = (_w: number, h: number) => setSugContentH(h);
  const onSelContentSizeChange = (_w: number, h: number) => setSelContentH(h);

  const onSugScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setSugScrollY(e.nativeEvent.contentOffset.y);
  const onSelScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setSelScrollY(e.nativeEvent.contentOffset.y);

  return (
    <WizardFrame
      title="Dị ứng của bạn"
      subtitle="Thêm các dị ứng để chúng tôi tránh gợi ý thực phẩm không phù hợp. Nếu không có, bạn có thể bỏ qua bước này."
    >
      {/* Ô nhập + Thêm */}
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder="Nhập dị ứng (ví dụ: Hải sản)…"
          placeholderTextColor={SLATE_400}
          onSubmitEditing={() => handleAdd()}
          returnKeyType="done"
          style={styles.input}
        />
        <Pressable
          onPress={() => handleAdd()}
          disabled={text.trim() === ''}
          style={({ pressed }) => [
            styles.addBtn,
            text.trim() === '' && styles.addBtnDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.addBtnText}>Thêm</Text>
        </Pressable>
      </View>

      {/* GỢI Ý PHỔ BIẾN — card + custom green scrollbar */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionLabel}>
            Gợi ý phổ biến ({suggestions.length})
          </Text>
        </View>

        {suggestions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Không tìm thấy gợi ý.</Text>
            <Text style={styles.emptySub}>Thử từ khoá khác nhé.</Text>
          </View>
        ) : (
          <View style={{ position: 'relative' }}>
            <ScrollView
              style={[styles.suggestScroll]}
              contentContainerStyle={styles.wrapChips}
              onContentSizeChange={onSugContentSizeChange}
              onLayout={onSugLayout}
              onScroll={onSugScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false} // ẩn scrollbar mặc định
              persistentScrollbar={false}
              nestedScrollEnabled
            >
              {suggestions.map(s => {
                const selected = existsInsensitive(s);
                return (
                  <Pressable
                    key={s}
                    onPress={() => handleAdd(s)}
                    disabled={selected}
                    style={[
                      styles.suggestChip,
                      selected && styles.suggestChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.suggestText,
                        selected && { color: GREEN_DARK },
                      ]}
                    >
                      {s}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Scrollbar xanh */}
            <GreenScrollbar
              visibleH={sugVisibleH}
              contentH={sugContentH}
              scrollY={sugScrollY}
            />
          </View>
        )}
      </View>

      {/* ĐÃ CHỌN — card + custom green scrollbar */}
      <View style={[styles.card, { flex: 1 }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionLabel}>
            Dị ứng đã chọn ({form.allergies.length})
          </Text>
          {!!form.allergies.length && (
            <Pressable
              onPress={clearAllergies}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={styles.clearAll}>Xoá tất cả</Text>
            </Pressable>
          )}
        </View>

        {form.allergies.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Chưa có dị ứng nào được thêm.</Text>
            <Text style={styles.emptySub}>
              Nhập dị ứng hoặc chọn từ gợi ý bên trên.
            </Text>
          </View>
        ) : (
          <View style={{ position: 'relative', flex: 1 }}>
            <ScrollView
              style={[styles.selectedScroll]}
              contentContainerStyle={styles.wrapChips}
              onContentSizeChange={onSelContentSizeChange}
              onLayout={onSelLayout}
              onScroll={onSelScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false} // ẩn scrollbar mặc định
              persistentScrollbar={false}
              nestedScrollEnabled
            >
              {form.allergies.map(a => (
                <View key={a} style={styles.selectedChip}>
                  <Text style={styles.selectedTxt}>🚫 {a}</Text>
                  <Pressable onPress={() => removeAllergy(a)} hitSlop={8}>
                    <Text style={styles.removeX}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>

            {/* Scrollbar xanh */}
            <GreenScrollbar
              visibleH={selVisibleH}
              contentH={selContentH}
              scrollY={selScrollY}
            />
          </View>
        )}
      </View>
    </WizardFrame>
  );
};

/* ===== Styles ===== */
const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: SLATE_200,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 1 },
    }),
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: SLATE_900,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  addBtn: {
    backgroundColor: GREEN,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { color: WHITE, fontWeight: '700' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },

  // Card chung
  card: {
    borderWidth: 1,
    borderColor: SLATE_200,
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 13,
    color: SLATE_600,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearAll: { color: SLATE_500, fontWeight: '600' },

  // Vùng cuộn (set maxHeight qua logic)
  suggestScroll: { maxHeight: 170 },
  selectedScroll: { maxHeight: 200 },

  // Wrap chip
  wrapChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
    paddingRight: 8, // chừa chỗ cho scrollbar
  },

  // Scrollbar xanh
  sbTrack: {
    width: 4,
    marginRight: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(34,197,94,0.12)', // track xanh nhạt
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  sbThumb: {
    width: 4,
    borderRadius: 999,
    backgroundColor: GREEN, // thumb xanh
    shadowColor: GREEN,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.35,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 0 },
      },
      android: { elevation: 2 },
    }),
  },

  // Chip gợi ý
  suggestChip: {
    borderWidth: 1,
    borderColor: SLATE_200,
    backgroundColor: SLATE_100,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  suggestChipSelected: {
    borderColor: GREEN,
    backgroundColor: 'rgba(34,197,94,0.10)',
  },
  suggestText: { fontSize: 13, color: SLATE_700, fontWeight: '600' },

  // Chip đã chọn
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: RED_LIGHT,
    borderWidth: 1,
    borderColor: RED,
    borderRadius: 999,
  },
  selectedTxt: { color: SLATE_900, fontWeight: '700' },
  removeX: { color: RED, fontWeight: '900', fontSize: 12 },

  // Empty
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: SLATE_100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SLATE_200,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 15,
    color: SLATE_600,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySub: { fontSize: 13, color: SLATE_500, textAlign: 'center' },
});

export default StepAllergiesScreen;

import React, { useMemo, useState } from 'react';
import {
  TextInput,
  Pressable,
  ScrollView,
  Keyboard,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  View,
} from 'react-native';
import WizardFrame from '../../components/WizardFrame';
import { useWizard } from '../../context/WizardContext';
import { colors as C } from '../../constants/colors';
import TextComponent from '../../components/TextComponent';
import ViewComponent from '../../components/ViewComponent';
import GreenScrollbar from '../../components/Step/GreenScrollbar';

/* ====== Gợi ý mặc định ====== */
const SUGGESTED_CONDITIONS = [
  'Tăng huyết áp',
  'Đái tháo đường',
  'Tim mạch',
  'Hen suyễn',
  'Rối loạn mỡ máu',
  'Suy giáp',
  'Cường giáp',
  'Loét dạ dày',
  'Viêm đại tràng',
  'Gout',
  'Viêm gan',
  'Suy thận',
  'Viêm khớp',
  'Trầm cảm',
  'Lo âu',
  'Bệnh tự miễn',
  'Bệnh phổi tắc nghẽn mạn tính',
  'Bệnh thận mạn tính',
  'Bệnh gan mạn tính',
  'Bệnh tuyến giáp',
  'Bệnh về mắt',
  'Bệnh về da',
  'Bệnh về thần kinh',
  'Bệnh về tiêu hoá',
];

const StepConditionScreen = () => {
  const { form, addAllergy, removeAllergy, clearAllergies } = useWizard();

  const [text, setText] = useState('');

  const normalized = text.trim().toLowerCase();
  const suggestions = useMemo(() => {
    if (!normalized) return SUGGESTED_CONDITIONS;
    return SUGGESTED_CONDITIONS.filter(s => s.toLowerCase().includes(normalized));
  }, [normalized]);

  // so sánh không phân biệt hoa/thường & dấu
  const existsInsensitive = (v: string) =>
    form.allergies.some(a => a.localeCompare(v, undefined, { sensitivity: 'accent' }) === 0);

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

  /* ==== Scroll metrics cho 2 vùng ==== */
  const SUG_MAX = 170;

  const [sugVisibleH, setSugVisibleH] = useState(SUG_MAX);
  const [sugContentH, setSugContentH] = useState(0);
  const [sugScrollY, setSugScrollY] = useState(0);

  const [selVisibleH, setSelVisibleH] = useState(0);
  const [selContentH, setSelContentH] = useState(0);
  const [selScrollY, setSelScrollY] = useState(0);

  const onSugLayout = (e: LayoutChangeEvent) =>
    setSugVisibleH(Math.min(SUG_MAX, Math.round(e.nativeEvent.layout.height)));
  const onSelLayout = (e: LayoutChangeEvent) =>
    setSelVisibleH(Math.round(e.nativeEvent.layout.height));

  const onSugContentSizeChange = (_w: number, h: number) => setSugContentH(h);
  const onSelContentSizeChange = (_w: number, h: number) => setSelContentH(h);

  const onSugScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setSugScrollY(e.nativeEvent.contentOffset.y);
  const onSelScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setSelScrollY(e.nativeEvent.contentOffset.y);

  return (
    <WizardFrame
      title="Bệnh nền của bạn"
      subtitle="Hãy cho chúng tôi biết nếu bạn có bệnh nền để gợi ý chế độ phù hợp. Có thể bỏ qua nếu không có."
    >
      {/* Ô nhập + Nút thêm */}
      <ViewComponent
        row
        center
        gap={8}
        px={12}
        py={Platform.OS === 'ios' ? 10 : 6}
        radius={12}
        border
        borderColor={C.border}
        backgroundColor={C.inputBg}
        style={Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
          },
          android: { elevation: 1 },
        })}
        mb={12}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Nhập tên bệnh nền (ví dụ: Tăng huyết áp)…"
          placeholderTextColor={C.sub}
          onSubmitEditing={() => handleAdd()}
          returnKeyType="done"
          style={{ flex: 1, fontSize: 15, color: C.text, paddingVertical: 6, paddingHorizontal: 4 }}
        />
      </ViewComponent>

      {/* GỢI Ý PHỔ BIẾN */}
      <ViewComponent variant="card" p={10} mb={10} radius={12} border>
        <ViewComponent row between alignItems="center" mb={6}>
          <TextComponent
            text={`Gợi ý phổ biến (${suggestions.length})`}
            variant="caption"
            weight="bold"
            tone="muted"
          />
        </ViewComponent>

        {suggestions.length === 0 ? (
          <ViewComponent
            center
            p={20}
            radius={12}
            border
            style={{ borderStyle: 'dashed' }}
            backgroundColor={C.bg}
            borderColor={C.border}
          >
            <TextComponent text="Không tìm thấy gợi ý." weight="semibold" tone="muted" />
            <TextComponent text="Thử từ khoá khác nhé." variant="caption" tone="muted" />
          </ViewComponent>
        ) : (
          <View style={{ position: 'relative' }}>
            <ScrollView
              style={{ maxHeight: SUG_MAX }}
              contentContainerStyle={chipWrap}
              onContentSizeChange={onSugContentSizeChange}
              onLayout={onSugLayout}
              onScroll={onSugScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
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
                    style={({ pressed }) => [
                      chipBase,
                      {
                        borderColor: selected ? C.primaryBorder : C.border,
                        backgroundColor: selected ? C.primarySurface : C.slate50,
                        opacity: pressed ? 0.9 : 1,
                      },
                    ]}
                  >
                    <TextComponent
                      text={s}
                      variant="caption"
                      weight="semibold"
                      color={selected ? C.primaryDark : C.slate700}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>

            <GreenScrollbar visibleH={sugVisibleH} contentH={sugContentH} scrollY={sugScrollY} />
          </View>
        )}
      </ViewComponent>

      {/* ĐÃ CHỌN */}
      <ViewComponent variant="card" p={10} mb={10} radius={12} border style={{ flex: 1 }}>
        <ViewComponent row between alignItems="center" mb={6}>
          <TextComponent
            text={`Bệnh nền đã chọn (${form.allergies.length})`}
            variant="caption"
            weight="bold"
            tone="muted"
          />
          {!!form.allergies.length && (
            <Pressable
              onPress={clearAllergies}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Xoá tất cả bệnh nền đã chọn"
              android_ripple={{ color: 'rgba(239,68,68,0.15)', radius: 200 }}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  minHeight: 44,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: C.red,
                  backgroundColor: pressed ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)',
                  opacity: pressed ? 0.98 : 1,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                },
              ]}
            >
              <TextComponent text="🗑" variant="body" />
              <TextComponent text="Xoá tất cả" variant="body" weight="semibold" tone="danger" />
            </Pressable>
          )}
        </ViewComponent>

        {form.allergies.length === 0 ? (
          <ViewComponent
            center
            p={20}
            radius={12}
            border
            style={{ borderStyle: 'dashed' }}
            backgroundColor={C.bg}
            borderColor={C.border}
          >
            <TextComponent text="Chưa có bệnh nền nào được thêm." weight="semibold" tone="muted" />
            <TextComponent
              text="Nhập bệnh nền hoặc chọn từ gợi ý bên trên."
              variant="caption"
              tone="muted"
              align="center"
            />
          </ViewComponent>
        ) : (
          <View style={{ position: 'relative', flex: 1, minHeight: 0 }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={chipWrap}
              onContentSizeChange={onSelContentSizeChange}
              onLayout={onSelLayout}
              onScroll={onSelScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              persistentScrollbar={false}
              nestedScrollEnabled
            >
              {form.allergies.map(a => (
                <ViewComponent
                  key={a}
                  row
                  center
                  gap={8}
                  px={12}
                  py={8}
                  radius={999}
                  border
                  borderColor={C.primaryBorder}
                  backgroundColor={C.primarySurface}
                >
                  <TextComponent text={`💊 ${a}`} weight="bold" />
                  <Pressable onPress={() => removeAllergy(a)} hitSlop={8}>
                    <TextComponent text="✕" color={C.red} weight="bold" />
                  </Pressable>
                </ViewComponent>
              ))}
            </ScrollView>

            <GreenScrollbar visibleH={selVisibleH} contentH={selContentH} scrollY={selScrollY} />
          </View>
        )}
      </ViewComponent>
    </WizardFrame>
  );
};


const chipWrap = {
  flexDirection: 'row' as const,
  flexWrap: 'wrap' as const,
  gap: 8,
  paddingVertical: 4,
  paddingRight: 8,
};

const chipBase = {
  borderWidth: 1,
  paddingHorizontal: 10,
  paddingVertical: 8,
  borderRadius: 999,
};

export default StepConditionScreen;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TextInput,
  Pressable,
  ScrollView,
  Keyboard,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import WizardFrame from '../../components/WizardFrame';
import { useWizard } from '../../context/WizardContext';
import { colors as C } from '../../constants/colors';
import TextComponent from '../../components/TextComponent';
import ViewComponent from '../../components/ViewComponent';
import GreenScrollbar from '../../components/Step/GreenScrollbar';
import axios from 'axios';
import { getAllAllergies } from '../../services/allergy.service';
import type { Condition } from '../../types/types';

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

const StepAllergiesScreen = () => {
  const { form, addAllergy, removeAllergy, clearAllergies } = useWizard();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [remoteAllergies, setRemoteAllergies] = useState<Condition[]>([]);

  const idToName = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of remoteAllergies) m.set(a.id, a.name);
    return m;
  }, [remoteAllergies]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const data: Condition[] = await getAllAllergies(controller.signal);
        const seen = new Set<string>();
        const unique: Condition[] = [];
        for (const item of data ?? []) {
          const name = (item?.name || '').trim();
          if (!name) continue;
          const key = normalize(name);
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(item);
          }
        }
        setRemoteAllergies(unique);
      } catch (error: any) {
        if (axios.isCancel(error)) {
          console.log('⏹ Request canceled:', error.message);
        } else {
          console.error('❌ Error fetching allergies:', error);
          setRemoteAllergies([]);
          Alert.alert('Lỗi', 'Không thể tải danh sách dị ứng.');
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);
  const normalizedInput = normalize(text);
  const suggestions = useMemo(() => {
    if (!normalizedInput) return remoteAllergies;
    return remoteAllergies.filter(s =>
      normalize(s.name).includes(normalizedInput),
    );
  }, [normalizedInput, remoteAllergies]);
  const existsById = useCallback(
    (id: string) => form.allergies.includes(id),
    [form.allergies],
  );

  // Chọn một dị ứng -> lưu ID
  const handleAddById = (id: string) => {
    if (!id) return;
    if (existsById(id)) {
      setText('');
      Keyboard.dismiss();
      return;
    }
    addAllergy(id);
    setText('');
    Keyboard.dismiss();
  };
  const handleSubmitTyping = () => {
    if (!normalizedInput) return;
    const first = suggestions[0];
    if (first) handleAddById(first.id);
    else Alert.alert('Không tìm thấy', 'Vui lòng chọn từ gợi ý.');
  };

  /* ==== Scroll metrics ==== */
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
      title="Dị ứng của bạn"
      subtitle="Chọn dị ứng (theo danh sách chuẩn) để loại trừ thực phẩm không phù hợp."
    >
      {/* Ô nhập + Enter để pick gợi ý đầu tiên */}
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
        mb={12}
        style={Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
          },
          android: { elevation: 1 },
        })}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Tìm dị ứng (ví dụ: Hải sản)…"
          placeholderTextColor={C.sub}
          onSubmitEditing={handleSubmitTyping}
          returnKeyType="done"
          style={{
            flex: 1,
            fontSize: 15,
            color: C.text,
            paddingVertical: 6,
            paddingHorizontal: 4,
          }}
        />
      </ViewComponent>

      {/* GỢI Ý TỪ MÁY CHỦ */}
      <ViewComponent variant="card" p={10} mb={10} radius={12}>
        <ViewComponent row between alignItems="center" mb={6}>
          <TextComponent
            text={`Gợi ý dị ứng từ máy chủ (${suggestions.length})`}
            variant="caption"
            weight="bold"
            tone="muted"
          />
          {loading && (
            <ViewComponent row center gap={6}>
              <ActivityIndicator size="small" />
              <TextComponent
                text="Đang tải..."
                variant="caption"
                tone="muted"
              />
            </ViewComponent>
          )}
        </ViewComponent>

        {suggestions.length === 0 ? (
          <ViewComponent
            center
            p={20}
            radius={12}
            border
            backgroundColor={C.bg}
            borderColor={C.border}
            style={{ borderStyle: 'dashed' }}
          >
            <TextComponent
              text="Không có gợi ý để hiển thị."
              weight="semibold"
              tone="muted"
            />
            <TextComponent
              text="Hãy gõ từ khóa để tìm và chọn từ gợi ý."
              variant="caption"
              tone="muted"
            />
          </ViewComponent>
        ) : (
          <SuggestionsChips
            suggestions={suggestions}
            existsById={existsById}
            onPick={handleAddById}
            onLayout={onSugLayout}
            onContentSizeChange={onSugContentSizeChange}
            onScroll={onSugScroll}
            visibleH={sugVisibleH}
            contentH={sugContentH}
            scrollY={sugScrollY}
          />
        )}
      </ViewComponent>

      {/* ĐÃ CHỌN (render theo name từ idToName) */}
      <ViewComponent variant="card" p={10} radius={12} style={{ flex: 1 }}>
        <ViewComponent row between alignItems="center" mb={6}>
          <TextComponent
            text={`Dị ứng đã chọn (${form.allergies.length})`}
            variant="caption"
            weight="bold"
            tone="muted"
          />
          {!!form.allergies.length && (
            <Pressable
              onPress={clearAllergies}
              hitSlop={12}
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
                  backgroundColor: pressed
                    ? 'rgba(239,68,68,0.12)'
                    : 'rgba(239,68,68,0.08)',
                  opacity: pressed ? 0.98 : 1,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                },
              ]}
            >
              <TextComponent text="🗑" variant="body" />
              <TextComponent
                text="Xoá tất cả"
                variant="body"
                weight="semibold"
                tone="danger"
              />
            </Pressable>
          )}
        </ViewComponent>

        {form.allergies.length === 0 ? (
          <ViewComponent
            center
            p={20}
            radius={12}
            border
            backgroundColor={C.bg}
            borderColor={C.border}
            style={{ borderStyle: 'dashed' }}
          >
            <TextComponent
              text="Chưa có dị ứng nào được thêm."
              weight="semibold"
              tone="muted"
            />
            <TextComponent
              text="Nhập và chọn từ gợi ý ở trên."
              variant="caption"
              tone="muted"
              align="center"
            />
          </ViewComponent>
        ) : (
          <SelectedChips
            ids={form.allergies}
            idToName={idToName}
            onRemove={removeAllergy}
            onLayout={onSelLayout}
            onContentSizeChange={onSelContentSizeChange}
            onScroll={onSelScroll}
            visibleH={selVisibleH}
            contentH={selContentH}
            scrollY={selScrollY}
          />
        )}
      </ViewComponent>
    </WizardFrame>
  );
};

export default StepAllergiesScreen;

/* ====== Subcomponents ====== */

function SuggestionsChips(props: {
  suggestions: Condition[];
  existsById: (id: string) => boolean;
  onPick: (id: string) => void;
  onLayout: (e: LayoutChangeEvent) => void;
  onContentSizeChange: (_w: number, h: number) => void;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  visibleH: number;
  contentH: number;
  scrollY: number;
}) {
  const {
    suggestions,
    existsById,
    onPick,
    onLayout,
    onContentSizeChange,
    onScroll,
    visibleH,
    contentH,
    scrollY,
  } = props;
  return (
    <ViewComponent style={{ position: 'relative' }}>
      <ScrollView
        style={{ maxHeight: 170 }}
        contentContainerStyle={{ paddingVertical: 4, paddingRight: 8 }}
        onContentSizeChange={onContentSizeChange}
        onLayout={onLayout}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        persistentScrollbar={false}
        nestedScrollEnabled
      >
        <ViewComponent row wrap gap={8}>
          {suggestions.map(s => {
            const selected = existsById(s.id);
            return (
              <Pressable
                key={s.id}
                onPress={() => onPick(s.id)}
                disabled={selected}
                style={({ pressed }) => [
                  {
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.99 : 1 }],
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Chọn dị ứng ${s.name}`}
              >
                <ViewComponent
                  border
                  borderColor={selected ? C.primaryBorder : C.border}
                  backgroundColor={selected ? C.primarySurface : C.slate50}
                  px={10}
                  py={8}
                  radius={999}
                >
                  <TextComponent
                    text={s.name}
                    variant="caption"
                    weight="semibold"
                    color={selected ? C.primaryDark : C.slate700}
                  />
                </ViewComponent>
              </Pressable>
            );
          })}
        </ViewComponent>
      </ScrollView>

      <GreenScrollbar
        visibleH={visibleH}
        contentH={contentH}
        scrollY={scrollY}
      />
    </ViewComponent>
  );
}

function SelectedChips(props: {
  ids: string[];
  idToName: Map<string, string>;
  onRemove: (id: string) => void;
  onLayout: (e: LayoutChangeEvent) => void;
  onContentSizeChange: (_w: number, h: number) => void;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  visibleH: number;
  contentH: number;
  scrollY: number;
}) {
  const {
    ids,
    idToName,
    onRemove,
    onLayout,
    onContentSizeChange,
    onScroll,
    visibleH,
    contentH,
    scrollY,
  } = props;
  return (
    <ViewComponent style={{ position: 'relative', flex: 1, minHeight: 0 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 4, paddingRight: 8 }}
        onContentSizeChange={onContentSizeChange}
        onLayout={onLayout}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        persistentScrollbar={false}
        nestedScrollEnabled
      >
        <ViewComponent row wrap gap={8}>
          {ids.map(id => {
            const name = idToName.get(id) ?? id;
            return (
              <ViewComponent
                key={id}
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
                <TextComponent text={`🚫 ${name}`} weight="bold" />
                <Pressable
                  onPress={() => onRemove(id)}
                  hitSlop={8}
                  accessibilityRole="button"
                >
                  <TextComponent text="✕" color={C.red} weight="bold" />
                </Pressable>
              </ViewComponent>
            );
          })}
        </ViewComponent>
      </ScrollView>

      <GreenScrollbar
        visibleH={visibleH}
        contentH={contentH}
        scrollY={scrollY}
      />
    </ViewComponent>
  );
}

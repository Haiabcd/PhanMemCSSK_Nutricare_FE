import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  Image,
  Pressable,
  TextInput,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors as C } from '../constants/colors';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SuggestionStackParamList } from '../navigation/SuggestionNavigator';

/* ================== Avatar fallback ================== */
function Avatar({ name, photoUri }: { name: string; photoUri?: string | null }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  if (photoUri) return <Image source={{ uri: photoUri }} style={s.avatar} />;
  return (
    <ViewComponent center radius={999} border backgroundColor={C.bg} style={s.avatar}>
      <TextComponent text={initials} variant="subtitle" weight="bold" tone="primary" />
    </ViewComponent>
  );
}

/* ================== Types & Data ================== */
type Slot = 'Bữa sáng' | 'Bữa trưa' | 'Bữa chiều' | 'Bữa phụ';
type Category = 'Tất cả' | Slot;

type Recipe = {
  id: string;
  title: string;
  desc: string;
  cal: number;
  protein: number;
  image: string;
  slot: Slot;
};

const CATS: Category[] = ['Tất cả', 'Bữa sáng', 'Bữa trưa', 'Bữa chiều', 'Bữa phụ'];

const RECIPES: Recipe[] = [
  { id: '1', title: 'Salad Gà Ớt', desc: 'Món salad tươi ngon, giàu rau củ, phù hợp giảm cân.', cal: 380, protein: 18, image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1200', slot: 'Bữa trưa' },
  { id: '2', title: 'Quinoa & Cá Hồi', desc: 'Omega-3 từ cá hồi, giàu hạt quinoa cho sức khỏe.', cal: 450, protein: 35, image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?q=80&w=1200', slot: 'Bữa chiều' },
  { id: '3', title: 'Sinh Tố Rau Xanh', desc: 'Kết hợp rau xanh & trái cây, vitamin tự nhiên.', cal: 250, protein: 8, image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1200', slot: 'Bữa sáng' },
  { id: '4', title: 'Gà Tôm Xào Rau', desc: 'Món xào nhẹ, gà và rau củ cân đối.', cal: 400, protein: 30, image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1200', slot: 'Bữa chiều' },
  { id: '5', title: 'Salad Đậu & Rau', desc: 'Đơn giản với đậu & rau, hợp ăn chay.', cal: 320, protein: 12, image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1200', slot: 'Bữa trưa' },
  { id: '6', title: 'Sữa Chua & Trái Cây', desc: 'Giàu protein từ sữa chua, trái cây tươi.', cal: 300, protein: 20, image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=1200', slot: 'Bữa phụ' },
];

/* ================== Screen ================== */
export default function Suggestion() {
  const navigation = useNavigation<NativeStackNavigationProp<SuggestionStackParamList>>();
  const { height: screenH } = useWindowDimensions();
  const CONTENT_MIN_HEIGHT = Math.max(420, Math.floor(screenH * 0.79));

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [cat, setCat] = useState<Category>('Tất cả');

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 180);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = useMemo(() => {
    return RECIPES.filter(r => {
      const matchCat = cat === 'Tất cả' || r.slot === cat;
      const matchQ =
        debouncedQuery.length === 0 ||
        r.title.toLowerCase().includes(debouncedQuery) ||
        r.desc.toLowerCase().includes(debouncedQuery);
      return matchCat && matchQ;
    });
  }, [debouncedQuery, cat]);

  const clearFilters = useCallback(() => {
    setQuery('');
    setCat('Tất cả');
  }, []);


  const renderRecipe = useCallback(
    ({ item }: { item: Recipe }) => {
      const checked = selected.has(item.id);

      return (
        <ViewComponent style={s.cardWrap}>
          <ViewComponent variant="card" radius={16} flex={1}>
            {/* Ảnh + tick */}
            <ViewComponent style={s.thumbWrap}>
              <Image source={{ uri: item.image }} style={s.thumb} resizeMode="cover" />
              <Pressable onPress={() => toggleSelect(item.id)} style={s.tickWrap} hitSlop={8}>
                <ViewComponent
                  center
                  radius={999}
                  border
                  style={[
                    s.tickCircle,
                    { borderColor: checked ? C.primary : C.primary, backgroundColor: checked ? C.primary : C.white },
                  ]}
                >
                  <Ionicons
                    name={checked ? 'checkmark' : 'add'}
                    size={16}
                    color={checked ? C.onPrimary : C.primary}
                  />
                </ViewComponent>
              </Pressable>
            </ViewComponent>

            {/* Thân card */}
            <ViewComponent style={s.cardBody}>
              <ViewComponent style={s.bodyTop}>
                <TextComponent
                  text={item.title}
                  variant="h3"
                  tone="default"
                  numberOfLines={2}
                  style={{
                    letterSpacing: 0.15,
                    height: 44,
                    lineHeight: 22,
                  }}
                />

                <TextComponent
                  text={item.desc}
                  variant="body"
                  numberOfLines={3}
                  style={{
                    lineHeight: 18,
                    height: 54,
                    textAlignVertical: 'top',
                    marginBottom: 8,
                  }}
                />

                <ViewComponent row gap={8} wrap mb={8}>
                  <ViewComponent
                    row
                    alignItems="center"
                    gap={4}
                    backgroundColor={C.accentSurface}
                    border
                    borderColor={C.accentBorder}
                    radius={999}
                    px={8}
                    py={4}
                  >
                    <McIcon name="fire" size={14} color={C.red} />
                    <TextComponent text={`${item.cal} kcal`} variant="caption" weight="bold" />
                  </ViewComponent>

                  <ViewComponent
                    row
                    alignItems="center"
                    gap={4}
                    backgroundColor={C.primarySurface}
                    border
                    borderColor={C.primaryBorder}
                    radius={999}
                    px={8}
                    py={4}
                  >
                    <McIcon name="food-drumstick" size={14} color={C.success} />
                    <TextComponent text={`${item.protein}g protein`} variant="caption" weight="bold" />
                  </ViewComponent>
                </ViewComponent>
              </ViewComponent>

              <Pressable
                onPress={() => navigation.navigate('MealLogDetail')}
                style={({ pressed }) => [
                  s.ctaBtn,
                  {
                    backgroundColor: C.primarySurface,
                    borderColor: C.primaryBorder,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <TextComponent
                  text="XEM CÔNG THỨC"
                  variant="caption"
                  weight="bold"
                  tone="default"
                  style={{ color: C.primaryDark, letterSpacing: 0.3 }}
                  numberOfLines={1}
                />
              </Pressable>
            </ViewComponent>
          </ViewComponent>
        </ViewComponent>
      );
    },
    [navigation, selected, toggleSelect]
  );

  return (
    <Container>
      {/* Header */}
      <ViewComponent row between alignItems="center">
        <ViewComponent row alignItems="center" gap={10} flex={0}>
          <Avatar name="Anh Hải" />
          <ViewComponent flex={0}>
            <TextComponent text="Xin chào," variant="caption" tone="muted" />
            <TextComponent text="Anh Hải" variant="subtitle" weight="bold" />
          </ViewComponent>
        </ViewComponent>
        <Pressable>
          <ViewComponent
            center
            radius={12}
            backgroundColor={C.bg}
            border
            style={{ width: 42, height: 42 }}
          >
            <Entypo name="bell" size={20} color={C.primary} />
          </ViewComponent>
        </Pressable>
      </ViewComponent>

      {/* Search + Filters + List */}
      <ViewComponent style={{ flex: 1, minHeight: CONTENT_MIN_HEIGHT }}>
        {/* Search */}
        <ViewComponent
          row
          alignItems="center"
          gap={10}
          backgroundColor={C.white}
          radius={999}
          border
          borderColor={C.border}
          px={14}
          style={{ height: 50, marginTop: 10 }}
        >
          <Ionicons name="search" size={18} color={C.slate500} />
          <TextInput
            placeholder="Tìm kiếm món ăn..."
            placeholderTextColor={C.slate500}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            style={s.searchInput}
          />
          {query ? (
            <Pressable onPress={clearFilters} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={C.slate500} />
            </Pressable>
          ) : (
            <Ionicons name="mic-outline" size={18} color={C.slate500} />
          )}
        </ViewComponent>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 10, height: 44, maxHeight: 44 }}
          contentContainerStyle={{ alignItems: 'center', justifyContent: 'space-between', flex: 1 }}
        >
          {CATS.map(c => {
            const active = cat === c;
            return (
              <Pressable key={`cat-${c}`} onPress={() => setCat(c)} style={{ marginRight: 8 }}>
                <ViewComponent
                  center
                  radius={999}
                  border
                  px={20}
                  py={8}
                  backgroundColor={active ? C.primary : C.white}
                  borderColor={active ? C.primary : C.border}
                  style={active ? s.chipActiveShadow : undefined}
                >
                  <TextComponent
                    text={c}
                    variant="caption"
                    weight="bold"
                    tone={active ? 'inverse' : 'default'}
                    numberOfLines={1}
                  />
                </ViewComponent>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* List */}
        <ViewComponent style={{ flex: 1, minHeight: 0 }}>
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            contentContainerStyle={{ paddingTop: 10, flexGrow: 1 }}
            renderItem={renderRecipe}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <ViewComponent center style={{ flex: 1, padding: 24 }}>
                <TextComponent text="Không tìm thấy kết quả" variant="h3" />
                <TextComponent
                  text="Thử từ khóa khác hoặc chọn bộ lọc khác."
                  variant="body"
                  tone="muted"
                  style={{ marginTop: 8, textAlign: 'center' }}
                />
              </ViewComponent>
            }
          />
        </ViewComponent>
      </ViewComponent>
    </Container>
  );
}

/* ================== Styles giữ tối thiểu ================== */
const s = StyleSheet.create({
  avatar: { width: 52, height: 52 },
  searchInput: { flex: 1, color: C.text, paddingVertical: 10, fontFamily: 'System' },
  chipActiveShadow: {
    shadowColor: C.primary,
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  // Card grid
  cardWrap: { width: '48%', marginBottom: 12 },

  // Media
  thumbWrap: {
    width: '100%',
    aspectRatio: 1.2,
    position: 'relative',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden', // ✅ đảm bảo ảnh tuân theo viền bo
  },
  thumb: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  // Tick
  tickWrap: { position: 'absolute', top: 8, right: 8 },
  tickCircle: { width: 28, height: 28 },

  // Card body & text block
  cardBody: { padding: 12, minHeight: 150, justifyContent: 'space-between' },
  bodyTop: { flexShrink: 1 },

  ctaBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    width: '100%',
    alignItems: 'center',
  },

});

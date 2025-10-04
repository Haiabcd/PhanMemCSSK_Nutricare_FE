import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
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

/* ================== Avatar fallback (đồng bộ MealPlan) ================== */
function Avatar({ name, photoUri }: { name: string; photoUri?: string | null }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  if (photoUri) return <Image source={{ uri: photoUri }} style={styles.avatar} />;
  return (
    <ViewComponent center style={styles.avatarFallback} flex={0}>
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
export default function NutritionGuide() {
  const navigation = useNavigation<NativeStackNavigationProp<SuggestionStackParamList>>();
  const { height: screenH } = useWindowDimensions();

  // Chiều cao tối thiểu cho block nội dung (linh hoạt theo màn)
  const CONTENT_MIN_HEIGHT = Math.max(420, Math.floor(screenH * 0.79));

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [cat, setCat] = useState<Category>('Tất cả');

  // state tích chọn item
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
        <View style={styles.cardWrap}>
          <View style={styles.card}>
            {/* Ảnh banner + nút tích chọn */}
            <View style={styles.thumbWrap}>
              <Image source={{ uri: item.image }} style={styles.thumb} resizeMode="cover" />

              {/* Tick chọn (thay cho badge slot) */}
              <Pressable onPress={() => toggleSelect(item.id)} style={styles.tickWrap}>
                <View style={[styles.tickCircle, checked ? styles.tickOn : styles.tickOff]}>
                  <Ionicons
                    name={checked ? 'checkmark' : 'add'}
                    size={16}
                    color={checked ? '#ffffff' : '#10b981'}
                  />
                </View>
              </Pressable>
            </View>

            {/* Thân thẻ */}
            <View style={styles.cardBody}>
              <View>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={3}>{item.desc}</Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaPill}>
                    <McIcon name="fire" size={14} color="#ef4444" />
                    <Text style={styles.metaText}>{item.cal} kcal</Text>
                  </View>
                  <View style={styles.metaPill}>
                    <McIcon name="food-drumstick" size={14} color="#16a34a" />
                    <Text style={styles.metaText}>{item.protein}g protein</Text>
                  </View>
                </View>
              </View>

              <Pressable style={styles.ctaBtn} onPress={() => navigation.navigate('MealLogDetail')}>
                <Text style={styles.ctaText}>XEM CÔNG THỨC</Text>
              </Pressable>
            </View>
          </View>
        </View>
      );
    },
    [navigation, selected, toggleSelect]
  );

  return (
    <Container>
      {/* Header (avatar + chuông) */}
      <ViewComponent row between alignItems="center" mt={20}>
        <ViewComponent row alignItems="center" gap={10} flex={0}>
          <Avatar name="Anh Hải" />
          <ViewComponent flex={0}>
            <TextComponent text="Xin chào," variant="caption" tone="muted" />
            <TextComponent text="Anh Hải" variant="subtitle" weight="bold" />
          </ViewComponent>
        </ViewComponent>
        <Pressable style={styles.iconContainer}>
          <Entypo name="bell" size={20} color={C.primary} />
        </Pressable>
      </ViewComponent>

      {/* Khối: search + filters + list */}
      <View style={[styles.contentBlock, { flex: 1, minHeight: CONTENT_MIN_HEIGHT }]}>
        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color="#64748b" />
          <TextInput
            placeholder="Tìm kiếm món ăn..."
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query ? (
            <Pressable onPress={clearFilters} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </Pressable>
          ) : (
            <Ionicons name="mic-outline" size={18} color="#94a3b8" />
          )}
        </View>

        {/* Filters — giãn đều 5 ô */}
        <View style={styles.filterBar}>
          {CATS.map(c => {
            const active = cat === c;
            return (
              <Pressable
                key={`cat-${c}`}
                onPress={() => setCat(c)}
                style={[styles.chip, styles.chipEqual, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* List */}
        <View style={styles.listHolder}>
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrap}
            contentContainerStyle={[styles.listContent, { flexGrow: 1 }]}
            renderItem={renderRecipe}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
                <Text style={styles.emptySub}>Thử từ khóa khác hoặc chọn bộ lọc khác.</Text>
              </View>
            }
          />
        </View>
      </View>
    </Container>
  );
}

/* ================== Styles (gộp một nơi) ================== */
const styles = StyleSheet.create({
  ctaBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#fce7f3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#f9a8d4',
    marginTop: 10, // tách khỏi metaRow
  },
  ctaText: { color: '#be185d', fontWeight: '900', fontSize: 12, letterSpacing: 0.2 },

  // Header
  iconContainer: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  avatarFallback: {
    width: 52, height: 52, borderRadius: 999,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
  },
  avatar: { width: 52, height: 52, borderRadius: 999 },

  // Content block
  contentBlock: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
    overflow: 'hidden',
    marginTop: 12, // tránh đè header
  },

  // Search
  searchWrap: {
    marginTop: 10,
    marginHorizontal: 12,
    height: 44,
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 14,
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: { flex: 1, color: '#0f172a', paddingVertical: 10, fontWeight: '600' },

  // Filter bar (giãn đều)
  filterBar: {
    marginTop: 10,
    height: 44,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // giãn đều 5 ô
  },
  chipEqual: {
    flex: 1,              // mỗi chip chiếm phần bằng nhau
    marginHorizontal: 4,  // khoảng cách giữa các chip
  },

  chip: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#10b981', borderColor: '#10b981',
    shadowColor: '#10b981', shadowOpacity: 0.14, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  chipText: { color: '#0f172a', fontWeight: '800', fontSize: 12 },
  chipTextActive: { color: '#fff' },

  // List
  listHolder: { flex: 1, minHeight: 0 },
  listContent: { paddingTop: 10, paddingBottom: 14 },
  columnWrap: { paddingHorizontal: 12, justifyContent: 'space-between' },

  // Card
  cardWrap: { width: '48%', marginBottom: 12 }, // để nội dung tự giãn theo ảnh & text
  card: {
    backgroundColor: '#ffffff', borderRadius: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: '#eef2f7',
  },

  // Ảnh
  thumbWrap: { width: '100%', aspectRatio: 1.2, position: 'relative' },
  thumb: { width: '100%', height: '100%' },

  // Tick chọn
  tickWrap: { position: 'absolute', top: 8, right: 8 },
  tickCircle: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    backgroundColor: '#ffffff',
  },
  tickOn: { backgroundColor: '#10b981', borderColor: '#10b981' },
  tickOff: { borderColor: '#10b981' },

  // Thân card
  cardBody: { padding: 12 },
  cardTitle: {
    fontSize: 16, fontWeight: '900', color: '#0f172a', letterSpacing: 0.15, marginBottom: 6,
  },
  cardDesc: { fontSize: 13, color: '#334155', lineHeight: 18 },

  metaRow: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 8,
  },
  metaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1, borderColor: '#e2e8f0',
  },
  metaText: { fontSize: 12, color: '#0f172a', fontWeight: '700' },

  // Empty
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  emptySub: { marginTop: 8, color: '#6b7280', textAlign: 'center' },
});

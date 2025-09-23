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
type Category = 'Tất cả' | 'Thấp Calo' | 'Cao Protein' | 'Khỏe mạnh';
type Recipe = {
  id: string; title: string; desc: string; cal: number; protein: number; image: string; category: Category[];
};

const CATS: Category[] = ['Tất cả', 'Thấp Calo', 'Cao Protein', 'Khỏe mạnh'];

const RECIPES: Recipe[] = [
  { id: '1', title: 'Salad Gà Ớt', desc: 'Món salad tươi ngon, giàu rau củ, phù hợp giảm cân.', cal: 380, protein: 18, image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1200', category: ['Thấp Calo', 'Khỏe mạnh'] },
  { id: '2', title: 'Quinoa & Cá Hồi', desc: 'Omega-3 từ cá hồi, giàu hạt quinoa cho sức khỏe.', cal: 450, protein: 35, image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?q=80&w=1200', category: ['Cao Protein', 'Khỏe mạnh'] },
  { id: '3', title: 'Sinh Tố Rau Xanh', desc: 'Kết hợp rau xanh & trái cây, vitamin tự nhiên.', cal: 250, protein: 8, image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1200', category: ['Thấp Calo', 'Khỏe mạnh'] },
  { id: '4', title: 'Gà Tôm Xào Rau', desc: 'Món xào nhẹ, gà và rau củ cân đối.', cal: 400, protein: 30, image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1200', category: ['Cao Protein', 'Khỏe mạnh'] },
  { id: '5', title: 'Salad Đậu & Rau', desc: 'Đơn giản với đậu & rau, hợp ăn chay.', cal: 320, protein: 12, image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1200', category: ['Thấp Calo', 'Khỏe mạnh'] },
  { id: '6', title: 'Sữa Chua & Trái Cây', desc: 'Giàu protein từ sữa chua, trái cây tươi.', cal: 300, protein: 20, image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=1200', category: ['Cao Protein', 'Khỏe mạnh'] },
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
  const [onlyLowCal, setOnlyLowCal] = useState(false);
  const [onlyHighProtein, setOnlyHighProtein] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 180);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = useMemo(() => {
    return RECIPES.filter(r => {
      const matchCat = cat === 'Tất cả' || r.category.includes(cat);
      const matchQ =
        debouncedQuery.length === 0 ||
        r.title.toLowerCase().includes(debouncedQuery) ||
        r.desc.toLowerCase().includes(debouncedQuery);
      const matchLowCal = !onlyLowCal || r.cal <= 350;
      const matchHighProtein = !onlyHighProtein || r.protein >= 20;
      return matchCat && matchQ && matchLowCal && matchHighProtein;
    });
  }, [debouncedQuery, cat, onlyLowCal, onlyHighProtein]);

  const clearFilters = useCallback(() => {
    setQuery(''); setCat('Tất cả'); setOnlyLowCal(false); setOnlyHighProtein(false);
  }, []);

  const renderRecipe = useCallback(
    ({ item }: { item: Recipe }) => (
      <View style={styles.cardWrap}>
        <View style={styles.card}>
          {/* Ảnh banner + badge */}
          <View style={styles.thumbWrap}>
            <Image source={{ uri: item.image }} style={styles.thumb} resizeMode="cover" />
            <View style={styles.badge}><Text style={styles.badgeText}>Món ăn</Text></View>
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
    ),
    [navigation]
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
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </Pressable>
          ) : (
            <Ionicons name="mic-outline" size={18} color="#94a3b8" />
          )}
        </View>

        {/* Filters — cuộn ngang */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterStrip}
          contentContainerStyle={styles.filterStripContent}
        >
          {CATS.map(c => {
            const active = cat === c;
            return (
              <Pressable key={`cat-${c}`} onPress={() => setCat(c)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            );
          })}

          <View style={styles.sep} />

          <Pressable onPress={() => setOnlyLowCal(v => !v)} style={[styles.chip, onlyLowCal && styles.chipActive]}>
            <Text style={[styles.chipText, onlyLowCal && styles.chipTextActive]}>≤ 350 cal</Text>
          </Pressable>

          <Pressable onPress={() => setOnlyHighProtein(v => !v)} style={[styles.chip, onlyHighProtein && styles.chipActive]}>
            <Text style={[styles.chipText, onlyHighProtein && styles.chipTextActive]}>≥ 20g protein</Text>
          </Pressable>

          <View style={styles.sep} />

          <Pressable onPress={clearFilters} style={[styles.chip, styles.resetChip]}>
            <Text style={[styles.chipText, styles.resetChipText]}>Đặt lại</Text>
          </Pressable>
        </ScrollView>

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
                <Text style={styles.emptySub}>Thử xóa bớt bộ lọc hoặc dùng từ khóa khác.</Text>
                <Pressable style={styles.emptyBtn} onPress={clearFilters}>
                  <Text style={styles.emptyBtnText}>XÓA BỘ LỌC</Text>
                </Pressable>
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
  ctaBtn: { alignSelf: 'flex-start', backgroundColor: '#fce7f3', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#f9a8d4', },
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
  },

  // Search
  searchWrap: {
    marginTop: 10,
    marginHorizontal: 12,
    height: 42,
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 14,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: { flex: 1, color: '#0f172a', paddingVertical: 8, fontWeight: '600' },

  // Filter strip
  filterStrip: { marginTop: 10, height: 44, maxHeight: 44 },
  filterStripContent: { paddingHorizontal: 12, paddingRight: 18, alignItems: 'center' },
  sep: { width: 8 },
  chip: {
    height: 36, paddingHorizontal: 14,
    borderRadius: 999, backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#e2e8f0',
    marginRight: 8, alignItems: 'center', justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#10b981', borderColor: '#10b981',
    shadowColor: '#10b981', shadowOpacity: 0.14, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  chipText: { color: '#0f172a', fontWeight: '800', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  resetChip: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
  resetChipText: { color: '#334155', fontWeight: '900' },

  // List
  listHolder: { flex: 1, minHeight: 0 },
  listContent: { paddingTop: 6, paddingBottom: 12 },
  columnWrap: { paddingHorizontal: 12, justifyContent: 'space-between' },

  // Card
  cardWrap: { width: '48%', height: 300, marginBottom: 12 },
  card: {
    flex: 1, backgroundColor: '#ffffff', borderRadius: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: '#eef2f7',
  },
  thumbWrap: { width: '100%', aspectRatio: 1.9 },
  thumb: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(15,23,42,0.82)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },

  cardBody: { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', letterSpacing: 0.15 },
  cardDesc: { fontSize: 13, color: '#334155', lineHeight: 18 },

  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 6 },
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
  emptyBtn: {
    marginTop: 14, backgroundColor: '#10b981', paddingHorizontal: 16,
    height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center',
  },
  emptyBtnText: { color: '#fff', fontWeight: '900' },
});

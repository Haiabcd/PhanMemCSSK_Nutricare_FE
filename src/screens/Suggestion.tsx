import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Container from '../components/Container';

// ==== Types ====
type Category = 'Tất cả' | 'Thấp Calo' | 'Cao Protein' | 'Khỏe mạnh';

type Recipe = {
  id: string;
  title: string;
  desc: string;
  cal: number; // kcal per serving
  protein: number; // grams per serving
  image: string;
  category: Category[];
};

type SortKey = 'relevant' | 'calAsc' | 'calDesc' | 'proteinDesc';

// ==== Constants (mock data) ====
const CATS: Category[] = ['Tất cả', 'Thấp Calo', 'Cao Protein', 'Khỏe mạnh'];

const RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Salad Gà Ớt',
    desc: 'Món salad tươi ngon, giàu rau củ, phù hợp giảm cân.',
    cal: 380,
    protein: 18,
    image:
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1200',
    category: ['Thấp Calo', 'Khỏe mạnh'],
  },
  {
    id: '2',
    title: 'Quinoa & Cá Hồi',
    desc: 'Omega-3 từ cá hồi, giàu hạt quinoa cho sức khỏe.',
    cal: 450,
    protein: 35,
    image:
      'https://images.unsplash.com/photo-1532550907401-a500c9a57435?q=80&w=1200',
    category: ['Cao Protein', 'Khỏe mạnh'],
  },
  {
    id: '3',
    title: 'Sinh Tố Rau Xanh',
    desc: 'Kết hợp rau xanh & trái cây, vitamin tự nhiên.',
    cal: 250,
    protein: 8,
    image:
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1200',
    category: ['Thấp Calo', 'Khỏe mạnh'],
  },
  {
    id: '4',
    title: 'Gà Tôm Xào Rau',
    desc: 'Món xào nhẹ, gà và rau củ cân đối.',
    cal: 400,
    protein: 30,
    image:
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1200',
    category: ['Cao Protein', 'Khỏe mạnh'],
  },
  {
    id: '5',
    title: 'Salad Đậu & Rau',
    desc: 'Đơn giản với đậu & rau, hợp ăn chay.',
    cal: 320,
    protein: 12,
    image:
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1200',
    category: ['Thấp Calo', 'Khỏe mạnh'],
  },
  {
    id: '6',
    title: 'Sữa Chua & Trái Cây',
    desc: 'Giàu protein từ sữa chua, trái cây tươi.',
    cal: 300,
    protein: 20,
    image:
      'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=1200',
    category: ['Cao Protein', 'Khỏe mạnh'],
  },
];

// ==== Component ====
export default function NutritionGuide(): JSX.Element {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [cat, setCat] = useState<Category>('Tất cả');
  const [onlyLowCal, setOnlyLowCal] = useState<boolean>(false); // <= 350 kcal
  const [onlyHighProtein, setOnlyHighProtein] = useState<boolean>(false); // >= 20g
  const [sort, setSort] = useState<SortKey>('relevant');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  // Debounce search text for snappier typing
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedQuery(query.trim().toLowerCase()),
      180,
    );
    return () => clearTimeout(t);
  }, [query]);

  const filtered = useMemo(() => {
    const list = RECIPES.filter(r => {
      const matchCat = cat === 'Tất cả' || r.category.includes(cat);
      const matchQ =
        debouncedQuery.length === 0 ||
        r.title.toLowerCase().includes(debouncedQuery) ||
        r.desc.toLowerCase().includes(debouncedQuery);
      const matchLowCal = !onlyLowCal || r.cal <= 350;
      const matchHighProtein = !onlyHighProtein || r.protein >= 20;
      return matchCat && matchQ && matchLowCal && matchHighProtein;
    });

    switch (sort) {
      case 'calAsc':
        return [...list].sort((a, b) => a.cal - b.cal);
      case 'calDesc':
        return [...list].sort((a, b) => b.cal - a.cal);
      case 'proteinDesc':
        return [...list].sort((a, b) => b.protein - a.protein);
      default:
        return list; // relevant (no extra sorting beyond filter order)
    }
  }, [debouncedQuery, cat, onlyLowCal, onlyHighProtein, sort]);

  const resultsMeta = useMemo(() => {
    if (filtered.length === 0) return { count: 0, avgCal: 0, avgProtein: 0 };
    const totalCal = filtered.reduce((s, r) => s + r.cal, 0);
    const totalP = filtered.reduce((s, r) => s + r.protein, 0);
    return {
      count: filtered.length,
      avgCal: Math.round(totalCal / filtered.length),
      avgProtein: Math.round(totalP / filtered.length),
    };
  }, [filtered]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const clearFilters = useCallback(() => {
    setQuery('');
    setCat('Tất cả');
    setOnlyLowCal(false);
    setOnlyHighProtein(false);
    setSort('relevant');
  }, []);

  const renderRecipe = useCallback(
    ({ item }: { item: Recipe }) => {
      const liked = !!favorites[item.id];

      // Giới hạn badge để giữ chiều cao ổn định
      const shownCats = item.category.slice(0, 2);
      const extra = item.category.length - shownCats.length;

      return (
        <View
          style={[styles.card, styles.shadow]}
          accessible
          accessibilityLabel={`Món ${item.title}, ${item.cal} calo, ${item.protein} gam protein`}
        >
          <Pressable
            onPress={() => toggleFavorite(item.id)}
            style={styles.favoriteBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={liked ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
          >
            <Text style={[styles.heart, liked && styles.heartActive]}>
              {liked ? '❤' : '♡'}
            </Text>
          </Pressable>

          <Image source={{ uri: item.image }} style={styles.cardImg} />
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.desc}
          </Text>

          <View style={styles.badgesRow}>
            {shownCats.map(c => (
              <View key={`${item.id}-${c}`} style={styles.badge}>
                <Text style={styles.badgeText}>{c}</Text>
              </View>
            ))}
            {extra > 0 && (
              <View style={styles.badgeMore}>
                <Text style={styles.badgeMoreText}>{`+${extra}`}</Text>
              </View>
            )}
          </View>

          <Text style={styles.cardMeta}>
            {item.cal} calo · {item.protein}g protein
          </Text>

          {/* Spacer đẩy CTA xuống đáy thẻ */}
          <View style={styles.flexSpacer} />

          <Pressable
            style={styles.cta}
            onPress={() => {
              // TODO: tích hợp điều hướng chi tiết công thức (React Navigation)
              // navigation.navigate('RecipeDetail', { id: item.id })
            }}
            accessibilityRole="button"
            accessibilityLabel={`Xem công thức cho ${item.title}`}
          >
            <Text style={styles.ctaText}>XEM CÔNG THỨC</Text>
          </Pressable>
        </View>
      );
    },
    [favorites, toggleFavorite],
  );

  return (
    <Container>
      {/* Header */}
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Đề xuất Dinh dưỡng</Text>
        <Text style={styles.topSub}>
          Chọn món hợp mục tiêu · Lọc nhanh theo calo & protein
        </Text>
      </View>

      {/* Filter Bar */}
      <View
        style={[styles.filterBar, styles.shadow]}
        accessibilityRole="header"
        accessibilityLabel="Bộ lọc tìm kiếm và phân loại món"
      >
        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <TextInput
              placeholder="Tìm kiếm món ăn..."
              placeholderTextColor="#96A2AF"
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
              returnKeyType="search"
              accessibilityLabel="Ô tìm kiếm món ăn"
            />
          </View>
          <Pressable
            style={styles.searchBtn}
            onPress={() => setDebouncedQuery(query.trim().toLowerCase())}
            accessibilityRole="button"
            accessibilityLabel="Thực hiện tìm kiếm"
          >
            <Text style={styles.searchIcon}>🔍</Text>
          </Pressable>
          {query.length > 0 && (
            <Pressable
              style={styles.clearBtn}
              onPress={() => setQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Xóa nội dung tìm kiếm"
            >
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
        >
          {CATS.map(c => (
            <Pressable
              key={c}
              onPress={() => setCat(c)}
              style={[styles.pill, cat === c && styles.pillActive]}
              accessibilityRole="button"
              accessibilityLabel={`Lọc theo ${c}`}
            >
              <Text
                style={[styles.pillText, cat === c && styles.pillTextActive]}
              >
                {c}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Quick Toggles + Sorter (wrap để không tràn) */}
        <View style={styles.quickRow}>
          <ToggleChip
            active={onlyLowCal}
            onPress={() => setOnlyLowCal(v => !v)}
            label="≤ 350 cal"
          />
          <ToggleChip
            active={onlyHighProtein}
            onPress={() => setOnlyHighProtein(v => !v)}
            label="≥ 20g protein"
          />

          <View style={styles.sorter}>
            {(
              [
                { key: 'relevant', label: 'Mặc định' },
                { key: 'calAsc', label: 'Calo ↑' },
                { key: 'calDesc', label: 'Calo ↓' },
                { key: 'proteinDesc', label: 'Protein ↓' },
              ] as { key: SortKey; label: string }[]
            ).map(({ key, label }) => (
              <Pressable
                key={key}
                onPress={() => setSort(key)}
                style={[styles.sortBtn, sort === key && styles.sortBtnActive]}
                accessibilityRole="button"
                accessibilityLabel={`Sắp xếp: ${label}`}
              >
                <Text
                  style={[
                    styles.sortText,
                    sort === key && styles.sortTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Results meta + clear */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {resultsMeta.count} món · TB {resultsMeta.avgCal} cal ·{' '}
            {resultsMeta.avgProtein}g protein
          </Text>
          <Pressable
            onPress={clearFilters}
            accessibilityRole="button"
            accessibilityLabel="Xóa tất cả bộ lọc"
          >
            <Text style={styles.clearAll}>Đặt lại</Text>
          </Pressable>
        </View>
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
          <Text style={styles.emptySub}>
            Thử xóa bớt bộ lọc hoặc dùng từ khóa khác.
          </Text>
          <Pressable style={styles.emptyBtn} onPress={clearFilters}>
            <Text style={styles.emptyBtnText}>XÓA BỘ LỌC</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.listContent}
          renderItem={renderRecipe}
          showsVerticalScrollIndicator={false}
          accessibilityLabel="Danh sách món ăn"
        />
      )}
    </Container>
  );
}

// ==== Reusable subcomponents ====
function ToggleChip({
  active,
  onPress,
  label,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.toggle, active && styles.toggleActive]}
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
    >
      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ==== Styles ====
const colors = {
  bg: '#f5fbff',
  text: '#0f172a',
  sub: '#5d6b7a',
  border: '#e6eef7',
  primary: '#1e9afe',
  primarySoft: '#e9f2ff',
  card: '#ffffff',
  btn: '#ff6b81',
  green: '#22c55e',
};

const styles = StyleSheet.create({
  topBar: {
    backgroundColor: 'transparent',
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 20,
  },
  topTitle: { fontSize: 20, fontWeight: '800', letterSpacing: 0.1 },
  topSub: { color: '#6b7280', fontSize: 13, marginTop: 2 },

  filterBar: {
    backgroundColor: colors.bg,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  searchBox: {
    flex: 1,
    height: 40,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  searchInput: { color: colors.text, fontWeight: '600' },
  searchBtn: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: { fontSize: 16, color: '#fff' },
  clearBtn: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearIcon: { fontSize: 16, color: '#fff' },

  catRow: { paddingVertical: 10, borderRadius: 12 },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    marginRight: 8,
  },
  pillActive: { backgroundColor: colors.primary },
  pillText: { color: colors.text, fontWeight: '800', fontSize: 12 },
  pillTextActive: { color: '#fff' },

  // Không dùng gap; cho phép wrap để chống tràn
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  toggle: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  toggleActive: { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' },
  toggleText: { fontWeight: '800', fontSize: 12, color: colors.text },
  toggleTextActive: { color: colors.green },

  // Sorter tự wrap, không đẩy cả hàng
  sorter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingLeft: 4,
    paddingRight: 4,
  },
  sortBtn: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginRight: 4,
    marginBottom: 4,
    borderRadius: 999,
  },
  sortBtnActive: { backgroundColor: colors.primary },
  sortText: { fontWeight: '800', fontSize: 12, color: colors.text },
  sortTextActive: { color: '#fff' },

  metaRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: { color: colors.sub, fontSize: 12, fontWeight: '700' },
  clearAll: { color: colors.primary, fontWeight: '900', fontSize: 12 },

  // List
  listContent: { paddingHorizontal: 12, paddingBottom: 28, paddingTop: 12 },
  column: { justifyContent: 'space-between', marginBottom: 12 },

  card: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    minHeight: 300, // NEW: đồng đều chiều cao thẻ
  },
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  favoriteBtn: {
    position: 'absolute',
    zIndex: 2,
    right: 12,
    top: 12,
    backgroundColor: '#ffffffcc',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  heart: { fontSize: 16, color: '#64748b' },
  heartActive: { color: '#ef4444' },
  cardImg: { width: '100%', height: 110, borderRadius: 10, marginBottom: 8 },
  cardTitle: { fontWeight: '900', color: colors.text },
  cardDesc: { color: colors.sub, fontSize: 12, marginTop: 4 },

  // Không dùng gap; dùng margin để tương thích
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  badge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: colors.text },
  badgeMore: {
    backgroundColor: '#eef2ff',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  badgeMoreText: { fontSize: 10, fontWeight: '900', color: '#4338ca' },

  cardMeta: {
    color: colors.text,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '800',
  },

  // Spacer để đẩy CTA xuống đáy thẻ
  flexSpacer: { flexGrow: 1 },

  cta: {
    marginTop: 10,
    backgroundColor: colors.btn,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  ctaText: { color: '#fff', fontWeight: '900', fontSize: 12 },

  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: colors.text },
  emptySub: { marginTop: 8, color: colors.sub, textAlign: 'center' },
  emptyBtn: {
    marginTop: 14,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtnText: { color: '#fff', fontWeight: '900' },
});

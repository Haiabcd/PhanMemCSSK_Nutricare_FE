import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    Image,
    Pressable,
    StyleSheet,
} from 'react-native';
import Container from '../components/Container';

type Category = 'Tất cả' | 'Thấp Calo' | 'Cao Protein' | 'Khỏe mạnh';

type Recipe = {
    id: string;
    title: string;
    desc: string;
    cal: number;
    protein: number;
    image: string;
    category: Category[];
};

const CATS: Category[] = ['Tất cả', 'Thấp Calo', 'Cao Protein', 'Khỏe mạnh'];

const RECIPES: Recipe[] = [
    {
        id: '1',
        title: 'Salad Gà Ớt',
        desc: 'Món salad tươi ngon, giàu rau củ, phù hợp giảm cân.',
        cal: 380,
        protein: 18,
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1200',
        category: ['Thấp Calo', 'Khỏe mạnh'],
    },
    {
        id: '2',
        title: 'Quinoa & Cá Hồi',
        desc: 'Omega-3 từ cá hồi, giàu hạt quinoa cho sức khỏe.',
        cal: 450,
        protein: 35,
        image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?q=80&w=1200',
        category: ['Cao Protein', 'Khỏe mạnh'],
    },
    {
        id: '3',
        title: 'Sinh Tố Rau Xanh',
        desc: 'Kết hợp rau xanh & trái cây, vitamin tự nhiên.',
        cal: 250,
        protein: 8,
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1200',
        category: ['Thấp Calo', 'Khỏe mạnh'],
    },
    {
        id: '4',
        title: 'Gà Tôm Xào Rau',
        desc: 'Món xào nhẹ, gà và rau củ cân đối.',
        cal: 400,
        protein: 30,
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1200',
        category: ['Cao Protein', 'Khỏe mạnh'],
    },
    {
        id: '5',
        title: 'Salad Đậu & Rau',
        desc: 'Đơn giản với đậu & rau, hợp ăn chay.',
        cal: 320,
        protein: 12,
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1200',
        category: ['Thấp Calo', 'Khỏe mạnh'],
    },
    {
        id: '6',
        title: 'Sữa Chua & Trái Cây',
        desc: 'Giàu protein từ sữa chua, trái cây tươi.',
        cal: 300,
        protein: 20,
        image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=1200',
        category: ['Cao Protein', 'Khỏe mạnh'],
    },
];

export default function NutritionGuide() {
    const [query, setQuery] = useState('');
    const [cat, setCat] = useState<Category>('Tất cả');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return RECIPES.filter((r) => {
            const matchCat = cat === 'Tất cả' || r.category.includes(cat);
            const matchQ =
                q.length === 0 ||
                r.title.toLowerCase().includes(q) ||
                r.desc.toLowerCase().includes(q);
            return matchCat && matchQ;
        });
    }, [query, cat]);

    return (
        <Container>
            {/* HEADER cố định */}
            <View style={style.topBar}>
                <Text style={style.topTitle}>Đề xuất Dinh dưỡng</Text>
                <Text style={style.topSub}>Giúp bạn lựa chọn món ăn phù hợp với mục tiêu</Text>
            </View>

            {/* THANH TÌM KIẾM + LỌC cố định */}
            <View style={[style.filterBar, style.shadow]}>
                <View style={style.searchRow}>
                    <View style={style.searchBox}>
                        <TextInput
                            placeholder="Tìm kiếm món ăn..."
                            placeholderTextColor="#96A2AF"
                            value={query}
                            onChangeText={setQuery}
                            style={style.searchInput}
                            returnKeyType="search"
                        />
                    </View>
                    <Pressable style={style.searchBtn} onPress={() => { }}>
                        <Text style={style.searchIcon}>🔍</Text>
                    </Pressable>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={style.catRow}
                >
                    {CATS.map((c) => (
                        <Pressable
                            key={c}
                            onPress={() => setCat(c)}
                            style={[style.pill, cat === c && style.pillActive]}
                        >
                            <Text style={[style.pillText, cat === c && style.pillTextActive]}>
                                {c}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {/* DANH SÁCH cuộn độc lập */}
            <ScrollView
                style={style.listArea}
                contentContainerStyle={style.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={style.grid}>
                    {filtered.map((r) => (
                        <View key={r.id} style={[style.card, style.shadow]}>
                            <Image source={{ uri: r.image }} style={style.cardImg} />
                            <Text style={style.cardTitle} numberOfLines={2}>{r.title}</Text>
                            <Text style={style.cardDesc} numberOfLines={2}>{r.desc}</Text>
                            <Text style={style.cardMeta}>
                                {r.cal} calo | {r.protein}g protein
                            </Text>
                            <Pressable style={style.cta}>
                                <Text style={style.ctaText}>XEM CÔNG THỨC</Text>
                            </Pressable>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </Container>
    );
}

/* ---------------- styles ---------------- */

const colors = {
    bg: '#f5fbff',
    text: '#0f172a',
    sub: '#5d6b7a',
    border: '#e6eef7',
    primary: '#1e9afe',
    primarySoft: '#e9f2ff',
    card: '#ffffff',
    btn: '#ff6b81',
};

const style = StyleSheet.create({
    topBar: {
        backgroundColor: 'transparent',
        paddingTop: 14,
        paddingBottom: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        marginTop: 20
    },
    topTitle: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.1,
    },

    topSub: {
        color: "#6b7280",
        fontSize: 13,
        marginTop: 2,
    },

    // Thanh tìm & lọc cố định
    filterBar: {
        backgroundColor: colors.bg,
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 6,
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

    catRow: {
        paddingVertical: 10,
        borderRadius: 12,
    },
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

    // Khu vực danh sách cuộn
    listArea: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 12, paddingBottom: 28 },

    grid: {
        marginTop: 6,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: '48%',
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 10,
        marginBottom: 12,
    },
    shadow: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    cardImg: { width: '100%', height: 110, borderRadius: 10, marginBottom: 8 },
    cardTitle: { fontWeight: '900', color: colors.text },
    cardDesc: { color: colors.sub, fontSize: 12, marginTop: 4 },
    cardMeta: { color: colors.text, fontSize: 12, marginTop: 6, fontWeight: '800' },
    cta: {
        marginTop: 10,
        backgroundColor: colors.btn,
        height: 34,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaText: { color: '#fff', fontWeight: '900', fontSize: 12 },
});

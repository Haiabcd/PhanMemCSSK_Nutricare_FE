import React, { useState } from 'react';
import {
  Image,
  Text,
  View,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import Container from '../components/Container';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CaloriesNutritionCard from '../components/CaloriesNutritionCard';
import HydrationCard from '../components/HydrationCard';
import HydrationSummaryCard from '../components/HydrationCard';

/* ================== Palette ================== */
export const colors = {
  white: '#ffffff',
  black: '#000000',
  textBlack: '#010101',
  textWhite: '#F5FEF2',
  green: '#43B05C',
  greenLight: '#04B81B',
  greenLight2: '#BBF7D0',
  red: '#EF4444',
  blue: '#3B82F6',
  bg: '#f7faf8',
  text: '#0f172a',
  sub: '#6b7280',
  border: '#e5efe8',
  chip: '#eafff3',
  inputBg: '#f9fffb',
  primary: '#0ea5e9',
  success: '#16a34a',

  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',

  emerald50: '#ecfdf5',
  emerald700: '#047857',
  emerald800: '#065f46',

  // ⬇ bổ sung nhẹ để tiện dùng
  amber500: '#f59e0b',
  violet500: '#8b5cf6',
};

const C = colors;

/* ================== Avatar fallback ================== */
function Avatar({
  name,
  photoUri,
}: {
  name: string;
  photoUri?: string | null;
}) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (photoUri) return <Image source={{ uri: photoUri }} style={s.avatar} />;

  return (
    <View style={s.avatarFallback}>
      <Text style={s.avatarInitials}>{initials}</Text>
    </View>
  );
}

/* ================== Tabs món ăn (tick chọn) ================== */
type TabKey = 'Sáng' | 'Trưa' | 'Chiều' | 'Phụ';
type Meal = { id: string; title: string; kcal: number; img: string };

function MealCardsTabs() {
  const [active, setActive] = useState<TabKey>('Sáng');

  const data: Record<TabKey, Meal[]> = {
    Sáng: [
      {
        id: 'm1',
        title: 'Bún gà rau củ',
        kcal: 380,
        img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=1200',
      },
      {
        id: 'm2',
        title: 'Sữa chua + yến mạch',
        kcal: 240,
        img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200',
      },
    ],
    Trưa: [
      {
        id: 'm3',
        title: 'Cơm cá hồi áp chảo',
        kcal: 520,
        img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200',
      },
      {
        id: 'm4',
        title: 'Salad ức gà',
        kcal: 330,
        img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200',
      },
      {
        id: 'm5',
        title: 'Canh nấm',
        kcal: 110,
        img: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=1200',
      },
    ],
    Chiều: [
      {
        id: 'm6',
        title: 'Bánh mì trứng + rau',
        kcal: 410,
        img: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200',
      },
      {
        id: 'm7',
        title: 'Sữa tươi ít béo',
        kcal: 160,
        img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200',
      },
    ],
    Phụ: [
      {
        id: 'm8',
        title: 'Táo + hạt điều',
        kcal: 210,
        img: 'https://images.unsplash.com/photo-1576402187878-974f70cbf7e5?w=1200',
      },
      {
        id: 'm9',
        title: 'Chuối',
        kcal: 90,
        img: 'https://images.unsplash.com/photo-1571771896275-1e6a1d49b6f9?w=1200',
      },
    ],
  };

  // selected theo từng tab
  const [selectedMap, setSelectedMap] = useState<Record<TabKey, Set<string>>>({
    Sáng: new Set(),
    Trưa: new Set(),
    Chiều: new Set(),
    Phụ: new Set(),
  });

  const toggleSelect = (tab: TabKey, id: string) => {
    setSelectedMap(prev => {
      const next = new Map(prev[tab]); // clone
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, [tab]: new Set(next) };
    });
  };

  const tabs = Object.keys(data) as TabKey[];
  const meals = data[active];
  const selected = selectedMap[active];

  return (
    <View>
      {/* Tabs */}
      <View style={s.tabBar}>
        {tabs.map(t => {
          const isOn = active === t;
          return (
            <Pressable
              key={t}
              onPress={() => setActive(t)}
              style={[s.pill, isOn && s.pillActive]}
            >
              <Text style={[s.pillText, isOn && s.pillTextActive]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={s.tabTitle}>{active}</Text>

      {/* Danh sách món (tick chọn) */}
      {meals.map(m => {
        const isChecked = selected.has(m.id);
        return (
          <View key={m.id} style={s.mealCard}>
            <View style={s.imageWrap}>
              <Image source={{ uri: m.img }} style={s.image} />
              <View style={s.overlay} />

              {/* Badge thông tin */}
              <View style={s.mealBadge}>
                <Entypo name="leaf" size={12} color={C.success} />
                <Text style={s.mealBadgeText}>
                  {m.kcal} kcal • {m.title}
                </Text>
              </View>

              {/* Checkbox */}
              <Pressable
                onPress={() => toggleSelect(active, m.id)}
                style={[s.checkBox, isChecked ? s.checkOn : s.checkOff]}
              >
                {isChecked ? (
                  <MaterialCommunityIcons
                    name="check-bold"
                    size={14}
                    color={C.white}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="checkbox-blank-outline"
                    size={14}
                    color={C.slate500}
                  />
                )}
              </Pressable>
            </View>

            <View style={s.btnRow}>
              <Pressable style={[s.btn, s.btnPrimary]}>
                <Text style={[s.btnText, s.btnTextPrimary]}>Đổi món</Text>
              </Pressable>
              <Pressable style={[s.btn, s.btnGhost]}>
                <Text style={s.btnText}>Xem chi tiết</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/* ================== Uống nước (icon đẹp hơn) ================== */
function TrackWater() {
  const [water, setWater] = useState(0);
  const target = 2.5;
  const step = 0.25;

  const add = () => setWater(v => Math.min(target, +(v + step).toFixed(2)));
  const sub = () => setWater(v => Math.max(0, +(v - step).toFixed(2)));
  const pct =
    target === 0 ? 0 : Math.min(100, Math.max(0, (water / target) * 100));

  return (
    <View style={s.waterRow}>
      <View style={s.waterCol}>
        <Pressable
          style={[s.circleBtn, { backgroundColor: C.blue }]}
          onPress={sub}
        >
          <MaterialCommunityIcons
            name="water-minus"
            size={22}
            color={C.white}
          />
        </Pressable>
        <Text style={s.waterText}>{step} lt</Text>
        <Text style={s.waterSub}>Thực tế {water.toFixed(2)} lt</Text>
      </View>

      {/* Cốc nước */}
      <View style={s.cupWrap}>
        <View style={s.cupRim} />
        <View style={s.cupBody}>
          <View style={s.cupShineLeft} />
          <View style={s.cupShineRight} />
          <View style={[s.measureLine, { bottom: '25%' }]} />
          <View style={[s.measureLine, { bottom: '50%' }]} />
          <View style={[s.measureLine, { bottom: '75%' }]} />
          <View
            style={[
              s.waterFillGlass,
              { height: `${pct}%`, backgroundColor: C.blue },
            ]}
          />
          <View style={[s.waterSurface, { bottom: `${pct}%` }]} />
          <MaterialCommunityIcons
            name="cup-water"
            size={20}
            color={C.slate500}
            style={{ position: 'absolute', top: 6, right: 6, opacity: 0.6 }}
          />
        </View>
        <Text style={s.waterBoxText}>
          {water.toFixed(2)} / {target} lt
        </Text>
      </View>

      <View style={s.waterCol}>
        <Pressable
          style={[s.circleBtn, { backgroundColor: C.success }]}
          onPress={add}
        >
          <MaterialCommunityIcons name="water-plus" size={22} color={C.white} />
        </Pressable>
        <Text style={s.waterText}>{step} lt</Text>
        <Text style={s.waterSub}>Mục tiêu {target} lt</Text>
      </View>
    </View>
  );
}

/* ================== Main ================== */
const MealPlan = () => {
  const [range, setRange] = useState<'day' | 'week'>('day');

  return (
    <Container>
      {/* Header */}
      <View style={s.top}>
        <View style={s.nameAvatar}>
          <Avatar name="Anh Hải" />
          <View style={{ marginLeft: 10 }}>
            <Text style={s.hello}>Xin chào,</Text>
            <Text style={s.textName}>Anh Hải</Text>
          </View>
        </View>

        <Pressable style={s.iconContainer}>
          <Entypo name="bell" size={20} color={C.blue} />
        </Pressable>
      </View>

      <View style={s.line} />

      {/* Date + segmented control */}
      <View style={s.center}>
        <View style={s.dateRow}>
          <Entypo name="calendar" size={18} color={C.blue} />
          <Text style={s.dateText}>Thứ 2, 01 Tháng 09</Text>
        </View>

        <View style={s.segment}>
          <Pressable
            onPress={() => setRange('day')}
            style={[s.segmentBtn, range === 'day' && s.segmentBtnActive]}
          >
            <Text
              style={[s.segmentText, range === 'day' && s.segmentTextActive]}
            >
              Theo ngày
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setRange('week')}
            style={[s.segmentBtn, range === 'week' && s.segmentBtnActive]}
          >
            <Text
              style={[s.segmentText, range === 'week' && s.segmentTextActive]}
            >
              Theo tuần
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Calories & Dinh dưỡng*/}
        <View style={{ marginBottom: 12 }}>
          <CaloriesNutritionCard
            target={2105}
            eaten={2105}
            burned={0}
            macros={{
              carbs: { cur: 80, total: 263 },
              protein: { cur: 30, total: 121 },
              fat: { cur: 15, total: 63 },
              fiber: { cur: 8, total: 27 },
            }}
            modeLabel="Cân Bằng"
            palette={colors}
          />
        </View>

        {/* Nhật ký ăn uống */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Nhật ký ăn uống</Text>
          <MealCardsTabs />
        </View>

        {/* Uống nước */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Uống nước</Text>
          <HydrationSummaryCard
            target={2.5}
            step={0.25}
            initial={0.5}
            palette={colors} // tái dùng palette của app (giống Calo)
          />
        </View>
      </ScrollView>
    </Container>
  );
};

export default MealPlan;

/* ================== Styles ================== */
const s = StyleSheet.create({
  /* Header */
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  avatar: { width: 52, height: 52, borderRadius: 999 },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: C.slate50,
    borderWidth: 1,
    borderColor: C.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontWeight: '800', color: C.blue },
  nameAvatar: { flexDirection: 'row', alignItems: 'center' },
  hello: { fontSize: 12, color: C.sub },
  textName: { fontSize: 16, fontWeight: '800', color: C.text },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: C.slate50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.slate200,
  },

  /* Common sections */
  section: {
    backgroundColor: C.white,
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.slate200,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
    color: C.blue,
  },
  line: { height: 2, backgroundColor: C.slate200, marginVertical: 12 },
  center: { alignItems: 'center', marginBottom: 6 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { fontSize: 15, fontWeight: '700', color: C.text },

  segment: {
    flexDirection: 'row',
    backgroundColor: C.slate100,
    borderRadius: 999,
    padding: 4,
    gap: 6,
    marginTop: 8,
  },
  segmentBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999 },
  segmentBtnActive: { backgroundColor: C.blue },
  segmentText: { fontSize: 12, fontWeight: '800', color: C.text },
  segmentTextActive: { color: C.white },

  /* Nutri Card (dark) */
  nutriCard: {
    backgroundColor: C.slate800,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  nutriHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nutriTitle: { color: C.textWhite, fontWeight: '800', fontSize: 16 },
  statBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: C.slate700,
    borderWidth: 1,
    borderColor: C.slate600,
  },
  statBtnText: { color: C.textWhite, fontWeight: '800', fontSize: 12 },

  nutriBody: { flexDirection: 'row', marginTop: 8 },
  nutriLeft: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  appleWrap: { alignItems: 'center', justifyContent: 'center' },
  appleSmall: {
    position: 'absolute',
    top: 18,
    color: C.textWhite,
    opacity: 0.9,
    fontSize: 12,
  },
  appleBig: {
    position: 'absolute',
    top: 40,
    color: C.amber500,
    fontSize: 28,
    fontWeight: '900',
  },

  nutriRight: { flex: 1, paddingLeft: 8, justifyContent: 'center' },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statLabel: { color: C.textWhite, opacity: 0.9, flex: 1 },
  statValue: { color: C.textWhite, fontWeight: '900' },

  dashedWrap: { marginTop: 8, position: 'relative' },
  dashed: {
    height: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.slate600,
  },
  helpDot: {
    position: 'absolute',
    right: -2,
    top: -8,
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: C.slate700,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.slate600,
  },

  macroRow: { marginTop: 8 },
  macroIcon: { position: 'absolute', left: 0, top: 2 },
  macroText: { color: C.textWhite, marginLeft: 22 },
  macroBarDark: {
    height: 8,
    borderRadius: 999,
    backgroundColor: C.slate700,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 6,
    marginLeft: 22,
  },
  macroBarDarkFill: { height: '100%', borderRadius: 999 },
  macroValDark: {
    color: C.textWhite,
    opacity: 0.9,
    marginLeft: 22,
    fontSize: 12,
  },

  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  modeText: { color: C.textWhite, opacity: 0.9 },
  modeChip: {
    backgroundColor: C.greenLight2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.green,
  },
  modeChipText: { color: C.emerald800, fontWeight: '900', fontSize: 12 },

  /* Meal tabs & cards (tick) */
  tabBar: { flexDirection: 'row', paddingVertical: 4, marginBottom: 8 },
  pill: {
    flex: 1,
    backgroundColor: C.slate100,
    paddingVertical: 8,
    borderRadius: 999,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: { backgroundColor: C.blue },
  pillText: { color: C.text, fontWeight: '800', fontSize: 13 },
  pillTextActive: { color: C.white },
  tabTitle: {
    textAlign: 'center',
    fontWeight: '800',
    color: C.text,
    marginBottom: 8,
    fontSize: 14,
  },

  mealCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: C.slate200,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 12,
  },
  imageWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.slate200,
    position: 'relative',
  },
  image: { width: '100%', height: 130, resizeMode: 'cover' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  mealBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: C.white,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.slate200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealBadgeText: { fontSize: 12, fontWeight: '800', color: C.text },

  checkBox: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  checkOn: { backgroundColor: C.blue, borderColor: C.blue },
  checkOff: { backgroundColor: C.slate50, borderColor: C.slate200 },

  btnRow: { flexDirection: 'row', marginTop: 8 },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: C.blue, marginRight: 8 },
  btnGhost: { backgroundColor: C.slate100 },
  btnText: { fontWeight: '800', color: C.text, fontSize: 12 },
  btnTextPrimary: { color: C.white },

  /* Water */
  waterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  waterCol: { alignItems: 'center', width: 88 },
  circleBtn: {
    width: 50,
    height: 50,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  waterText: { fontSize: 13, fontWeight: '800', color: C.text },
  waterSub: { fontSize: 12, color: C.sub, textAlign: 'center' },

  cupWrap: { flex: 1, alignItems: 'center', marginHorizontal: 12 },
  cupRim: {
    width: 100,
    height: 16,
    borderRadius: 50,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.slate200,
    marginBottom: -7,
    zIndex: 2,
  },
  cupBody: {
    width: 100,
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.slate200,
    backgroundColor: C.slate50,
    overflow: 'hidden',
    position: 'relative',
  },
  waterFillGlass: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.95,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  waterSurface: {
    position: 'absolute',
    left: 6,
    right: 6,
    height: 10,
    marginBottom: -5,
    backgroundColor: '#60a5fa',
    borderRadius: 50,
    opacity: 0.9,
  },
  cupShineLeft: {
    position: 'absolute',
    top: 12,
    bottom: 12,
    left: 8,
    width: 6,
    backgroundColor: C.white,
    opacity: 0.25,
    borderRadius: 999,
  },
  cupShineRight: {
    position: 'absolute',
    top: 22,
    bottom: 22,
    right: 10,
    width: 3,
    backgroundColor: C.white,
    opacity: 0.25,
    borderRadius: 999,
  },
  measureLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: C.slate200,
    opacity: 0.45,
  },
  waterBoxText: { marginTop: 8, color: C.text, fontWeight: '800' },
});

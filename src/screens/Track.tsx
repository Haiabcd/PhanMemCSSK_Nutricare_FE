import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Container from '../components/Container';

/* ===== đồng bộ header với app ===== */
import Entypo from 'react-native-vector-icons/Entypo';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PlanStackParamList } from '../navigation/PlanNavigator';
import { colors as C } from '../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabKey = 'scan' | 'manual' | 'history';
type MealType = 'Sáng' | 'Trưa' | 'Tối' | 'Phụ';

/* ===== Avatar fallback ===== */
function Avatar({ name, photoUri }: { name: string; photoUri?: string | null }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  if (photoUri) return <Image source={{ uri: photoUri }} style={s.avatar} />;
  return (
    <View style={s.avatarFallback}>
      <Text style={s.avatarInitials}>{initials}</Text>
    </View>
  );
}

export default function Track() {
  const navigation = useNavigation<NativeStackNavigationProp<PlanStackParamList>>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  // Date + calendar (fake)
  const [date, setDate] = useState(new Date());
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  const add = (key: 'd' | 'm' | 'y', n: number) => {
    setDate(prev => {
      const d = new Date(prev);
      if (key === 'd') d.setDate(d.getDate() + n);
      if (key === 'm') d.setMonth(d.getMonth() + n);
      if (key === 'y') d.setFullYear(d.getFullYear() + n);
      return d;
    });
  };

  // Tabs
  const [tab, setTab] = useState<TabKey>('scan');
  const onChangeTab = (k: TabKey) => {
    setTab(k);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  };

  // Manual (UI)
  const [ings, setIngs] = useState<{ name: string; qty: string }[]>([{ name: '', qty: '' }]);
  const addIng = () => setIngs(p => [...p, { name: '', qty: '' }]);
  const delIng = (i: number) => setIngs(p => p.filter((_, idx) => idx !== i));

  // Scan
  const [showResult, setShowResult] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [mealType, setMealType] = useState<MealType>('Sáng');

  // Demo history data (grouped)
  const historyData: Record<
    MealType,
    { name: string; cal: number; p: number; c: number; f: number; ings?: string[] }[]
  > = {
    Sáng: [
      { name: 'Bánh mì thịt', cal: 400, p: 22, c: 45, f: 14, ings: ['Bánh mì', 'Thịt', 'Rau'] },
      { name: 'Sữa chua + trái cây', cal: 230, p: 12, c: 30, f: 6 },
    ],
    Trưa: [{ name: 'Salad gà', cal: 300, p: 30, c: 20, f: 12 }],
    Tối: [{ name: 'Cơm tấm', cal: 520, p: 20, c: 70, f: 15 }],
    Phụ: [{ name: 'Táo + hạt', cal: 180, p: 5, c: 22, f: 7 }],
  };

  // Giả lập quét
  const handleScan = () => {
    if (isScanning) return;
    setShowResult(false);
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setShowResult(true);
    }, 1500);
  };

  return (
    <Container>
      {/* ===== Header Avatar + Xin chào + Chuông ===== */}
      <View style={[s.headerRow, styles.fullBleed]}>
        <View style={s.headerLeft}>
          <Avatar name="Anh Hải" />
          <View>
            <Text style={s.hello}>Xin chào,</Text>
            <Text style={s.name}>Anh Hải</Text>
          </View>
        </View>

        <Pressable style={s.iconContainer} onPress={() => navigation.navigate('Notification')}>
          <Entypo name="bell" size={20} color={C.primary} />
        </Pressable>
      </View>
      <View style={[s.line, styles.fullBleed]} />

      <View style={{ flex: 1 }}>
        {/* ===== Tiêu đề màn ===== */}
        <View style={[styles.header, styles.fullBleed]}>
          <Text style={styles.headerTitle}>Theo dõi bữa ăn</Text>
          <Text style={styles.headerSub}>Quản lý bữa ăn hàng ngày của bạn một cách hiện đại và tiện lợi</Text>
        </View>

        {/* Tránh bị che bởi bàn phím & tab bar/bottom safe area */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="always"
          >
            {/* Nội dung full-bleed để triệt tiêu padding của Container */}
            <View style={[styles.inner, styles.fullBleed]}>
              {/* Date + stepper */}
              <View style={styles.dateRow}>
                <Pressable style={styles.stepBtn} onPress={() => add('d', -1)}>
                  <Text style={styles.stepText}>◀</Text>
                </Pressable>
                <View style={styles.dateField}>
                  <Text style={styles.dateText}>{fmt(date)}</Text>
                  <Image
                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/747/747310.png' }}
                    style={styles.calendarIcon}
                  />
                </View>
                <Pressable style={styles.stepBtn} onPress={() => add('d', +1)}>
                  <Text style={styles.stepText}>▶</Text>
                </Pressable>
              </View>

              {/* Tabs */}
              <View style={styles.tabs}>
                <Tab label="Scan AI" active={tab === 'scan'} onPress={() => onChangeTab('scan')} />
                <Tab label="Nhập thủ công" active={tab === 'manual'} onPress={() => onChangeTab('manual')} />
                <Tab label="Xem lịch sử" active={tab === 'history'} onPress={() => onChangeTab('history')} />
              </View>

              {/* SCAN */}
              {tab === 'scan' && (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Nhập bữa ăn bằng AI</Text>
                  <Image
                    source={{
                      uri: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/98fb941f-eb1e-49d6-9c4c-7235d38840a5.png',
                    }}
                    style={styles.scanImage}
                  />
                  <Pressable
                    style={[styles.primaryBtn, isScanning && { opacity: 0.6 }]}
                    onPress={handleScan}
                    disabled={isScanning}
                  >
                    <Text style={styles.primaryText}>{isScanning ? 'Đang quét...' : 'Quét Scan'}</Text>
                  </Pressable>

                  {isScanning && (
                    <View style={styles.scanningBox}>
                      <ActivityIndicator size="large" />
                      <Text style={styles.scanHint}>Đang phân tích hình ảnh...</Text>
                    </View>
                  )}

                  {showResult && !isScanning && (
                    <View style={styles.resultBox}>
                      <Text style={styles.resultTitle}>Kết quả từ AI:</Text>
                      <Row label="Tên" value="Bữa ăn từ Scan AI" />
                      <Row label="Calo" value="514 kcal" />
                      <Row label="Protein" value="27 g" />
                      <Row label="Carbs" value="35 g" />
                      <Row label="Fat" value="21 g" />

                      <Text style={[styles.label, { marginTop: 8, marginBottom: 6 }]}>Loại bữa:</Text>
                      <View style={styles.pickerWrap}>
                        <Picker
                          selectedValue={mealType}
                          onValueChange={v => setMealType(v as MealType)}
                          style={styles.picker}
                          itemStyle={Platform.OS === 'ios' ? { color: '#0f172a', fontSize: 16 } : undefined}
                          {...(Platform.OS === 'android' ? { mode: 'dropdown', dropdownIconColor: '#6b7280' } : {})}
                        >
                          <Picker.Item label="Sáng" value="Sáng" />
                          <Picker.Item label="Trưa" value="Trưa" />
                          <Picker.Item label="Tối" value="Tối" />
                          <Picker.Item label="Phụ" value="Phụ" />
                        </Picker>
                      </View>

                      <Pressable style={[styles.primaryBtn, { marginTop: 10, alignSelf: 'center' }]}>
                        <Text style={styles.primaryText}>Lưu bữa ăn</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}

              {/* MANUAL */}
              {tab === 'manual' && (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Nhập bữa ăn thủ công</Text>

                  <Pressable style={styles.selectBox}>
                    <Text style={styles.placeholderText}>Chọn từ danh sách</Text>
                    <Text style={styles.caret}>▾</Text>
                  </Pressable>

                  <TextInput placeholder="Hoặc nhập tên bữa ăn tuỳ ý" style={styles.input} />
                  <TextInput placeholder="Calo (kcal)" style={styles.input} keyboardType="numeric" />
                  <TextInput placeholder="Protein (g)" style={styles.input} keyboardType="numeric" />
                  <TextInput placeholder="Carbs (g)" style={styles.input} keyboardType="numeric" />
                  <TextInput placeholder="Fat (g)" style={styles.input} keyboardType="numeric" />

                  <Pressable style={styles.selectBox}>
                    <Text style={styles.placeholderText}>{mealType}</Text>
                    <Text style={styles.caret}>▾</Text>
                  </Pressable>

                  <Text style={styles.blockLabel}>Nguyên liệu</Text>
                  {ings.map((_, idx) => (
                    <View key={idx} style={styles.ingRow}>
                      <TextInput placeholder="Tên nguyên liệu" style={[styles.input, styles.ingName]} />
                      <TextInput placeholder="Số lượng" style={[styles.input, styles.ingQty]} />
                      <Pressable style={styles.removeBtn} onPress={() => delIng(idx)}>
                        <Text style={{ color: '#ef4444', fontWeight: '700' }}>×</Text>
                      </Pressable>
                    </View>
                  ))}
                  <Pressable style={styles.ghostBtn} onPress={addIng}>
                    <Text style={styles.ghostBtnText}>+ Thêm nguyên liệu</Text>
                  </Pressable>

                  <Pressable style={[styles.primaryBtn, { alignSelf: 'center' }]}>
                    <Text style={styles.primaryText}>Thêm bữa ăn</Text>
                  </Pressable>
                </View>
              )}

              {/* HISTORY */}
              {tab === 'history' && (
                <View style={{ width: '100%' }}>
                  <Text style={styles.sectionTitle}>Lịch sử bữa ăn</Text>
                  {(Object.keys(historyData) as MealType[]).map(type => (
                    <View key={type} style={{ marginBottom: 16 }}>
                      <Text style={styles.groupHeader}>{type}</Text>
                      {historyData[type].map((m, i) => (
                        <View key={i} style={styles.historyCard}>
                          <Text style={styles.mealName}>{m.name}</Text>
                          <Text>
                            Calo: {m.cal} kcal, Protein: {m.p}g, Carbs: {m.c}g, Fat: {m.f}g
                          </Text>
                          {m.ings?.length ? (
                            <Text style={{ marginTop: 4 }}>
                              <Text style={{ fontWeight: '700' }}>Nguyên liệu:</Text> {m.ings.join(', ')}
                            </Text>
                          ) : null}
                          <View style={styles.rowBtns}>
                            <Pressable style={styles.badgeYellow}>
                              <Text style={styles.badgeText}>Sửa (demo)</Text>
                            </Pressable>
                            <Pressable style={styles.badgeRed}>
                              <Text style={styles.badgeText}>Xóa (demo)</Text>
                            </Pressable>
                          </View>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Container>
  );
}

/* helpers */
const Tab = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <Pressable onPress={onPress} style={[styles.tabBtn, active && styles.tabBtnActive]}>
    <Text
      allowFontScaling={false}
      numberOfLines={1}
      ellipsizeMode="tail"
      style={[styles.tabText, active && styles.tabTextActive]}
    >
      {label}
    </Text>
  </Pressable>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

/* ====== styles header ====== */
const s = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  line: { height: 2, backgroundColor: '#e2e8f0', marginVertical: 12 },

  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 52, height: 52, borderRadius: 999 },
  avatarInitials: { fontWeight: '800', color: C.primary },

  hello: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  name: { color: '#0f172a', fontSize: 16, fontWeight: '800' },
});

/* ====== styles chính (đồng bộ palette với NutritionGuide) ====== */
const styles = StyleSheet.create({
  // full-bleed: triệt tiêu padding ngang của Container (mặc định 16)
  fullBleed: { marginHorizontal: -16 },

  header: {
    backgroundColor: 'transparent',
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginTop: 0,
  },
  headerTitle: { color: '#0f172a', fontSize: 20, fontWeight: '800', letterSpacing: 0.1, marginHorizontal: 16 },
  headerSub: { color: '#6b7280', fontSize: 13, marginTop: 2, marginHorizontal: 16 },

  scrollContent: { paddingBottom: 0 },
  inner: { paddingHorizontal: 16, paddingTop: 10, alignItems: 'center' },

  // date row (gọn)
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  stepBtn: {
    backgroundColor: '#f1f5f9',
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stepText: { fontSize: 18, fontWeight: '700', color: '#334155' },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dateText: { fontWeight: '600', color: '#0f172a' },
  calendarIcon: { width: 18, height: 18, marginLeft: 8, opacity: 0.75 },

  // tabs kiểu chip — 3 nút đều nhau
  tabs: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    alignItems: 'stretch',
    marginBottom: 16,
    gap: 8,
    paddingHorizontal: 16,
  },
  tabBtn: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tabBtnActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  tabText: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
  },
  tabTextActive: { color: '#ffffff' },

  // card
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: { textAlign: 'center', fontSize: 18, fontWeight: '700', marginBottom: 10 },

  // controls rút gọn
  selectBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 38,
    marginBottom: 8,
  },
  placeholderText: { color: '#9ca3af' },
  caret: { color: '#6b7280', fontSize: 16 },

  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 38,
    marginBottom: 8,
    color: '#0f172a',
  },
  blockLabel: { marginTop: 6, marginBottom: 6, fontWeight: '700', color: '#0f172a' },
  ingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  ingName: { flex: 1 },
  ingQty: { width: 96 },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#ffffff',
  },

  // buttons theo màu chủ đạo app
  primaryBtn: {
    backgroundColor: C.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10b981',
    alignSelf: 'center',
  },
  primaryText: { color: '#ffffff', fontWeight: '900', letterSpacing: 0.2 },

  scanImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 12,
  },

  scanningBox: { marginTop: 12, alignItems: 'center' },
  scanHint: { marginTop: 6, color: '#6b7280' },

  resultBox: { marginTop: 20, backgroundColor: '#ffffff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  resultTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: '#6b7280' },
  value: { fontWeight: '600' },

  // picker rút ngắn (đồng bộ input)
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    justifyContent: 'center',
    minHeight: 38,
    paddingLeft: Platform.OS === 'android' ? 4 : 0,
    paddingRight: Platform.OS === 'android' ? 4 : 0,
  },
  picker: Platform.select({
    android: { height: 38, width: '100%', color: '#0f172a', paddingLeft: 8, paddingRight: 36 },
    ios: { height: 38, width: '100%', color: '#0f172a' },
    default: { height: 38, width: '100%', color: '#0f172a' },
  }) as any,

  // history
  groupHeader: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: C.primary,
    paddingLeft: 10,
    paddingRight: 16,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    marginHorizontal: 16,
  },
  mealName: { fontWeight: '600', marginBottom: 4 },
  rowBtns: { flexDirection: 'row', gap: 8, marginTop: 8 },
  badgeYellow: { backgroundColor: '#f59e0b', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  badgeRed: { backgroundColor: '#ef4444', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  badgeText: { color: '#fff', fontWeight: '700' },

  // ghost
  ghostBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ghostBtnText: { color: '#0f172a', fontWeight: '700' },
});

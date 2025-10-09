import React, { useRef, useState, useMemo } from 'react';
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
  FlatList,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
} from 'react-native';
import Container from '../components/Container';

import Entypo from 'react-native-vector-icons/Entypo';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PlanStackParamList } from '../navigation/PlanNavigator';
import { colors as C } from '../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

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

/* ===== Format ngày giống MealPlan ===== */
const fmtVNFull = (d: Date) => {
  const dow = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][d.getDay()];
  const dd = `${d.getDate()}`.padStart(2, '0');
  const mm = `${d.getMonth() + 1}`.padStart(2, '0');
  return `${dow}, ${dd} Tháng ${mm}`;
};

/* ===== Màu & constant ===== */
const INPUT_TEXT_COLOR = '#0f172a';
const PLACEHOLDER_COLOR = '#94a3b8';
const UNITS = ['phần', 'gram', 'kg', 'chén', 'ly', 'miếng', 'bát', 'đĩa'] as const;
type UnitType = typeof UNITS[number];

/* ===== Demo menu để chọn nhanh ===== */
const DEMO_MEALS = [
  { name: 'Bánh mì thịt', cal: 400, p: 22, c: 45, f: 14 },
  { name: 'Sữa chua + trái cây', cal: 230, p: 12, c: 30, f: 6 },
  { name: 'Salad gà', cal: 300, p: 30, c: 20, f: 12 },
  { name: 'Cơm tấm', cal: 520, p: 20, c: 70, f: 15 },
  { name: 'Táo + hạt', cal: 180, p: 5, c: 22, f: 7 },
];

/* ===== InlineSelect: ô input + panel đúng 4 item, có scrollbar, cuộn được ===== */
function InlineSelect<T extends string>({
  labelRenderer,
  options,
  value,
  onChange,
  zIndex = 10,
  openKey,
  setOpenKey,
  myKey,
  anchorY,
  onRequestScrollTo,
  maxVisibleItems = 4,
  placeholder = 'Chọn...',
}: {
  labelRenderer: (v: T) => string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
  zIndex?: number;
  openKey: string | null;
  setOpenKey: (k: string | null) => void;
  myKey: string;
  anchorY?: number;
  onRequestScrollTo?: (y: number) => void;
  maxVisibleItems?: number;
  placeholder?: string;
}) {
  const open = openKey === myKey;
  const screenH = Dimensions.get('window').height;

  const ITEM_H = 46;
  const V_PADDING = 16;
  const MIN_BELOW_TO_OPEN_DOWN = 140;

  // Chiều cao mong muốn = 4 item + padding
  const visibleCount = Math.min(options.length, maxVisibleItems);
  const preferredH = visibleCount * ITEM_H + V_PADDING;

  const [openDir, setOpenDir] = useState<'down' | 'up'>('down');

  const handlePress = () => {
    const willOpen = openKey !== myKey;
    if (willOpen) {
      const anchor = typeof anchorY === 'number' ? anchorY : 0;
      const spaceBelow = screenH - anchor - 140;

      if (spaceBelow >= MIN_BELOW_TO_OPEN_DOWN) {
        setOpenDir('down');
        if (typeof anchorY === 'number' && onRequestScrollTo) {
          onRequestScrollTo(Math.max(0, anchorY - 200));
        }
      } else {
        setOpenDir('up');
        if (onRequestScrollTo) {
          const targetY = Math.max(0, anchor - Math.round(screenH * 0.18));
          onRequestScrollTo(targetY);
        }
      }
      setOpenKey(myKey);
    } else {
      setOpenKey(null);
    }
  };

  // Kẹp chiều cao panel theo không gian thực tế
  const spaceDown = Math.max(120, screenH - (anchorY ?? 0) - 140);
  const spaceUp = Math.max(120, (anchorY ?? screenH) - 100);
  const panelHeight = Math.min(openDir === 'down' ? spaceDown : spaceUp, preferredH);

  const displayText = value ? labelRenderer(value) : '';

  return (
    <View style={[styles.dropdownAnchor, { zIndex, minWidth: 156 }]}>
      {/* Ô input hiển thị giá trị đã chọn (không editable) */}
      <Pressable style={{ width: '100%' }} onPress={handlePress}>
        <View pointerEvents="none">
          <TextInput
            value={displayText}
            placeholder={placeholder}
            editable={false}
            style={[styles.input, styles.selectInputLike]}
            placeholderTextColor={PLACEHOLDER_COLOR}
          />
        </View>
        <Text style={[styles.caret, { position: 'absolute', right: 12, top: 14 }]}>▾</Text>
      </Pressable>

      {open && (
        <View
          style={[
            styles.dropdownPanel,
            openDir === 'down' ? { top: 52 } : { bottom: 52 },
            { height: panelHeight }, // cố định để list chắc chắn cuộn được
          ]}
          // chặn ScrollView cha "nuốt" gesture
          onStartShouldSetResponderCapture={() => true}
        >
          <FlatList
            data={options}
            keyExtractor={(item) => String(item)}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}     // có thanh cuộn
            overScrollMode="never"
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 4 }}
            getItemLayout={(_, index) => ({ length: ITEM_H, offset: ITEM_H * index, index })}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.itemRow, { height: ITEM_H, justifyContent: 'center' }]}
                onPress={() => {
                  onChange(item as T);  // cập nhật state bên ngoài
                  setOpenKey(null);     // đóng panel
                }}
              >
                <Text style={{ color: INPUT_TEXT_COLOR, fontWeight: '600' }}>
                  {labelRenderer(item as T)}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

export default function Track() {
  const navigation = useNavigation<NativeStackNavigationProp<PlanStackParamList>>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  // Map vị trí (y) của từng anchor để auto-scroll khi mở combobox
  const anchorYMap = useRef<Record<string, number>>({}).current;
  const setAnchorY = (key: string) => (e: any) => {
    anchorYMap[key] = e.nativeEvent.layout.y;
  };
  const scrollToApprox = (y: number) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y, animated: true });
    });
  };

  const [openKey, setOpenKey] = useState<string | null>(null);

  // Date state
  const [date, setDate] = useState(new Date());

  // iOS date modal
  const [showPicker, setShowPicker] = useState(false);
  const openPicker = () => {
    setOpenKey(null);
    setShowPicker(true);
  };

  // Tabs
  const [tab, setTab] = useState<TabKey>('scan');
  const onChangeTab = (k: TabKey) => {
    setTab(k);
    setOpenKey(null);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  };

  // Manual (state)
  const [mealName, setMealName] = useState('');
  const [cal, setCal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [macrosLocked, setMacrosLocked] = useState(false); // true khi chọn từ danh sách

  // Chỉ hiện NGUYÊN LIỆU khi: không chọn từ danh sách (macrosLocked=false) và có nhập tên món
  const showIngredients = !macrosLocked && mealName.trim().length > 0;

  // Số lượng (Manual)
  const [qtyManual, setQtyManual] = useState('1');
  const [unitManual, setUnitManual] = useState<UnitType>('phần');

  // Nguyên liệu: name + unit
  const [ings, setIngs] = useState<{ name: string; unit: UnitType }[]>([{ name: '', unit: 'gram' }]);
  const addIng = () => {
    setOpenKey(null);
    setIngs(p => [...p, { name: '', unit: 'gram' }]);
  };
  const delIng = (i: number) => {
    setOpenKey(null);
    setIngs(p => p.filter((_, idx) => idx !== i));
  };

  // Manual selectors (inline dropdowns)
  const [openMealList, setOpenMealList] = useState(false);
  const [mealSearch, setMealSearch] = useState('');
  const filteredMeals = useMemo(() => {
    const q = mealSearch.trim().toLowerCase();
    if (!q) return DEMO_MEALS;
    return DEMO_MEALS.filter(m => m.name.toLowerCase().includes(q));
  }, [mealSearch]);

  // Scan
  const [showResult, setShowResult] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [mealType, setMealType] = useState<MealType>('Sáng');
  // Số lượng (Scan)
  const [qtyScan, setQtyScan] = useState('1');
  const [unitScan, setUnitScan] = useState<UnitType>('phần');

  // Demo history data (+ qty/unit)
  const historyData: Record<
    MealType,
    { name: string; cal: number; p: number; c: number; f: number; ings?: string[]; qty?: string; unit?: UnitType }[]
  > = {
    Sáng: [
      { name: 'Bánh mì thịt', cal: 400, p: 22, c: 45, f: 14, ings: ['Bánh mì', 'Thịt', 'Rau'], qty: '1', unit: 'phần' },
      { name: 'Sữa chua + trái cây', cal: 230, p: 12, c: 30, f: 6, qty: '1', unit: 'ly' },
    ],
    Trưa: [{ name: 'Salad gà', cal: 300, p: 30, c: 20, f: 12, qty: '1', unit: 'phần' }],
    Tối: [{ name: 'Cơm tấm', cal: 520, p: 20, c: 70, f: 15, qty: '1', unit: 'đĩa' as UnitType }],
    Phụ: [{ name: 'Táo + hạt', cal: 180, p: 5, c: 22, f: 7, qty: '1', unit: 'phần' }],
  };

  // Giả lập quét
  const handleScan = () => {
    if (isScanning) return;
    setOpenKey(null);
    setShowResult(false);
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setShowResult(true);
    }, 1500);
  };

  // Khi chọn món từ danh sách → fill form manual & khoá macro (ẩn nguyên liệu)
  const chooseMeal = (m: { name: string; cal: number; p: number; c: number; f: number }) => {
    setMealName(m.name);
    setCal(String(m.cal));
    setProtein(String(m.p));
    setCarbs(String(m.c));
    setFat(String(m.f));
    setMacrosLocked(true);   // đã chọn từ list → ẩn nguyên liệu
    setOpenMealList(false);
    setOpenKey(null);
  };

  // Utility render label cho MealType
  const mealTypeLabel = (mt: MealType) => (mt === 'Tối' ? 'Chiều tối' : mt);

  return (
    <Container>
      {/* ===== Overlay đóng khi chạm ngoài dropdown / danh sách ===== */}
      {(openKey || openMealList) && (
        <Pressable
          onPress={() => { setOpenKey(null); setOpenMealList(false); }}
          style={[StyleSheet.absoluteFillObject, { zIndex: 1000 }]}
        />
      )}

      {/* ===== Header ===== */}
      <View style={[s.headerRow, styles.fullBleed]}>
        <View style={s.headerLeft}>
          <Avatar name="Anh Hải" />
          <View>
            <Text style={s.hello}>Xin chào,</Text>
            <Text style={s.name}>Anh Hải</Text>
          </View>
        </View>
        <Pressable
          style={s.iconContainer}
          onPress={() => {
            setOpenKey(null);
            navigation.navigate('Notification');
          }}
        >
          <Entypo name="bell" size={20} color={C.primary} />
        </Pressable>
      </View>
      <View style={[s.line, styles.fullBleed]} />

      <View style={{ flex: 1 }}>
        {/* ===== Khối lịch (manual & history) ===== */}
        {(tab === 'manual' || tab === 'history') && (
          <View style={[styles.calendarWrap, styles.fullBleed]}>
            <Pressable onPress={openPicker} style={styles.calendarBtn}>
              <Entypo name="calendar" size={18} color={C.primary} />
              <Text style={styles.calendarText}>{fmtVNFull(date)}</Text>
            </Pressable>
          </View>
        )}

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
            overScrollMode="never"
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="always"
            nestedScrollEnabled
            keyboardDismissMode="on-drag"
            // Tắt cuộn cha khi có dropdown/list mở để list con cuộn mượt
            scrollEnabled={!openKey && !openMealList}
            onScroll={(_e: NativeSyntheticEvent<NativeScrollEvent>) => { }}
          >
            <View style={[styles.inner, styles.fullBleed]}>
              {/* Tabs kiểu chip */}
              <View style={styles.tabs}>
                <Tab label="Scan AI" active={tab === 'scan'} onPress={() => onChangeTab('scan')} />
                <Tab label="Nhập thủ công" active={tab === 'manual'} onPress={() => onChangeTab('manual')} />
                <Tab label="Xem lịch sử" active={tab === 'history'} onPress={() => onChangeTab('history')} />
              </View>

              {/* ========== SCAN ========== */}
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
                    style={[styles.actionBtn]}
                    onPress={handleScan}
                    disabled={isScanning}
                  >
                    {isScanning ? <ActivityIndicator /> : <Text style={styles.actionText}>Quét Scan</Text>}
                  </Pressable>

                  {isScanning && (
                    <View style={styles.scanningBox}>
                      <Text style={styles.scanHint}>Đang phân tích hình ảnh...</Text>
                    </View>
                  )}

                  {showResult && !isScanning && (
                    <View style={[styles.resultBox]}>
                      <Text style={styles.resultTitleBig}>Kết quả từ AI</Text>

                      <Row label="Tên" value="Bữa ăn từ Scan AI" />
                      <Row label="Calo" value="514 kcal" />
                      <Row label="Protein" value="27 g" />
                      <Row label="Carbs" value="35 g" />
                      <Row label="Fat" value="21 g" />

                      {/* Số lượng + Đơn vị (Scan) */}
                      <Text style={[styles.blockLabel, { marginTop: 12 }]}>Số lượng</Text>
                      <View style={styles.inlineRow}>
                        <TextInput
                          placeholder="1"
                          keyboardType="numeric"
                          style={[styles.input, styles.flex1, { marginRight: 8 }]}
                          placeholderTextColor={PLACEHOLDER_COLOR}
                          selectionColor={C.primary}
                          value={qtyScan}
                          onFocus={() => setOpenKey(null)}
                          onChangeText={setQtyScan}
                        />
                        <View onLayout={setAnchorY('scan_unit')}>
                          <InlineSelect<UnitType>
                            labelRenderer={(u) => u}
                            options={[...UNITS]}
                            value={unitScan}
                            onChange={setUnitScan}
                            zIndex={30}
                            openKey={openKey}
                            setOpenKey={setOpenKey}
                            myKey="scan_unit"
                            anchorY={anchorYMap['scan_unit']}
                            onRequestScrollTo={scrollToApprox}
                            maxVisibleItems={4}
                            placeholder="Chọn đơn vị"
                          />
                        </View>
                      </View>

                      {/* Loại bữa */}
                      <Text style={[styles.blockLabel, { marginTop: 12 }]}>Loại bữa</Text>
                      <View onLayout={setAnchorY('scan_mealtype')}>
                        <InlineSelect<MealType>
                          labelRenderer={mealTypeLabel}
                          options={['Sáng', 'Trưa', 'Tối', 'Phụ']}
                          value={mealType}
                          onChange={setMealType}
                          zIndex={20}
                          openKey={openKey}
                          setOpenKey={setOpenKey}
                          myKey="scan_mealtype"
                          anchorY={anchorYMap['scan_mealtype']}
                          onRequestScrollTo={scrollToApprox}
                          placeholder="Chọn loại bữa"
                        />
                      </View>

                      <Pressable
                        style={[styles.actionBtn, { marginTop: 14 }]}
                        onPress={() => setOpenKey(null)}
                      >
                        <Text style={styles.actionText}>Lưu bữa ăn</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}

              {/* ========== MANUAL ========== */}
              {tab === 'manual' && (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Nhập bữa ăn thủ công</Text>

                  {/* Chọn từ danh sách */}
                  <View style={[styles.dropdownAnchor, { zIndex: 50 }]}>
                    <Pressable
                      style={[styles.selectBox, styles.selectBoxLong]}
                      onPress={() => {
                        setOpenKey(null);
                        setOpenMealList(o => !o);
                      }}
                    >
                      <Text style={styles.placeholderText}>Chọn từ danh sách</Text>
                      <Text style={styles.caret}>▾</Text>
                    </Pressable>

                    {openMealList && (
                      <View
                        style={[
                          styles.dropdownPanel,
                          {
                            top: 52,
                            maxHeight: Math.min(Math.round(Dimensions.get('window').height * 0.55), 380),
                          },
                        ]}
                        onStartShouldSetResponderCapture={() => true}
                      >
                        <TextInput
                          placeholder="Tìm món..."
                          style={[styles.input, { marginHorizontal: 0, marginBottom: 8 }]}
                          placeholderTextColor={PLACEHOLDER_COLOR}
                          selectionColor={C.primary}
                          value={mealSearch}
                          onChangeText={setMealSearch}
                          onFocus={() => setOpenKey(null)}
                        />
                        <FlatList
                          data={filteredMeals}
                          keyExtractor={(item) => item.name}
                          nestedScrollEnabled
                          keyboardShouldPersistTaps="handled"
                          showsVerticalScrollIndicator={true}
                          overScrollMode="never"
                          style={{ maxHeight: 300 }}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              style={[styles.itemRow, { height: 46, justifyContent: 'center' }]}
                              onPress={() => {
                                chooseMeal(item);
                              }}
                            >
                              <Text style={{ color: INPUT_TEXT_COLOR, fontWeight: '600' }}>{item.name}</Text>
                              <Text style={{ color: '#475569' }}>
                                {item.cal} kcal • P{item.p}/C{item.c}/F{item.f}
                              </Text>
                            </TouchableOpacity>
                          )}
                          ListEmptyComponent={
                            <Text style={{ textAlign: 'center', color: '#64748b', paddingVertical: 12 }}>
                              Không tìm thấy món phù hợp
                            </Text>
                          }
                        />
                      </View>
                    )}
                  </View>

                  {/* Nhập tay */}
                  <TextInput
                    placeholder="Hoặc nhập tên bữa ăn tuỳ ý"
                    style={styles.input}
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    selectionColor={C.primary}
                    value={mealName}
                    onFocus={() => setOpenKey(null)}
                    onChangeText={(t) => {
                      setMealName(t);
                      // gõ tay → mở khoá macro (coi như KHÔNG chọn từ danh sách)
                      if (t !== '') setMacrosLocked(false);
                    }}
                  />
                  <TextInput
                    placeholder="Calo (kcal)"
                    style={[styles.input, macrosLocked && styles.inputDisabled]}
                    editable={!macrosLocked}
                    keyboardType="numeric"
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    selectionColor={C.primary}
                    value={cal}
                    onFocus={() => setOpenKey(null)}
                    onChangeText={setCal}
                  />
                  <TextInput
                    placeholder="Protein (g)"
                    style={[styles.input, macrosLocked && styles.inputDisabled]}
                    editable={!macrosLocked}
                    keyboardType="numeric"
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    selectionColor={C.primary}
                    value={protein}
                    onFocus={() => setOpenKey(null)}
                    onChangeText={setProtein}
                  />
                  <TextInput
                    placeholder="Carbs (g)"
                    style={[styles.input, macrosLocked && styles.inputDisabled]}
                    editable={!macrosLocked}
                    keyboardType="numeric"
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    selectionColor={C.primary}
                    value={carbs}
                    onFocus={() => setOpenKey(null)}
                    onChangeText={setCarbs}
                  />
                  <TextInput
                    placeholder="Fat (g)"
                    style={[styles.input, macrosLocked && styles.inputDisabled]}
                    editable={!macrosLocked}
                    keyboardType="numeric"
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    selectionColor={C.primary}
                    value={fat}
                    onFocus={() => setOpenKey(null)}
                    onChangeText={setFat}
                  />

                  {/* Số lượng + Đơn vị (Manual) */}
                  <Text style={styles.blockLabel}>Số lượng</Text>
                  <View style={styles.inlineRow}>
                    <TextInput
                      placeholder="1"
                      keyboardType="numeric"
                      style={[styles.input, styles.flex1, { marginRight: 8 }]}
                      placeholderTextColor={PLACEHOLDER_COLOR}
                      selectionColor={C.primary}
                      value={qtyManual}
                      onFocus={() => setOpenKey(null)}
                      onChangeText={setQtyManual}
                    />
                    <View onLayout={setAnchorY('manual_unit')}>
                      <InlineSelect<UnitType>
                        labelRenderer={(u) => u}
                        options={[...UNITS]}
                        value={unitManual}
                        onChange={setUnitManual}
                        zIndex={40}
                        openKey={openKey}
                        setOpenKey={setOpenKey}
                        myKey="manual_unit"
                        anchorY={anchorYMap['manual_unit']}
                        onRequestScrollTo={scrollToApprox}
                        maxVisibleItems={4}
                        placeholder="Chọn đơn vị"
                      />
                    </View>
                  </View>

                  {/* Loại bữa */}
                  <Text style={styles.blockLabel}>Loại bữa</Text>
                  <View onLayout={setAnchorY('manual_mealtype')}>
                    <InlineSelect<MealType>
                      labelRenderer={mealTypeLabel}
                      options={['Sáng', 'Trưa', 'Tối', 'Phụ']}
                      value={mealType}
                      onChange={setMealType}
                      zIndex={30}
                      openKey={openKey}
                      setOpenKey={setOpenKey}
                      myKey="manual_mealtype"
                      anchorY={anchorYMap['manual_mealtype']}
                      onRequestScrollTo={scrollToApprox}
                      placeholder="Chọn loại bữa"
                    />
                  </View>

                  {/* ===== NGUYÊN LIỆU: chỉ hiện khi nhập thủ công & không chọn từ danh sách ===== */}
                  {showIngredients && (
                    <>
                      <Text style={styles.blockLabel}>Nguyên liệu</Text>
                      {ings.map((row, idx) => {
                        const key = `ing_unit_${idx}`;
                        return (
                          <View key={idx} style={styles.ingRow}>
                            <TextInput
                              placeholder="Tên nguyên liệu"
                              style={[styles.input, styles.ingName]}
                              placeholderTextColor={PLACEHOLDER_COLOR}
                              selectionColor={C.primary}
                              value={row.name}
                              onFocus={() => setOpenKey(null)}
                              onChangeText={t => {
                                const next = [...ings];
                                next[idx].name = t;
                                setIngs(next);
                              }}
                            />
                            <View onLayout={setAnchorY(key)}>
                              <InlineSelect<UnitType>
                                labelRenderer={(u) => u}
                                options={[...UNITS]}
                                value={row.unit}
                                onChange={(u) => {
                                  const next = [...ings];
                                  next[idx].unit = u;
                                  setIngs(next);
                                }}
                                zIndex={25 - idx}
                                openKey={openKey}
                                setOpenKey={setOpenKey}
                                myKey={key}
                                anchorY={anchorYMap[key]}
                                onRequestScrollTo={scrollToApprox}
                                maxVisibleItems={4}
                                placeholder="Đơn vị"
                              />
                            </View>
                            <Pressable style={styles.removeBtn} onPress={() => delIng(idx)}>
                              <Text style={{ color: '#ef4444', fontWeight: '700' }}>×</Text>
                            </Pressable>
                          </View>
                        );
                      })}

                      <Pressable style={styles.ghostBtn} onPress={addIng}>
                        <Text style={styles.ghostBtnText}>+ Thêm nguyên liệu</Text>
                      </Pressable>
                    </>
                  )}

                  <Pressable
                    style={[styles.actionBtn]}
                    onPress={() => { setOpenKey(null); /* TODO: submit manual */ }}
                  >
                    <Text style={styles.actionText}>Thêm bữa ăn</Text>
                  </Pressable>
                </View>
              )}

              {/* ========== HISTORY ========== */}
              {tab === 'history' && (
                <View style={{ width: '100%' }}>
                  <Text style={styles.sectionTitle}>Lịch sử bữa ăn</Text>
                  {(Object.keys(historyData) as MealType[]).map(type => (
                    <View key={type} style={{ marginBottom: 16 }}>
                      <Text style={styles.groupHeader}>{type === 'Tối' ? 'Chiều tối' : type}</Text>
                      {historyData[type].map((m, i) => (
                        <View key={i} style={styles.historyCard}>
                          <Text style={styles.mealName}>{m.name}</Text>
                          <Text>
                            Calo: {m.cal} kcal, Protein: {m.p}g, Carbs: {m.c}g, Fat: {m.f}g
                          </Text>
                          <Text style={{ marginTop: 2, color: '#334155' }}>
                            Số lượng: {m.qty ?? '1'} {m.unit ?? 'phần'}
                          </Text>
                          {m.ings?.length ? (
                            <Text style={{ marginTop: 4 }}>
                              <Text style={{ fontWeight: '700' }}>Nguyên liệu:</Text> {m.ings.join(', ')}
                            </Text>
                          ) : null}
                          <View style={styles.rowBtns}>
                            <Pressable style={[styles.badge, styles.badgeEditSoft]} onPress={() => setOpenKey(null)}>
                              <Text style={styles.badgeTextEdit}>Sửa</Text>
                            </Pressable>
                            <Pressable style={[styles.badge, styles.badgeDeleteSoft]} onPress={() => setOpenKey(null)}>
                              <Text style={styles.badgeTextDelete}>Xóa</Text>
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

      {/* ===== DatePicker iOS (modal riêng) ===== */}
      {Platform.OS === 'ios' && showPicker && (
        <View style={styles.iosPickerOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { setShowPicker(false); setOpenKey(null); }} />
          <View style={styles.pickerBox}>
            <DateTimePicker
              value={date}
              mode="date"
              display="inline"
              themeVariant="light"
              onChange={(_, d) => { if (d) setDate(d); }}
            />
            <Pressable style={styles.doneBtn} onPress={() => { setShowPicker(false); setOpenKey(null); }}>
              <Text style={{ color: C.onPrimary, fontWeight: '700' }}>Xong</Text>
            </Pressable>
          </View>
        </View>
      )}

      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="calendar"
          onChange={(event, d) => {
            setShowPicker(false);
            setOpenKey(null);
            if (event.type === 'set' && d) setDate(d);
          }}
        />
      )}
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

/* ====== styles chính ====== */
const styles = StyleSheet.create({
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

  /* Lịch giống MealPlan */
  calendarWrap: { alignItems: 'center', marginBottom: 8, paddingTop: 4, paddingBottom: 4 },
  calendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.primaryBorder,
    backgroundColor: C.primarySurface,
  },
  calendarText: { fontWeight: '800', color: '#0f172a' },

  scrollContent: { paddingBottom: 0 },
  inner: { paddingHorizontal: 16, paddingTop: 10, alignItems: 'center' },

  // tabs
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

  // input chung
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 8,
    color: INPUT_TEXT_COLOR,
    fontSize: 16,
    lineHeight: 20,
    ...Platform.select({
      android: { textAlignVertical: 'center', paddingVertical: 6 },
      ios: { paddingVertical: 10 },
      default: {},
    }),
  },
  // input dùng cho select
  selectInputLike: {
    backgroundColor: '#ffffff',
  },
  inputDisabled: {
    backgroundColor: '#f1f5f9',
    opacity: 0.7,
  },

  // select button cũ (giữ cho "Chọn từ danh sách")
  selectBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 8,
  },
  selectBoxLong: {
    minWidth: 156,
    height: 46,
    paddingHorizontal: 14,
  },

  placeholderText: { color: '#9ca3af' },
  caret: { color: '#6b7280', fontSize: 16 },

  blockLabel: { marginTop: 6, marginBottom: 6, fontWeight: '700', color: '#0f172a' },
  ingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  ingName: { flex: 1 },

  inlineRow: { flexDirection: 'row', alignItems: 'center' },
  flex1: { flex: 1 },

  removeBtn: {
    width: 40,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#ffffff',
  },

  primaryBtn: {
    backgroundColor: C.primary,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#10b981',
    alignSelf: 'stretch',
    marginTop: 10,
  },
  primaryText: { color: '#ffffff', fontWeight: '900', letterSpacing: 0.2 },

  // Nút riêng Scan (nhẹ hơn)
  actionBtn: {
    backgroundColor: '#93c5fd',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#60a5fa',
    alignSelf: 'stretch',
    marginTop: 10,
  },
  actionText: { color: '#0b2149', fontWeight: '900', letterSpacing: 0.2 },

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

  // giãn spacing phần kết quả
  resultBox: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resultTitleBig: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
    color: '#0f172a',
  },

  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { color: '#6b7280', fontSize: 15 },
  value: { fontWeight: '700', fontSize: 15, color: '#0f172a' },

  // inline dropdown
  dropdownAnchor: {
    position: 'relative',
  },
  dropdownPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    zIndex: 9999,
    ...Platform.select({
      android: { elevation: 20 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
    }),
  },

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
  mealName: { fontWeight: '700', marginBottom: 4, color: '#0f172a' },
  rowBtns: { flexDirection: 'row', gap: 8, marginTop: 8 },
  badge: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEditSoft: { backgroundColor: '#bfdbfe' },
  badgeDeleteSoft: { backgroundColor: '#fecaca' },
  badgeTextEdit: { color: '#0b2149', fontWeight: '800' },
  badgeTextDelete: { color: '#7f1d1d', fontWeight: '800' },

  ghostBtn: {
    alignSelf: 'stretch',
    height: 44,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    marginTop: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: { color: '#0f172a', fontWeight: '700' },

  /* iOS DatePicker overlay riêng */
  iosPickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  pickerBox: {
    backgroundColor: C.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderColor: C.border,
  },
  doneBtn: {
    alignSelf: 'center',
    marginTop: 8,
    backgroundColor: C.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },

  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    color: INPUT_TEXT_COLOR,
  },
  itemRow: {
    paddingHorizontal: 0,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
});

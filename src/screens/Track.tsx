import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, Pressable, TextInput, ActivityIndicator, Platform,
  FlatList, TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent,
  Dimensions, Modal, KeyboardAvoidingView,
} from 'react-native';
import Container from '../components/Container';
import Entypo from 'react-native-vector-icons/Entypo';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PlanStackParamList } from '../navigation/PlanNavigator';
import { colors as C } from '../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary, launchCamera, type ImageLibraryOptions, type CameraOptions } from 'react-native-image-picker';
import Dropdown from '../components/Track/Dropdown';

import { getLogs } from '../services/log.service';
import type { MealSlot } from '../types/types';
import type { LogResponse } from '../types/log.type';

type TabKey = 'scan' | 'manual' | 'history';
type MealType = 'Sáng' | 'Trưa' | 'Tối' | 'Phụ';

function Avatar({ name, photoUri }: { name: string; photoUri?: string | null }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  if (photoUri) return <Image source={{ uri: photoUri }} style={s.avatar} />;
  return (
    <View style={s.avatarFallback}>
      <Text style={s.avatarInitials}>{initials}</Text>
    </View>
  );
}

const fmtVNFull = (d: Date) => {
  const dow = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][d.getDay()];
  const dd = `${d.getDate()}`.padStart(2, '0');
  const mm = `${d.getMonth() + 1}`.padStart(2, '0');
  return `${dow}, ${dd} Tháng ${mm}`;
};

// YYYY-MM-DD (local) cho BE
const toYMDLocal = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const INPUT_TEXT_COLOR = '#0f172a';
const PLACEHOLDER_COLOR = '#94a3b8';
const UNITS = ['phần', 'gram', 'kg', 'chén', 'ly', 'miếng', 'bát', 'đĩa'] as const;
type UnitType = typeof UNITS[number];

const UNIT_OPTIONS = UNITS.map(u => ({ label: u, value: u }));
const MEALTYPE_OPTIONS = (['Sáng', 'Trưa', 'Tối', 'Phụ'] as MealType[]).map(m => ({ label: m === 'Tối' ? 'Chiều tối' : m, value: m }));

const DEMO_MEALS = [
  { name: 'Bánh mì thịt', cal: 400, p: 22, c: 45, f: 14 },
  { name: 'Sữa chua + trái cây', cal: 230, p: 12, c: 30, f: 6 },
  { name: 'Salad gà', cal: 300, p: 30, c: 20, f: 12 },
  { name: 'Cơm tấm', cal: 520, p: 20, c: 70, f: 15 },
  { name: 'Táo + hạt', cal: 180, p: 5, c: 22, f: 7 },
];

/* ===== Chip & SummaryBar ===== */
const Chip = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.chip}>
    <Text style={styles.chipText}>{children}</Text>
  </View>
);

const SummaryBar = ({
  qty, unit, mealType, ingCount,
}: { qty?: string; unit?: string; mealType?: string; ingCount?: number }) => (
  <View style={styles.summaryBar}>
    {qty && unit ? <Chip>{qty} {unit}</Chip> : null}
    {mealType ? <Chip>{mealType === 'Tối' ? 'Chiều tối' : mealType}</Chip> : null}
    {typeof ingCount === 'number' ? <Chip>{ingCount} nguyên liệu</Chip> : null}
  </View>
);

export default function Track() {
  const navigation = useNavigation<NativeStackNavigationProp<PlanStackParamList>>();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<any>>(null);

  const [scrollY, setScrollY] = useState(0);

  const [openKey, setOpenKey] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const openPicker = () => { setOpenKey(null); setShowPicker(true); };

  const [showScanCalendar, setShowScanCalendar] = useState(false);
  const [tab, setTab] = useState<TabKey>('scan');
  const onChangeTab = (k: TabKey) => { setTab(k); setOpenKey(null); requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: false })); };

  // Manual
  const [mealName, setMealName] = useState('');
  const [cal, setCal] = useState(''); const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState(''); const [fat, setFat] = useState('');
  const [macrosLocked, setMacrosLocked] = useState(false);

  // Thu gọn
  const [showScanMacros, setShowScanMacros] = useState(false);
  const [showMacroSection, setShowMacroSection] = useState(false);
  const [showMoreIngs, setShowMoreIngs] = useState(false);
  const visibleIngsCount = showMoreIngs ? undefined : 1;

  const showIngredients = !macrosLocked && mealName.trim().length > 0;

  // Qty/Unit
  const [qtyManual, setQtyManual] = useState('1');
  const [unitManual, setUnitManual] = useState<UnitType>('phần');

  // Ingredients
  const [ings, setIngs] = useState<{ name: string; unit: UnitType }[]>([{ name: '', unit: 'gram' }]);
  const addIng = () => { setOpenKey(null); setIngs(p => [...p, { name: '', unit: 'gram' }]); };
  const delIng = (i: number) => { setOpenKey(null); setIngs(p => p.filter((_, idx) => idx !== i)); };

  // Meal list/search
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
  const [qtyScan, setQtyScan] = useState('1');
  const [unitScan, setUnitScan] = useState<UnitType>('phần');
  const [selectedImageUri, setSelectedImageUri] = useState<string | undefined>(undefined);

  // ============== HISTORY (API) ==============
  const [logs, setLogs] = useState<LogResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Gọi API cho TẤT CẢ mealSlot
  useEffect(() => {
    if (tab !== 'history') return; // chỉ fetch khi đang ở tab history
    const ac = new AbortController();

    (async () => {
      try {
        setHistoryLoading(true);
        setHistoryError(null);

        const ymd = toYMDLocal(date); // YYYY-MM-DD local
        const slots: MealSlot[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

        const results = await Promise.all(
          slots.map(slot =>
            getLogs(ymd, slot, ac.signal)
              .then(arr => Array.isArray(arr) ? arr : [])
              .catch(err => {
                console.log('[HISTORY] getLogs failed for', slot, '-', err?.message ?? err);
                return [];
              })
          )
        );

        const merged = results.flat();
        setLogs(merged);

        // Debug ra console
        console.log('[HISTORY] date=', ymd);
        console.log('[HISTORY] merged logs:', merged);

        const groupedDebug: Record<MealSlot, LogResponse[]> = {
          BREAKFAST: results[0] ?? [],
          LUNCH: results[1] ?? [],
          DINNER: results[2] ?? [],
          SNACK: results[3] ?? [],
        };
        console.log('[HISTORY] grouped by slot:', groupedDebug);

      } catch (e: any) {
        setHistoryError(e?.message ?? 'Không thể tải lịch sử');
        setLogs([]);
      } finally {
        setHistoryLoading(false);
      }
    })();

    return () => ac.abort();
  }, [tab, date]);

  // Gom nhóm theo mealSlot để render
  const groupLabel: Record<MealSlot, string> = {
    BREAKFAST: 'Sáng',
    LUNCH: 'Trưa',
    DINNER: 'Tối',
    SNACK: 'Phụ',
  };

  const groupedLogs = useMemo(() => {
    const g: Record<MealSlot, LogResponse[]> = {
      BREAKFAST: [],
      LUNCH: [],
      DINNER: [],
      SNACK: [],
    };
    for (const item of logs) {
      const slot = (item?.mealSlot as MealSlot) || 'SNACK';
      if (g[slot]) g[slot].push(item);
    }
    return g;
  }, [logs]);

  const [scanChoiceOpen, setScanChoiceOpen] = useState(false);

  const beginFakeScan = () => {
    setOpenKey(null); setShowResult(false); setIsScanning(true);
    setTimeout(() => { setIsScanning(false); setShowResult(true); }, 1500);
  };

  const handleScanFromCamera = async () => {
    setScanChoiceOpen(false); setOpenKey(null); setShowScanCalendar(false);
    const options: CameraOptions = { mediaType: 'photo', cameraType: 'back', saveToPhotos: false, quality: 0.9 };
    try {
      const res = await launchCamera(options);
      if (res?.didCancel) return;
      const uri = res.assets?.[0]?.uri;
      if (uri) { setSelectedImageUri(uri); beginFakeScan(); }
    } catch (e) { setShowScanCalendar(false); }
  };

  const handleScanFromLibrary = async () => {
    setScanChoiceOpen(false); setOpenKey(null);
    const options: ImageLibraryOptions = { mediaType: 'photo', selectionLimit: 1, quality: 0.9 };
    try {
      const res = await launchImageLibrary(options);
      if (res?.didCancel) { setShowScanCalendar(false); return; }
      const uri = res.assets?.[0]?.uri;
      if (uri) { setShowScanCalendar(true); setSelectedImageUri(uri); beginFakeScan(); }
      else setShowScanCalendar(false);
    } catch (e) { setShowScanCalendar(false); }
  };

  const chooseMeal = (m: { name: string; cal: number; p: number; c: number; f: number }) => {
    setMealName(m.name);
    setCal(String(m.cal));
    setProtein(String(m.p));
    setCarbs(String(m.c));
    setFat(String(m.f));
    setShowMacroSection(true);
    setMacrosLocked(true);
    setOpenMealList(false);
    setOpenKey(null);
  };

  /* ===== UI ===== */
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 80}
    >
      <Container>
        {openMealList && (
          <Pressable onPress={() => { setOpenKey(null); setOpenMealList(false); }}
            style={[StyleSheet.absoluteFillObject, { zIndex: 1000 }]} />
        )}

        {/* Header */}
        <View style={[s.headerRow, styles.fullBleed]}>
          <View style={s.headerLeft}>
            <Avatar name="Anh Hải" />
            <View>
              <Text style={s.hello}>Xin chào,</Text>
              <Text style={s.name}>Anh Hải</Text>
            </View>
          </View>
          <Pressable style={s.iconContainer} onPress={() => { setOpenKey(null); navigation.navigate('Notification'); }}>
            <Entypo name="bell" size={20} color={C.primary} />
          </Pressable>
        </View>
        <View style={[s.line, styles.fullBleed]} />

        {(tab === 'manual' || tab === 'history' || (tab === 'scan' && showScanCalendar)) && (
          <View style={[styles.calendarWrap, styles.fullBleed]}>
            <Pressable onPress={openPicker} style={styles.calendarBtn}>
              <Entypo name="calendar" size={18} color={C.primary} />
              <Text style={styles.calendarText}>{fmtVNFull(date)}</Text>
            </Pressable>
          </View>
        )}

        <FlatList
          ref={listRef}
          data={[0]}
          keyExtractor={() => 'screen'}
          renderItem={() => (
            <View style={[styles.inner, styles.fullBleed]}>
              {/* Tabs */}
              <View style={styles.tabs}>
                <Tab label="Scan AI" active={tab === 'scan'} onPress={() => onChangeTab('scan')} />
                <Tab label="Nhập thủ công" active={tab === 'manual'} onPress={() => onChangeTab('manual')} />
                <Tab label="Xem lịch sử" active={tab === 'history'} onPress={() => onChangeTab('history')} />
              </View>

              {/* ========== SCAN ========== */}
              {tab === 'scan' && (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>NHẬP BỮA ĂN BẰNG AI</Text>
                  <Text style={styles.sectionSub}>Chụp ảnh hoặc chọn ảnh món ăn để phân tích nhanh.</Text>

                  <Image
                    source={{
                      uri: selectedImageUri ? selectedImageUri
                        : 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/98fb941f-eb1e-49d6-9c4c-7235d38840a5.png'
                    }}
                    style={styles.scanImage}
                  />

                  <Pressable style={[styles.actionBtn]} onPress={() => setScanChoiceOpen(true)} disabled={isScanning}>
                    {isScanning ? <ActivityIndicator /> : <Text style={styles.actionText}>Quét Scan</Text>}
                  </Pressable>

                  {isScanning && (
                    <View style={styles.scanningBox}>
                      <Text style={styles.scanHint}>Đang phân tích hình ảnh...</Text>
                    </View>
                  )}

                  {showResult && !isScanning && (
                    <View style={[styles.resultBox]}>
                      <Text style={styles.resultTitleBig}>KẾT QUẢ TỪ AI</Text>

                      <SummaryBar qty={qtyScan} unit={unitScan} mealType={mealType} />

                      <Row label="Tên" value="Bữa ăn từ Scan AI" />
                      <Row label="Calo" value="514 kcal" />

                      {!showScanMacros ? (
                        <Pressable style={styles.ghostBtn} onPress={() => setShowScanMacros(true)}>
                          <Text style={styles.ghostBtnText}>Hiện chi tiết dinh dưỡng (P/C/F)</Text>
                        </Pressable>
                      ) : (
                        <>
                          <Row label="Protein" value="27 g" />
                          <Row label="Carbs" value="35 g" />
                          <Row label="Fat" value="21 g" />
                          <Pressable style={styles.ghostBtn} onPress={() => setShowScanMacros(false)}>
                            <Text style={styles.ghostBtnText}>Ẩn bớt chi tiết</Text>
                          </Pressable>
                        </>
                      )}

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
                        <View style={{ minWidth: 156 }}>
                          <Dropdown value={unitScan} options={UNIT_OPTIONS} onChange={v => setUnitScan(v as UnitType)}
                            menuWidth={140}
                            menuMaxHeight={140}
                            menuOffsetY={6}
                          />
                        </View>
                      </View>

                      <Text style={[styles.blockLabel, { marginTop: 12 }]}>Loại bữa</Text>
                      <View style={{ minWidth: 156 }}>
                        <Dropdown value={mealType} options={MEALTYPE_OPTIONS} onChange={v => setMealType(v as MealType)}
                          menuMaxHeight={140}
                          menuOffsetY={6}
                        />
                      </View>

                      <Pressable style={[styles.actionBtn, { marginTop: 18 }]} onPress={() => setOpenKey(null)}>
                        <Text style={styles.actionText}>Lưu bữa ăn</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}

              {/* ========== MANUAL ========== */}
              {tab === 'manual' && (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>NHẬP BỮA ĂN THỦ CÔNG</Text>
                  <Text style={styles.sectionSub}>Chọn nhanh từ danh sách hoặc tự nhập thông tin.</Text>

                  <SummaryBar
                    qty={qtyManual}
                    unit={unitManual}
                    mealType={mealType}
                    ingCount={showIngredients ? ings.filter(i => i.name.trim()).length : 0}
                  />

                  {/* Chọn từ danh sách */}
                  <View style={[styles.dropdownAnchor, { zIndex: 50 }]}>
                    <Pressable
                      style={[styles.selectBox, styles.selectBoxLong]}
                      onPress={() => { setOpenKey(null); setOpenMealList(o => !o); }}
                    >
                      <Text style={styles.placeholderText}>Chọn từ danh sách</Text>
                      <Text style={styles.caret}>▾</Text>
                    </Pressable>

                    {openMealList && (
                      <View
                        style={[
                          styles.dropdownPanel,
                          { top: 52, maxHeight: Math.min(Math.round(Dimensions.get('window').height * 0.55), 380) }
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
                          keyboardShouldPersistTaps="always"
                          showsVerticalScrollIndicator
                          overScrollMode="never"
                          style={{ maxHeight: 300 }}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              style={[styles.itemRow, { height: 46, justifyContent: 'center' }]}
                              onPress={() => { chooseMeal(item); }}
                            >
                              <Text style={{ color: INPUT_TEXT_COLOR, fontWeight: '600' }}>{item.name}</Text>
                              <Text style={{ color: '#475569' }}>{item.cal} kcal • P{item.p}/C{item.c}/F{item.f}</Text>
                            </TouchableOpacity>
                          )}
                          ListEmptyComponent={
                            <Text style={{ textAlign: 'center,', color: '#64748b', paddingVertical: 12 }}>
                              Không tìm thấy món phù hợp
                            </Text>
                          }
                        />
                      </View>
                    )}
                  </View>

                  {/* Nhập tay — tên + vĩ chất */}
                  <TextInput
                    placeholder="Hoặc nhập tên bữa ăn tuỳ ý"
                    style={styles.input}
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    selectionColor={C.primary}
                    value={mealName}
                    onFocus={() => setOpenKey(null)}
                    onChangeText={(t) => { setMealName(t); if (t !== '') setMacrosLocked(false); }}
                  />

                  {!showMacroSection ? (
                    <Pressable style={styles.ghostBtn} onPress={() => setShowMacroSection(true)}>
                      <Text style={styles.ghostBtnText}>Nhập calorie & vĩ chất</Text>
                    </Pressable>
                  ) : (
                    <>
                      <TextInput placeholder="Calo (kcal)" style={[styles.input, macrosLocked && styles.inputDisabled]}
                        editable={!macrosLocked} keyboardType="numeric" placeholderTextColor={PLACEHOLDER_COLOR}
                        selectionColor={C.primary} value={cal} onFocus={() => setOpenKey(null)} onChangeText={setCal} />
                      <TextInput placeholder="Protein (g)" style={[styles.input, macrosLocked && styles.inputDisabled]}
                        editable={!macrosLocked} keyboardType="numeric" placeholderTextColor={PLACEHOLDER_COLOR}
                        selectionColor={C.primary} value={protein} onFocus={() => setOpenKey(null)} onChangeText={setProtein} />
                      <TextInput placeholder="Carbs (g)" style={[styles.input, macrosLocked && styles.inputDisabled]}
                        editable={!macrosLocked} keyboardType="numeric" placeholderTextColor={PLACEHOLDER_COLOR}
                        selectionColor={C.primary} value={carbs} onFocus={() => setOpenKey(null)} onChangeText={setCarbs} />
                      <TextInput placeholder="Fat (g)" style={[styles.input, macrosLocked && styles.inputDisabled]}
                        editable={!macrosLocked} keyboardType="numeric" placeholderTextColor={PLACEHOLDER_COLOR}
                        selectionColor={C.primary} value={fat} onFocus={() => setOpenKey(null)} onChangeText={setFat} />
                      <Pressable style={styles.ghostBtn} onPress={() => setShowMacroSection(false)}>
                        <Text style={styles.ghostBtnText}>Ẩn bớt phần vĩ chất</Text>
                      </Pressable>
                    </>
                  )}

                  {/* Số lượng + Đơn vị */}
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
                    <View style={{ minWidth: 156 }}>
                      <Dropdown value={unitManual} options={UNIT_OPTIONS} onChange={v => setUnitManual(v as UnitType)}
                        menuWidth={140}
                        menuMaxHeight={140}
                        menuOffsetY={6}
                      />
                    </View>
                  </View>

                  {/* Loại bữa */}
                  <Text style={styles.blockLabel}>Loại bữa</Text>
                  <View style={{ minWidth: 156 }}>
                    <Dropdown value={mealType} options={MEALTYPE_OPTIONS} onChange={v => setMealType(v as MealType)}
                      menuMaxHeight={140}
                      menuOffsetY={6}
                    />
                  </View>

                  {/* Nguyên liệu */}
                  {showIngredients && (
                    <>
                      <Text style={styles.blockLabel}>Nguyên liệu</Text>

                      {(visibleIngsCount ? ings.slice(0, visibleIngsCount) : ings).map((row, idx) => (
                        <View key={`${row.unit}-${idx}`} style={styles.ingRow}>
                          <TextInput
                            placeholder="Tên nguyên liệu"
                            style={[styles.input, styles.ingName]}
                            placeholderTextColor={PLACEHOLDER_COLOR}
                            selectionColor={C.primary}
                            value={row.name}
                            onFocus={() => setOpenKey(null)}
                            onChangeText={t => { const next = [...ings]; next[idx].name = t; setIngs(next); }}
                          />
                          <View style={{ minWidth: 130 }}>
                            <Dropdown
                              value={row.unit}
                              options={UNIT_OPTIONS}
                              onChange={(u) => { const next = [...ings]; next[idx].unit = u as UnitType; setIngs(next); }}
                              menuWidth={140}
                              menuMaxHeight={140}
                              menuOffsetY={6}
                            />
                          </View>
                          {(showMoreIngs || ings.length === 1) && (
                            <Pressable style={styles.removeBtn} onPress={() => delIng(idx)}>
                              <Text style={{ color: '#ef4444', fontWeight: '700' }}>×</Text>
                            </Pressable>
                          )}
                        </View>
                      ))}

                      {ings.length > 1 && !showMoreIngs && (
                        <Pressable style={styles.ghostBtn} onPress={() => setShowMoreIngs(true)}>
                          <Text style={styles.ghostBtnText}>Hiện thêm {ings.length - 1} nguyên liệu</Text>
                        </Pressable>
                      )}
                      {ings.length > 1 && showMoreIngs && (
                        <Pressable style={styles.ghostBtn} onPress={() => setShowMoreIngs(false)}>
                          <Text style={styles.ghostBtnText}>Ẩn bớt nguyên liệu</Text>
                        </Pressable>
                      )}

                      <Pressable style={styles.ghostBtn} onPress={addIng}>
                        <Text style={styles.ghostBtnText}>+ Thêm nguyên liệu</Text>
                      </Pressable>
                    </>
                  )}

                  <Pressable style={[styles.actionBtn, { marginTop: 18 }]} onPress={() => { setOpenKey(null); }}>
                    <Text style={styles.actionText}>Thêm bữa ăn</Text>
                  </Pressable>
                </View>
              )}

              {/* ========== HISTORY (API) ========== */}
              {tab === 'history' && (
                <View style={{ width: '100%' }}>
                  <Text style={styles.sectionTitle}>LỊCH SỬ BỮA ĂN</Text>

                  {historyLoading ? (
                    <View style={{ paddingVertical: 16 }}>
                      <ActivityIndicator />
                      <Text style={{ textAlign: 'center', color: '#64748b', marginTop: 6 }}>Đang tải...</Text>
                    </View>
                  ) : historyError ? (
                    <View style={{ paddingVertical: 16 }}>
                      <Text style={{ textAlign: 'center', color: '#b91c1c' }}>{historyError}</Text>
                    </View>
                  ) : logs.length === 0 ? (
                    <View style={{ paddingVertical: 16 }}>
                      <Text style={{ textAlign: 'center', color: '#64748b' }}>Chưa có log cho ngày này</Text>
                    </View>
                  ) : (
                    (['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as MealSlot[]).map(slot => {
                      const items = groupedLogs[slot] || [];
                      if (!items.length) return null;
                      return (
                        <View key={slot} style={{ marginBottom: 16 }}>
                          <Text style={styles.groupHeader}>{groupLabel[slot] === 'Tối' ? 'Chiều tối' : groupLabel[slot]}</Text>
                          {items.map((m, i) => (
                            <View key={`${m.id ?? i}`} style={styles.historyCard}>
                              <Text style={styles.mealName}>{(m as any).name ?? 'Món ăn'}</Text>
                              {'kcal' in m || 'calories' in m ? (
                                <Text>
                                  Calo: {(m as any).kcal ?? (m as any).calories ?? '-'} kcal
                                </Text>
                              ) : null}
                              {'proteinG' in m || 'carbG' in m || 'fatG' in m ? (
                                <Text>
                                  Protein: {(m as any).proteinG ?? '-'}g, Carbs: {(m as any).carbG ?? '-'}g, Fat: {(m as any).fatG ?? '-'}g
                                </Text>
                              ) : null}
                              {'quantity' in m || 'unit' in m ? (
                                <Text style={{ marginTop: 2, color: '#334155' }}>
                                  Số lượng: {(m as any).quantity ?? '1'} {(m as any).unit ?? 'phần'}
                                </Text>
                              ) : null}
                              {Array.isArray((m as any).ingredients) && (m as any).ingredients.length ? (
                                <Text style={{ marginTop: 4 }}>
                                  <Text style={{ fontWeight: '700' }}>Nguyên liệu:</Text> {(m as any).ingredients.join(', ')}
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
                      );
                    })
                  )}
                </View>
              )}
            </View>
          )}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          keyboardShouldPersistTaps="always"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          nestedScrollEnabled
          onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => setScrollY(e.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
        />

        {/* Modal Scan source */}
        <Modal visible={scanChoiceOpen} transparent animationType="fade" onRequestClose={() => setScanChoiceOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setScanChoiceOpen(false)}>
            <Pressable style={styles.modalCard} onPress={() => { }}>
              <Text style={styles.sheetTitle}>Chọn nguồn ảnh</Text>
              <Pressable style={styles.modalAction} onPress={handleScanFromCamera}><Text style={styles.modalActionText}>Chụp ảnh (Camera)</Text></Pressable>
              <Pressable style={styles.modalAction} onPress={handleScanFromLibrary}><Text style={styles.modalActionText}>Chọn từ thư viện</Text></Pressable>
              <Pressable style={styles.modalCancel} onPress={() => setScanChoiceOpen(false)}><Text style={styles.modalCancelText}>Hủy</Text></Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Date pickers */}
        {Platform.OS === 'ios' && showPicker && (
          <View style={styles.iosPickerOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => { setShowPicker(false); setOpenKey(null); }} />
            <View style={styles.pickerBox}>
              <DateTimePicker value={date} mode="date" display="inline" themeVariant="light"
                onChange={(_, d) => { if (d) setDate(d); }} />
              <Pressable style={styles.doneBtn} onPress={() => { setShowPicker(false); setOpenKey(null); }}>
                <Text style={{ color: C.onPrimary, fontWeight: '700' }}>Xong</Text>
              </Pressable>
            </View>
          </View>
        )}
        {Platform.OS === 'android' && showPicker && (
          <DateTimePicker value={date} mode="date" display="calendar"
            onChange={(event, d) => { setShowPicker(false); setOpenKey(null); if (event.type === 'set' && d) setDate(d); }} />
        )}
      </Container>
    </KeyboardAvoidingView>
  );
}

/* helpers */
const Tab = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <Pressable onPress={onPress} style={[styles.tabBtn, active && styles.tabBtnActive]}>
    <Text allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail"
      style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconContainer: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  line: { height: 2, backgroundColor: '#e2e8f0', marginVertical: 12 },
  avatarFallback: { width: 52, height: 52, borderRadius: 999, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 999 },
  avatarInitials: { fontWeight: '800', color: C.primary },
  hello: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  name: { color: '#0f172a', fontSize: 16, fontWeight: '800' },
});

/* ====== styles chính ====== */
const styles = StyleSheet.create({
  fullBleed: { marginHorizontal: -16 },
  header: { backgroundColor: 'transparent', paddingTop: 14, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginTop: 0 },
  headerTitle: { color: '#0f172a', fontSize: 20, fontWeight: '800', letterSpacing: 0.1, marginHorizontal: 16 },
  headerSub: { color: '#6b7280', fontSize: 13, marginTop: 2, marginHorizontal: 16 },

  calendarWrap: { alignItems: 'center', marginBottom: 8, paddingTop: 4, paddingBottom: 4 },
  calendarBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: C.primaryBorder, backgroundColor: C.primarySurface },
  calendarText: { fontWeight: '800', color: '#0f172a' },

  scrollContent: { paddingBottom: 0 },
  inner: { paddingHorizontal: 16, paddingTop: 10, alignItems: 'center' },

  tabs: { flexDirection: 'row', alignSelf: 'stretch', alignItems: 'stretch', marginBottom: 16, gap: 8, paddingHorizontal: 16 },
  tabBtn: { flex: 1, height: 40, borderRadius: 999, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  tabBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  tabText: { color: '#0f172a', fontWeight: '800', fontSize: 13, lineHeight: 16, textAlign: 'center' },
  tabTextActive: { color: '#ffffff' },

  card: { width: '100%', backgroundColor: '#ffffff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12, paddingHorizontal: 16 },

  sectionTitle: { textAlign: 'center', fontSize: 18, fontWeight: '900', letterSpacing: 0.2, color: '#0f172a' },
  sectionSub: { textAlign: 'center', color: '#64748b', fontSize: 12, marginTop: 4, marginBottom: 8 },

  input: {
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12,
    height: 44, marginBottom: 8, color: INPUT_TEXT_COLOR, fontSize: 16, lineHeight: 20,
    ...Platform.select({ android: { textAlignVertical: 'center', paddingVertical: 6 }, ios: { paddingVertical: 10 }, default: {} }),
  },
  selectInputLike: { backgroundColor: '#ffffff' },
  inputDisabled: { backgroundColor: '#f1f5f9', opacity: 0.7 },

  selectBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, height: 44, marginBottom: 8 },
  selectBoxLong: { minWidth: 156, height: 46, paddingHorizontal: 14 },

  placeholderText: { color: '#9ca3af' },
  caret: { color: '#6b7280', fontSize: 16 },

  blockLabel: { marginTop: 6, marginBottom: 6, fontWeight: '700', color: '#0f172a' },
  ingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  ingName: { flex: 1 },

  inlineRow: { flexDirection: 'row', alignItems: 'center' },
  flex1: { flex: 1 },

  removeBtn: { width: 40, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fca5a5', backgroundColor: '#ffffff' },

  primaryBtn: { backgroundColor: C.primary, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#10b981', alignSelf: 'stretch', marginTop: 10 },
  primaryText: { color: '#ffffff', fontWeight: '900', letterSpacing: 0.2 },

  actionBtn: { backgroundColor: '#93c5fd', height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#60a5fa', alignSelf: 'stretch', marginTop: 10 },
  actionText: { color: '#0b2149', fontWeight: '900', letterSpacing: 0.2 },

  scanImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#e2e8f0', alignSelf: 'center', marginBottom: 12 },
  scanningBox: { marginTop: 12, alignItems: 'center' },
  scanHint: { marginTop: 6, color: '#6b7280' },

  resultBox: { marginTop: 16, backgroundColor: '#ffffff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#e2e8f0' },
  resultTitleBig: { fontSize: 20, fontWeight: '900', marginBottom: 10, textAlign: 'center', color: '#0f172a' },

  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { color: '#0f172a', fontSize: 15, fontWeight: '700' },
  value: { fontWeight: '700', fontSize: 15, color: '#0f172a' },

  dropdownAnchor: { position: 'relative' },
  dropdownPanel: {
    position: 'absolute', left: 0, right: 0, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, zIndex: 9999,
    ...Platform.select({ android: { elevation: 20 }, ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } } }),
  },

  groupHeader: { fontSize: 16, fontWeight: '700', marginBottom: 8, borderLeftWidth: 4, borderLeftColor: C.primary, paddingLeft: 10, paddingRight: 16 },
  historyCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10, marginHorizontal: 16 },
  mealName: { fontWeight: '700', marginBottom: 4, color: '#0f172a' },
  rowBtns: { flexDirection: 'row', gap: 8, marginTop: 8 },
  badge: { flex: 1, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badgeEditSoft: { backgroundColor: '#bfdbfe' },
  badgeDeleteSoft: { backgroundColor: '#fecaca' },
  badgeTextEdit: { color: '#0b2149', fontWeight: '800' },
  badgeTextDelete: { color: '#7f1d1d', fontWeight: '800' },

  ghostBtn: {
    alignSelf: 'stretch', height: 44, borderRadius: 10, backgroundColor: '#f1f5f9', marginTop: 8, marginBottom: 10,
    borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center',
  },
  ghostBtnText: { color: '#0f172a', fontWeight: '700' },

  summaryBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 6, marginBottom: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  chipText: { color: '#0f172a', fontWeight: '700', fontSize: 12 },

  iosPickerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  pickerBox: { backgroundColor: C.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 8, paddingBottom: 12, borderTopWidth: 1, borderColor: C.border },
  doneBtn: { alignSelf: 'center', marginTop: 8, backgroundColor: C.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },

  sheetTitle: { fontSize: 16, fontWeight: '800', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, color: INPUT_TEXT_COLOR },
  itemRow: { paddingHorizontal: 0, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e2e8f0' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  modalAction: { height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', marginTop: 8 },
  modalActionText: { fontWeight: '800', color: '#0f172a' },
  modalCancel: { height: 46, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ef4444', marginTop: 12 },
  modalCancelText: { fontWeight: '800', color: '#fff' },
});

/**
 * Android: bảo đảm `adjustResize` cho windowSoftInputMode.
 * iOS: đã dùng KeyboardAvoidingView.
 */

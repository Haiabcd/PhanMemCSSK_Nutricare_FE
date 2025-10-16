import React, {
  useRef,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  FlatList,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  RefreshControl,
  Alert,
} from 'react-native';
import Container from '../components/Container';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PlanStackParamList } from '../navigation/PlanNavigator';
import { colors as C } from '../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  launchImageLibrary,
  launchCamera,
  type ImageLibraryOptions,
  type CameraOptions,
} from 'react-native-image-picker';
import Dropdown from '../components/Track/Dropdown';

import DateButton from '../components/Date/DateButton';
import DatePickerSheet from '../components/Date/DatePickerSheet';

import { getLogs, deletePlanLogById } from '../services/log.service';
import type { MealSlot } from '../types/types';
import type { LogResponse } from '../types/log.type';
import AppHeader from '../components/AppHeader'; // ⬅️ Header dùng chung

type TabKey = 'scan' | 'manual' | 'history';
type MealType = 'Sáng' | 'Trưa' | 'Tối' | 'Phụ';

const fmtVNFull = (d: Date) => {
  const dow = [
    'Chủ nhật',
    'Thứ 2',
    'Thứ 3',
    'Thứ 4',
    'Thứ 5',
    'Thứ 6',
    'Thứ 7',
  ][d.getDay()];
  const dd = `${d.getDate()}`.padStart(2, '0');
  const mm = `${d.getMonth() + 1}`.padStart(2, '0');
  return `${dow}, ${dd} Tháng ${mm}`;
};

// YYYY-MM-DD (local) cho BE
const toYMDLocal = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

const INPUT_TEXT_COLOR = '#0f172a';
const PLACEHOLDER_COLOR = '#94a3b8';
const UNITS = [
  'phần',
  'gram',
  'kg',
  'chén',
  'ly',
  'miếng',
  'bát',
  'đĩa',
] as const;
type UnitType = (typeof UNITS)[number];

const UNIT_OPTIONS = UNITS.map(u => ({ label: u, value: u }));
const MEALTYPE_OPTIONS = (['Sáng', 'Trưa', 'Tối', 'Phụ'] as MealType[]).map(
  m => ({ label: m === 'Tối' ? 'Chiều tối' : m, value: m }),
);

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
  qty,
  unit,
  mealType,
  ingCount,
}: {
  qty?: string;
  unit?: string;
  mealType?: string;
  ingCount?: number;
}) => (
  <View style={styles.summaryBar}>
    {qty && unit ? (
      <Chip>
        {qty} {unit}
      </Chip>
    ) : null}
    {mealType ? (
      <Chip>{mealType === 'Tối' ? 'Chiều tối' : mealType}</Chip>
    ) : null}
    {typeof ingCount === 'number' ? <Chip>{ingCount} nguyên liệu</Chip> : null}
  </View>
);

export default function Track() {
  const navigation =
    useNavigation<NativeStackNavigationProp<PlanStackParamList>>();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<any>>(null);

  const [scrollY, setScrollY] = useState(0);
  const [openKey, setOpenKey] = useState<string | null>(null);

  // ==== Date pickers (dùng component riêng) ====
  const [date, setDate] = useState(new Date()); // mặc định hôm nay
  const [openDateSheet, setOpenDateSheet] = useState(false);

  const [showScanCalendar, setShowScanCalendar] = useState(false);
  const [tab, setTab] = useState<TabKey>('scan');
  const onChangeTab = (k: TabKey) => {
    setTab(k);
    setOpenKey(null);
    // đóng các overlay có thể chặn tương tác
    setOpenMealList(false);
    setScanChoiceOpen(false);
    setOpenDateSheet(false);
    requestAnimationFrame(() =>
      listRef.current?.scrollToOffset({ offset: 0, animated: false }),
    );
  };

  // Manual
  const [mealName, setMealName] = useState('');
  const [cal, setCal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
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
  const [ings, setIngs] = useState<{ name: string; unit: UnitType }[]>([
    { name: '', unit: 'gram' },
  ]);
  const addIng = () => {
    setOpenKey(null);
    setIngs(p => [...p, { name: '', unit: 'gram' }]);
  };
  const delIng = (i: number) => {
    setOpenKey(null);
    setIngs(p => p.filter((_, idx) => idx !== i));
  };

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
  const [selectedImageUri, setSelectedImageUri] = useState<string | undefined>(
    undefined,
  );

  // ============== HISTORY (API) ==============
  const [logs, setLogs] = useState<LogResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Tách hàm load lịch sử để dùng lại
  const loadHistory = useCallback(
    async (theDate: Date, signal?: AbortSignal) => {
      try {
        setHistoryLoading(true);
        setHistoryError(null);

        const ymd = toYMDLocal(theDate);
        const slots: MealSlot[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

        const results = await Promise.all(
          slots.map(slot =>
            getLogs(ymd, slot, signal)
              .then(arr => (Array.isArray(arr) ? arr : []))
              .catch(err => {
                console.log(
                  '[HISTORY] getLogs failed for',
                  slot,
                  '-',
                  err?.message ?? err,
                );
                return [];
              }),
          ),
        );

        setLogs(results.flat());
        console.log('[HISTORY] date=', ymd);
      } catch (e: any) {
        setHistoryError(e?.message ?? 'Không thể tải lịch sử');
        setLogs([]);
      } finally {
        setHistoryLoading(false);
      }
    },
    [],
  );

  // Handler xoá 1 log
  const onDeleteLog = useCallback(
    (logId?: string) => {
      if (!logId) return;

      Alert.alert('Xác nhận', 'Bạn muốn xoá mục này?', [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            const ac = new AbortController();

            // Optimistic UI: xoá khỏi UI trước
            setLogs(prev => prev.filter(x => x.id !== logId));

            try {
              await deletePlanLogById(logId, ac.signal);
              // có thể thêm toast thành công tại đây
            } catch (e) {
              // rollback bằng cách tải lại lịch sử
              await loadHistory(date);
            }
          },
        },
      ]);
    },
    [date, loadHistory],
  );

  // Kéo-để-refresh
  const onRefresh = useCallback(async () => {
    const ac = new AbortController();
    setRefreshing(true);
    await loadHistory(date, ac.signal);
    setRefreshing(false);
    return () => ac.abort();
  }, [date, loadHistory]);

  // Gọi khi đổi tab/date
  useEffect(() => {
    if (tab !== 'history') return;
    const ac = new AbortController();
    loadHistory(date, ac.signal);
    return () => ac.abort();
  }, [tab, date, loadHistory]);

  // Gọi lại mỗi khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      if (tab !== 'history') return;
      const ac = new AbortController();
      loadHistory(date, ac.signal);
      return () => ac.abort();
    }, [tab, date, loadHistory]),
  );

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
    setOpenKey(null);
    setShowResult(false);
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setShowResult(true);
    }, 1500);
  };

  const handleScanFromCamera = async () => {
    setScanChoiceOpen(false);
    setOpenKey(null);
    setShowScanCalendar(true);
    const options: CameraOptions = {
      mediaType: 'photo',
      cameraType: 'back',
      saveToPhotos: false,
      quality: 0.9,
    };
    try {
      const res = await launchCamera(options);
      if (res?.didCancel) return;
      const uri = res.assets?.[0]?.uri;
      if (uri) {
        setSelectedImageUri(uri);
        beginFakeScan();
      }
    } catch {
      setShowScanCalendar(false);
    }
  };

  const handleScanFromLibrary = async () => {
    setScanChoiceOpen(false);
    setOpenKey(null);
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.9,
    };
    try {
      const res = await launchImageLibrary(options);
      if (res?.didCancel) {
        setShowScanCalendar(false);
        return;
      }
      const uri = res.assets?.[0]?.uri;
      if (uri) {
        setShowScanCalendar(true);
        setSelectedImageUri(uri);
        beginFakeScan();
      } else setShowScanCalendar(false);
    } catch {
      setShowScanCalendar(false);
    }
  };

  const chooseMeal = (m: {
    name: string;
    cal: number;
    p: number;
    c: number;
    f: number;
  }) => {
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
          <Pressable
            onPress={() => {
              setOpenKey(null);
              setOpenMealList(false);
            }}
            style={[StyleSheet.absoluteFillObject, { zIndex: 1000 }]}
          />
        )}

        {/* Header dùng chung */}
        <AppHeader
          onPressBell={() => {
            setOpenKey(null);
            navigation.navigate('Notification');
          }}
        />
        <View style={[s.line, styles.fullBleed]} />

        {/* Thanh chọn ngày – luôn hiển thị */}
        <View style={[styles.calendarWrap, styles.fullBleed]}>
          <DateButton
            date={date}
            onPress={() => {
              setOpenKey(null);
              setOpenMealList(false);
              setScanChoiceOpen(false);
              setOpenDateSheet(true);
            }}
            formatter={fmtVNFull}
          />
        </View>

        <FlatList
          ref={listRef}
          data={[0]}
          keyExtractor={() => 'screen'}
          renderItem={() => (
            <View style={[styles.inner, styles.fullBleed]}>
              {/* Tabs */}
              <View style={styles.tabs}>
                <Tab
                  label="Scan AI"
                  active={tab === 'scan'}
                  onPress={() => onChangeTab('scan')}
                />
                <Tab
                  label="Nhập thủ công"
                  active={tab === 'manual'}
                  onPress={() => onChangeTab('manual')}
                />
                <Tab
                  label="Xem lịch sử"
                  active={tab === 'history'}
                  onPress={() => onChangeTab('history')}
                />
              </View>

              {/* ========== SCAN ========== */}
              {tab === 'scan' && (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>NHẬP BỮA ĂN BẰNG AI</Text>
                  <Text style={styles.sectionSub}>
                    Chụp ảnh hoặc chọn ảnh món ăn để phân tích nhanh.
                  </Text>

                  <Image
                    source={{
                      uri: selectedImageUri
                        ? selectedImageUri
                        : 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/98fb941f-eb1e-49d6-9c4c-7235d38840a5.png',
                    }}
                    style={styles.scanImage}
                  />

                  <Pressable
                    style={[styles.actionBtn]}
                    onPress={() => setScanChoiceOpen(true)}
                    disabled={isScanning}
                  >
                    {isScanning ? (
                      <ActivityIndicator />
                    ) : (
                      <Text style={styles.actionText}>Quét Scan</Text>
                    )}
                  </Pressable>

                  {isScanning && (
                    <View style={styles.scanningBox}>
                      <Text style={styles.scanHint}>
                        Đang phân tích hình ảnh...
                      </Text>
                    </View>
                  )}

                  {showResult && !isScanning && (
                    <View style={[styles.resultBox]}>
                      <Text style={styles.resultTitleBig}>KẾT QUẢ TỪ AI</Text>

                      <SummaryBar
                        qty={qtyScan}
                        unit={unitScan}
                        mealType={mealType}
                      />

                      <Row label="Tên" value="Bữa ăn từ Scan AI" />
                      <Row label="Calo" value="514 kcal" />

                      {!showScanMacros ? (
                        <Pressable
                          style={styles.ghostBtn}
                          onPress={() => setShowScanMacros(true)}
                        >
                          <Text style={styles.ghostBtnText}>
                            Hiện chi tiết dinh dưỡng (P/C/F)
                          </Text>
                        </Pressable>
                      ) : (
                        <>
                          <Row label="Protein" value="27 g" />
                          <Row label="Carbs" value="35 g" />
                          <Row label="Fat" value="21 g" />
                          <Pressable
                            style={styles.ghostBtn}
                            onPress={() => setShowScanMacros(false)}
                          >
                            <Text style={styles.ghostBtnText}>
                              Ẩn bớt chi tiết
                            </Text>
                          </Pressable>
                        </>
                      )}

                      <Text style={[styles.blockLabel, { marginTop: 12 }]}>
                        Số lượng
                      </Text>
                      <View style={styles.inlineRow}>
                        <TextInput
                          placeholder="1"
                          keyboardType="numeric"
                          style={[
                            styles.input,
                            styles.flex1,
                            { marginRight: 8 },
                          ]}
                          placeholderTextColor={PLACEHOLDER_COLOR}
                          selectionColor={C.primary}
                          value={qtyScan}
                          onFocus={() => setOpenKey(null)}
                          onChangeText={setQtyScan}
                        />
                        <View style={{ minWidth: 156 }}>
                          <Dropdown
                            value={unitScan}
                            options={UNIT_OPTIONS}
                            onChange={v => setUnitScan(v as UnitType)}
                            menuWidth={140}
                            menuMaxHeight={140}
                            menuOffsetY={6}
                          />
                        </View>
                      </View>

                      <Text style={[styles.blockLabel, { marginTop: 12 }]}>
                        Loại bữa
                      </Text>
                      <View style={{ minWidth: 156 }}>
                        <Dropdown
                          value={mealType}
                          options={MEALTYPE_OPTIONS}
                          onChange={v => setMealType(v as MealType)}
                          menuMaxHeight={140}
                          menuOffsetY={6}
                        />
                      </View>

                      <Pressable
                        style={[styles.actionBtn, { marginTop: 18 }]}
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
                  <Text style={styles.sectionTitle}>NHẬP BỮA ĂN THỦ CÔNG</Text>
                  <Text style={styles.sectionSub}>
                    Chọn nhanh từ danh sách hoặc tự nhập thông tin.
                  </Text>

                  <SummaryBar
                    qty={qtyManual}
                    unit={unitManual}
                    mealType={mealType}
                    ingCount={
                      showIngredients
                        ? ings.filter(i => i.name.trim()).length
                        : 0
                    }
                  />

                  {/* Chọn từ danh sách */}
                  <View style={[styles.dropdownAnchor, { zIndex: 50 }]}>
                    <Pressable
                      style={[styles.selectBox, styles.selectBoxLong]}
                      onPress={() => {
                        setOpenKey(null);
                        setOpenDateSheet(false);
                        setOpenMealList(o => !o);
                      }}
                    >
                      <Text style={styles.placeholderText}>
                        Chọn từ danh sách
                      </Text>
                      <Text style={styles.caret}>▾</Text>
                    </Pressable>

                    {openMealList && (
                      <View
                        style={[
                          styles.dropdownPanel,
                          {
                            top: 52,
                            maxHeight: Math.min(
                              Math.round(
                                Dimensions.get('window').height * 0.55,
                              ),
                              380,
                            ),
                          },
                        ]}
                        onStartShouldSetResponderCapture={() => true}
                      >
                        <TextInput
                          placeholder="Tìm món..."
                          style={[
                            styles.input,
                            { marginHorizontal: 0, marginBottom: 8 },
                          ]}
                          placeholderTextColor={PLACEHOLDER_COLOR}
                          selectionColor={C.primary}
                          value={mealSearch}
                          onChangeText={setMealSearch}
                          onFocus={() => setOpenKey(null)}
                        />
                        <FlatList
                          data={filteredMeals}
                          keyExtractor={item => item.name}
                          nestedScrollEnabled
                          keyboardShouldPersistTaps="always"
                          showsVerticalScrollIndicator
                          overScrollMode="never"
                          style={{ maxHeight: 300 }}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              style={[{ height: 46, justifyContent: 'center' }]}
                              onPress={() => {
                                chooseMeal(item);
                              }}
                            >
                              <Text
                                style={{
                                  color: INPUT_TEXT_COLOR,
                                  fontWeight: '600',
                                }}
                              >
                                {item.name}
                              </Text>
                              <Text style={{ color: '#475569' }}>
                                {item.cal} kcal • P{item.p}/C{item.c}/F{item.f}
                              </Text>
                            </TouchableOpacity>
                          )}
                          ListEmptyComponent={
                            <Text>Không tìm thấy món phù hợp</Text>
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
                    onChangeText={t => {
                      setMealName(t);
                      if (t !== '') setMacrosLocked(false);
                    }}
                  />

                  {!showMacroSection ? (
                    <Pressable
                      style={styles.ghostBtn}
                      onPress={() => setShowMacroSection(true)}
                    >
                      <Text style={styles.ghostBtnText}>
                        Nhập calorie & vĩ chất
                      </Text>
                    </Pressable>
                  ) : (
                    <>
                      <TextInput
                        placeholder="Calo (kcal)"
                        style={[
                          styles.input,
                          macrosLocked && styles.inputDisabled,
                        ]}
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
                        style={[
                          styles.input,
                          macrosLocked && styles.inputDisabled,
                        ]}
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
                        style={[
                          styles.input,
                          macrosLocked && styles.inputDisabled,
                        ]}
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
                        style={[
                          styles.input,
                          macrosLocked && styles.inputDisabled,
                        ]}
                        editable={!macrosLocked}
                        keyboardType="numeric"
                        placeholderTextColor={PLACEHOLDER_COLOR}
                        selectionColor={C.primary}
                        value={fat}
                        onFocus={() => setOpenKey(null)}
                        onChangeText={setFat}
                      />
                      <Pressable
                        style={styles.ghostBtn}
                        onPress={() => setShowMacroSection(false)}
                      >
                        <Text style={styles.ghostBtnText}>
                          Ẩn bớt phần vĩ chất
                        </Text>
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
                      <Dropdown
                        value={unitManual}
                        options={UNIT_OPTIONS}
                        onChange={v => setUnitManual(v as UnitType)}
                        menuWidth={140}
                        menuMaxHeight={140}
                        menuOffsetY={6}
                      />
                    </View>
                  </View>

                  {/* Loại bữa */}
                  <Text style={styles.blockLabel}>Loại bữa</Text>
                  <View style={{ minWidth: 156 }}>
                    <Dropdown
                      value={mealType}
                      options={MEALTYPE_OPTIONS}
                      onChange={v => setMealType(v as MealType)}
                      menuMaxHeight={140}
                      menuOffsetY={6}
                    />
                  </View>

                  {/* Nguyên liệu */}
                  {showIngredients && (
                    <>
                      <Text style={styles.blockLabel}>Nguyên liệu</Text>

                      {(visibleIngsCount
                        ? ings.slice(0, visibleIngsCount)
                        : ings
                      ).map((row, idx) => (
                        <View key={`${row.unit}-${idx}`} style={styles.ingRow}>
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
                          <View style={{ minWidth: 130 }}>
                            <Dropdown
                              value={row.unit}
                              options={UNIT_OPTIONS}
                              onChange={u => {
                                const next = [...ings];
                                next[idx].unit = u as UnitType;
                                setIngs(next);
                              }}
                              menuWidth={140}
                              menuMaxHeight={140}
                              menuOffsetY={6}
                            />
                          </View>
                          {(showMoreIngs || ings.length === 1) && (
                            <Pressable
                              style={styles.removeBtn}
                              onPress={() => delIng(idx)}
                            >
                              <Text
                                style={{ color: '#ef4444', fontWeight: '700' }}
                              >
                                ×
                              </Text>
                            </Pressable>
                          )}
                        </View>
                      ))}

                      {ings.length > 1 && !showMoreIngs && (
                        <Pressable
                          style={styles.ghostBtn}
                          onPress={() => setShowMoreIngs(true)}
                        >
                          <Text style={styles.ghostBtnText}>
                            Hiện thêm {ings.length - 1} nguyên liệu
                          </Text>
                        </Pressable>
                      )}
                      {ings.length > 1 && showMoreIngs && (
                        <Pressable
                          style={styles.ghostBtn}
                          onPress={() => setShowMoreIngs(false)}
                        >
                          <Text style={styles.ghostBtnText}>
                            Ẩn bớt nguyên liệu
                          </Text>
                        </Pressable>
                      )}

                      <Pressable style={styles.ghostBtn} onPress={addIng}>
                        <Text style={styles.ghostBtnText}>
                          + Thêm nguyên liệu
                        </Text>
                      </Pressable>
                    </>
                  )}

                  <Pressable
                    style={[styles.actionBtn, { marginTop: 18 }]}
                    onPress={() => {
                      setOpenKey(null);
                    }}
                  >
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
                      <Text
                        style={{
                          textAlign: 'center',
                          color: '#64748b',
                          marginTop: 6,
                        }}
                      >
                        Đang tải...
                      </Text>
                    </View>
                  ) : historyError ? (
                    <View style={{ paddingVertical: 16 }}>
                      <Text style={{ textAlign: 'center', color: '#b91c1c' }}>
                        {historyError}
                      </Text>
                    </View>
                  ) : logs.length === 0 ? (
                    <View style={{ paddingVertical: 16 }}>
                      <Text style={{ textAlign: 'center', color: '#64748b' }}>
                        Chưa có lịch sử ăn cho ngày này
                      </Text>
                    </View>
                  ) : (
                    (
                      ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as MealSlot[]
                    ).map(slot => {
                      const items = groupedLogs[slot] || [];
                      if (!items.length) return null;
                      return (
                        <View key={slot} style={{ marginBottom: 16 }}>
                          <Text style={styles.groupHeader}>
                            {groupLabel[slot] === 'Tối'
                              ? 'Chiều tối'
                              : groupLabel[slot]}
                          </Text>
                          {items.map((m, i) => {
                            const name = m?.food?.name ?? 'Món ăn';
                            const portionText =
                              (m?.portion != null ? String(m.portion) : '1') +
                              ' ' +
                              (m?.food?.servingName || 'phần');
                            const kcal = m?.actualNutrition?.kcal;
                            const p = m?.actualNutrition?.proteinG;
                            const c = m?.actualNutrition?.carbG;
                            const f = m?.actualNutrition?.fatG;

                            return (
                              <View
                                key={`${m.id ?? i}`}
                                style={styles.historyCard}
                              >
                                <Text style={styles.mealName}>{name}</Text>
                                <Text
                                  style={{ color: '#334155', marginBottom: 2 }}
                                >
                                  Số lượng: {portionText}
                                </Text>
                                {kcal != null && (
                                  <Text style={{ marginTop: 2 }}>
                                    Calo: {Math.round(Number(kcal))} kcal
                                  </Text>
                                )}
                                {(p != null || c != null || f != null) && (
                                  <Text>
                                    Protein: {p ?? '-'} g, Carbs: {c ?? '-'} g,
                                    Fat: {f ?? '-'} g
                                  </Text>
                                )}
                                <View style={styles.rowBtns}>
                                  <Pressable
                                    style={[styles.badge, styles.badgeEditSoft]}
                                    onPress={() => setOpenKey(null)}
                                  >
                                    <Text style={styles.badgeTextEdit}>
                                      Sửa
                                    </Text>
                                  </Pressable>
                                  <Pressable
                                    style={[
                                      styles.badge,
                                      styles.badgeDeleteSoft,
                                    ]}
                                    onPress={() => {
                                      setOpenKey(null);
                                      onDeleteLog(m.id);
                                    }}
                                  >
                                    <Text style={styles.badgeTextDelete}>
                                      Xóa
                                    </Text>
                                  </Pressable>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          )}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 20 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          keyboardShouldPersistTaps="always"
          keyboardDismissMode={
            Platform.OS === 'ios' ? 'interactive' : 'on-drag'
          }
          nestedScrollEnabled
          onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
            setScrollY(e.nativeEvent.contentOffset.y)
          }
          scrollEventThrottle={16}
          refreshControl={
            tab === 'history' ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            ) : undefined
          }
        />

        {/* Modal Scan source */}
        <Modal
          visible={scanChoiceOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setScanChoiceOpen(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setScanChoiceOpen(false)}
          >
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text>Chọn nguồn ảnh</Text>
              <Pressable
                style={styles.modalAction}
                onPress={handleScanFromCamera}
              >
                <Text style={styles.modalActionText}>Chụp ảnh (Camera)</Text>
              </Pressable>
              <Pressable
                style={styles.modalAction}
                onPress={handleScanFromLibrary}
              >
                <Text style={styles.modalActionText}>Chọn từ thư viện</Text>
              </Pressable>
              <Pressable
                style={styles.modalCancel}
                onPress={() => setScanChoiceOpen(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Date pickers */}
        <DatePickerSheet
          visible={openDateSheet}
          value={date}
          onClose={() => setOpenDateSheet(false)}
          onChange={d => {
            setDate(d);
            setOpenDateSheet(false);
          }}
        />
      </Container>
    </KeyboardAvoidingView>
  );
}

/* helpers */
const Tab = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={[styles.tabBtn, active && styles.tabBtnActive]}
  >
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
  line: { height: 2, backgroundColor: '#e2e8f0', marginVertical: 12 },
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

  calendarWrap: {
    alignItems: 'center',
    marginBottom: 8,
    paddingTop: 4,
    paddingBottom: 4,
  },

  scrollContent: { paddingBottom: 0 },
  inner: { paddingHorizontal: 16, paddingTop: 10, alignItems: 'center' },

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
  tabBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  tabText: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
  },
  tabTextActive: { color: '#ffffff' },

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

  sectionTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
    color: '#0f172a',
  },
  sectionSub: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },

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
  selectInputLike: { backgroundColor: '#ffffff' },
  inputDisabled: { backgroundColor: '#f1f5f9', opacity: 0.7 },

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
  selectBoxLong: { minWidth: 156, height: 46, paddingHorizontal: 14 },

  placeholderText: { color: '#9ca3af' },
  caret: { color: '#6b7280', fontSize: 16 },

  blockLabel: {
    marginTop: 6,
    marginBottom: 6,
    fontWeight: '700',
    color: '#0f172a',
  },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
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
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
    color: '#0f172a',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: { color: '#0f172a', fontSize: 15, fontWeight: '700' },
  value: { fontWeight: '700', fontSize: 15, color: '#0f172a' },

  dropdownAnchor: { position: 'relative' },
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

  summaryBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipText: { color: '#0f172a', fontWeight: '700', fontSize: 12 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalAction: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    marginTop: 8,
  },
  modalActionText: { fontWeight: '800', color: '#0f172a' },
  modalCancel: {
    height: 46,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    marginTop: 12,
  },
  modalCancelText: { fontWeight: '800', color: '#fff' },
});

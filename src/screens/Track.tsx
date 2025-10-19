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
  NativeSyntheticEvent,
  NativeScrollEvent,
  Modal,
  KeyboardAvoidingView,
  RefreshControl,
  Alert,
  Keyboard,
} from 'react-native';
import Container from '../components/Container';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PlanStackParamList } from '../navigation/PlanNavigator';
import { colors as C } from '../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateButton from '../components/Date/DateButton';
import DatePickerSheet from '../components/Date/DatePickerSheet';
import {
  getLogs,
  deletePlanLogById,
  saveManualLog,
} from '../services/log.service';
import type { MealSlot } from '../types/types';
import type { LogResponse } from '../types/log.type';
import type { FoodResponse, IngredientResponse } from '../types/food.type';
import {
  autocompleteFoods,
  autocompleteIngredients,
} from '../services/food.service';
import AppHeader from '../components/AppHeader';

import Dropdown from '../components/Track/Dropdown';
import {
  launchImageLibrary,
  launchCamera,
  type ImageLibraryOptions,
  type CameraOptions,
} from 'react-native-image-picker';

type TabKey = 'scan' | 'manual' | 'history';

type MealType = 'Sáng' | 'Trưa' | 'Tối' | 'Phụ';
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

// YYYY-MM-DD (local)
const toYMDLocal = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

const INPUT_TEXT_COLOR = '#0f172a';
const PLACEHOLDER_COLOR = '#94a3b8';

/** ===== Autocomplete config ===== */
const AC_ITEM_HEIGHT = 52;
const AC_VISIBLE_ROWS = 4;
const AC_PAGE_SIZE = 12;

/** ===== Helpers ===== */
const safeNum = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const fmtNum = (n: number, digits = 1) =>
  (Math.round(n * 10 ** digits) / 10 ** digits).toString();
const isBlank = (s?: string) => !s || s.trim().length === 0; // <- guard chung

/* ===== Tiny UI helpers for new Scan tab ===== */
const Chip = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.scanChipBox}>
    <Text style={styles.scanChipText}>{children}</Text>
  </View>
);
const SummaryBar = ({
  qty,
  unit,
  mealType,
}: {
  qty?: string;
  unit?: string;
  mealType?: string;
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
  </View>
);
const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.nutRow}>
    <Text style={styles.nutLabel}>{label}:</Text>
    <Text style={styles.nutValue}>{value}</Text>
  </View>
);

export default function Track() {
  const navigation =
    useNavigation<NativeStackNavigationProp<PlanStackParamList>>();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<any>>(null);

  const [openKey, setOpenKey] = useState<string | null>(null);

  // ==== Date pickers ====
  const [date, setDate] = useState(new Date());
  const [openDateSheet, setOpenDateSheet] = useState(false);

  const [tab, setTab] = useState<TabKey>('manual');
  const onChangeTab = (k: TabKey) => {
    setTab(k);
    setOpenKey(null);
    setOpenDateSheet(false);
    requestAnimationFrame(() =>
      listRef.current?.scrollToOffset({ offset: 0, animated: false }),
    );
  };

  // ====== Scan AI state (REWRITTEN) ======
  const [selectedImageUri, setSelectedImageUri] = useState<string | undefined>(
    undefined,
  );
  const [isScanning, setIsScanning] = useState(false);
  const [showScanResult, setShowScanResult] = useState(false);

  const [qtyScan, setQtyScan] = useState<string>('1');
  const [unitScan, setUnitScan] = useState<UnitType>('phần');
  const [mealTypeScan, setMealTypeScan] = useState<MealType>('Sáng');

  const [scanChoiceOpen, setScanChoiceOpen] = useState(false);

  const beginFakeScan = useCallback(() => {
    setOpenKey(null);
    setShowScanResult(false);
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setShowScanResult(true);
      if (!selectedImageUri) {
        setSelectedImageUri(
          'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=300&q=80',
        );
      }
    }, 1500);
  }, [selectedImageUri]);

  const handleScanFromCamera = async () => {
    setScanChoiceOpen(false);
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
    } catch (e) {
      /* noop */
    }
  };

  const handleScanFromLibrary = async () => {
    setScanChoiceOpen(false);
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.9,
    };
    try {
      const res = await launchImageLibrary(options);
      if (res?.didCancel) return;
      const uri = res.assets?.[0]?.uri;
      if (uri) {
        setSelectedImageUri(uri);
        beginFakeScan();
      }
    } catch (e) {
      /* noop */
    }
  };

  // ===== Manual =====
  const mealNameInputRef = useRef<TextInput>(null);
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [mealName, setMealName] = useState<string>('');

  // nutrition (base per 1 serving, from selected food)
  const [baseKcal, setBaseKcal] = useState<number>(0);
  const [baseP, setBaseP] = useState<number>(0);
  const [baseC, setBaseC] = useState<number>(0);
  const [baseF, setBaseF] = useState<number>(0);
  const [baseFiber, setBaseFiber] = useState<number>(0);
  const [baseSodium, setBaseSodium] = useState<number>(0);
  const [baseSugar, setBaseSugar] = useState<number>(0);

  // lock = selected from food list
  const [macrosLocked, setMacrosLocked] = useState<boolean>(false);

  // Qty/Unit for meal (serving)
  const [qtyManual, setQtyManual] = useState<string>('1');
  const [unitManual, setUnitManual] = useState<string>('phần');

  // NEW: meal type for Manual + dropdown open state
  const [mealTypeManual, setMealTypeManual] = useState<MealSlot>('BREAKFAST');
  const [openMealDropdown, setOpenMealDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Autocomplete Food
  const [autoLoading, setAutoLoading] = useState<boolean>(false);
  const [acLoadingMore, setAcLoadingMore] = useState<boolean>(false);
  const [acPage, setAcPage] = useState<number>(1);
  const [acHasMore, setAcHasMore] = useState<boolean>(true);
  const [autoItems, setAutoItems] = useState<FoodResponse[]>([]);
  const acRef = useRef<AbortController | null>(null);
  const skipAcRef = useRef<boolean>(false); // prevent re-trigger

  // Ingredients (dùng trực tiếp IngredientResponse + qty text)
  const [ingredients, setIngredients] = useState<
    (IngredientResponse & { qty: string })[]
  >([]);
  const [openIngSheet, setOpenIngSheet] = useState(false);
  const [ingQuery, setIngQuery] = useState('');
  const [ingLoading, setIngLoading] = useState(false);
  const [ingResults, setIngResults] = useState<IngredientResponse[]>([]);

  // ===== Số khẩu phần đã ăn (hệ số nhân) =====
  const [consumedServings, setConsumedServings] = useState<string>('1');
  const consumedNum = useMemo(() => {
    const n = Number(consumedServings);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [consumedServings]);

  // ===== Food autocomplete effect =====
  useEffect(() => {
    if (skipAcRef.current) {
      skipAcRef.current = false;
      setAutoItems([]);
      setAutoLoading(false);
      return;
    }

    const q = mealName ?? '';
    setAcPage(1);
    setAcHasMore(true);

    // guard: rỗng/toàn space => không gọi API, clear UI
    if (isBlank(q)) {
      acRef.current?.abort?.();
      setAutoItems([]);
      setAutoLoading(false);
      return;
    }

    setAutoLoading(true);
    acRef.current?.abort?.();
    const ac = new AbortController();
    acRef.current = ac;

    const t = setTimeout(async () => {
      try {
        const data = await autocompleteFoods(q.trim(), AC_PAGE_SIZE, ac.signal);
        const list = Array.isArray(data) ? data : [];
        setAutoItems(list);
        setAcHasMore(list.length >= AC_PAGE_SIZE);
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          setAutoItems([]);
          setAcHasMore(false);
        }
      } finally {
        setAutoLoading(false);
      }
    }, 220);

    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [mealName]);

  const loadMoreAuto = useCallback(async () => {
    if (autoLoading || acLoadingMore || !acHasMore) return;
    const q = mealName ?? '';
    if (isBlank(q)) return; // guard

    try {
      setAcLoadingMore(true);
      const nextPage = acPage + 1;
      const data = await autocompleteFoods(
        q.trim(),
        nextPage * AC_PAGE_SIZE,
        undefined,
      );
      const list = Array.isArray(data) ? data : [];
      setAutoItems(list);
      setAcPage(nextPage);
      setAcHasMore(list.length >= nextPage * AC_PAGE_SIZE);
    } catch {
      setAcHasMore(false);
    } finally {
      setAcLoadingMore(false);
    }
  }, [autoLoading, acLoadingMore, acHasMore, acPage, mealName]);

  const getThumb = (f?: { imageUrl?: string }) =>
    f?.imageUrl ||
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=300&q=80';

  // When user selects a food from list (single tap)
  const onSelectFood = useCallback((item: FoodResponse) => {
    skipAcRef.current = true;

    setMealName(item.name);
    setSelectedFoodId(String(item.id));
    setAutoItems([]);
    setAutoLoading(false);

    // base per serving
    const n = item.nutrition as any;
    setBaseKcal(safeNum(n?.kcal));
    setBaseP(safeNum(n?.proteinG));
    setBaseC(safeNum(n?.carbG));
    setBaseF(safeNum(n?.fatG));
    setBaseFiber(safeNum(n?.fiberG));
    setBaseSodium(safeNum(n?.sodiumMg));
    setBaseSugar(safeNum(n?.sugarMg));

    // lock editing & set qty/unit
    setQtyManual(
      item.defaultServing != null ? String(item.defaultServing) : '1',
    );
    setUnitManual((item.servingName as string) || 'phần');
    setMacrosLocked(true);

    // blur input & close keyboard
    mealNameInputRef.current?.blur();
    Keyboard.dismiss();
  }, []);

  /** ======= HISTORY (API) giữ nguyên ======= */
  const [logs, setLogs] = useState<LogResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const cancelAutocomplete = useCallback(() => {
    acRef.current?.abort();
    setAutoLoading(false);
    setAcLoadingMore(false);
    setAutoItems([]);
  }, []);

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
              .catch(() => []),
          ),
        );

        console.log('Loaded logs for', results);

        setLogs(results.flat());
      } catch (e: any) {
        setHistoryError(e?.message ?? 'Không thể tải lịch sử');
        setLogs([]);
      } finally {
        setHistoryLoading(false);
      }
    },
    [],
  );

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
            setLogs(prev => prev.filter(x => x.id !== logId));
            try {
              await deletePlanLogById(logId, ac.signal);
            } catch {
              await loadHistory(date);
            }
          },
        },
      ]);
    },
    [date, loadHistory],
  );

  const onRefresh = useCallback(async () => {
    const ac = new AbortController();
    setRefreshing(true);
    await loadHistory(date, ac.signal);
    setRefreshing(false);
    return () => ac.abort();
  }, [date, loadHistory]);

  useEffect(() => {
    if (tab !== 'history') return;
    const ac = new AbortController();
    loadHistory(date, ac.signal);
    return () => ac.abort();
  }, [tab, date, loadHistory]);

  useFocusEffect(
    useCallback(() => {
      if (tab !== 'history') return;
      const ac = new AbortController();
      loadHistory(date, ac.signal);
      return () => ac.abort();
    }, [tab, date, loadHistory]),
  );

  const groupLabel: Record<MealSlot, string> = {
    BREAKFAST: 'Sáng',
    LUNCH: 'Trưa',
    DINNER: 'Chiều',
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

  // ======== Nutrition totals ========
  // 1) Tổng từ món ăn (nếu đã chọn)
  const qtyNum = useMemo(() => {
    const n = Number(qtyManual);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [qtyManual]);

  const foodTotal = useMemo(() => {
    if (!macrosLocked) {
      return {
        kcal: 0,
        proteinG: 0,
        carbG: 0,
        fatG: 0,
        fiberG: 0,
        sodiumMg: 0,
        sugarMg: 0,
      };
    }
    return {
      kcal: baseKcal * qtyNum,
      proteinG: baseP * qtyNum,
      carbG: baseC * qtyNum,
      fatG: baseF * qtyNum,
      fiberG: baseFiber * qtyNum,
      sodiumMg: baseSodium * qtyNum,
      sugarMg: baseSugar * qtyNum,
    };
  }, [
    macrosLocked,
    baseKcal,
    baseP,
    baseC,
    baseF,
    baseFiber,
    baseSodium,
    baseSugar,
    qtyNum,
  ]);

  // 2) Tổng từ các nguyên liệu (per100 * qty/100)
  const ingredientsTotal = useMemo(() => {
    const sum = {
      kcal: 0,
      proteinG: 0,
      carbG: 0,
      fatG: 0,
      fiberG: 0,
      sodiumMg: 0,
      sugarMg: 0,
    };
    for (const ing of ingredients) {
      const qty = Number(ing.qty);
      const ratio = Number.isFinite(qty) && qty > 0 ? qty / 100 : 0;
      sum.kcal += safeNum(ing.per100?.kcal) * ratio;
      sum.proteinG += safeNum(ing.per100?.proteinG) * ratio;
      sum.carbG += safeNum(ing.per100?.carbG) * ratio;
      sum.fatG += safeNum(ing.per100?.fatG) * ratio;
      sum.fiberG += safeNum(ing.per100?.fiberG) * ratio;
      sum.sodiumMg += safeNum(ing.per100?.sodiumMg) * ratio;
      sum.sugarMg += safeNum(ing.per100?.sugarMg) * ratio;
    }
    return sum;
  }, [ingredients]);

  // 3) Tổng món (Food + Ingredients) trước khi nhân khẩu phần đã ăn
  const totalNutrition = useMemo(() => {
    return {
      kcal: foodTotal.kcal + ingredientsTotal.kcal,
      proteinG: foodTotal.proteinG + ingredientsTotal.proteinG,
      carbG: foodTotal.carbG + ingredientsTotal.carbG,
      fatG: foodTotal.fatG + ingredientsTotal.fatG,
      fiberG: foodTotal.fiberG + ingredientsTotal.fiberG,
      sodiumMg: foodTotal.sodiumMg + ingredientsTotal.sodiumMg,
      sugarMg: foodTotal.sugarMg + ingredientsTotal.sugarMg,
    };
  }, [foodTotal, ingredientsTotal]);

  // 4) Tổng ĐÃ ĂN = tổng món * số khẩu phần đã ăn (0.5, 1, 2, ...)
  const eatenNutrition = useMemo(() => {
    return {
      kcal: totalNutrition.kcal * consumedNum,
      proteinG: totalNutrition.proteinG * consumedNum,
      carbG: totalNutrition.carbG * consumedNum,
      fatG: totalNutrition.fatG * consumedNum,
      fiberG: totalNutrition.fiberG * consumedNum,
      sodiumMg: totalNutrition.sodiumMg * consumedNum,
      sugarMg: totalNutrition.sugarMg * consumedNum,
    };
  }, [totalNutrition, consumedNum]);

  // ===== Load search results for Ingredient sheet =====
  useEffect(() => {
    if (!openIngSheet) return;
    const q = ingQuery ?? '';

    // guard: rỗng/toàn space => clear & không gọi API
    if (isBlank(q)) {
      setIngResults([]);
      setIngLoading(false);
      return;
    }

    const ac = new AbortController();
    setIngLoading(true);
    const t = setTimeout(async () => {
      try {
        const list = await autocompleteIngredients(q.trim(), 20, ac.signal);
        setIngResults(Array.isArray(list) ? list : []);
      } catch {
      } finally {
        setIngLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [openIngSheet, ingQuery]);

  const handleAddMeal = useCallback(async () => {
    try {
      setSubmitting(true);
      const payload = {
        date: toYMDLocal(date), // YYYY-MM-DD
        mealSlot: mealTypeManual,
        foodId: macrosLocked ? selectedFoodId : null,
        nameFood: mealName?.trim() || (macrosLocked ? '' : 'Món tự nhập'),
        consumedServings: Number(consumedServings) || 1,
        totalNutrition: {
          kcal: Math.round(eatenNutrition.kcal),
          proteinG: Number(fmtNum(eatenNutrition.proteinG)),
          carbG: Number(fmtNum(eatenNutrition.carbG)),
          fatG: Number(fmtNum(eatenNutrition.fatG)),
          fiberG: Number(fmtNum(eatenNutrition.fiberG)),
          sodiumMg: Math.round(eatenNutrition.sodiumMg),
          sugarMg: Math.round(eatenNutrition.sugarMg),
        },
        ingredients: ingredients.map(it => ({
          id: String(it.id),
          qty: Number(it.qty) || 0,
        })),
      } as const;

      const ac = new AbortController();
      await saveManualLog(payload, ac.signal);

      Alert.alert('Thành công', 'Tạo log thủ công thành công');

      setSelectedFoodId(null);
      setMealName('');
      setMacrosLocked(false);
      setBaseKcal(0);
      setBaseP(0);
      setBaseC(0);
      setBaseF(0);
      setBaseFiber(0);
      setBaseSodium(0);
      setBaseSugar(0);
      setQtyManual('1');
      setUnitManual('phần');
      setMealTypeManual('BREAKFAST');
      setIngredients([]);
      setConsumedServings('1');
      setOpenMealDropdown(false);
      cancelAutocomplete();
      setOpenKey(null);
      if (tab === 'history') {
        await loadHistory(date);
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể lưu bữa ăn');
    } finally {
      setSubmitting(false);
    }
  }, [
    date,
    mealTypeManual,
    macrosLocked,
    selectedFoodId,
    mealName,
    consumedServings,
    eatenNutrition,
    ingredients,
    tab,
    loadHistory,
    cancelAutocomplete,
  ]);

  /* ===== UI ===== */
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 80}
    >
      <Container>
        {/* Header */}
        <AppHeader
          onPressBell={() => {
            setOpenKey(null);
            navigation.navigate('Notification');
          }}
        />
        <View style={[s.line, styles.fullBleed]} />

        {/* Date line */}
        <View style={[styles.calendarWrap, styles.fullBleed]}>
          <DateButton
            date={date}
            onPress={() => {
              setOpenKey(null);
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

              {/* ========== SCAN (REPLACED) ========== */}
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
                      <Text style={{ marginTop: 6, color: '#6b7280' }}>
                        Đang phân tích hình ảnh...
                      </Text>
                    </View>
                  )}

                  {showScanResult && !isScanning && (
                    <View
                      style={[styles.nutTable, { marginTop: 12, padding: 14 }]}
                    >
                      <Text
                        style={{
                          fontWeight: '900',
                          fontSize: 18,
                          color: '#0f172a',
                          textAlign: 'center',
                          marginBottom: 8,
                        }}
                      >
                        KẾT QUẢ TỪ AI
                      </Text>

                      <SummaryBar
                        qty={qtyScan}
                        unit={unitScan}
                        mealType={mealTypeScan}
                      />

                      <Row label="Tên" value="Bữa ăn từ Scan AI" />
                      <Row label="Calo" value="514 kcal" />

                      {/* (toggle more) */}
                      <View style={{ marginTop: 4 }}>
                        <Row label="Protein" value="27 g" />
                        <Row label="Carbs" value="35 g" />
                        <Row label="Fat" value="21 g" />
                      </View>

                      {/* Số lượng & đơn vị */}
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

                      {/* Loại bữa */}
                      <Text style={[styles.blockLabel, { marginTop: 12 }]}>
                        Loại bữa
                      </Text>
                      <View style={{ minWidth: 156 }}>
                        <Dropdown
                          value={mealTypeScan}
                          options={MEALTYPE_OPTIONS}
                          onChange={v => setMealTypeScan(v as MealType)}
                          menuMaxHeight={140}
                          menuOffsetY={6}
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
                  <Text style={styles.sectionTitle}>NHẬP BỮA ĂN THỦ CÔNG</Text>
                  <Text style={styles.sectionSub}>
                    Chọn nhanh từ danh sách hoặc thêm nguyên liệu riêng.
                  </Text>

                  {/* Name + Autocomplete Food */}
                  <View style={{ position: 'relative' }}>
                    <TextInput
                      ref={mealNameInputRef}
                      placeholder="Nhập tên bữa ăn (tùy chọn)"
                      style={styles.input}
                      placeholderTextColor={PLACEHOLDER_COLOR}
                      selectionColor={C.primary}
                      value={mealName}
                      onFocus={() => setOpenKey(null)}
                      onChangeText={(t: string) => {
                        setMealName(t);
                        if (isBlank(t)) {
                          acRef.current?.abort?.();
                          setAutoItems([]);
                          setAutoLoading(false);
                        } else {
                          setMacrosLocked(false);
                          setSelectedFoodId(null);
                        }
                      }}
                      onBlur={cancelAutocomplete}
                      editable={true}
                    />

                    {(autoLoading ||
                      (!isBlank(mealName) && autoItems.length > 0)) && (
                      <View
                        style={[
                          styles.dropdownPanel,
                          {
                            top: 52,
                            height: AC_ITEM_HEIGHT * AC_VISIBLE_ROWS + 2,
                            paddingVertical: 6,
                            overflow: 'hidden',
                          },
                        ]}
                      >
                        {autoLoading && autoItems.length === 0 ? (
                          <View
                            style={{ paddingVertical: 8, alignItems: 'center' }}
                          >
                            <ActivityIndicator />
                          </View>
                        ) : (
                          <FlatList
                            keyboardShouldPersistTaps="always"
                            style={{ flexGrow: 0 }}
                            data={autoItems}
                            keyExtractor={(it: FoodResponse) => String(it.id)}
                            renderItem={({ item }: { item: FoodResponse }) => (
                              <Pressable
                                onPress={() => onSelectFood(item)}
                                style={styles.acItem}
                              >
                                <Image
                                  source={{ uri: getThumb(item) }}
                                  style={styles.acThumb}
                                />
                                <Text numberOfLines={1} style={styles.acName}>
                                  {item.name}
                                </Text>
                              </Pressable>
                            )}
                            ItemSeparatorComponent={() => (
                              <View style={styles.acSep} />
                            )}
                            onEndReachedThreshold={0.3}
                            onEndReached={loadMoreAuto}
                            ListFooterComponent={
                              acHasMore ? (
                                <View
                                  style={{
                                    paddingVertical: 8,
                                    alignItems: 'center',
                                  }}
                                >
                                  {acLoadingMore ? (
                                    <ActivityIndicator />
                                  ) : (
                                    <Text style={{ color: '#64748b' }}>
                                      Kéo để tải thêm…
                                    </Text>
                                  )}
                                </View>
                              ) : null
                            }
                          />
                        )}
                      </View>
                    )}
                  </View>

                  {/* ===== NEW: Combobox chọn bữa (Manual) ===== */}
                  <View style={{ marginTop: 6 }}>
                    <Text style={styles.blockLabel}>Loại bữa</Text>
                    <View style={{ position: 'relative' }}>
                      <Pressable
                        onPress={() => setOpenMealDropdown(v => !v)}
                        style={[styles.input, { justifyContent: 'center' }]}
                      >
                        <Text style={{ color: INPUT_TEXT_COLOR, fontSize: 16 }}>
                          {mealTypeManual === 'BREAKFAST'
                            ? 'Sáng'
                            : mealTypeManual === 'LUNCH'
                            ? 'Trưa'
                            : mealTypeManual === 'DINNER'
                            ? 'Chiều'
                            : 'Phụ'}
                        </Text>
                        <Text style={styles.dropdownCaret}>▾</Text>
                      </Pressable>

                      {openMealDropdown && (
                        <View
                          style={[
                            styles.dropdownPanel,
                            { top: 52, paddingVertical: 4 },
                          ]}
                        >
                          {(
                            [
                              { k: 'BREAKFAST', label: 'Sáng' },
                              { k: 'LUNCH', label: 'Trưa' },
                              { k: 'DINNER', label: 'Chiều' },
                              { k: 'SNACK', label: 'Phụ' },
                            ] as { k: MealSlot; label: string }[]
                          ).map(opt => {
                            const active = mealTypeManual === opt.k;
                            return (
                              <Pressable
                                key={opt.k}
                                onPress={() => {
                                  setMealTypeManual(opt.k);
                                  setOpenMealDropdown(false);
                                }}
                                style={[
                                  styles.acItem,
                                  { height: 44, gap: 0, paddingHorizontal: 12 },
                                ]}
                              >
                                <Text
                                  style={{
                                    fontWeight: active ? '800' : '600',
                                    color: active ? C.primary : '#0f172a',
                                  }}
                                >
                                  {opt.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  </View>

                  {/* ===== Nguyên liệu ===== */}
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.blockLabel}>Nguyên liệu</Text>

                    {ingredients.length === 0 ? (
                      <Text style={{ color: '#64748b', marginBottom: 8 }}>
                        Thêm từng nguyên liệu (mặc định 100g/ml) để mô tả món tự
                        do.
                      </Text>
                    ) : (
                      ingredients.map((it, idx) => (
                        <View
                          key={it.id + idx}
                          style={[styles.inlineRow, { marginBottom: 6 }]}
                        >
                          <Image
                            source={{ uri: getThumb(it) }}
                            style={[styles.acThumb, { marginRight: 8 }]}
                          />
                          <Text
                            style={{
                              flex: 1,
                              fontWeight: '600',
                              color: '#0f172a',
                            }}
                            numberOfLines={1}
                          >
                            {it.name}
                          </Text>

                          {/* số lượng (gram/ml) */}
                          <TextInput
                            style={[
                              styles.input,
                              { width: 80, marginRight: 8 },
                            ]}
                            keyboardType="numeric"
                            value={it.qty}
                            onChangeText={t =>
                              setIngredients(prev =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, qty: t } : x,
                                ),
                              )
                            }
                          />

                          {/* đơn vị cố định từ DB */}
                          <Text
                            style={{
                              minWidth: 40,
                              color: '#0f172a',
                              fontWeight: '600',
                              textAlign: 'right',
                            }}
                          >
                            {it.unit}
                          </Text>

                          {/* Xóa */}
                          <Pressable
                            onPress={() =>
                              setIngredients(prev =>
                                prev.filter((_, i) => i !== idx),
                              )
                            }
                            style={{
                              marginLeft: 8,
                              paddingHorizontal: 10,
                              height: 44,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text
                              style={{ color: '#b91c1c', fontWeight: '800' }}
                            >
                              X
                            </Text>
                          </Pressable>
                        </View>
                      ))
                    )}

                    <Pressable
                      onPress={() => {
                        setOpenIngSheet(true);
                        setIngQuery('');
                        setIngResults([]);
                      }}
                      style={[
                        styles.actionBtn,
                        {
                          height: 42,
                          backgroundColor: '#e0f2fe',
                          borderColor: '#7dd3fc',
                          marginTop: 4,
                        },
                      ]}
                    >
                      <Text style={{ color: '#0c4a6e', fontWeight: '900' }}>
                        + Thêm nguyên liệu
                      </Text>
                    </Pressable>
                  </View>

                  {/* ===== Số khẩu phần đã ăn (hệ số nhân) ===== */}
                  <Text style={[styles.blockLabel, { marginTop: 10 }]}>
                    Bạn đã ăn bao nhiêu?
                  </Text>
                  <View style={styles.inlineRow}>
                    <TextInput
                      placeholder="1 (có thể 0.5, 2...)"
                      keyboardType="numeric"
                      style={[styles.input, styles.flex1]}
                      placeholderTextColor={PLACEHOLDER_COLOR}
                      selectionColor={C.primary}
                      value={consumedServings}
                      onChangeText={(t: string) => setConsumedServings(t)}
                    />
                    {macrosLocked ? (
                      <Text
                        style={{
                          color: '#0f172a',
                          fontSize: 16,
                          marginLeft: 16,
                        }}
                      >
                        {unitManual || 'phần'}
                      </Text>
                    ) : (
                      <Text
                        style={{
                          color: '#0f172a',
                          fontSize: 16,
                          marginLeft: 16,
                        }}
                      >
                        khẩu phần đã ăn
                      </Text>
                    )}
                  </View>

                  {/* Nutrition (READ-ONLY) */}
                  <Text style={[styles.blockLabel, { marginTop: 10 }]}>
                    Dinh dưỡng (tính tổng đã ăn)
                  </Text>

                  {/* Tổng món (chưa nhân) */}
                  <View style={styles.nutTable}>
                    <Text
                      style={{
                        fontWeight: '800',
                        marginBottom: 4,
                        color: '#0f172a',
                      }}
                    >
                      Tổng cho món (chưa nhân khẩu phần đã ăn)
                    </Text>
                    <Row
                      label="Calo"
                      value={`${fmtNum(totalNutrition.kcal, 0)} kcal`}
                    />
                    <Row
                      label="Protein"
                      value={`${fmtNum(totalNutrition.proteinG)} g`}
                    />
                    <Row
                      label="Carbs"
                      value={`${fmtNum(totalNutrition.carbG)} g`}
                    />
                    <Row
                      label="Fat"
                      value={`${fmtNum(totalNutrition.fatG)} g`}
                    />
                    <Row
                      label="Chất xơ"
                      value={`${fmtNum(totalNutrition.fiberG)} g`}
                    />
                    <Row
                      label="Natri"
                      value={`${fmtNum(totalNutrition.sodiumMg, 0)} mg`}
                    />
                    <Row
                      label="Đường"
                      value={`${fmtNum(totalNutrition.sugarMg, 0)} mg`}
                    />
                  </View>

                  {/* Tổng ĐÃ ĂN */}
                  <View style={[styles.nutTable, { marginTop: 6 }]}>
                    <Text
                      style={{
                        fontWeight: '800',
                        marginBottom: 4,
                        color: '#0f172a',
                      }}
                    >
                      Tổng dinh dưỡng bạn đã ăn (x{fmtNum(consumedNum, 2)})
                    </Text>
                    <Row
                      label="Calo"
                      value={`${fmtNum(eatenNutrition.kcal, 0)} kcal`}
                    />
                    <Row
                      label="Protein"
                      value={`${fmtNum(eatenNutrition.proteinG)} g`}
                    />
                    <Row
                      label="Carbs"
                      value={`${fmtNum(eatenNutrition.carbG)} g`}
                    />
                    <Row
                      label="Fat"
                      value={`${fmtNum(eatenNutrition.fatG)} g`}
                    />
                    <Row
                      label="Chất xơ"
                      value={`${fmtNum(eatenNutrition.fiberG)} g`}
                    />
                    <Row
                      label="Natri"
                      value={`${fmtNum(eatenNutrition.sodiumMg, 0)} mg`}
                    />
                    <Row
                      label="Đường"
                      value={`${fmtNum(eatenNutrition.sugarMg, 0)} mg`}
                    />
                  </View>

                  {/* Nút hành động */}
                  <Pressable
                    style={[
                      styles.actionBtn,
                      { marginTop: 14, opacity: submitting ? 0.7 : 1 },
                    ]}
                    onPress={handleAddMeal}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator />
                    ) : (
                      <Text style={styles.actionText}>Thêm bữa ăn</Text>
                    )}
                  </Pressable>
                </View>
              )}

              {/* ========== HISTORY ========== */}
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
                            {groupLabel[slot] === 'Chiều'
                              ? 'Chiều tối'
                              : groupLabel[slot]}
                          </Text>
                          {items.map((m, i) => {
                            const name = m?.food?.name ?? m.nameFood;
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
          onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
            /* no-op */
          }}
          scrollEventThrottle={16}
          refreshControl={
            tab === 'history' ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            ) : undefined
          }
        />

        {/* Date picker */}
        <DatePickerSheet
          visible={openDateSheet}
          value={date}
          onClose={() => setOpenDateSheet(false)}
          onChange={(d: Date) => {
            setDate(d);
            setOpenDateSheet(false);
          }}
        />

        {/* ===== Modal chọn nguồn ảnh cho Scan ===== */}
        <Modal
          visible={scanChoiceOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setScanChoiceOpen(false)}
          statusBarTranslucent
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setScanChoiceOpen(false)}
          >
            <Pressable style={styles.modalCard}>
              <Text style={styles.sheetTitle}>Chọn nguồn ảnh</Text>
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

        {/* ===== Modal chọn nguyên liệu ===== */}
        <Modal
          visible={openIngSheet}
          transparent
          animationType="fade"
          onRequestClose={() => setOpenIngSheet(false)}
          statusBarTranslucent
        >
          {/* Root container để tránh "giật" layout */}
          <View style={styles.modalRoot}>
            {/* Backdrop (để đóng) */}
            <Pressable
              style={styles.backdrop}
              onPress={() => setOpenIngSheet(false)}
            />

            {/* Bottom sheet */}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 40}
              style={styles.sheetWrap}
            >
              <View
                style={[styles.sheet, { paddingBottom: 12 + insets.bottom }]}
              >
                {/* Header sheet */}
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Chọn nguyên liệu</Text>
                  <Pressable
                    onPress={() => setOpenIngSheet(false)}
                    hitSlop={10}
                  >
                    <Text style={styles.sheetClose}>Đóng</Text>
                  </Pressable>
                </View>

                {/* Input tìm */}
                <TextInput
                  placeholder="Nhập tên nguyên liệu"
                  style={styles.input}
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  value={ingQuery}
                  onChangeText={setIngQuery}
                  autoFocus
                />

                {/* Kết quả */}
                {ingLoading ? (
                  <ActivityIndicator />
                ) : (
                  <FlatList
                    keyboardShouldPersistTaps="always"
                    data={ingResults}
                    keyExtractor={(it: IngredientResponse) => String(it.id)}
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => {
                          setIngredients(prev => [
                            ...prev,
                            {
                              ...item,
                              qty: '100', // mặc định 100g/ml
                            },
                          ]);
                          setOpenIngSheet(false);
                          setIngQuery('');
                          setIngResults([]);
                        }}
                        style={styles.acItem}
                      >
                        <Image
                          source={{ uri: getThumb(item) }}
                          style={styles.acThumb}
                        />
                        <View style={{ flex: 1 }}>
                          <Text numberOfLines={1} style={styles.acName}>
                            {item.name}
                          </Text>
                          <Text style={{ color: '#64748b', fontSize: 12 }}>
                            {item.unit} • per 100:{' '}
                            {fmtNum(safeNum(item.per100?.kcal), 0)} kcal
                          </Text>
                        </View>
                      </Pressable>
                    )}
                    ItemSeparatorComponent={() => <View style={styles.acSep} />}
                  />
                )}

                {/* Nút Hủy (nếu không chọn) */}
                <Pressable
                  onPress={() => setOpenIngSheet(false)}
                  style={[
                    styles.actionBtn,
                    {
                      marginTop: 10,
                      backgroundColor: '#f1f5f9',
                      borderColor: '#e2e8f0',
                    },
                  ]}
                >
                  <Text style={{ color: '#0f172a', fontWeight: '900' }}>
                    Hủy
                  </Text>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
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

/* ====== styles header ====== */
const s = StyleSheet.create({
  line: { height: 2, backgroundColor: '#e2e8f0', marginVertical: 12 },
});

/* ====== styles chính ====== */
const styles = StyleSheet.create({
  fullBleed: { marginHorizontal: -16 },

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
  inputDisabled: { backgroundColor: '#f1f5f9', opacity: 0.7 },

  blockLabel: {
    marginTop: 6,
    marginBottom: 6,
    fontWeight: '700',
    color: '#0f172a',
  },

  inlineRow: { flexDirection: 'row', alignItems: 'center' },
  flex1: { flex: 1 },

  actionBtn: {
    backgroundColor: '#93c5fd',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#60a5fa',
    alignSelf: 'stretch',
  },
  actionText: { color: '#0b2149', fontWeight: '900', letterSpacing: 0.2 },

  // autocomplete & sheet list item
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
  acItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 10,
    height: AC_ITEM_HEIGHT,
  },
  acThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  acName: { flex: 1, color: '#0f172a', fontWeight: '600' },
  acSep: { height: 1, backgroundColor: '#eef2f7', marginLeft: 58 },

  // nutrition
  nutTable: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f9fafb',
    marginTop: 6,
    marginBottom: 6,
  },
  nutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  nutLabel: { color: '#0f172a', fontWeight: '700' },
  nutValue: { color: '#0f172a', fontWeight: '700' },

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

  // ===== modal styles =====
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 12,
    maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetTitle: { fontWeight: '800', fontSize: 16, color: '#0f172a' },
  sheetClose: { color: C.primary, fontWeight: '800' },

  // ===== Scan styles bổ sung =====
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
  scanChipBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scanChipText: { color: '#0f172a', fontWeight: '700', fontSize: 12 },
  summaryBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 8,
  },

  // caret cho combobox
  dropdownCaret: {
    position: 'absolute',
    right: 12,
    top: 10,
    fontSize: 20,
    color: '#64748b',
  },

  // Modal for scan source
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

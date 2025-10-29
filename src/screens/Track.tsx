import React, {
  useRef,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from 'react';
import {
  View as RNView,
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
  Keyboard,
} from 'react-native';
import Container from '../components/Container';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateButton from '../components/Date/DateButton';
import DatePickerSheet from '../components/Date/DatePickerSheet';
import {
  getLogs,
  deletePlanLogById,
  saveManualLog,
  saveScanLog,
  analyzeNutritionFromImage,
  updatePlanLog,
} from '../services/log.service';
import type { MealSlot } from '../types/types';
import type {
  LogResponse,
  PlanLogUpdateRequest,
  KcalWarningResponse,
  NutritionAudit,
  PlanLogScanRequest,
} from '../types/log.type';
import type { FoodResponse, IngredientResponse } from '../types/food.type';
import { autocompleteFoods } from '../services/food.service';
import AppHeader from '../components/AppHeader';
import {
  launchImageLibrary,
  launchCamera,
  type ImageLibraryOptions,
  type CameraOptions,
} from 'react-native-image-picker';
import Text from '../components/TextComponent';
import V from '../components/ViewComponent';
import ConfirmSheet from '../components/Modals/ConfirmSheet';
import AlertSheet from '../components/Modals/AlertSheet';
import useKeyboardHeight from '../hooks/useKeyboardHeight';
import { safeNum, fmtNum, isBlank } from '../helpers/number.helper';
import { toYMDLocal, fmtVNFull } from '../helpers/date.helper';
import MealTypePicker from '../components/Track/MealTypePicker';
import NutritionTable from '../components/Track/NutritionTable';
import IngredientRow from '../components/Track/IngredientRow';
import IngredientPickerSheet from '../components/Track/IngredientPickerSheet';
import useNutritionTotals from '../hooks/useNutritionTotals';
import { toneToColor } from '../helpers/track.helper';

type TabKey = 'scan' | 'manual' | 'history';
const INPUT_TEXT_COLOR = colors.text;
const PLACEHOLDER_COLOR = '#94a3b8';
const AC_ITEM_HEIGHT = 52;
const AC_VISIBLE_ROWS = 4;
const AC_PAGE_SIZE = 12;
const fmt = (n?: number, d = 1) =>
  typeof n === 'number' ? (Math.round(n * 10 ** d) / 10 ** d).toString() : '0';

/* =================== Modern Notice / Toast =================== */
type NoticeTone = 'default' | 'success' | 'warning' | 'danger' | 'info';

const ToastBar = ({
  message,
  tone = 'default',
  onClose,
}: {
  message: string;
  tone?: NoticeTone;
  onClose: () => void;
}) => {
  const c = toneToColor(tone);
  return (
    <V style={[styles.toastWrap]}>
      <V
        variant="card"
        style={[
          {
            backgroundColor: c.bg,
            borderColor: c.border,
            borderWidth: 1,
            padding: 12,
            borderRadius: 14,
          },
        ]}
      >
        <V row between alignItems="center">
          <Text text={message} color={c.text} weight="semibold" />
          <Pressable onPress={onClose} hitSlop={10}>
            <Text text="✕" color={c.text} weight="bold" />
          </Pressable>
        </V>
      </V>
    </V>
  );
};

/* ===== Tiny UI helpers for new Scan tab ===== */
const Row = ({ label, value }: { label: string; value: string }) => (
  <V row between style={styles.nutRow}>
    <Text text={`${label}:`} weight="semibold" />
    <Text text={value} weight="semibold" />
  </V>
);

function ScanAIResult(audit: NutritionAudit) {
  return (
    <V variant="card" style={[styles.nutTable, { marginTop: 12, padding: 14 }]}>
      <Text
        text="KẾT QUẢ TỪ AI"
        variant="h3"
        align="center"
        style={{ marginBottom: 8 }}
      />
      <Row label="Tên" value={audit.dishName || '—'} />
      {typeof audit.servingGram === 'number' && (
        <Row label="Khối lượng" value={`${fmt(audit.servingGram, 0)} g `} />
      )}
    </V>
  );
}

/* =================== main screen =================== */
export default function Track() {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<any>>(null);
  const keyboardH = useKeyboardHeight();
  const [warnAlert, setWarnAlert] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [openDateSheet, setOpenDateSheet] = useState(false);
  const [tab, setTab] = useState<TabKey>('manual');
  const onChangeTab = (k: TabKey) => {
    setTab(k);
    setOpenDateSheet(false);
    requestAnimationFrame(() =>
      listRef.current?.scrollToOffset({ offset: 0, animated: false }),
    );
  };

  // Scan AI state
  const [selectedImageUri, setSelectedImageUri] = useState<
    string | undefined
  >();
  const [isScanning, setIsScanning] = useState(false);
  const [showScanResult, setShowScanResult] = useState(false);
  const [scanResult, setScanResult] = useState<NutritionAudit | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const scanControllerRef = useRef<AbortController | null>(null);
  const [scanChoiceOpen, setScanChoiceOpen] = useState(false);

  // Toast + Confirm
  const [toast, setToast] = useState<{ msg: string; tone: NoticeTone } | null>(
    null,
  );
  const notify = (msg: string, tone: NoticeTone = 'default') =>
    setToast({ msg, tone });

  const [confirm, setConfirm] = useState<{ id?: string } | null>(null);

  // ===== Scan form states (independent from manual) =====
  const [scanMealType, setScanMealType] = useState<MealSlot>('BREAKFAST');
  const [scanConsumedServings, setScanConsumedServings] = useState<string>('1');
  const scanConsumedNum = useMemo(() => {
    const n = Number(scanConsumedServings);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [scanConsumedServings]);

  // ingredient picker target: 'manual' | 'scan'
  const [ingTarget, setIngTarget] = useState<'manual' | 'scan'>('manual');

  // Ingredients for Scan tab (each qty is gram)
  const [scanIngredients, setScanIngredients] = useState<
    (IngredientResponse & { qty: string })[]
  >([]);

  // ➕ Reset Scan về trạng thái ban đầu
  const resetScan = useCallback(() => {
    scanControllerRef.current?.abort?.();
    setIsScanning(false);
    setShowScanResult(false);
    setScanResult(null);
    setScanError(null);
    setScanIngredients([]);
    setScanConsumedServings('1');
    setScanMealType('BREAKFAST');
    setSelectedImageUri(undefined);
  }, []);

  const beginScan = useCallback(
    async (asset: { uri: string; type?: string; fileName?: string }) => {
      scanControllerRef.current?.abort?.();
      const ac = new AbortController();
      scanControllerRef.current = ac;

      try {
        const ImageResizer = (await import('react-native-image-resizer'))
          .default;
        const resized = await ImageResizer.createResizedImage(
          asset.uri,
          1024,
          1024,
          'JPEG',
          80,
          0,
        );
        asset = {
          uri: resized.uri,
          type: 'image/jpeg',
          fileName: resized.name || 'compressed.jpg',
        };
      } catch {
        // fallback dùng ảnh gốc
      }
      setIsScanning(true);
      setShowScanResult(false);
      setScanError(null);
      setScanResult(null);

      try {
        const data = await analyzeNutritionFromImage(asset, {
          signal: ac.signal,
        });
        console.log('AI scan result:', data);
        setScanResult(data ?? null);
        setShowScanResult(true);
        if (data?.items?.length) {
          const picked = data.items
            .filter((x: any) => x && x.missing === false && x.ingredientId)
            .map(toUIIngredientFromAI);
          setScanIngredients(picked);
          setScanMealType('BREAKFAST');
          setScanConsumedServings('1');
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          setScanError(
            'AI hiện đang quá tải. Vui lòng đợi ít phút hãy thử lại.',
          );
          setShowScanResult(false);
        }
      } finally {
        setIsScanning(false);
      }
    },
    [],
  );

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
      const asset = res.assets?.[0];
      if (asset?.uri) {
        setSelectedImageUri(asset.uri);
        await beginScan({
          uri: asset.uri,
          type: asset.type,
          fileName: asset.fileName,
        });
      }
    } catch {}
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
      const asset = res.assets?.[0];
      if (asset?.uri) {
        setSelectedImageUri(asset.uri);
        await beginScan({
          uri: asset.uri,
          type: asset.type,
          fileName: asset.fileName,
        });
      }
    } catch {}
  };

  useEffect(() => () => scanControllerRef.current?.abort?.(), []);

  // Manual
  const mealNameInputRef = useRef<TextInput>(null);
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [mealName, setMealName] = useState<string>('');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  // nutrition (base per 1 serving, from selected food)
  const [baseKcal, setBaseKcal] = useState<number>(0);
  const [baseP, setBaseP] = useState<number>(0);
  const [baseC, setBaseC] = useState<number>(0);
  const [baseF, setBaseF] = useState<number>(0);
  const [baseFiber, setBaseFiber] = useState<number>(0);
  const [baseSodium, setBaseSodium] = useState<number>(0);
  const [baseSugar, setBaseSugar] = useState<number>(0);

  // lock
  const [macrosLocked, setMacrosLocked] = useState<boolean>(false);

  // Qty/Unit
  const [qtyManual, setQtyManual] = useState<string>('1');
  const [unitManual, setUnitManual] = useState<string>('phần');

  // Meal type
  const [mealTypeManual, setMealTypeManual] = useState<MealSlot>('BREAKFAST');
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  // Autocomplete Food
  const [autoLoading, setAutoLoading] = useState<boolean>(false);
  const [acLoadingMore, setAcLoadingMore] = useState<boolean>(false);
  const [acPage, setAcPage] = useState<number>(1);
  const [acHasMore, setAcHasMore] = useState<boolean>(true);
  const [autoItems, setAutoItems] = useState<FoodResponse[]>([]);
  const acRef = useRef<AbortController | null>(null);
  const skipAcRef = useRef<boolean>(false);

  // Ingredients
  const [ingredients, setIngredients] = useState<
    (IngredientResponse & { qty: string })[]
  >([]);
  const [openIngSheet, setOpenIngSheet] = useState(false);

  // Khẩu phần đã ăn
  const [consumedServings, setConsumedServings] = useState<string>('1');
  const consumedNum = useMemo(() => {
    const n = Number(consumedServings);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [consumedServings]);

  // Food autocomplete effect
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
    if (isBlank(q)) return;
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

  const onSelectFood = useCallback((item: FoodResponse) => {
    skipAcRef.current = true;
    setMealName(item.name);
    setSelectedFoodId(String(item.id));
    setAutoItems([]);
    setAutoLoading(false);
    const n = item.nutrition as any;
    setBaseKcal(safeNum(n?.kcal));
    setBaseP(safeNum(n?.proteinG));
    setBaseC(safeNum(n?.carbG));
    setBaseF(safeNum(n?.fatG));
    setBaseFiber(safeNum(n?.fiberG));
    setBaseSodium(safeNum(n?.sodiumMg));
    setBaseSugar(safeNum(n?.sugarMg));
    setQtyManual(
      item.defaultServing != null ? String(item.defaultServing) : '1',
    );
    setUnitManual((item.servingName as string) || 'phần');
    setMacrosLocked(true);
    mealNameInputRef.current?.blur();
    Keyboard.dismiss();
  }, []);

  /* ======= HISTORY ======= */
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

  const onDeleteLog = useCallback((logId?: string) => {
    if (!logId) return;
    setConfirm({ id: logId });
  }, []);

  const toUIIngredient = (x: any): IngredientResponse & { qty: string } => {
    const src = x?.ingredient ?? x ?? {};
    return {
      id: String(src.id ?? x.id ?? ''),
      name: String(src.name ?? ''),
      unit: src.unit ?? 'G',
      per100: src.per100 ?? {
        kcal: 0,
        proteinG: 0,
        carbG: 0,
        fatG: 0,
        fiberG: 0,
        sodiumMg: 0,
        sugarMg: 0,
      },
      imageUrl: src.imageUrl ?? undefined,
      aliases: Array.isArray(src.aliases) ? src.aliases : [],
      servingName: src.servingName ?? '',
      servingSizeGram: Number(src.servingSizeGram) || 0,
      tags: Array.isArray(src.tags) ? src.tags : [],
      qty: String(x.quantity ?? 100),
    };
  };

  const toUIIngredientFromAI = (
    it: any,
  ): IngredientResponse & { qty: string } => {
    const name = String(it.matchedName || it.requestedName || 'Nguyên liệu');
    const per100 = {
      kcal: safeNum(it?.per100?.kcal),
      proteinG: safeNum(it?.per100?.proteinG),
      carbG: safeNum(it?.per100?.carbG),
      fatG: safeNum(it?.per100?.fatG),
      fiberG: safeNum(it?.per100?.fiberG),
      sodiumMg: safeNum(it?.per100?.sodiumMg),
      sugarMg: safeNum(it?.per100?.sugarMg),
    };
    return {
      id: String(it.ingredientId || ''),
      name,
      unit: 'G',
      per100,
      imageUrl: it.imageUrl || undefined,
      aliases: [],
      servingName: '',
      servingSizeGram: 0,
      tags: [],
      qty: String(Number(it.gram) || 0),
    };
  };

  const fillManualFromLog = useCallback(
    (m: LogResponse) => {
      skipAcRef.current = true;
      setEditingLogId(m.id ?? null);
      setTab('manual');
      setOpenDateSheet(false);
      cancelAutocomplete();
      mealNameInputRef.current?.blur();

      const slot = (m?.mealSlot as MealSlot) || 'SNACK';
      setMealTypeManual(slot);
      const portion = Number(m?.portion);
      setConsumedServings(
        Number.isFinite(portion) && portion > 0 ? String(portion) : '1',
      );

      if (m?.food) {
        setMacrosLocked(true);
        setSelectedFoodId(String(m.food.id));
        setMealName(m.food.name || '');
        const n = m.food.nutrition as any;
        setBaseKcal(safeNum(n?.kcal));
        setBaseP(safeNum(n?.proteinG));
        setBaseC(safeNum(n?.carbG));
        setBaseF(safeNum(n?.fatG));
        setBaseFiber(safeNum(n?.fiberG));
        setBaseSodium(safeNum(n?.sodiumMg));
        setBaseSugar(safeNum(n?.sugarMg));
        setQtyManual(
          m.food.defaultServing != null ? String(m.food.defaultServing) : '1',
        );
        setUnitManual(m.food.servingName || 'phần');
        setIngredients((m.ingredients || []).map(toUIIngredient));
      } else {
        setMacrosLocked(false);
        setSelectedFoodId(null);
        setMealName(m?.nameFood || '');
        setBaseKcal(0);
        setBaseP(0);
        setBaseC(0);
        setBaseF(0);
        setBaseFiber(0);
        setBaseSodium(0);
        setBaseSugar(0);
        setQtyManual('1');
        setUnitManual('phần');
        setIngredients((m.ingredients || []).map(toUIIngredient));
      }
    },
    [cancelAutocomplete],
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

  // ===== Totals =====
  const qtyNum = useMemo(() => {
    const n = Number(qtyManual);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [qtyManual]);

  // ===== Totals for Scan tab =====
  const scanIngredientsTotal = useNutritionTotals(scanIngredients);

  const scanTotalNutrition = useMemo(
    () => scanIngredientsTotal,
    [scanIngredientsTotal],
  );

  const scanEatenNutrition = useMemo(
    () => ({
      kcal: scanTotalNutrition.kcal * scanConsumedNum,
      proteinG: scanTotalNutrition.proteinG * scanConsumedNum,
      carbG: scanTotalNutrition.carbG * scanConsumedNum,
      fatG: scanTotalNutrition.fatG * scanConsumedNum,
      fiberG: scanTotalNutrition.fiberG * scanConsumedNum,
      sodiumMg: scanTotalNutrition.sodiumMg * scanConsumedNum,
      sugarMg: scanTotalNutrition.sugarMg * scanConsumedNum,
    }),
    [scanTotalNutrition, scanConsumedNum],
  );

  const canSubmitScan = useMemo(
    () => Math.round(scanEatenNutrition.kcal) > 0,
    [scanEatenNutrition.kcal],
  );
  const [submittingAddScan, setSubmittingAddScan] = useState(false);

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

  const ingredientsTotal = useNutritionTotals(ingredients);

  const totalNutrition = useMemo(
    () => ({
      kcal: foodTotal.kcal + ingredientsTotal.kcal,
      proteinG: foodTotal.proteinG + ingredientsTotal.proteinG,
      carbG: foodTotal.carbG + ingredientsTotal.carbG,
      fatG: foodTotal.fatG + ingredientsTotal.fatG,
      fiberG: foodTotal.fiberG + ingredientsTotal.fiberG,
      sodiumMg: foodTotal.sodiumMg + ingredientsTotal.sodiumMg,
      sugarMg: foodTotal.sugarMg + ingredientsTotal.sugarMg,
    }),
    [foodTotal, ingredientsTotal],
  );

  const eatenNutrition = useMemo(
    () => ({
      kcal: totalNutrition.kcal * consumedNum,
      proteinG: totalNutrition.proteinG * consumedNum,
      carbG: totalNutrition.carbG * consumedNum,
      fatG: totalNutrition.fatG * consumedNum,
      fiberG: totalNutrition.fiberG * consumedNum,
      sodiumMg: totalNutrition.sodiumMg * consumedNum,
      sugarMg: totalNutrition.sugarMg * consumedNum,
    }),
    [totalNutrition, consumedNum],
  );

  const canSubmitAdd = useMemo(
    () => Math.round(eatenNutrition.kcal) > 0,
    [eatenNutrition.kcal],
  );

  const isAddDisabled = submittingAdd || !canSubmitAdd;

  /* ===== Handlers: Save/Update with modern toast ===== */
  const resetManualForm = useCallback(() => {
    setEditingLogId(null);
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
    cancelAutocomplete();
  }, [cancelAutocomplete]);

  const handleAddMeal = useCallback(async () => {
    try {
      setSubmittingAdd(true);
      const payload = {
        date: toYMDLocal(date),
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
      const warn: KcalWarningResponse = await saveManualLog(payload, ac.signal);
      const slotLabel: Record<string, string> = {
        BREAKFAST: 'Sáng',
        LUNCH: 'Trưa',
        DINNER: 'Chiều',
        SNACK: 'Phụ',
      };
      const slotName = slotLabel[warn.mealSlot] ?? warn.mealSlot;
      const d = Math.round(Math.abs(warn.diff));
      let msg = '';
      if (warn.status === 'OVER') {
        msg =
          `Đã lưu bữa ${slotName}.\n` +
          `Bạn vượt mục tiêu ~${d} kcal.\n` +
          `Mục tiêu ${Math.round(warn.targetKcal)} · Thực tế ${Math.round(
            warn.actualKcal,
          )} kcal.` +
          `\n\nHệ thống đã tinh chỉnh các bữa còn lại trong ngày. ` +
          `\nBạn hãy cố gắng tuân theo kế hoạch đã điều chỉnh để đảm bảo mục tiêu hôm nay nhé.`;
      } else if (warn.status === 'UNDER') {
        msg =
          `Đã lưu bữa ${slotName}.\n` +
          `Bạn còn thiếu ~${d} kcal.\n` +
          `Mục tiêu ${Math.round(warn.targetKcal)} · Thực tế ${Math.round(
            warn.actualKcal,
          )} kcal.` +
          `\n\nHệ thống đã tinh chỉnh các bữa còn lại trong ngày. ` +
          `\nBạn hãy cố gắng tuân theo kế hoạch đã điều chỉnh để đảm bảo mục tiêu hôm nay nhé.`;
      } else {
        msg =
          `Đã lưu bữa ${slotName}.\n` +
          `Bạn đang bám sát mục tiêu!\n` +
          `${Math.round(warn.actualKcal)} / ${Math.round(
            warn.targetKcal,
          )} kcal.` +
          `\nTiếp tục tuân theo kế hoạch hiện tại để duy trì nhịp độ nhé.`;
      }
      setWarnAlert(msg);
      setTab('history');
      resetManualForm();
      await loadHistory(date);
    } catch (err: any) {
      notify(err?.message || 'Không thể lưu bữa ăn', 'danger');
    } finally {
      setSubmittingAdd(false);
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
    resetManualForm,
  ]);

  const handleAddMealFromScan = useCallback(async () => {
    try {
      setSubmittingAddScan(true);
      const now = new Date();
      const todayYmd = toYMDLocal(now);

      const payload: PlanLogScanRequest = {
        date: todayYmd,
        mealSlot: scanMealType,
        nameFood: scanResult?.dishName?.trim() || 'Món từ AI',
        consumedServings: Number(scanConsumedServings) || 1,
        totalNutrition: {
          kcal: Math.round(scanEatenNutrition.kcal),
          proteinG: Number(fmtNum(scanEatenNutrition.proteinG)),
          carbG: Number(fmtNum(scanEatenNutrition.carbG)),
          fatG: Number(fmtNum(scanEatenNutrition.fatG)),
          fiberG: Number(fmtNum(scanEatenNutrition.fiberG)),
          sodiumMg: Math.round(scanEatenNutrition.sodiumMg),
          sugarMg: Math.round(scanEatenNutrition.sugarMg),
        },
        ingredients: scanIngredients.map(it => ({
          id: String(it.id),
          qty: Number(it.qty) || 0,
        })),
      };

      const ac = new AbortController();
      const warn: KcalWarningResponse = await saveScanLog(payload, ac.signal);

      const slotLabel: Record<string, string> = {
        BREAKFAST: 'Sáng',
        LUNCH: 'Trưa',
        DINNER: 'Chiều',
        SNACK: 'Phụ',
      };
      const slotName = slotLabel[warn.mealSlot] ?? warn.mealSlot;
      const d = Math.round(Math.abs(warn.diff));

      let msg = '';
      if (warn.status === 'OVER') {
        msg = `Đã lưu bữa ${slotName}.\nBạn vượt mục tiêu ~${d} kcal.\nMục tiêu ${Math.round(
          warn.targetKcal,
        )} · Thực tế ${Math.round(
          warn.actualKcal,
        )} kcal.\n\nHệ thống đã tinh chỉnh các bữa còn lại trong ngày.\nBạn hãy cố gắng tuân theo kế hoạch đã điều chỉnh để đảm bảo mục tiêu hôm nay nhé.`;
      } else if (warn.status === 'UNDER') {
        msg = `Đã lưu bữa ${slotName}.\nBạn còn thiếu ~${d} kcal.\nMục tiêu ${Math.round(
          warn.targetKcal,
        )} · Thực tế ${Math.round(
          warn.actualKcal,
        )} kcal.\n\nHệ thống đã tinh chỉnh các bữa còn lại trong ngày.\nBạn hãy cố gắng tuân theo kế hoạch đã điều chỉnh để đảm bảo mục tiêu hôm nay nhé.`;
      } else {
        msg = `Đã lưu bữa ${slotName}.\nBạn đang bám sát mục tiêu!\n${Math.round(
          warn.actualKcal,
        )} / ${Math.round(
          warn.targetKcal,
        )} kcal.\nTiếp tục tuân theo kế hoạch hiện tại để duy trì nhịp độ nhé.`;
      }
      setWarnAlert(msg);
      setTab('history');
      setDate(now);
      await loadHistory(now);
    } catch (err: any) {
      notify(err?.message || 'Không thể lưu bữa (Scan)', 'danger');
    } finally {
      setSubmittingAddScan(false);
    }
  }, [
    scanMealType,
    scanConsumedServings,
    scanEatenNutrition,
    scanIngredients,
    scanResult,
    loadHistory,
  ]);

  const handleUpdateMeal = useCallback(async () => {
    if (!editingLogId) return;
    try {
      setSubmittingUpdate(true);

      const payload: PlanLogUpdateRequest = {
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
      };

      const ac = new AbortController();
      const warn: KcalWarningResponse = await updatePlanLog(
        editingLogId,
        payload,
        ac.signal,
      );

      const slotLabel: Record<string, string> = {
        BREAKFAST: 'Sáng',
        LUNCH: 'Trưa',
        DINNER: 'Chiều',
        SNACK: 'Phụ',
      };
      const slotName = slotLabel[warn.mealSlot] ?? warn.mealSlot;
      const d = Math.round(Math.abs(warn.diff));

      let msg = '';
      if (warn.status === 'OVER') {
        msg =
          `Đã cập nhật bữa ${slotName}.\n` +
          `Bạn vượt mục tiêu ~${d} kcal.\n` +
          `Mục tiêu ${Math.round(warn.targetKcal)} · Thực tế ${Math.round(
            warn.actualKcal,
          )} kcal.` +
          `\n\nHệ thống đã tinh chỉnh các bữa còn lại trong ngày. ` +
          `\nBạn hãy cố gắng tuân theo kế hoạch đã điều chỉnh để đảm bảo mục tiêu hôm nay nhé.`;
      } else if (warn.status === 'UNDER') {
        msg =
          `Đã cập nhật bữa ${slotName}.\n` +
          `Bạn còn thiếu ~${d} kcal.\n` +
          `Mục tiêu ${Math.round(warn.targetKcal)} · Thực tế ${Math.round(
            warn.actualKcal,
          )} kcal.` +
          `\n\nHệ thống đã tinh chỉnh các bữa còn lại trong ngày. ` +
          `\nBạn hãy cố gắng tuân theo kế hoạch đã điều chỉnh để đảm bảo mục tiêu hôm nay nhé.`;
      } else {
        msg =
          `Đã cập nhật bữa ${slotName}.\n` +
          `Bạn đang bám sát mục tiêu!\n` +
          `${Math.round(warn.actualKcal)} / ${Math.round(
            warn.targetKcal,
          )} kcal.` +
          `\nTiếp tục tuân theo kế hoạch hiện tại để duy trì nhịp độ nhé.`;
      }
      setWarnAlert(msg);

      setTab('history');
      resetManualForm();
      await loadHistory(date);
    } catch (e: any) {
      notify(e?.message || 'Không thể cập nhật bữa ăn', 'danger');
    } finally {
      setSubmittingUpdate(false);
    }
  }, [
    editingLogId,
    mealTypeManual,
    macrosLocked,
    selectedFoodId,
    mealName,
    consumedServings,
    eatenNutrition,
    ingredients,
    loadHistory,
    date,
    resetManualForm,
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
        <AppHeader />
        <RNView style={[s.line, styles.fullBleed]} />

        {/* Date line */}
        <V alignItems="center" style={[styles.calendarWrap, styles.fullBleed]}>
          <DateButton
            date={date}
            onPress={() => {
              setOpenDateSheet(true);
            }}
            formatter={fmtVNFull}
          />
        </V>

        <FlatList
          ref={listRef}
          data={[0]}
          keyExtractor={() => 'screen'}
          renderItem={() => (
            <V style={[styles.inner, styles.fullBleed]}>
              {/* Tabs */}
              <V row gap={8} style={styles.tabs}>
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
                  label="Xem lịch sử "
                  active={tab === 'history'}
                  onPress={() => onChangeTab('history')}
                />
              </V>

              {/* ========== SCAN ========== */}
              {tab === 'scan' && (
                <V variant="card" style={styles.card}>
                  <Text
                    text="NHẬP BỮA ĂN BẰNG AI"
                    variant="h3"
                    align="center"
                  />
                  <Text
                    text="Chụp ảnh hoặc chọn ảnh món ăn để phân tích nhanh."
                    tone="muted"
                    variant="caption"
                    align="center"
                    style={{ marginTop: 4, marginBottom: 8 }}
                  />

                  <Image
                    source={{
                      uri:
                        selectedImageUri ||
                        'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/98fb941f-eb1e-49d6-9c4c-7235d38840a5.png',
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
                      <Text text="Quét Scan" weight="bold" color="#0b2149" />
                    )}
                  </Pressable>

                  {isScanning && (
                    <V alignItems="center" style={styles.scanningBox}>
                      <ActivityIndicator />
                      <Text
                        text="Việc phân tích có thể mất một chút thời gian..."
                        tone="muted"
                        style={{ marginTop: 6 }}
                      />
                    </V>
                  )}

                  {scanError && !isScanning && (
                    <V style={{ marginTop: 10 }}>
                      <Text text={scanError} color="#b91c1c" align="center" />
                    </V>
                  )}

                  {showScanResult && !isScanning && scanResult && (
                    <>
                      <ScanAIResult {...scanResult} />

                      {/* Chọn bữa cho Scan */}
                      <V style={{ marginTop: 10 }}>
                        <Text
                          text="Loại bữa"
                          weight="semibold"
                          style={styles.blockLabel}
                        />
                        <MealTypePicker
                          value={scanMealType}
                          onChange={setScanMealType}
                        />
                      </V>

                      {/* Nguyên liệu từ AI + thêm mới */}
                      <V style={{ marginTop: 10 }}>
                        <Text
                          text="Nguyên liệu (AI đã nhận diện)"
                          weight="semibold"
                          style={styles.blockLabel}
                        />
                        {scanIngredients.length === 0 ? (
                          <Text
                            text="Chưa có nguyên liệu. Hãy thêm thủ công."
                            tone="muted"
                            style={{ marginBottom: 8 }}
                          />
                        ) : (
                          scanIngredients.map((it, idx) => (
                            <IngredientRow
                              key={it.id + idx}
                              name={it.name}
                              imageUrl={getThumb(it)}
                              unit="G"
                              qty={it.qty}
                              onChangeQty={t =>
                                setScanIngredients(prev =>
                                  prev.map((x, i) =>
                                    i === idx ? { ...x, qty: t } : x,
                                  ),
                                )
                              }
                              onRemove={() =>
                                setScanIngredients(prev =>
                                  prev.filter((_, i) => i !== idx),
                                )
                              }
                            />
                          ))
                        )}

                        <Pressable
                          onPress={() => {
                            setIngTarget('scan');
                            setOpenIngSheet(true);
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
                          <Text
                            text="+ Thêm nguyên liệu"
                            weight="bold"
                            color="#0c4a6e"
                          />
                        </Pressable>
                      </V>

                      {/* Khẩu phần đã ăn */}
                      <Text
                        text="Bạn đã dùng bao nhiêu?"
                        weight="semibold"
                        style={[styles.blockLabel, { marginTop: 10 }]}
                      />
                      <V row alignItems="center">
                        <TextInput
                          placeholder="1 (có thể 0.5, 2...)"
                          keyboardType="numeric"
                          style={[styles.input, styles.flex1]}
                          placeholderTextColor={PLACEHOLDER_COLOR}
                          selectionColor={colors.primary}
                          value={scanConsumedServings}
                          onChangeText={t => setScanConsumedServings(t)}
                        />
                        <Text
                          text={scanResult?.servingName || 'khẩu phần'}
                          color={colors.text}
                          style={{ fontSize: 16, marginLeft: 16 }}
                        />
                      </V>

                      {/* Dinh dưỡng (Scan) */}
                      <Text
                        text="Dinh dưỡng"
                        weight="semibold"
                        style={[styles.blockLabel, { marginTop: 10 }]}
                      />
                      <NutritionTable
                        title="Tổng cho món (chưa nhân khẩu phần đã ăn)"
                        data={scanTotalNutrition}
                      />
                      <NutritionTable
                        title={`Tổng dinh dưỡng bạn đã ăn (x${fmtNum(
                          scanConsumedNum,
                          2,
                        )})`}
                        data={scanEatenNutrition}
                      />

                      {/* Nút hành động Scan: Lưu + Hủy */}
                      <V row gap={10} style={{ marginTop: 14 }}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{
                            disabled: submittingAddScan || !canSubmitScan,
                          }}
                          onPress={
                            submittingAddScan || !canSubmitScan
                              ? undefined
                              : handleAddMealFromScan
                          }
                          disabled={submittingAddScan || !canSubmitScan}
                          android_ripple={
                            submittingAddScan || !canSubmitScan
                              ? undefined
                              : { borderless: false }
                          }
                          style={[
                            styles.actionBtn,
                            { flex: 2 },
                            submittingAddScan || !canSubmitScan
                              ? styles.actionBtnDisabled
                              : styles.actionBtnEnabled,
                          ]}
                        >
                          {submittingAddScan ? (
                            <ActivityIndicator />
                          ) : (
                            <Text
                              text="Lưu bữa từ Scan"
                              weight="bold"
                              color={
                                submittingAddScan || !canSubmitScan
                                  ? '#64748b'
                                  : '#0b2149'
                              }
                            />
                          )}
                        </Pressable>

                        {/* ➕ Nút Hủy: reset về trạng thái ban đầu để quét lại */}
                        <Pressable
                          onPress={resetScan}
                          style={[
                            styles.actionBtn,
                            {
                              flex: 1,
                              backgroundColor: '#f1f5f9',
                              borderColor: '#e2e8f0',
                            },
                          ]}
                        >
                          <Text text="Hủy" weight="bold" color={colors.text} />
                        </Pressable>
                      </V>
                    </>
                  )}
                </V>
              )}

              {/* ========== MANUAL ========== */}
              {tab === 'manual' && (
                <V variant="card" style={styles.card}>
                  <Text
                    text="NHẬP BỮA ĂN THỦ CÔNG"
                    variant="h3"
                    align="center"
                  />
                  <Text
                    text="Chọn nhanh từ danh sách hoặc thêm nguyên liệu riêng."
                    tone="muted"
                    variant="caption"
                    align="center"
                    style={{ marginTop: 4, marginBottom: 8 }}
                  />

                  {/* Name + Autocomplete */}
                  <RNView style={{ position: 'relative' }}>
                    <TextInput
                      ref={mealNameInputRef}
                      placeholder="Nhập tên bữa ăn"
                      style={styles.input}
                      placeholderTextColor={PLACEHOLDER_COLOR}
                      selectionColor={colors.primary}
                      value={mealName}
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
                    />

                    {(autoLoading ||
                      (!isBlank(mealName) && autoItems.length > 0)) && (
                      <V
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
                          <V alignItems="center" style={{ paddingVertical: 8 }}>
                            <ActivityIndicator />
                          </V>
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
                                <Text
                                  text={item.name}
                                  weight="semibold"
                                  style={styles.acName as any}
                                />
                              </Pressable>
                            )}
                            ItemSeparatorComponent={() => (
                              <RNView style={styles.acSep} />
                            )}
                            onEndReachedThreshold={0.3}
                            onEndReached={loadMoreAuto}
                            ListFooterComponent={
                              acHasMore ? (
                                <V
                                  alignItems="center"
                                  style={{ paddingVertical: 8 }}
                                >
                                  {acLoadingMore ? (
                                    <ActivityIndicator />
                                  ) : (
                                    <Text
                                      text="Kéo để tải thêm…"
                                      tone="muted"
                                    />
                                  )}
                                </V>
                              ) : null
                            }
                          />
                        )}
                      </V>
                    )}
                  </RNView>

                  {/* Combobox chọn bữa */}
                  <V style={{ marginTop: 6 }}>
                    <Text
                      text="Loại bữa"
                      weight="semibold"
                      style={styles.blockLabel}
                    />
                    <MealTypePicker
                      value={mealTypeManual}
                      onChange={setMealTypeManual}
                    />
                  </V>

                  {/* Nguyên liệu */}
                  <V style={{ marginTop: 10 }}>
                    <Text
                      text="Nguyên liệu"
                      weight="semibold"
                      style={styles.blockLabel}
                    />
                    {ingredients.length === 0 ? (
                      <Text
                        text="Thêm từng nguyên liệu để mô tả món tự do."
                        tone="muted"
                        style={{ marginBottom: 8 }}
                      />
                    ) : (
                      ingredients.map((it, idx) => (
                        <IngredientRow
                          key={it.id + idx}
                          name={it.name}
                          imageUrl={getThumb(it)}
                          unit={it.unit}
                          qty={it.qty}
                          onChangeQty={t =>
                            setIngredients(prev =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, qty: t } : x,
                              ),
                            )
                          }
                          onRemove={() =>
                            setIngredients(prev =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                        />
                      ))
                    )}

                    <Pressable
                      onPress={() => {
                        setIngTarget('manual');
                        setOpenIngSheet(true);
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
                      <Text
                        text="+ Thêm nguyên liệu"
                        weight="bold"
                        color="#0c4a6e"
                      />
                    </Pressable>
                  </V>

                  {/* Số khẩu phần đã ăn */}
                  <Text
                    text="Bạn đã dùng bao nhiêu?"
                    weight="semibold"
                    style={[styles.blockLabel, { marginTop: 10 }]}
                  />
                  <V row alignItems="center">
                    <TextInput
                      placeholder="1 (có thể 0.5, 2...)"
                      keyboardType="numeric"
                      style={[styles.input, styles.flex1]}
                      placeholderTextColor={PLACEHOLDER_COLOR}
                      selectionColor={colors.primary}
                      value={consumedServings}
                      onChangeText={(t: string) => setConsumedServings(t)}
                    />
                    <Text
                      text={macrosLocked ? unitManual || 'phần' : 'khẩu phần'}
                      color={colors.text}
                      style={{ fontSize: 16, marginLeft: 16 }}
                    />
                  </V>

                  {/* Nutrition (READ-ONLY) */}
                  <Text
                    text="Dinh dưỡng"
                    weight="semibold"
                    style={[styles.blockLabel, { marginTop: 10 }]}
                  />

                  <NutritionTable
                    title="Tổng cho món (chưa nhân khẩu phần đã ăn)"
                    data={totalNutrition}
                  />
                  <NutritionTable
                    title={`Tổng dinh dưỡng bạn đã ăn (x${fmtNum(
                      consumedNum,
                      2,
                    )})`}
                    data={eatenNutrition}
                  />

                  {/* Nút hành động */}
                  {!editingLogId ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ disabled: isAddDisabled }}
                      onPress={isAddDisabled ? undefined : handleAddMeal}
                      disabled={isAddDisabled}
                      android_ripple={
                        isAddDisabled ? undefined : { borderless: false }
                      }
                    >
                      <RNView
                        style={[
                          styles.actionBtn,
                          isAddDisabled
                            ? styles.actionBtnDisabled
                            : styles.actionBtnEnabled,
                        ]}
                      >
                        {submittingAdd ? (
                          <ActivityIndicator />
                        ) : (
                          <Text
                            text="Thêm bữa ăn"
                            weight="bold"
                            color={isAddDisabled ? '#64748b' : '#0b2149'}
                          />
                        )}
                      </RNView>
                    </Pressable>
                  ) : (
                    <V row gap={10} style={{ marginTop: 14 }}>
                      <Pressable
                        style={[
                          styles.actionBtn,
                          {
                            flex: 2,
                            opacity: submittingUpdate ? 0.7 : 1,
                            backgroundColor: '#60a5fa',
                            borderColor: '#3b82f6',
                          },
                        ]}
                        onPress={handleUpdateMeal}
                        disabled={submittingUpdate}
                      >
                        {submittingUpdate ? (
                          <ActivityIndicator />
                        ) : (
                          <Text text="Cập nhật" weight="bold" color="#0b2149" />
                        )}
                      </Pressable>
                      <Pressable
                        style={[
                          styles.actionBtn,
                          {
                            flex: 1,
                            backgroundColor: '#f1f5f9',
                            borderColor: '#e2e8f0',
                          },
                        ]}
                        onPress={resetManualForm}
                      >
                        <Text text="Hủy" weight="bold" color={colors.text} />
                      </Pressable>
                    </V>
                  )}
                </V>
              )}
              {/* ========== HISTORY ========== */}
              {tab === 'history' && (
                <V style={{ width: '100%' }}>
                  <Text text="LỊCH SỬ BỮA ĂN" variant="h3" align="center" />
                  {historyLoading ? (
                    <V style={{ paddingVertical: 16 }} alignItems="center">
                      <ActivityIndicator />
                      <Text
                        text="Đang tải..."
                        tone="muted"
                        style={{ marginTop: 6 }}
                      />
                    </V>
                  ) : historyError ? (
                    <V style={{ paddingVertical: 16 }} alignItems="center">
                      <Text text={historyError} color="#b91c1c" />
                    </V>
                  ) : logs.length === 0 ? (
                    <V style={{ paddingVertical: 16 }} alignItems="center">
                      <Text
                        text="Chưa có lịch sử ăn cho ngày này"
                        tone="muted"
                      />
                    </V>
                  ) : (
                    (
                      ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as MealSlot[]
                    ).map(slot => {
                      const items = groupedLogs[slot] || [];
                      if (!items.length) return null;
                      return (
                        <V key={slot} style={{ marginBottom: 16 }}>
                          <Text
                            text={
                              groupLabel[slot] === 'Chiều'
                                ? 'Chiều tối'
                                : groupLabel[slot]
                            }
                            weight="bold"
                            style={styles.groupHeader}
                          />
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
                              <V
                                key={`${m.id ?? i}`}
                                variant="card"
                                style={styles.historyCard}
                              >
                                <Text text={name} weight="bold" />
                                <Text
                                  text={`Số lượng: ${portionText}`}
                                  color="#334155"
                                  style={{ marginBottom: 2 }}
                                />
                                {kcal != null && (
                                  <Text
                                    text={`Calo: ${Math.round(
                                      Number(kcal),
                                    )} kcal`}
                                  />
                                )}
                                {(p != null || c != null || f != null) && (
                                  <Text
                                    text={`Protein: ${p ?? '-'} g, Carbs: ${
                                      c ?? '-'
                                    } g, Fat: ${f ?? '-'} g`}
                                  />
                                )}
                                <V row gap={8} style={styles.rowBtns}>
                                  <Pressable
                                    style={[styles.badge, styles.badgeEditSoft]}
                                    onPress={() => fillManualFromLog(m)}
                                  >
                                    <Text
                                      text="Sửa"
                                      weight="bold"
                                      color="#0b2149"
                                    />
                                  </Pressable>
                                  <Pressable
                                    style={[
                                      styles.badge,
                                      styles.badgeDeleteSoft,
                                    ]}
                                    onPress={() => {
                                      onDeleteLog(m.id);
                                    }}
                                  >
                                    <Text
                                      text="Xóa"
                                      weight="bold"
                                      color="#7f1d1d"
                                    />
                                  </Pressable>
                                </V>
                              </V>
                            );
                          })}
                        </V>
                      );
                    })
                  )}
                </V>
              )}
            </V>
          )}
          extraData={{
            isAddDisabled,
            submittingAdd,
            tab,
            consumedServings,
            ingredientsLength: ingredients.length,
            totalKcal: Math.round(eatenNutrition.kcal),
          }}
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
          onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {}}
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
          maxDate={new Date()}
        />

        {/* Modal chọn nguồn ảnh */}
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
            <V variant="card" style={styles.modalCard}>
              <Text text="Chọn nguồn ảnh" weight="bold" variant="h3" />
              <Pressable
                style={styles.modalAction}
                onPress={handleScanFromCamera}
              >
                <Text text="Chụp ảnh (Camera)" weight="bold" />
              </Pressable>
              <Pressable
                style={styles.modalAction}
                onPress={handleScanFromLibrary}
              >
                <Text text="Chọn từ thư viện" weight="bold" />
              </Pressable>
              <Pressable
                style={[styles.modalCancel]}
                onPress={() => setScanChoiceOpen(false)}
              >
                <Text text="Hủy" weight="bold" color={colors.onPrimary} />
              </Pressable>
            </V>
          </Pressable>
        </Modal>

        {/* IngredientPickerSheet (mới) */}
        <IngredientPickerSheet
          visible={openIngSheet}
          onClose={() => setOpenIngSheet(false)}
          insetsBottom={insets.bottom}
          keyboardH={keyboardH}
          onPick={item => {
            if (ingTarget === 'scan') {
              setScanIngredients(prev => [...prev, { ...item, qty: '100' }]);
            } else {
              setIngredients(prev => [...prev, { ...item, qty: '100' }]);
            }
            setOpenIngSheet(false);
          }}
        />

        {/* Confirm delete */}
        <ConfirmSheet
          visible={!!confirm}
          title="Xác nhận"
          message="Xoá mục này sẽ ảnh hưởng đến dinh dưỡng, nhưng hệ thống sẽ điều chỉnh kế hoạch mới cho bạn. Tiếp tục xoá?"
          confirmLabel="Xóa"
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            const id = confirm?.id;
            setConfirm(null);
            if (!id) return;
            const ac = new AbortController();
            setLogs(prev => prev.filter(x => x.id !== id));
            try {
              await deletePlanLogById(id, ac.signal);
              notify('Đã xoá mục', 'success');
            } catch {
              await loadHistory(date);
              notify('Không thể xoá. Vui lòng thử lại.', 'danger');
            }
          }}
        />
        <AlertSheet
          visible={!!warnAlert}
          title="Cảnh báo calo"
          message={warnAlert || ''}
          onClose={() => setWarnAlert(null)}
        />

        {/* Toast */}
        {toast && (
          <ToastBar
            message={toast.msg}
            tone={toast.tone}
            onClose={() => setToast(null)}
          />
        )}
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
      text={label}
      allowFontScaling={false as any}
      style={[styles.tabText as any, active && (styles.tabTextActive as any)]}
    />
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
  },
  tabTextActive: { color: colors.onPrimary },

  unitWrap: {
    height: 44,
    minWidth: 40,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
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
    }),
  },

  blockLabel: { marginTop: 6, marginBottom: 6 },

  inlineRow: { flexDirection: 'row', alignItems: 'center' },
  flex1: { flex: 1 },

  actionBtn: {
    height: 48,
    borderRadius: 12,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    alignSelf: 'stretch',
  },
  actionBtnEnabled: {
    backgroundColor: '#93c5fd',
    borderColor: '#60a5fa',
  },
  actionBtnDisabled: {
    backgroundColor: '#e5e7eb',
    borderColor: '#cbd5e1',
  },
  dropdownPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.white,
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
  acName: { flex: 1 } as any,
  acSep: { height: 1, backgroundColor: '#eef2f7', marginLeft: 58 },

  // nutrition
  nutTable: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.bg,
    marginTop: 6,
    marginBottom: 6,
  },
  nutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },

  // history
  groupHeader: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    paddingLeft: 10,
    paddingRight: 16,
  },
  historyCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    marginHorizontal: 16,
  },
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

  // Scan styles
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

  // Generic modal styling
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
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalAction: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.slate50,
    marginTop: 8,
  },
  modalCancel: {
    height: 46,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red,
    marginTop: 12,
  },

  // Toast
  toastWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
});

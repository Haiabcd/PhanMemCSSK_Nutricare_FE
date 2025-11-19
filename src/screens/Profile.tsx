import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
  useWindowDimensions,
  Image,
} from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';
import type {
  Allergy,
  Condition,
  InfoResponse,
  ProfileDto,
  UserAllergyResponse,
  UserConditionResponse,
} from '../types/types';
import type { UpdateRequest } from '../types/user.type';
import LoadingOverlay from '../components/LoadingOverlay';
import {
  calcAge,
  displayGender,
  translateGoal,
  translateActivityLevel,
  getAllergyNames,
  getConditionNames,
  GOAL_OPTIONS,
  GENDER_OPTIONS,
  ACTIVITY_OPTIONS,
  toYMDLocal,
} from '../helpers/profile.helper';
import MultiSelectModal from '../components/Profile/MultiSelectModal';
import LoginChoiceModal from '../components/Profile/LoginModal';
import InfoItem from '../components/Profile/InfoItem';
import ToastCenter, { ToastKind } from '../components/Profile/ToastCenter';
import FormField from '../components/Profile/FormField';
import Dropdown from '../components/Profile/Dropdown';
import AppHeader from '../components/AppHeader';
import ConfirmLogoutModal from '../components/Profile/ConfirmLogoutModal';
import {
  startGoogleOAuth,
  logout as logoutApi,
} from '../services/auth.service';
import { getAllConditions } from '../services/condition.service';
import { getAllAllergies } from '../services/allergy.service';
import { getMyInfo, updateProfile } from '../services/user.service';
import { getOrCreateDeviceId } from '../config/deviceId';
import { useHeader } from '../context/HeaderProvider';
import { getTokenSecure, removeTokenSecure } from '../config/secureToken';
import { resetTo } from '../navigation/RootNavigation';
import { api } from '../config/api';

type PickerType = 'condition' | 'allergy';

/* ====================== Constants & helpers ====================== */
const SAFE = {
  LOSE: { MIN: 0.5, MAX: 1.0 }, // kg/tuần
  GAIN: { MIN: 0.25, MAX: 0.5 }, // kg/tuần
};

const HEIGHT_RANGE = { MIN: 80, MAX: 250 }; // cm
const WEIGHT_RANGE = { MIN: 20, MAX: 500 }; // kg
const MIN_AGE = 13;

const formatTargetDeltaForDisplay = (goal: string, delta: number) => {
  if (goal === 'LOSE') return Math.abs(delta);
  if (goal === 'MAINTAIN') return 0;
  return Math.abs(delta);
};

const normalizeTargetDeltaForApi = (goal: string, delta: number) => {
  if (goal === 'LOSE') return -Math.abs(delta || 0);
  if (goal === 'MAINTAIN') return 0;
  return Math.abs(delta || 0);
};

type PlanCheck =
  | { ok: true }
  | {
      ok: false;
      reason: 'invalid' | 'too_fast' | 'too_slow';
      message: string;
      subMessage?: string;
      suggestWeeks?: number;
    };

function validatePlan(
  goal: 'LOSE' | 'GAIN',
  deltaAbsKg: number,
  weeks: number,
  touched: boolean,
): PlanCheck {
  if (!touched) return { ok: true };

  if (!deltaAbsKg || !weeks) {
    return {
      ok: false,
      reason: 'invalid',
      message:
        'Vui lòng nhập đủ “Mức thay đổi cân nặng (kg)” và “Thời gian đạt mục tiêu (tuần)”.',
    };
  }

  const rate = deltaAbsKg / weeks;
  const R = goal === 'LOSE' ? SAFE.LOSE : SAFE.GAIN;

  if (rate > R.MAX) {
    const suggest = Math.ceil(deltaAbsKg / R.MAX);
    return {
      ok: false,
      reason: 'too_fast',
      suggestWeeks: suggest,
      message:
        goal === 'LOSE'
          ? `Tốc độ giảm ${rate.toFixed(2)} kg/tuần vượt mức an toàn (${
              R.MAX
            } kg/tuần).`
          : `Tốc độ tăng ${rate.toFixed(2)} kg/tuần vượt mức an toàn (${
              R.MAX
            } kg/tuần).`,
      subMessage:
        goal === 'LOSE'
          ? 'Khuyến nghị giảm 0.5–1.0 kg/tuần để bền vững.'
          : 'Khuyến nghị tăng 0.25–0.5 kg/tuần để chủ yếu tăng khối nạc.',
    };
  }

  if (rate < R.MIN) {
    return {
      ok: false,
      reason: 'too_slow',
      message:
        goal === 'LOSE'
          ? `Tốc độ giảm ${rate.toFixed(2)} kg/tuần thấp hơn khuyến nghị (${
              R.MIN
            }–${R.MAX} kg/tuần).`
          : `Tốc độ tăng ${rate.toFixed(2)} kg/tuần thấp hơn khuyến nghị (${
              R.MIN
            }–${R.MAX} kg/tuần).`,
      subMessage:
        'Bạn có thể tiếp tục (an toàn) hoặc điều chỉnh để nhanh hơn nếu muốn.',
    };
  }

  return { ok: true };
}

/* ====================== Screen ====================== */
function SkeletonRow() {
  return (
    <ViewComponent row wrap mt={20} mb={4} gap={0}>
      {Array.from({ length: 8 }).map((_, i) => (
        <ViewComponent
          key={i}
          style={{
            width: '48%',
            height: 64,
            borderRadius: 14,
            backgroundColor: '#F3F4F6',
            margin: '1%',
          }}
        />
      ))}
    </ViewComponent>
  );
}

function SkeletonCard() {
  return (
    <ViewComponent style={{ marginTop: 8, marginBottom: 12 }}>
      <ViewComponent
        style={{
          height: 18,
          width: 160,
          borderRadius: 6,
          backgroundColor: '#E5E7EB',
          marginBottom: 10,
        }}
      />
      {Array.from({ length: 3 }).map((_, i) => (
        <ViewComponent
          key={i}
          style={{
            height: 46,
            borderRadius: 12,
            backgroundColor: '#F3F4F6',
            marginBottom: 8,
          }}
        />
      ))}
    </ViewComponent>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const notice: string | undefined = route.params?.notice;
  const noticeShownRef = React.useRef(false);
  const { width } = useWindowDimensions();
  const isSmall = width < 370;

  const [showEdit, setShowEdit] = useState(false);

  const [data, setData] = useState<ProfileDto | null>(null);
  const [myInfo, setMyInfo] = useState<InfoResponse | null>(null);
  const [editData, setEditData] = useState<ProfileDto | null>(null);
  const [editInfo, setEditInfo] = useState<InfoResponse | null>(null);

  const [loadingInfo, setLoadingInfo] = useState(false);
  const [toast, setToast] = useState<{
    title: string;
    subtitle?: string;
    kind?: ToastKind;
  } | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<PickerType>('condition');

  const [conditions, setConditions] = useState<Condition[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(false);

  const [loginChoiceOpen, setLoginChoiceOpen] = useState(false);
  const [oauthStarting, setOauthStarting] = useState(false);

  const { refresh: refreshHeader, reset: resetHeader } = useHeader();
  const [loggingOut, setLoggingOut] = useState(false);

  // validate theo thời gian thực cho cặp mục tiêu
  const [planTouched, setPlanTouched] = useState(false);
  const [planCheck, setPlanCheck] = useState<PlanCheck>({ ok: true });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const reloadAt: number | undefined = route.params?.reloadAt;

  // ===== Fetch

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setLoadingInfo(true);
      const [conditionRes, allergyRes, myInfoRes] = await Promise.all([
        getAllConditions(signal),
        getAllAllergies(signal),
        getMyInfo(signal),
      ]);

      setConditions(conditionRes);
      setAllergies(allergyRes);
      const info = myInfoRes.data as InfoResponse;
      setMyInfo(info);
      setData(info.profileCreationResponse);
      setEditData(info.profileCreationResponse);
      setEditInfo({
        ...info,
        conditions: [...(info.conditions ?? [])],
        allergies: [...(info.allergies ?? [])],
      });
    } catch (err: any) {
      if (err?.name !== 'CanceledError')
        console.error('❌ fetchData error:', err?.response?.data ?? err);
    } finally {
      setLoading(false);
      setLoadingInfo(false);
    }
  }, []);

  useEffect(() => {
    if (!reloadAt) return;
    const ac = new AbortController();
    fetchData(ac.signal);
    navigation.setParams?.({ reloadAt: undefined });
    return () => ac.abort();
  }, [reloadAt, fetchData, navigation]);

  useEffect(() => {
    if (!notice || noticeShownRef.current) return;
    noticeShownRef.current = true;

    Alert.alert(
      'Tài khoản này đã được dùng',
      notice || 'Tài khoản Google này đã liên kết với user khác.',
      [
        {
          text: 'Hủy',
          style: 'cancel',
          onPress: () => {
            navigation.setParams?.({ notice: undefined });
            noticeShownRef.current = false;
          },
        },
        {
          text: 'Về Welcome để đăng nhập',
          onPress: () => {
            navigation.setParams?.({ notice: undefined });
            noticeShownRef.current = false;
            resetTo('Welcome');
          },
        },
      ],
      { cancelable: true },
    );
  }, [notice, navigation]);

  useEffect(() => {
    const ac = new AbortController();
    fetchData(ac.signal);
    return () => ac.abort();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      const ac = new AbortController();
      fetchData(ac.signal);
      refreshHeader?.();

      return () => ac.abort();
    }, [fetchData, refreshHeader]),
  );

  // ===== Helpers UI
  const showToast = (
    opts: {
      title: string;
      subtitle?: string;
      kind?: ToastKind;
      duration?: number;
    },
    cb?: () => void,
  ) => {
    const { title, subtitle, kind = 'success', duration = 1400 } = opts;
    setToast({ title, subtitle, kind });
    setTimeout(() => {
      setToast(null);
      cb && cb();
    }, duration);
  };

  const onOpenEdit = () => {
    if (data) setEditData({ ...data });
    if (myInfo)
      setEditInfo({
        ...myInfo,
        conditions: [...(myInfo.conditions ?? [])],
        allergies: [...(myInfo.allergies ?? [])],
      });
    setPlanTouched(false);
    setPlanCheck({ ok: true });
    setShowEdit(true);
  };

  // ===== OAuth / Logout
  const provider = myInfo?.provider ?? 'NONE';
  const isGuest = provider === 'NONE';

  const onLoginWith = useCallback(
    async (providerPick: 'google' | 'facebook') => {
      setLoginChoiceOpen(false);
      if (providerPick === 'google') {
        try {
          setOauthStarting(true);
          const deviceId = await getOrCreateDeviceId();
          const res = await startGoogleOAuth(deviceId, true);
          const url = res?.data?.authorizeUrl;
          if (!url) {
            Alert.alert('Lỗi', 'Không nhận được liên kết đăng nhập Google.');
            return;
          }
          await Linking.openURL(url);
        } catch (e) {
          Alert.alert(
            'Lỗi',
            'Không thể bắt đầu đăng nhập Google. Vui lòng thử lại.',
          );
        } finally {
          setOauthStarting(false);
        }
        return;
      }
    },
    [navigation],
  );

  const doLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const cur = await getTokenSecure();
      const refreshToken = cur?.refreshToken;
      if (refreshToken) {
        try {
          await logoutApi({ refreshToken });
        } catch (e) {
          console.warn('logoutApi failed:', e);
        }
      }
    } finally {
      try {
        await removeTokenSecure();
      } catch (e) {
        console.warn('removeTokenSecure failed:', e);
      }
      try {
        (api.defaults.headers.common as any).Authorization = undefined;
      } catch {}

      resetHeader?.();
      setShowLogoutModal(false);
      setLoggingOut(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    }
  };

  const onLogout = () => {
    setShowLogoutModal(true);
  };
  /* ================== Dirty check ================== */
  const isDirty = useMemo(() => {
    if (!data || !editData || !myInfo || !editInfo) return false;

    const fields: (keyof ProfileDto)[] = [
      'name',
      'birthYear',
      'gender',
      'heightCm',
      'weightKg',
      'goal',
      'activityLevel',
      'targetWeightDeltaKg',
      'targetDurationWeeks',
    ];

    for (const k of fields) {
      // so sánh đặc biệt cho delta: editData đang lưu số dương khi nhập
      if (k === 'targetWeightDeltaKg') {
        const dispOrig = formatTargetDeltaForDisplay(
          data.goal,
          data.targetWeightDeltaKg || 0,
        );
        const dispEdit = formatTargetDeltaForDisplay(
          editData.goal,
          editData.targetWeightDeltaKg || 0,
        );
        if (Number(dispOrig) !== Number(dispEdit)) return true;
        continue;
      }
      if ((data as any)[k] !== (editData as any)[k]) return true;
    }

    const origCondIds = (myInfo.conditions ?? [])
      .map(c => c.id ?? c.id ?? c)
      .sort();
    const editCondIds = (editInfo.conditions ?? [])
      .map(c => c.id ?? c.id ?? c)
      .sort();
    if (JSON.stringify(origCondIds) !== JSON.stringify(editCondIds))
      return true;

    const origAlgIds = (myInfo.allergies ?? [])
      .map(a => a.id ?? a.id ?? a)
      .sort();
    const editAlgIds = (editInfo.allergies ?? [])
      .map(a => a.id ?? a.id ?? a)
      .sort();
    if (JSON.stringify(origAlgIds) !== JSON.stringify(editAlgIds)) return true;

    return false;
  }, [data, editData, myInfo, editInfo]);

  /* ================== Validate tổng hợp ================== */
  const { blockingErrors, warnings } = useMemo(() => {
    const errs: string[] = [];
    const warns: string[] = [];

    if (!editData) return { blockingErrors: errs, warnings: warns };
    // Name
    if (isDirty) {
      const nameTrim = (editData.name ?? '').trim();
      if (!nameTrim) errs.push('Tên không được để trống.');
    }
    // Age
    if (isDirty && editData) {
      const birthYearNum =
        typeof editData.birthYear === 'number'
          ? editData.birthYear
          : parseInt((editData.birthYear as unknown as string) || '0', 10);
      const age = Number.isFinite(birthYearNum) ? calcAge(birthYearNum) : NaN;

      if (!Number.isFinite(age) || (age as number) < MIN_AGE) {
        errs.push(`Tuổi phải từ ${MIN_AGE} trở lên.`);
      }
    }

    // Height
    if (isDirty) {
      const h = Number(editData.heightCm);
      if (!Number.isFinite(h) || h < HEIGHT_RANGE.MIN || h > HEIGHT_RANGE.MAX) {
        errs.push(
          `Chiều cao phải trong khoảng ${HEIGHT_RANGE.MIN}–${HEIGHT_RANGE.MAX} cm.`,
        );
      }
    }

    // Weight
    if (isDirty) {
      const w = Number(editData.weightKg);
      if (!Number.isFinite(w) || w < WEIGHT_RANGE.MIN || w > WEIGHT_RANGE.MAX) {
        errs.push(
          `Cân nặng phải trong khoảng ${WEIGHT_RANGE.MIN}–${WEIGHT_RANGE.MAX} kg.`,
        );
      }
    }

    // Goal LOSE/GAIN -> validate biến động/tuần
    if (editData.goal !== 'MAINTAIN') {
      const deltaAbs = Math.abs(Number(editData.targetWeightDeltaKg ?? 0));
      const weeks = Math.abs(Number(editData.targetDurationWeeks ?? 0));

      const v = validatePlan(
        editData.goal as 'LOSE' | 'GAIN',
        deltaAbs,
        weeks,
        planTouched,
      );

      if (!v.ok) {
        if (v.reason === 'too_fast' || v.reason === 'invalid') {
          errs.push(v.message + (v.subMessage ? ` ${v.subMessage}` : ''));
        } else if (v.reason === 'too_slow') {
          warns.push(v.message + (v.subMessage ? ` ${v.subMessage}` : ''));
        }
      }
    }

    return { blockingErrors: errs, warnings: warns };
  }, [editData, planTouched, isDirty]);

  // hiển thị hint WHO khi hợp lệ và có kế hoạch giảm cân
  const showWhoHint =
    !!editData && editData.goal === 'LOSE' && blockingErrors.length === 0;

  // Disable Lưu khi: chưa dirty OR có lỗi chặn
  const saveDisabled = !isDirty || blockingErrors.length > 0;

  /* ================== Realtime plan validate effect ================== */
  useEffect(() => {
    if (!editData || editData.goal === 'MAINTAIN') {
      setPlanCheck({ ok: true });
      return;
    }
    const deltaAbs = Math.abs(Number(editData.targetWeightDeltaKg ?? 0));
    const weeks = Math.abs(Number(editData.targetDurationWeeks ?? 0));
    const v = validatePlan(
      editData.goal as 'LOSE' | 'GAIN',
      deltaAbs,
      weeks,
      planTouched,
    );

    setPlanCheck(v);
  }, [
    editData?.goal,
    editData?.targetWeightDeltaKg,
    editData?.targetDurationWeeks,
    planTouched,
  ]);

  /* ================== Save handlers ================== */
  const handleSaveCore = useCallback(async () => {
    if (!editData || !editInfo) return;

    const conditionIds: string[] = (editInfo.conditions ?? []).map(
      (x: any) => x?.id ?? x?.conditionId ?? x,
    );
    const allergyIds: string[] = (editInfo.allergies ?? []).map(
      (x: any) => x?.id ?? x?.allergyId ?? x,
    );

    const normalizedDelta = normalizeTargetDeltaForApi(
      editData.goal,
      Number(editData.targetWeightDeltaKg || 0),
    );

    const payload: UpdateRequest = {
      profile: {
        id: editData.id,
        heightCm: editData.heightCm,
        weightKg: editData.weightKg,
        targetWeightDeltaKg: normalizedDelta,
        targetDurationWeeks: editData.targetDurationWeeks,
        gender: editData.gender,
        birthYear: editData.birthYear,
        goal: editData.goal,
        activityLevel: editData.activityLevel,
        name: (editData.name ?? '').trim(),
      },
      conditions: conditionIds,
      allergies: allergyIds,
      startDate: toYMDLocal(new Date()),
    };

    setLoading(true);
    const ac = new AbortController();
    try {
      // 1) Gọi API update
      await updateProfile(payload, ac.signal);

      // 2) Lấy lại dữ liệu mới nhất từ backend (trong đó có goalReached mới)
      await fetchData();

      // 3) Refresh header (nếu có)
      await refreshHeader?.();

      // 4) Toast + đóng form
      showToast(
        {
          title: 'Đã lưu thay đổi',
          subtitle: 'Hồ sơ đã được cập nhật.',
        },
        () => setShowEdit(false),
      );
    } catch (err: any) {
      Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [editData, editInfo, refreshHeader, fetchData]);

  const handleSave = useCallback(async () => {
    if (saveDisabled) return; // an toàn
    // nếu quá chậm (warning) vẫn cho lưu
    if (!planCheck.ok && planCheck.reason === 'too_fast') {
      Alert.alert(
        'Điều chỉnh mục tiêu',
        planCheck.message +
          (planCheck.subMessage ? `\n${planCheck.subMessage}` : ''),
      );
      return;
    }
    await handleSaveCore();
  }, [saveDisabled, planCheck, handleSaveCore]);

  /* ================== UI ================== */
  return (
    <Container>
      {loading && <ActivityIndicator size="large" color="#22C55E" />}

      <LoadingOverlay
        visible={loadingInfo || oauthStarting || loggingOut}
        label={
          oauthStarting
            ? 'Đang mở Google...'
            : loggingOut
            ? 'Đang đăng xuất...'
            : 'Đang đồng bộ...'
        }
      />

      <ToastCenter
        visible={!!toast}
        title={toast?.title ?? ''}
        subtitle={toast?.subtitle}
        kind={toast?.kind ?? 'success'}
      />

      <AppHeader
        loading={loading}
        onBellPress={() => navigation.navigate('Notification')}
      />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Grid info */}
        {!data && loading ? (
          <>
            <SkeletonRow />
            <SkeletonCard />
          </>
        ) : (
          <ViewComponent row wrap mt={20} mb={4} gap={0}>
            {data && !showEdit ? (
              <>
                <InfoItem
                  icon="calendar"
                  label="Tuổi"
                  value={`${calcAge(data.birthYear)}`}
                />
                <InfoItem
                  icon="gender-male-female"
                  label="Giới tính"
                  value={displayGender(data.gender)}
                />
                <InfoItem
                  icon="human-male-height"
                  label="Chiều cao"
                  value={`${data.heightCm} cm`}
                />
                <InfoItem
                  icon="weight-kilogram"
                  label="Cân nặng"
                  value={`${data.weightKg} kg`}
                />
                <InfoItem
                  icon="bullseye-arrow"
                  label="Mục tiêu"
                  value={translateGoal(data.goal)}
                />
                <InfoItem
                  icon="run-fast"
                  label="Mức độ vận động"
                  value={translateActivityLevel(data.activityLevel)}
                />
                <InfoItem
                  icon="hospital-box-outline"
                  label="Bệnh nền"
                  value={`${getConditionNames(myInfo?.conditions ?? [])}`}
                />
                <InfoItem
                  icon="allergy"
                  label="Dị ứng"
                  value={`${getAllergyNames(myInfo?.allergies ?? [])}`}
                />

                <TextComponent
                  text="Mục tiêu chi tiết"
                  variant="subtitle"
                  weight="bold"
                  style={{
                    width: '100%',
                    marginTop: 12,
                    marginBottom: 16,
                    marginLeft: 10,
                  }}
                />
                <InfoItem
                  icon="scale-bathroom"
                  label="Mức thay đổi cân nặng"
                  value={`${formatTargetDeltaForDisplay(
                    data.goal as any,
                    data.targetWeightDeltaKg,
                  )} kg`}
                />
                <InfoItem
                  icon="calendar-clock"
                  label="Thời gian đạt mục tiêu"
                  value={`${data.targetDurationWeeks} tuần`}
                />
              </>
            ) : null}
          </ViewComponent>
        )}
        {!showEdit &&
          data &&
          (() => {
            const goalIsChange = data.goal === 'LOSE' || data.goal === 'GAIN';
            const achieved = goalIsChange && data.goalReached === true;

            return (
              <ViewComponent
                style={[
                  styles.tipCard,
                  achieved && {
                    borderColor: C.success,
                    backgroundColor: '#ECFDF5',
                  },
                ]}
                row
                alignItems="center"
                gap={10}
              >
                <McIcon
                  name={achieved ? 'party-popper' : 'lightbulb-on-outline'}
                  size={18}
                  color={achieved ? C.success : C.info}
                />
                <TextComponent
                  text={
                    achieved
                      ? `🎉 Chúc mừng! Bạn đã đạt mục tiêu ${translateGoal(
                          data.goal,
                        )}. Hãy cập nhật mục tiêu mới (ví dụ: tiếp tục ${
                          data.goal === 'LOSE' ? 'giảm' : 'tăng'
                        } chậm hơn, hoặc chuyển sang DUY TRÌ) để giữ đà tiến bộ.`
                      : 'Nên cập nhật cân nặng mỗi tuần để kiểm tra tiến độ và tạo kế hoạch chính xác hơn.'
                  }
                  style={{ flex: 1 }}
                />
                {achieved && (
                  <Pressable
                    onPress={() => setShowEdit(true)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      backgroundColor: C.success,
                      borderRadius: 999,
                    }}
                  >
                    <TextComponent
                      text="Cập nhật mục tiêu"
                      tone="inverse"
                      weight="bold"
                      size={12}
                    />
                  </Pressable>
                )}
              </ViewComponent>
            );
          })()}

        {/* Form edit */}
        {showEdit && editData ? (
          <ViewComponent style={{ marginTop: 10 }}>
            <TextComponent
              text="Chỉnh Sửa Thông Tin"
              variant="subtitle"
              weight="bold"
              style={{ marginBottom: 12 }}
            />

            <ViewComponent row gap={12} mb={12}>
              <FormField
                icon="card-account-details-outline"
                label="Tên"
                style={styles.half}
              >
                <TextInput
                  value={editData.name}
                  onChangeText={t => setEditData({ ...editData, name: t })}
                  placeholder="Nhập họ tên"
                  style={styles.input}
                  placeholderTextColor={C.slate500}
                />
              </FormField>

              <FormField icon="calendar" label="Tuổi" style={styles.half}>
                <TextInput
                  value={`${calcAge(editData.birthYear)}`}
                  keyboardType="number-pad"
                  onChangeText={t =>
                    setEditData({
                      ...editData,
                      birthYear:
                        new Date().getFullYear() - parseInt(t || '0', 10),
                    })
                  }
                  placeholder="VD: 25"
                  style={styles.input}
                  placeholderTextColor={C.slate500}
                />
              </FormField>
            </ViewComponent>

            <ViewComponent row gap={12} mb={12}>
              <FormField
                icon="gender-male-female"
                label="Giới tính"
                style={styles.half}
              >
                <Dropdown
                  value={editData.gender}
                  options={GENDER_OPTIONS}
                  onChange={v =>
                    setEditData({
                      ...editData,
                      gender: v as typeof editData.gender,
                    })
                  }
                />
              </FormField>

              <FormField
                icon="human-male-height"
                label="Chiều cao (cm)"
                style={styles.half}
              >
                <TextInput
                  value={editData.heightCm ? `${editData.heightCm}` : ''}
                  keyboardType="number-pad"
                  onChangeText={t =>
                    setEditData({
                      ...editData,
                      heightCm: parseInt(t || '0', 10),
                    })
                  }
                  placeholder="VD: 175"
                  style={styles.input}
                  placeholderTextColor={C.slate500}
                />
              </FormField>
            </ViewComponent>

            <ViewComponent row gap={12} mb={12}>
              <FormField
                icon="weight-kilogram"
                label="Cân nặng (kg)"
                style={styles.half}
              >
                <TextInput
                  value={editData.weightKg ? `${editData.weightKg}` : ''}
                  keyboardType="number-pad"
                  onChangeText={t =>
                    setEditData({
                      ...editData,
                      weightKg: parseInt(t || '0', 10),
                    })
                  }
                  placeholder="VD: 70"
                  style={styles.input}
                  placeholderTextColor={C.slate500}
                />
              </FormField>

              <FormField
                icon="bullseye-arrow"
                label="Mục tiêu"
                style={styles.half}
              >
                <Dropdown
                  value={editData.goal}
                  options={GOAL_OPTIONS}
                  onChange={v => {
                    const nextGoal = v as typeof editData.goal;
                    setEditData(prev => ({
                      ...prev!,
                      goal: nextGoal,
                      ...(nextGoal === 'MAINTAIN'
                        ? { targetWeightDeltaKg: 0, targetDurationWeeks: 0 }
                        : {}),
                    }));
                  }}
                />
              </FormField>
            </ViewComponent>

            <ViewComponent row gap={12} mb={12}>
              <FormField
                icon="run-fast"
                label="Mức độ vận động"
                style={styles.half}
              >
                <Dropdown
                  value={editData.activityLevel}
                  options={ACTIVITY_OPTIONS}
                  onChange={v =>
                    setEditData({
                      ...editData,
                      activityLevel: v as typeof editData.activityLevel,
                    })
                  }
                />
              </FormField>
              <ViewComponent style={styles.halfPlaceholder} />
            </ViewComponent>

            <ViewComponent row gap={12} mb={8}>
              <FormField
                icon="hospital-box-outline"
                label="Bệnh nền"
                style={styles.half}
              >
                <Pressable
                  onPress={() => {
                    setPickerType('condition');
                    setPickerOpen(true);
                  }}
                >
                  <ViewComponent
                    style={[
                      styles.input,
                      {
                        minHeight: 46,
                        paddingVertical: 0,
                        justifyContent: 'center',
                      },
                    ]}
                  >
                    <TextComponent
                      text={
                        getConditionNames(editInfo?.conditions ?? []) ||
                        'VD: Tăng huyết áp, Tiểu đường'
                      }
                      weight="bold"
                      tone={
                        getConditionNames(editInfo?.conditions ?? [])
                          ? 'default'
                          : 'muted'
                      }
                      numberOfLines={2}
                      ellipsizeMode="tail"
                      style={{ includeFontPadding: false }}
                    />
                  </ViewComponent>
                </Pressable>
              </FormField>

              <FormField icon="allergy" label="Dị ứng" style={styles.half}>
                <Pressable
                  onPress={() => {
                    setPickerType('allergy');
                    setPickerOpen(true);
                  }}
                >
                  <ViewComponent
                    style={[
                      styles.input,
                      {
                        minHeight: 46,
                        paddingVertical: 0,
                        justifyContent: 'center',
                      },
                    ]}
                  >
                    <TextComponent
                      text={
                        getAllergyNames(editInfo?.allergies ?? []) ||
                        'VD: Hải sản, Sữa bò'
                      }
                      weight="bold"
                      tone={
                        getAllergyNames(editInfo?.allergies ?? [])
                          ? 'default'
                          : 'muted'
                      }
                      numberOfLines={2}
                      ellipsizeMode="tail"
                      style={{ includeFontPadding: false }}
                    />
                  </ViewComponent>
                </Pressable>
              </FormField>
            </ViewComponent>

            {editData.goal !== 'MAINTAIN' && (
              <>
                <ViewComponent row gap={12} mb={8}>
                  <FormField
                    icon="scale-bathroom"
                    label="Mức thay đổi cân nặng (kg)"
                    style={isSmall ? styles.full : styles.half}
                  >
                    <TextInput
                      value={
                        editData.targetWeightDeltaKg !== undefined &&
                        editData.targetWeightDeltaKg !== null
                          ? `${formatTargetDeltaForDisplay(
                              editData.goal as any,
                              Number(editData.targetWeightDeltaKg),
                            )}`
                          : ''
                      }
                      onChangeText={t => {
                        setPlanTouched(true);
                        setEditData(prev => ({
                          ...prev!,
                          targetWeightDeltaKg: Math.abs(parseFloat(t || '0')),
                        }));
                      }}
                      style={styles.input}
                      placeholderTextColor={C.slate500}
                    />
                  </FormField>

                  <FormField
                    icon="calendar-clock"
                    label="Thời gian đạt mục tiêu (tuần)"
                    style={isSmall ? styles.full : styles.half}
                  >
                    <TextInput
                      value={
                        editData.targetDurationWeeks
                          ? `${editData.targetDurationWeeks}`
                          : ''
                      }
                      onChangeText={t => {
                        setPlanTouched(true);
                        setEditData(prev => ({
                          ...prev!,
                          targetDurationWeeks: Math.abs(parseFloat(t || '0')),
                        }));
                      }}
                      style={styles.input}
                      placeholderTextColor={C.slate500}
                    />
                  </FormField>
                </ViewComponent>

                {/* Thông báo lỗi/cảnh báo tổng hợp */}
                {(blockingErrors.length > 0 || warnings.length > 0) && (
                  <ViewComponent
                    style={{
                      marginTop: 2,
                      marginBottom: 10,
                      padding: 10,
                      borderRadius: 12,
                      backgroundColor:
                        blockingErrors.length > 0 ? '#FEE2E2' : '#FEF3C7',
                      borderWidth: 1,
                      borderColor:
                        blockingErrors.length > 0 ? '#FCA5A5' : '#FCD34D',
                    }}
                  >
                    {blockingErrors.map((m, i) => (
                      <TextComponent
                        key={`e-${i}`}
                        variant="caption"
                        weight="bold"
                        style={{ marginBottom: 4 }}
                        text={`⚠️ ${m}`}
                      />
                    ))}
                    {warnings.map((m, i) => (
                      <TextComponent
                        key={`w-${i}`}
                        variant="caption"
                        tone="muted"
                        text={`ℹ️ ${m}`}
                      />
                    ))}
                  </ViewComponent>
                )}

                {/* Hint WHO/FAO khi hợp lệ */}
                {showWhoHint && (
                  <TextComponent
                    variant="caption"
                    tone="muted"
                    style={{ marginTop: -2, marginBottom: 8 }}
                    text="Lưu ý: WHO/FAO khuyến nghị không cắt quá 1000 kcal/ngày và không xuống dưới ~1200 kcal/ngày (nữ), ~1500 kcal/ngày (nam)."
                  />
                )}
              </>
            )}

            <ViewComponent row gap={10} mt={6}>
              <Pressable
                style={[
                  styles.saveBtn,
                  (saveDisabled || !isDirty) && { opacity: 0.5 },
                ]}
                onPress={handleSave}
                disabled={saveDisabled}
              >
                <TextComponent
                  text="Lưu Thay Đổi"
                  tone="inverse"
                  weight="bold"
                />
              </Pressable>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setShowEdit(false)}
              >
                <TextComponent text="Hủy" weight="bold" />
              </Pressable>
            </ViewComponent>
          </ViewComponent>
        ) : null}

        {/* Actions */}
        <ViewComponent row mt={12} mb={14}>
          {!showEdit && (
            <Pressable style={styles.primaryBtn} onPress={onOpenEdit}>
              <McIcon name="pencil" size={18} color={C.black} />
              <TextComponent text="Chỉnh Sửa Hồ Sơ" weight="bold" />
            </Pressable>
          )}
        </ViewComponent>

        {/* Cài đặt */}
        <ViewComponent variant="card" style={styles.settingsCard}>
          <TextComponent
            text="Cài đặt chung"
            variant="subtitle"
            weight="bold"
            style={{ marginBottom: 12 }}
          />
          {isGuest ? (
            <Pressable
              style={[styles.settingRowPress]}
              onPress={() => onLoginWith('google')}
            >
              <ViewComponent
                row
                alignItems="center"
                gap={10}
                style={{ flexShrink: 1 }}
              >
                <ViewComponent
                  center
                  style={[styles.settingIcon, { backgroundColor: '#fee2e2' }]}
                >
                  <Image
                    source={require('../assets/images/common/gg.png')}
                    style={[{ width: 24, height: 24 }]}
                    resizeMode="contain"
                    accessibilityLabel="Google logo"
                  />
                </ViewComponent>
                <ViewComponent>
                  <TextComponent
                    text="Đăng nhập với Google"
                    weight="semibold"
                    color={C.text}
                    style={{ marginBottom: 5 }}
                  />
                  <TextComponent
                    text="Đồng bộ & lưu trữ dữ liệu khi đổi thiết bị"
                    variant="caption"
                    tone="muted"
                  />
                </ViewComponent>
              </ViewComponent>
            </Pressable>
          ) : (
            <Pressable style={[styles.settingRowPress]} onPress={onLogout}>
              <ViewComponent
                row
                alignItems="center"
                gap={10}
                style={{ flex: 1, minWidth: 0 }}
              >
                <ViewComponent
                  center
                  style={[styles.settingIcon, { backgroundColor: '#ebf5ff' }]}
                >
                  <McIcon name="logout" size={16} color={C.red} />
                </ViewComponent>
                <TextComponent
                  text="Đăng xuất"
                  weight="semibold"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  color={C.red}
                />
              </ViewComponent>
            </Pressable>
          )}
        </ViewComponent>
      </ScrollView>

      {/* Picker Modal */}
      {pickerType === 'condition' ? (
        <MultiSelectModal<UserConditionResponse>
          visible={pickerOpen}
          title="Chọn bệnh nền"
          onClose={() => setPickerOpen(false)}
          options={conditions}
          value={editInfo?.conditions ?? []}
          onSave={selected =>
            setEditInfo(prev =>
              prev ? { ...prev, conditions: selected } : prev,
            )
          }
        />
      ) : (
        <MultiSelectModal<UserAllergyResponse>
          visible={pickerOpen}
          title="Chọn dị ứng"
          onClose={() => setPickerOpen(false)}
          options={allergies}
          value={editInfo?.allergies ?? []}
          onSave={selected =>
            setEditInfo(prev =>
              prev ? { ...prev, allergies: selected } : prev,
            )
          }
        />
      )}
      <LoginChoiceModal
        visible={loginChoiceOpen}
        onClose={() => setLoginChoiceOpen(false)}
        onSelect={onLoginWith}
      />
      {/* Modal xác nhận đăng xuất */}
      <ConfirmLogoutModal
        visible={showLogoutModal}
        loading={loggingOut}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={doLogout}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, borderRadius: 16, marginTop: 20 },
  scrollContent: { paddingBottom: 28 },
  half: { width: '48%' },
  full: { width: '100%' },
  halfPlaceholder: { width: '48%', opacity: 0 },

  input: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.slate200,
    paddingHorizontal: 12,
    backgroundColor: C.white,
    color: C.text,
    fontWeight: '700',
  },

  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    backgroundColor: C.blueLight,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: C.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    width: 110,
    height: 46,
    borderRadius: 12,
    backgroundColor: C.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingsCard: { marginTop: 16, padding: 14, borderRadius: 18 },
  settingIcon: {
    width: 24,
    height: 25,
    borderRadius: 999,
    backgroundColor: C.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingRowPress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.slate100,
  },
  tipCard: {
    borderWidth: 1,
    borderColor: C.primaryBorder,
    backgroundColor: C.primarySurface,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 4,
  },
});

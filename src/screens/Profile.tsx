import React, { useState, useEffect, useCallback } from 'react';
import {
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
  Linking,
  useWindowDimensions,
} from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';
import { useNavigation } from '@react-navigation/native';
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
import {
  startGoogleOAuth,
  logout as logoutApi,
} from '../services/auth.service'; // 👈 thêm import logout
import { getAllConditions } from '../services/condition.service';
import { getAllAllergies } from '../services/allergy.service';
import { getMyInfo, updateProfile } from '../services/user.service';
import { getOrCreateDeviceId } from '../config/deviceId';
import { useHeader } from '../context/HeaderProvider';
import { getTokenSecure, removeTokenSecure } from '../config/secureToken'; // 👈 cần để lấy refreshToken & fallback xoá local

type PickerType = 'condition' | 'allergy';

// ===== Helpers =====
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

type PickerType = 'condition' | 'allergy';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isSmall = width < 370;

  const [showEdit, setShowEdit] = useState(false);

  const [data, setData] = useState<ProfileDto | null>(null);
  const [myInfo, setMyInfo] = useState<InfoResponse | null>(null);
  const [editData, setEditData] = useState<ProfileDto | null>(null);
  const [editInfo, setEditInfo] = useState<InfoResponse | null>(null);

  const [loadingInfo, setLoadingInfo] = useState(false);
  const [allowNotif, setAllowNotif] = useState<boolean>(true);
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

  // OAuth
  const [loginChoiceOpen, setLoginChoiceOpen] = useState(false);
  const [oauthStarting, setOauthStarting] = useState(false);

  // ✅ hook để làm mới/clear header sau khi update / logout
  const { refresh: refreshHeader, reset: resetHeader } = useHeader();

  // ====== thêm trạng thái để hiện overlay khi đang logout ======
  const [loggingOut, setLoggingOut] = useState(false);

  // Gộp tất cả API
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
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

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
    setShowEdit(true);
  };

  // ====== Đăng xuất: gọi API logout với refreshToken trong Keychain ======
  const onLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              const cur = await getTokenSecure();
              const refreshToken = cur?.refreshToken;

              if (refreshToken) {
                // Gọi BE để thu hồi refresh token family
                await logoutApi({ refreshToken });
              } else {
                // Không có refresh token => xoá local cho sạch (phòng trường hợp lỗi trước đó)
                await removeTokenSecure();
              }

              // Clear header context dùng chung
              resetHeader?.();

              showToast(
                {
                  title: 'Đăng xuất thành công',
                  subtitle: 'Hẹn gặp lại bạn sớm nhé!',
                },
                () =>
                  navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] }),
              );
            } catch (e) {
              // Dù BE lỗi, vẫn xoá token local để đảm bảo người dùng đã đăng xuất ở client
              await removeTokenSecure();
              resetHeader?.();
              Alert.alert('Thông báo', 'Đã đăng xuất ở phía thiết bị.');
              navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const openPicker = (type: PickerType) => {
    setPickerType(type);
    setPickerOpen(true);
  };

  // ====== Hiển thị nút theo provider ======
  const provider = myInfo?.provider ?? 'NONE';
  const isGuest = provider === 'NONE';
  const isLoggedIn =
    provider === 'SUPABASE_GOOGLE' || provider === 'SUPABASE_FACEBOOK';

  // Login
  const onLoginWith = useCallback(
    async (providerPick: 'google' | 'facebook') => {
      setLoginChoiceOpen(false);

      if (providerPick === 'google') {
        try {
          setOauthStarting(true);
          const deviceId = await getOrCreateDeviceId();
          const res = await startGoogleOAuth(deviceId);
          const url = res?.data?.authorizeUrl;
          if (!url) {
            Alert.alert('Lỗi', 'Không nhận được liên kết đăng nhập Google.');
            return;
          }
          await Linking.openURL(url);
        } catch (e) {
          console.log('startGoogleOAuth error:', e);
          Alert.alert(
            'Lỗi',
            'Không thể bắt đầu đăng nhập Google. Vui lòng thử lại.',
          );
        } finally {
          setOauthStarting(false);
        }
        return;
      }

      navigation.navigate('Login', { provider: 'facebook' });
    },
    [navigation],
  );

  // ====== Lưu thay đổi: gọi API update + refresh header ======
  const handleSave = useCallback(async () => {
    if (!editData || !editInfo) {
      console.log('Thiếu dữ liệu editData/editInfo để build UpdateRequest');
      return;
    }

    const conditionIds: string[] = (editInfo.conditions ?? []).map(
      (x: any) => x?.id ?? x?.conditionId ?? x,
    );
    const allergyIds: string[] = (editInfo.allergies ?? []).map(
      (x: any) => x?.id ?? x?.allergyId ?? x,
    );

    // Chuẩn hóa delta theo goal cho API
    const normalizedDelta = normalizeTargetDeltaForApi(
      editData.goal,
      Number(editData.targetWeightDeltaKg || 0),
    );

    const payload: UpdateRequest = {
      profile: {
        id: editData.id,
        heightCm: editData.heightCm,
        weightKg: editData.weightKg,
        targetWeightDeltaKg: normalizedDelta, // 👈 nếu LOSE luôn là số âm
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
      await updateProfile(payload, ac.signal);

      // ✅ Optimistic update local UI
      setData(prev =>
        prev
          ? { ...prev, ...payload.profile }
          : (payload.profile as ProfileDto),
      );
      setMyInfo(prev =>
        prev
          ? {
              ...prev,
              profileCreationResponse: {
                ...(prev.profileCreationResponse ?? {}),
                ...payload.profile,
              } as ProfileDto,
              conditions: editInfo.conditions ?? [],
              allergies: editInfo.allergies ?? [],
            }
          : prev,
      );

      // ✅ Refresh lại header dùng chung (avatar/tên)
      await refreshHeader();

      showToast(
        {
          title: 'Đã lưu thay đổi',
          subtitle: 'Hồ sơ và tiêu đề đã được cập nhật.',
        },
        () => setShowEdit(false),
      );
    } catch (err: any) {
      console.log('updateProfile error:', err?.response?.data ?? err);
      Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [editData, editInfo, refreshHeader]);

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

      {/* Header dùng chung */}
      <AppHeader
        loading={loading}
        onPressBell={() => navigation.navigate('Notification')}
      />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Grid info */}
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
              <InfoItem icon="scale-bathroom" label="Mức thay đổi cân nặng" value={`${data.targetWeightDeltaKg} kg`} />
              <InfoItem icon="calendar-clock" label="Thời gian đạt mục tiêu" value={`${data.targetDurationWeeks} tuần`} />
            </>
          ) : null}
        </ViewComponent>

        {/* Form edit */}
        {showEdit && editData ? (
          <ViewComponent style={{ marginTop: 10 }}>
            <TextComponent text="Chỉnh Sửa Thông Tin" variant="subtitle" weight="bold" style={{ marginBottom: 12 }} />

            <ViewComponent row gap={12} mb={12}>
              <FormField icon="card-account-details-outline" label="Tên" style={styles.half}>
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
              <FormField icon="gender-male-female" label="Giới tính" style={styles.half}>
                <Dropdown
                  value={editData.gender}
                  options={GENDER_OPTIONS}
                  onChange={v => setEditData({ ...editData, gender: v as typeof editData.gender })}
                />
              </FormField>

              <FormField icon="human-male-height" label="Chiều cao (cm)" style={styles.half}>
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
              <FormField icon="weight-kilogram" label="Cân nặng (kg)" style={styles.half}>
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

              <FormField icon="bullseye-arrow" label="Mục tiêu" style={styles.half}>
                <Dropdown
                  value={editData.goal}
                  options={GOAL_OPTIONS}
                  onChange={v => {
                    const nextGoal = v as typeof editData.goal;
                    setEditData(prev => ({
                      ...prev!,
                      goal: nextGoal,
                      ...(nextGoal === 'MAINTAIN' ? { targetWeightDeltaKg: 0, targetDurationWeeks: 0 } : {}),
                    }));
                  }}
                />
              </FormField>
            </ViewComponent>

            <ViewComponent row gap={12} mb={12}>
              <FormField icon="run-fast" label="Mức độ vận động" style={styles.half}>
                <Dropdown
                  value={editData.activityLevel}
                  options={ACTIVITY_OPTIONS}
                  onChange={v => setEditData({ ...editData, activityLevel: v as typeof editData.activityLevel })}
                />
              </FormField>
              <ViewComponent style={styles.halfPlaceholder} />
            </ViewComponent>

            <ViewComponent row gap={12} mb={12}>
              <FormField icon="hospital-box-outline" label="Bệnh nền" style={styles.half}>
                <Pressable onPress={() => openPicker('condition')}>
                  <ViewComponent
                    style={[
                      styles.input,
                      { height: undefined, minHeight: 46, paddingVertical: 10, justifyContent: 'center' },
                    ]}
                  >
                    <TextComponent
                      text={getConditionNames(editInfo?.conditions ?? []) || 'VD: Tăng huyết áp, Tiểu đường'}
                      weight="bold"
                      tone={getConditionNames(editInfo?.conditions ?? []) ? 'default' : 'muted'}
                      numberOfLines={3}
                      ellipsizeMode="tail"
                      style={{ flexWrap: 'wrap', minHeight: 65 }}
                    />
                  </ViewComponent>
                </Pressable>
              </FormField>

              <FormField icon="allergy" label="Dị ứng" style={styles.half}>
                <Pressable onPress={() => openPicker('allergy')}>
                  <ViewComponent
                    style={[
                      styles.input,
                      { height: undefined, minHeight: 46, paddingVertical: 10, justifyContent: 'center' },
                    ]}
                  >
                    <TextComponent
                      text={getAllergyNames(editInfo?.allergies ?? []) || 'VD: Hải sản, Sữa bò'}
                      weight="bold"
                      tone={getAllergyNames(editInfo?.allergies ?? []) ? 'default' : 'muted'}
                      numberOfLines={3}
                      ellipsizeMode="tail"
                      style={{ flexWrap: 'wrap', minHeight: 65 }}
                    />
                  </ViewComponent>
                </Pressable>
              </FormField>
            </ViewComponent>

            {editData.goal !== 'MAINTAIN' && (
              <ViewComponent row gap={12} mb={12}>
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
                    onChangeText={t =>
                      setEditData(prev => ({
                        ...prev!,
                        // lưu dương; khi gửi sẽ chuẩn hóa dấu theo goal
                        targetWeightDeltaKg: Math.abs(parseFloat(t || '0')),
                      }))
                    }
                    placeholder="Nhập mức thay đổi cân nặng"
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
                    value={editData.targetDurationWeeks ? `${editData.targetDurationWeeks}` : ''}
                    onChangeText={t =>
                      setEditData(prev => ({
                        ...prev!,
                        targetDurationWeeks: parseFloat(t || '0'),
                      }))
                    }
                    placeholder="Nhập thời gian đạt mục tiêu"
                    style={styles.input}
                    placeholderTextColor={C.slate500}
                  />
                </FormField>
              </ViewComponent>
            )}

            <ViewComponent row gap={10} mt={6}>
              <Pressable style={styles.saveBtn} onPress={handleSave}>
                <TextComponent
                  text="Lưu Thay Đổi"
                  tone="inverse"
                  weight="bold"
                />
              </Pressable>
              <Pressable style={styles.cancelBtn} onPress={() => setShowEdit(false)}>
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
          <TextComponent text="Cài đặt chung" variant="subtitle" weight="bold" style={{ marginBottom: 12 }} />

          <ViewComponent row alignItems="center" justifyContent="space-between" py={10}>
            <ViewComponent row alignItems="center" gap={10} style={{ flexShrink: 1 }}>
              <ViewComponent center style={styles.settingIcon}>
                <McIcon name="bell-outline" size={16} color={C.success} />
              </ViewComponent>
              <ViewComponent>
                <TextComponent
                  text="Gửi thông báo"
                  weight="semibold"
                  style={{ marginBottom: 5 }}
                />
                <TextComponent
                  text="Nhận nhắc nhở và cập nhật dinh dưỡng"
                  variant="caption"
                  tone="muted"
                />
              </ViewComponent>
            </ViewComponent>
            <Switch
              value={allowNotif}
              onValueChange={setAllowNotif}
              thumbColor={C.white}
              trackColor={{ false: C.slate200, true: C.greenBorder }}
            />
          </ViewComponent>

          {/* Chỉ hiện khi CHƯA đăng nhập (provider = NONE) */}
          {isGuest && (
            <>
              <Pressable
                style={[styles.settingRowPress]}
                onPress={() => setLoginChoiceOpen(true)}
              >
                <ViewComponent
                  row
                  alignItems="center"
                  gap={10}
                  style={{ flexShrink: 1 }}
                >
                  <ViewComponent
                    center
                    style={[styles.settingIcon, { backgroundColor: '#dcfce7' }]}
                  >
                    <McIcon name="login" size={16} color={C.success} />
                  </ViewComponent>
                  <ViewComponent>
                    <TextComponent
                      text="Đăng nhập ngay"
                      weight="semibold"
                      color={C.success}
                      style={{ marginBottom: 5 }}
                    />
                    <TextComponent
                      text="Đăng nhập để đồng bộ và lưu trữ dữ liệu khi đổi thiết bị"
                      variant="caption"
                      tone="muted"
                    />
                  </ViewComponent>
                </ViewComponent>
                <McIcon name="chevron-right" size={18} color={C.slate500} />
              </Pressable>
            </>
          )}

          {/* Chỉ hiện khi ĐÃ đăng nhập (Google/Facebook) */}
          {isLoggedIn && (
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
                  <McIcon name="logout" size={16} color={C.primary} />
                </ViewComponent>
                <TextComponent
                  text="Đăng xuất"
                  weight="semibold"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                />
              </ViewComponent>
              <McIcon
                name="chevron-right"
                size={18}
                color={C.slate500}
                style={{ marginLeft: 'auto' }}
              />
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
          onSave={selected => setEditInfo(prev => (prev ? { ...prev, conditions: selected } : prev))}
        />
      ) : (
        <MultiSelectModal<UserAllergyResponse>
          visible={pickerOpen}
          title="Chọn dị ứng"
          onClose={() => setPickerOpen(false)}
          options={allergies}
          value={editInfo?.allergies ?? []}
          onSave={selected => setEditInfo(prev => (prev ? { ...prev, allergies: selected } : prev))}
        />
      )}

      <LoginChoiceModal
        visible={loginChoiceOpen}
        onClose={() => setLoginChoiceOpen(false)}
        onSelect={onLoginWith}
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
});

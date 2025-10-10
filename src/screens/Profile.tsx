import React, { useState, useRef, useEffect } from 'react';
import {
  Image,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  Animated,
  Easing,
  Modal,
  Platform,
} from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';
import { useNavigation } from '@react-navigation/native';
import { getMyInfo } from '../services/user.service';
import type { InfoResponse, ProfileDto } from '../types/types';

/** ----------------- Types ----------------- */
type Profile = {
  name: string;
  age: string;
  height: string;
  weight: string;
  gender: 'Nam' | 'Nữ' | 'Khác';
  goal: 'Giảm cân lành mạnh' | 'Giữ cân' | 'Tăng cân';
  activity:
    | 'Ít vận động'
    | 'Vận động nhẹ'
    | 'Vận động vừa'
    | 'Vận động nhiều'
    | 'Rất nhiều';
  illness: string;
  allergy: string;
};

const DEFAULT_PROFILE: Profile = {
  name: 'Anh Hải',
  age: '22',
  height: '168',
  weight: '60',
  gender: 'Nam',
  goal: 'Tăng cân',
  activity: 'Vận động nhẹ',
  illness: 'Không có',
  allergy: 'Không có',
};

const ACTIVITY_OPTIONS: Profile['activity'][] = [
  'Ít vận động',
  'Vận động nhẹ',
  'Vận động vừa',
  'Vận động nhiều',
  'Rất nhiều',
];

/* =======================  ToastCenter  ======================= */
type ToastKind = 'success' | 'danger';

function ToastCenter({
  visible,
  title,
  subtitle,
  kind = 'success',
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  kind?: ToastKind;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 160,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.95,
          duration: 160,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacity, scale]);

  if (!visible) return null;

  const color = kind === 'success' ? C.success : C.red;
  const tint = kind === 'success' ? C.greenSurface : '#fee2e2';

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.toastOverlay, { opacity }]}
    >
      <Animated.View style={[styles.toastCard, { transform: [{ scale }] }]}>
        <ViewComponent row alignItems="center" gap={12} px={16} py={18}>
          <ViewComponent
            center
            style={{
              width: 46,
              height: 46,
              borderRadius: 999,
              backgroundColor: tint,
            }}
          >
            <McIcon
              name={kind === 'success' ? 'check' : 'trash-can-outline'}
              size={26}
              color={color}
            />
          </ViewComponent>

          <ViewComponent flex={1}>
            <TextComponent text={title} variant="h3" />
            {!!subtitle && (
              <TextComponent text={subtitle} variant="caption" tone="muted" />
            )}
          </ViewComponent>
        </ViewComponent>

        <ViewComponent row gap={6} justifyContent="center" pb={14} px={16}>
          <ViewComponent
            style={{
              width: 28,
              height: 4,
              borderRadius: 999,
              backgroundColor: color,
              opacity: 0.25,
            }}
          />
          <ViewComponent
            style={{
              width: 28,
              height: 4,
              borderRadius: 999,
              backgroundColor: color,
              opacity: 0.45,
            }}
          />
          <ViewComponent
            style={{
              width: 28,
              height: 4,
              borderRadius: 999,
              backgroundColor: color,
              opacity: 0.25,
            }}
          />
        </ViewComponent>
      </Animated.View>
    </Animated.View>
  );
}

/* ===== Avatar fallback (đồng bộ MealPlan) ===== */
function HeaderAvatar({
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

  if (photoUri) {
    return <Image source={{ uri: photoUri }} style={styles.headerAvatar} />;
  }

  return (
    <ViewComponent center style={styles.headerAvatarFallback} flex={0}>
      <TextComponent
        text={initials}
        variant="subtitle"
        tone="primary"
        weight="bold"
      />
    </ViewComponent>
  );
}

/* =======================  Screen  ======================= */
export default function ProfileScreen() {
  const [data, setData] = useState<ProfileDto | null>(null);
  const [draft, setDraft] = useState<Profile>(DEFAULT_PROFILE);
  const [showEdit, setShowEdit] = useState(false);
  const [myInfo, setMyInfo] = useState<InfoResponse | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  const [allowNotif, setAllowNotif] = useState<boolean>(true);
  const navigation = useNavigation<any>();
  const [toast, setToast] = useState<{
    title: string;
    subtitle?: string;
    kind?: ToastKind;
  } | null>(null);

  // Picker state
  const SUGGESTED_ILLNESSES = [
    'Tăng huyết áp',
    'Đái tháo đường',
    'Tim mạch',
    'Hen suyễn',
    'Rối loạn mỡ máu',
    'Suy giáp',
    'Cường giáp',
    'Loét dạ dày',
    'Viêm đại tràng',
    'Gout',
    'Bệnh thận mạn',
    'Gan nhiễm mỡ',
    'Trầm cảm',
    'Lo âu',
  ];
  const SUGGESTED_ALLERGIES = [
    'Hải sản',
    'Sữa bò',
    'Đậu phộng',
    'Trứng',
    'Lúa mì (gluten)',
    'Đậu nành',
    'Mè (vừng)',
    'Tôm cua',
    'Cá',
    'Quả hạch',
  ];

  type PickerType = 'illness' | 'allergy';
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<PickerType>('illness');
  const [pickerSelected, setPickerSelected] = useState<string[]>([]);
  const [pickerSearch, setPickerSearch] = useState('');

  const strToArr = (v: string) =>
    v && v.trim() && v.trim() !== 'Không có'
      ? v
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      : [];
  const arrToStr = (arr: string[]) =>
    arr.length ? arr.join(', ') : 'Không có';

  const normalizeVN = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const openPicker = (type: PickerType) => {
    setPickerType(type);
    const current = type === 'illness' ? draft.illness : draft.allergy;
    setPickerSelected(strToArr(current));
    setPickerSearch('');
    setPickerOpen(true);
  };
  const togglePick = (item: string) =>
    setPickerSelected(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item],
    );
  const applyPicker = () => {
    const value = arrToStr(pickerSelected);
    if (pickerType === 'illness')
      setDraft(prev => ({ ...prev, illness: value }));
    else setDraft(prev => ({ ...prev, allergy: value }));
    setPickerOpen(false);
  };

  const currentOptions =
    pickerType === 'illness' ? SUGGESTED_ILLNESSES : SUGGESTED_ALLERGIES;
  const filteredOptions = pickerSearch.trim()
    ? currentOptions.filter(it =>
        normalizeVN(it).includes(normalizeVN(pickerSearch)),
      )
    : currentOptions;

  // Toast helper
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
    // setDraft(myInfo);
    setShowEdit(true);
  };

  const onLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          showToast(
            {
              title: 'Đăng xuất thành công',
              subtitle: 'Hẹn gặp lại bạn sớm nhé!',
            },
            () => {
              navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
            },
          );
        },
      },
    ]);
  };

  const onDeleteAccount = () => {
    Alert.alert('Xóa tài khoản', 'Bạn có chắc muốn xóa tài khoản?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          showToast(
            {
              title: 'Đã xóa tài khoản',
              subtitle: 'Tài khoản của bạn đã được xóa thành công.',
            },
            () => {
              navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
            },
          );
        },
      },
    ]);
  };

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoadingInfo(true);
        const res = await getMyInfo(controller.signal);
        setMyInfo(res.data);
        setData(res.data.profileCreationResponse);
      } catch (err: any) {
        if (err?.name === 'CanceledError') {
          console.log('[ProfileScreen] getMyInfo canceled (unmount)');
        } else {
          console.log(
            '[ProfileScreen] getMyInfo error:',
            err?.response?.data ?? err,
          );
        }
      } finally {
        setLoadingInfo(false);
      }
    })();

    return () => controller.abort();
  }, []);

  return (
    <Container>
      {/* Toast */}
      <ToastCenter
        visible={!!toast}
        title={toast?.title ?? ''}
        subtitle={toast?.subtitle}
        kind={toast?.kind ?? 'success'}
      />

      {/* Header (avatar + chào + chuông) */}
      <ViewComponent row between alignItems="center">
        <ViewComponent row alignItems="center" gap={10} flex={0}>
          <HeaderAvatar name="Anh Hải" />
          <ViewComponent flex={0}>
            <TextComponent text="Xin chào," variant="caption" tone="muted" />
            <TextComponent text="Anh Hải" variant="subtitle" weight="bold" />
          </ViewComponent>
        </ViewComponent>

        <Pressable
          style={styles.iconContainer}
          onPress={() => navigation.navigate('Notification')}
        >
          <Entypo name="bell" size={20} color={C.primary} />
        </Pressable>
      </ViewComponent>

      {/* Nội dung cuộn */}
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar lớn + tên hiển thị */}
        <ViewComponent alignItems="center" mt={16} mb={14}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600',
            }}
            style={styles.bigAvatar}
          />
          <TextComponent
            text={data?.name ?? ''}
            variant="subtitle"
            weight="bold"
            style={{ marginTop: 10 }}
          />
        </ViewComponent>

        {/* Grid thông tin */}
        <ViewComponent row wrap mt={6} mb={4} gap={0}>
          {data ? (
            <>
              <InfoItem
                icon="card-account-details-outline"
                label="Tên"
                value={data.name}
              />
              <InfoItem
                icon="calendar"
                label="Tuổi"
                value={`${data.birthYear}`}
              />
              <InfoItem
                icon="gender-male-female"
                label="Giới tính"
                value={data.gender}
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
                value={data.goal}
              />
              <InfoItem
                icon="run-fast"
                label="Mức độ vận động"
                value={data.activityLevel}
              />
              {/* <InfoItem icon="hospital-box-outline" label="Bệnh nền" value={data.} />
                            <InfoItem icon="allergy" label="Dị ứng" value={data.allergy} /> */}
            </>
          ) : null}
        </ViewComponent>

        {/* Form chỉnh sửa (tùy chọn) */}
        {showEdit && (
          <ViewComponent variant="card" style={styles.editCard}>
            <TextComponent
              text="Chỉnh Sửa Thông Tin"
              variant="subtitle"
              weight="bold"
              style={{ marginBottom: 12 }}
            />

            <ViewComponent row gap={12} mb={12}>
              <ViewComponent flex={1}>
                <TextComponent
                  text="Tên"
                  variant="caption"
                  tone="muted"
                  style={{ marginBottom: 6 }}
                />
                <TextInput
                  value={draft.name}
                  onChangeText={t => setDraft({ ...draft, name: t })}
                  placeholder="Nhập họ tên"
                  style={styles.input}
                  placeholderTextColor={C.slate500}
                />
              </ViewComponent>

              <ViewComponent flex={1}>
                <TextComponent
                  text="Tuổi"
                  variant="caption"
                  tone="muted"
                  style={{ marginBottom: 6 }}
                />
                <TextInput
                  value={draft.age}
                  keyboardType="number-pad"
                  onChangeText={t => setDraft({ ...draft, age: t })}
                  placeholder="VD: 25"
                  style={styles.input}
                  placeholderTextColor={C.slate500}
                />
              </ViewComponent>
            </ViewComponent>

            <ViewComponent row gap={12} mb={12}>
              <Dropdown
                label="Giới tính"
                value={draft.gender}
                options={['Nam', 'Nữ', 'Khác']}
                onChange={v =>
                  setDraft({ ...draft, gender: v as Profile['gender'] })
                }
              />
              <ViewComponent flex={1}>
                <TextComponent
                  text="Chiều cao (cm)"
                  variant="caption"
                  tone="muted"
                  style={{ marginBottom: 6 }}
                />
                <TextInput
                  value={draft.height}
                  keyboardType="number-pad"
                  onChangeText={t => setDraft({ ...draft, height: t })}
                  placeholder="VD: 175"
                  style={styles.input}
                  placeholderTextColor={C.slate500}
                />
              </ViewComponent>
            </ViewComponent>

            <ViewComponent row gap={12} mb={12}>
              <ViewComponent flex={1}>
                <TextComponent
                  text="Cân nặng (kg)"
                  variant="caption"
                  tone="muted"
                  style={{ marginBottom: 6 }}
                />
                <TextInput
                  value={draft.weight}
                  keyboardType="number-pad"
                  onChangeText={t => setDraft({ ...draft, weight: t })}
                  placeholder="VD: 70"
                  style={styles.input}
                  placeholderTextColor={C.slate500}
                />
              </ViewComponent>
              <Dropdown
                label="Mục tiêu"
                value={draft.goal}
                options={['Giảm cân lành mạnh', 'Giữ cân', 'Tăng cân']}
                onChange={v =>
                  setDraft({ ...draft, goal: v as Profile['goal'] })
                }
              />
            </ViewComponent>

            <ViewComponent row gap={12} mb={12}>
              <Dropdown
                label="Mức độ vận động"
                value={draft.activity}
                options={ACTIVITY_OPTIONS}
                onChange={v =>
                  setDraft({ ...draft, activity: v as Profile['activity'] })
                }
              />
              <ViewComponent flex={1} />
            </ViewComponent>

            <ViewComponent row gap={12} mb={12}>
              <ViewComponent flex={1}>
                <TextComponent
                  text="Bệnh nền"
                  variant="caption"
                  tone="muted"
                  style={{ marginBottom: 6 }}
                />
                <Pressable onPress={() => openPicker('illness')}>
                  <ViewComponent>
                    <TextInput
                      value={draft.illness}
                      editable={false}
                      placeholder="VD: Tăng huyết áp, Tiểu đường"
                      style={[styles.input, styles.inputPicker]}
                      placeholderTextColor={C.slate500}
                    />
                  </ViewComponent>
                </Pressable>
              </ViewComponent>

              <ViewComponent flex={1}>
                <TextComponent
                  text="Dị ứng"
                  variant="caption"
                  tone="muted"
                  style={{ marginBottom: 6 }}
                />
                <Pressable onPress={() => openPicker('allergy')}>
                  <ViewComponent>
                    <TextInput
                      value={draft.allergy}
                      editable={false}
                      placeholder="VD: Hải sản, Sữa bò"
                      style={[styles.input, styles.inputPicker]}
                      placeholderTextColor={C.slate500}
                    />
                  </ViewComponent>
                </Pressable>
              </ViewComponent>
            </ViewComponent>

            <ViewComponent row gap={10} mt={6}>
              <Pressable
                style={styles.saveBtn}
                // onPress={() => {
                //     setData(draft);
                //     setShowEdit(false);
                // }}
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
        )}

        {/* Actions */}
        <ViewComponent row mt={12} mb={14}>
          <Pressable style={styles.primaryBtn} onPress={onOpenEdit}>
            <McIcon name="pencil" size={18} color={C.black} />
            <TextComponent text="Chỉnh Sửa Hồ Sơ" weight="bold" />
          </Pressable>
        </ViewComponent>

        {/* Cài đặt chung */}
        <ViewComponent variant="card" style={styles.settingsCard}>
          <TextComponent
            text="Cài đặt chung"
            variant="subtitle"
            weight="bold"
            style={{ marginBottom: 12 }}
          />

          <ViewComponent
            row
            alignItems="center"
            justifyContent="space-between"
            py={10}
          >
            <ViewComponent
              row
              alignItems="center"
              gap={10}
              style={{ flexShrink: 1 }}
            >
              <ViewComponent center style={styles.settingIcon}>
                <McIcon name="bell-outline" size={16} color={C.success} />
              </ViewComponent>
              <ViewComponent>
                <TextComponent text="Gửi thông báo" weight="semibold" />
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

          <Pressable style={[styles.settingRowPress]} onPress={onLogout}>
            <ViewComponent
              row
              alignItems="center"
              gap={10}
              style={{ flexShrink: 1 }}
            >
              <ViewComponent
                center
                style={[styles.settingIcon, { backgroundColor: '#ebf5ff' }]}
              >
                <McIcon name="logout" size={16} color={C.primary} />
              </ViewComponent>
              <TextComponent text="Đăng xuất" weight="semibold" />
            </ViewComponent>
            <McIcon name="chevron-right" size={18} color={C.slate500} />
          </Pressable>

          <Pressable style={[styles.settingRowPress]} onPress={onDeleteAccount}>
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
                <McIcon name="trash-can-outline" size={16} color={C.red} />
              </ViewComponent>
              <ViewComponent>
                <TextComponent
                  text="Xóa tài khoản"
                  weight="semibold"
                  color={C.red}
                />
                <TextComponent
                  text="Xóa vĩnh viễn dữ liệu và tài khoản"
                  variant="caption"
                  tone="muted"
                />
              </ViewComponent>
            </ViewComponent>
            <McIcon name="chevron-right" size={18} color={C.slate500} />
          </Pressable>
        </ViewComponent>
      </ScrollView>

      {/* ===== Picker Modal ===== */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <ViewComponent center style={styles.modalOverlay}>
          <ViewComponent style={styles.modalCard}>
            <ViewComponent row alignItems="center" between mb={8}>
              <TextComponent
                text={
                  pickerType === 'illness' ? 'Chọn bệnh nền' : 'Chọn dị ứng'
                }
                variant="subtitle"
                weight="bold"
              />
              <Pressable onPress={() => setPickerOpen(false)} hitSlop={8}>
                <McIcon name="close" size={20} color={C.slate600} />
              </Pressable>
            </ViewComponent>

            <ViewComponent
              row
              alignItems="center"
              gap={8}
              style={styles.searchRow}
            >
              <McIcon name="magnify" size={18} color={C.slate600} />
              <TextInput
                value={pickerSearch}
                onChangeText={setPickerSearch}
                placeholder="Tìm kiếm…"
                placeholderTextColor={C.slate500}
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {pickerSearch.length > 0 && (
                <Pressable onPress={() => setPickerSearch('')} hitSlop={8}>
                  <McIcon name="close-circle" size={18} color={C.slate500} />
                </Pressable>
              )}
            </ViewComponent>

            <ScrollView
              style={styles.optionsList}
              contentContainerStyle={styles.optionsListContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filteredOptions.map(item => {
                const checked = pickerSelected.includes(item);
                return (
                  <Pressable
                    key={item}
                    onPress={() => togglePick(item)}
                    style={[
                      styles.optionRow,
                      checked && styles.optionRowChecked,
                    ]}
                  >
                    <ViewComponent
                      center
                      style={[
                        styles.checkbox,
                        checked && styles.checkboxChecked,
                      ]}
                    >
                      {checked && (
                        <McIcon
                          name="check-bold"
                          size={14}
                          color={C.onPrimary}
                        />
                      )}
                    </ViewComponent>
                    <TextComponent
                      text={item}
                      weight="bold"
                      color={checked ? C.slate800 : C.text}
                    />
                  </Pressable>
                );
              })}
              {filteredOptions.length === 0 && (
                <ViewComponent center py={14}>
                  <TextComponent
                    text="Không tìm thấy mục phù hợp"
                    weight="bold"
                    tone="muted"
                  />
                </ViewComponent>
              )}
            </ScrollView>

            <ViewComponent row justifyContent="flex-end" gap={10} mt={10}>
              <Pressable
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => setPickerOpen(false)}
              >
                <TextComponent text="Hủy" weight="bold" color={C.slate700} />
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalSave]}
                onPress={applyPicker}
              >
                <TextComponent text="Lưu" weight="bold" tone="inverse" />
              </Pressable>
            </ViewComponent>
          </ViewComponent>
        </ViewComponent>
      </Modal>
    </Container>
  );
}

/* ---------- small components ---------- */
function InfoItem({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <ViewComponent variant="card" style={styles.infoCard}>
      <ViewComponent row alignItems="center" mb={8}>
        <ViewComponent
          center
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            backgroundColor: C.chip,
          }}
        >
          <McIcon name={icon as any} size={16} color={C.success} />
        </ViewComponent>
        <TextComponent
          text={label}
          variant="caption"
          tone="muted"
          weight="bold"
          style={{ marginLeft: 8, letterSpacing: 0.2 }}
        />
      </ViewComponent>
      <TextComponent text={value} weight="bold" />
    </ViewComponent>
  );
}

function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <ViewComponent style={{ flex: 1, zIndex: 1 }}>
      <TextComponent
        text={label}
        variant="caption"
        tone="muted"
        style={{ marginBottom: 6 }}
      />
      <Pressable
        onPress={() => setOpen(v => !v)}
        style={[styles.input, styles.select]}
      >
        <TextComponent text={value} weight="bold" />
        <McIcon
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={C.slate600}
        />
      </Pressable>
      {open && (
        <ViewComponent variant="card" style={styles.optionList}>
          {options.map(opt => (
            <Pressable
              key={opt}
              onPress={() => {
                onChange(opt);
                setOpen(false);
              }}
              style={styles.optionItem}
            >
              <TextComponent text={opt} weight="bold" />
            </Pressable>
          ))}
        </ViewComponent>
      )}
    </ViewComponent>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  /* Header row (avatar + bell) */
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
  headerAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  headerAvatar: { width: 52, height: 52, borderRadius: 999 },

  /* Scroll area */
  screen: { flex: 1, backgroundColor: C.bg, borderRadius: 16 },
  scrollContent: { paddingBottom: 28 },

  /* Profile avatar big */
  bigAvatar: {
    width: 92,
    height: 92,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: C.greenSurface,
    backgroundColor: C.white,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },

  /* Cards base tweaks */
  infoCard: {
    width: '48%',
    padding: 14,
    marginBottom: 12,
    marginHorizontal: '1%',
  },

  /* Edit form */
  editCard: { marginTop: 10, borderRadius: 18, padding: 16 },
  input: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    backgroundColor: C.inputBg,
    color: C.text,
    fontWeight: '700',
  },
  inputPicker: {
    borderColor: C.accentBorder,
    backgroundColor: C.accentSurface,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionList: { marginTop: 6, borderRadius: 14, overflow: 'hidden' },
  optionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.slate100,
  },

  /* Actions */
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

  /** ✨ MISSING BUTTONS */
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

  /* Settings */
  settingsCard: {
    marginTop: 12,
    marginBottom: 24,
    padding: 14,
    borderRadius: 18,
  },
  settingIcon: {
    width: 24,
    height: 24,
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

  /* Toast */
  toastOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(2,6,23,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    paddingHorizontal: 24,
  },
  toastCard: {
    width: '92%',
    maxWidth: 420,
    backgroundColor: C.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 3,
    borderColor: C.info,
  },

  /* Modal Picker */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.35)',
    width: '100%',
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: C.info,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 6 },
    }),
  },
  searchRow: {
    borderWidth: 1,
    borderColor: C.accentBorder,
    backgroundColor: C.accentSurface,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    color: C.text,
    fontWeight: '700',
    paddingVertical: 0,
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  optionRowChecked: { backgroundColor: '#eff6ff' },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.info,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.white,
  },
  checkboxChecked: { backgroundColor: C.info, borderColor: C.info },

  modalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalCancel: { backgroundColor: C.slate50, borderColor: C.slate200 },
  modalSave: { backgroundColor: C.info, borderColor: '#2563eb' },
  optionsList: { height: 280 },
  optionsListContent: { paddingVertical: 4, minHeight: 280 },
});

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
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

/** ----------------- Types ----------------- */
type Profile = {
    name: string;
    age: string;
    height: string;
    weight: string;
    gender: 'Nam' | 'Nữ' | 'Khác';
    goal: 'Giảm cân lành mạnh' | 'Giữ cân' | 'Tăng cân';
    activity: 'Ít vận động' | 'Vận động nhẹ' | 'Vận động vừa' | 'Vận động nhiều' | 'Rất nhiều';
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
                Animated.timing(opacity, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.spring(scale, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 0, duration: 160, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
                Animated.timing(scale, { toValue: 0.95, duration: 160, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
            ]).start();
        }
    }, [visible, opacity, scale]);

    if (!visible) return null;

    const color = kind === 'success' ? '#16a34a' : '#ef4444';
    const tint = kind === 'success' ? '#d1fae5' : '#fee2e2';

    return (
        <Animated.View pointerEvents="none" style={[styles.toastOverlay, { opacity }]}>
            <Animated.View style={[styles.toastCard, { transform: [{ scale }] }]}>
                <View style={styles.toastBody}>
                    <View style={[styles.toastIconWrap, { backgroundColor: tint }]}>
                        <McIcon name={kind === 'success' ? 'check' : 'trash-can-outline'} size={26} color={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.toastTitle} numberOfLines={2}>{title}</Text>
                        {!!subtitle && <Text style={styles.toastSubtitle} numberOfLines={2}>{subtitle}</Text>}
                    </View>
                </View>
                <View style={styles.toastBottomRow}>
                    <View style={[styles.toastDot, { backgroundColor: color, opacity: 0.25 }]} />
                    <View style={[styles.toastDot, { backgroundColor: color, opacity: 0.45 }]} />
                    <View style={[styles.toastDot, { backgroundColor: color, opacity: 0.25 }]} />
                </View>
            </Animated.View>
        </Animated.View>
    );
}

/* ===== Avatar fallback (đồng bộ MealPlan) ===== */
function HeaderAvatar({ name, photoUri }: { name: string; photoUri?: string | null }) {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    if (photoUri) return <Image source={{ uri: photoUri }} style={styles.headerAvatar} />;
    return (
        <ViewComponent center style={styles.headerAvatarFallback} flex={0}>
            <TextComponent text={initials} variant="subtitle" weight="bold" tone="primary" />
        </ViewComponent>
    );
}

/* =======================  Screen  ======================= */
export default function ProfileScreen() {
    const [data, setData] = useState<Profile>(DEFAULT_PROFILE);
    const [draft, setDraft] = useState<Profile>(DEFAULT_PROFILE);
    const [showEdit, setShowEdit] = useState(false);

    const [allowNotif, setAllowNotif] = useState<boolean>(true);
    const navigation = useNavigation<any>();

    const [toast, setToast] = useState<{ title: string; subtitle?: string; kind?: ToastKind } | null>(null);

    // ===== Picker Modal state =====
    const SUGGESTED_ILLNESSES = ['Tăng huyết áp', 'Đái tháo đường', 'Tim mạch', 'Hen suyễn', 'Rối loạn mỡ máu', 'Suy giáp', 'Cường giáp', 'Loét dạ dày', 'Viêm đại tràng', 'Gout', 'Bệnh thận mạn', 'Gan nhiễm mỡ', 'Trầm cảm', 'Lo âu'];
    const SUGGESTED_ALLERGIES = ['Hải sản', 'Sữa bò', 'Đậu phộng', 'Trứng', 'Lúa mì (gluten)', 'Đậu nành', 'Mè (vừng)', 'Tôm cua', 'Cá', 'Quả hạch'];

    type PickerType = 'illness' | 'allergy';
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerType, setPickerType] = useState<PickerType>('illness');
    const [pickerSelected, setPickerSelected] = useState<string[]>([]);
    const [pickerSearch, setPickerSearch] = useState('');

    const strToArr = (v: string) => (v && v.trim() && v.trim() !== 'Không có' ? v.split(',').map(s => s.trim()).filter(Boolean) : []);
    const arrToStr = (arr: string[]) => (arr.length ? arr.join(', ') : 'Không có');

    const normalizeVN = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

    const openPicker = (type: PickerType) => {
        setPickerType(type);
        const current = type === 'illness' ? draft.illness : draft.allergy;
        setPickerSelected(strToArr(current));
        setPickerSearch('');
        setPickerOpen(true);
    };
    const togglePick = (item: string) => setPickerSelected(prev => (prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]));
    const applyPicker = () => {
        const value = arrToStr(pickerSelected);
        if (pickerType === 'illness') setDraft(prev => ({ ...prev, illness: value }));
        else setDraft(prev => ({ ...prev, allergy: value }));
        setPickerOpen(false);
    };

    const currentOptions = pickerType === 'illness' ? SUGGESTED_ILLNESSES : SUGGESTED_ALLERGIES;
    const filteredOptions = pickerSearch.trim()
        ? currentOptions.filter(it => normalizeVN(it).includes(normalizeVN(pickerSearch)))
        : currentOptions;

    // Toast helper
    const showToast = (opts: { title: string; subtitle?: string; kind?: ToastKind; duration?: number }, cb?: () => void) => {
        const { title, subtitle, kind = 'success', duration = 1400 } = opts;
        setToast({ title, subtitle, kind });
        setTimeout(() => { setToast(null); cb && cb(); }, duration);
    };

    const onOpenEdit = () => { setDraft(data); setShowEdit(true); };
    const onLogout = () => {
        Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Đăng xuất', style: 'destructive', onPress: () => {
                    showToast({ title: 'Đăng xuất thành công', subtitle: 'Hẹn gặp lại bạn sớm nhé!' }, () => {
                        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
                    });
                }
            },
        ]);
    };
    const onDeleteAccount = () => {
        Alert.alert('Xóa tài khoản', 'Bạn có chắc muốn xóa tài khoản?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa', style: 'destructive', onPress: () => {
                    showToast({ title: 'Đã xóa tài khoản', subtitle: 'Tài khoản của bạn đã được xóa thành công.' }, () => {
                        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
                    });
                }
            },
        ]);
    };

    return (
        <Container>
            {/* Toast */}
            <ToastCenter visible={!!toast} title={toast?.title ?? ''} subtitle={toast?.subtitle} kind={toast?.kind ?? 'success'} />

            {/* Header (avatar + chào + chuông) */}
            <ViewComponent row between alignItems="center">
                <ViewComponent row alignItems="center" gap={10} flex={0}>
                    <HeaderAvatar name="Anh Hải" />
                    <ViewComponent flex={0}>
                        <TextComponent text="Xin chào," variant="caption" tone="muted" />
                        <TextComponent text="Anh Hải" variant="subtitle" weight="bold" />
                    </ViewComponent>
                </ViewComponent>
                <Pressable style={styles.iconContainer} onPress={() => navigation.navigate('Notification')}>
                    <Entypo name="bell" size={20} color={C.primary} />
                </Pressable>
            </ViewComponent>

            {/* Nội dung cuộn */}
            <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Avatar lớn + tên hiển thị */}
                <View style={styles.avatarWrap}>
                    <Image source={{ uri: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600' }} style={styles.bigAvatar} />
                    <Text style={styles.displayName}>{data.name}</Text>
                </View>

                {/* Grid thông tin */}
                <View style={styles.grid}>
                    <InfoItem icon="card-account-details-outline" label="Tên" value={data.name} />
                    <InfoItem icon="calendar" label="Tuổi" value={`${data.age}`} />
                    <InfoItem icon="gender-male-female" label="Giới tính" value={data.gender} />
                    <InfoItem icon="human-male-height" label="Chiều cao" value={`${data.height} cm`} />
                    <InfoItem icon="weight-kilogram" label="Cân nặng" value={`${data.weight} kg`} />
                    <InfoItem icon="bullseye-arrow" label="Mục tiêu" value={data.goal} />
                    <InfoItem icon="run-fast" label="Mức độ vận động" value={data.activity} />
                    <InfoItem icon="hospital-box-outline" label="Bệnh nền" value={data.illness} />
                    <InfoItem icon="allergy" label="Dị ứng" value={data.allergy} />
                </View>

                {/* Form chỉnh sửa (tùy chọn) */}
                {showEdit && (
                    <View style={[styles.cardBase, styles.shadow, styles.editCard]}>
                        <Text style={styles.editTitle}>Chỉnh Sửa Thông Tin</Text>

                        <View style={styles.row}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Tên</Text>
                                <TextInput value={draft.name} onChangeText={(t) => setDraft({ ...draft, name: t })} placeholder="Nhập họ tên" style={styles.input} placeholderTextColor="#94a3b8" />
                            </View>
                            <View style={styles.field}>
                                <Text style={styles.label}>Tuổi</Text>
                                <TextInput value={draft.age} keyboardType="number-pad" onChangeText={(t) => setDraft({ ...draft, age: t })} placeholder="VD: 25" style={styles.input} placeholderTextColor="#94a3b8" />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <Dropdown label="Giới tính" value={draft.gender} options={['Nam', 'Nữ', 'Khác']} onChange={(v) => setDraft({ ...draft, gender: v as Profile['gender'] })} />
                            <View style={styles.field}>
                                <Text style={styles.label}>Chiều cao (cm)</Text>
                                <TextInput value={draft.height} keyboardType="number-pad" onChangeText={(t) => setDraft({ ...draft, height: t })} placeholder="VD: 175" style={styles.input} placeholderTextColor="#94a3b8" />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Cân nặng (kg)</Text>
                                <TextInput value={draft.weight} keyboardType="number-pad" onChangeText={(t) => setDraft({ ...draft, weight: t })} placeholder="VD: 70" style={styles.input} placeholderTextColor="#94a3b8" />
                            </View>
                            <Dropdown label="Mục tiêu" value={draft.goal} options={['Giảm cân lành mạnh', 'Giữ cân', 'Tăng cân']} onChange={(v) => setDraft({ ...draft, goal: v as Profile['goal'] })} />
                        </View>

                        <View style={styles.row}>
                            <Dropdown label="Mức độ vận động" value={draft.activity} options={ACTIVITY_OPTIONS} onChange={(v) => setDraft({ ...draft, activity: v as Profile['activity'] })} />
                            <View style={{ flex: 1 }} />
                        </View>

                        <View style={styles.row}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Bệnh nền</Text>
                                <Pressable onPress={() => openPicker('illness')}>
                                    <View pointerEvents="none">
                                        <TextInput value={draft.illness} editable={false} placeholder="VD: Tăng huyết áp, Tiểu đường" style={[styles.input, styles.inputPicker]} placeholderTextColor="#94a3b8" />
                                    </View>
                                </Pressable>
                            </View>

                            <View style={styles.field}>
                                <Text style={styles.label}>Dị ứng</Text>
                                <Pressable onPress={() => openPicker('allergy')}>
                                    <View pointerEvents="none">
                                        <TextInput value={draft.allergy} editable={false} placeholder="VD: Hải sản, Sữa bò" style={[styles.input, styles.inputPicker]} placeholderTextColor="#94a3b8" />
                                    </View>
                                </Pressable>
                            </View>
                        </View>

                        <View style={styles.editActions}>
                            <Pressable style={styles.saveBtn} onPress={() => { setData(draft); setShowEdit(false); }}>
                                <Text style={styles.saveBtnText}>Lưu Thay Đổi</Text>
                            </Pressable>
                            <Pressable style={styles.cancelBtn} onPress={() => setShowEdit(false)}>
                                <Text style={styles.cancelBtnText}>Hủy</Text>
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actionRow}>
                    <Pressable style={styles.primaryBtn} onPress={onOpenEdit}>
                        <McIcon name="pencil" size={18} color="#fff" />
                        <Text style={styles.primaryBtnText}>Chỉnh Sửa Hồ Sơ</Text>
                    </Pressable>
                </View>

                {/* Cài đặt chung */}
                <View style={[styles.cardBase, styles.shadow, styles.settingsCard]}>
                    <Text style={styles.settingsTitle}>Cài đặt chung</Text>

                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={styles.settingIcon}>
                                <McIcon name="bell-outline" size={16} color={stylesVars.success} />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Gửi thông báo</Text>
                                <Text style={styles.settingSub}>Nhận nhắc nhở và cập nhật dinh dưỡng</Text>
                            </View>
                        </View>
                        <Switch value={allowNotif} onValueChange={setAllowNotif} thumbColor="#fff" trackColor={{ false: '#e5e7eb', true: '#86efac' }} />
                    </View>

                    <Pressable style={[styles.settingRow, styles.settingPress]} onPress={onLogout}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.settingIcon, { backgroundColor: '#ebf5ff' }]}>
                                <McIcon name="logout" size={16} color={stylesVars.primary} />
                            </View>
                            <Text style={styles.settingLabel}>Đăng xuất</Text>
                        </View>
                        <McIcon name="chevron-right" size={18} color="#94a3b8" />
                    </Pressable>

                    <Pressable style={[styles.settingRow, styles.settingPress]} onPress={onDeleteAccount}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.settingIcon, { backgroundColor: '#fee2e2' }]}>
                                <McIcon name="trash-can-outline" size={16} color="#ef4444" />
                            </View>
                            <View>
                                <Text style={[styles.settingLabel, { color: '#ef4444' }]}>Xóa tài khoản</Text>
                                <Text style={styles.settingSub}>Xóa vĩnh viễn dữ liệu và tài khoản</Text>
                            </View>
                        </View>
                        <McIcon name="chevron-right" size={18} color="#94a3b8" />
                    </Pressable>
                </View>
            </ScrollView>

            {/* ===== Picker Modal ===== */}
            <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{pickerType === 'illness' ? 'Chọn bệnh nền' : 'Chọn dị ứng'}</Text>
                            <Pressable onPress={() => setPickerOpen(false)} hitSlop={8}>
                                <McIcon name="close" size={20} color="#64748b" />
                            </Pressable>
                        </View>

                        <View style={styles.searchRow}>
                            <McIcon name="magnify" size={18} color="#64748b" />
                            <TextInput
                                value={pickerSearch}
                                onChangeText={setPickerSearch}
                                placeholder="Tìm kiếm…"
                                placeholderTextColor="#94a3b8"
                                style={styles.searchInput}
                                autoCorrect={false}
                                autoCapitalize="none"
                                returnKeyType="search"
                            />
                            {pickerSearch.length > 0 && (
                                <Pressable onPress={() => setPickerSearch('')} hitSlop={8}>
                                    <McIcon name="close-circle" size={18} color="#94a3b8" />
                                </Pressable>
                            )}
                        </View>

                        <ScrollView
                            style={styles.optionsList}
                            contentContainerStyle={styles.optionsListContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {filteredOptions.map(item => {
                                const checked = pickerSelected.includes(item);
                                return (
                                    <Pressable key={item} onPress={() => togglePick(item)} style={[styles.optionRow, checked && styles.optionRowChecked]}>
                                        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                                            {checked && <McIcon name="check-bold" size={14} color="#fff" />}
                                        </View>
                                        <Text style={[styles.optionTxt, checked && styles.optionTxtChecked]}>{item}</Text>
                                    </Pressable>
                                );
                            })}
                            {filteredOptions.length === 0 && (
                                <View style={styles.noResult}>
                                    <Text style={{ color: '#64748b', fontWeight: '700' }}>Không tìm thấy mục phù hợp</Text>
                                </View>
                            )}
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <Pressable style={[styles.modalBtn, styles.modalCancel]} onPress={() => setPickerOpen(false)}>
                                <Text style={styles.modalCancelTxt}>Hủy</Text>
                            </Pressable>
                            <Pressable style={[styles.modalBtn, styles.modalSave]} onPress={applyPicker}>
                                <Text style={styles.modalSaveTxt}>Lưu</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </Container>
    );
}

/* ---------- small components ---------- */
function InfoItem({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <View style={[styles.cardBase, styles.shadow, styles.infoCard]}>
            <View style={styles.infoHeader}>
                <View style={styles.iconBadge}>
                    <McIcon name={icon as any} size={16} color={stylesVars.success} />
                </View>
                <Text style={styles.infoLabel}>{label}</Text>
            </View>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
}

function Dropdown({
    label,
    value,
    options,
    onChange,
}: {
    label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
    const [open, setOpen] = useState(false);
    return (
        <View style={[styles.field, { zIndex: 1 }]}>
            <Text style={styles.label}>{label}</Text>
            <Pressable onPress={() => setOpen(v => !v)} style={[styles.input, styles.select]}>
                <Text style={styles.selectText}>{value}</Text>
                <McIcon name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
            </Pressable>
            {open && (
                <View style={[styles.cardBase, styles.shadow, styles.optionList]}>
                    {options.map((opt) => (
                        <Pressable key={opt} onPress={() => { onChange(opt); setOpen(false); }} style={styles.optionItem}>
                            <Text style={styles.optionText}>{opt}</Text>
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    );
}

/* ---------- styles ---------- */
const stylesVars = {
    bg: '#f7faf8',
    text: '#0f172a',
    sub: '#6b7280',
    border: '#e5efe8',
    chip: '#eafff3',
    inputBg: '#f9fffb',
    primary: '#0ea5e9',
    success: '#16a34a',
};

const styles = StyleSheet.create({
    /* Header row (avatar + bell) */
    iconContainer: {
        width: 42, height: 42, borderRadius: 12,
        backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: C.border,
    },
    headerAvatarFallback: {
        width: 52, height: 52, borderRadius: 999,
        backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    },
    headerAvatar: { width: 52, height: 52, borderRadius: 999 },

    /* Header title */
    header: {
        backgroundColor: 'transparent',
        paddingBottom: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: stylesVars.border,
        marginTop: 14,
    },
    headerTitle: { color: stylesVars.text, fontSize: 20, fontWeight: '800', letterSpacing: 0.1 },
    headerSub: { color: stylesVars.sub, fontSize: 13, marginTop: 2 },

    /* Scroll area */
    screen: { flex: 1, backgroundColor: stylesVars.bg, borderRadius: 16 },
    scrollContent: { paddingBottom: 28 },

    /* Profile avatar big */
    avatarWrap: { alignItems: 'center', marginTop: 16, marginBottom: 14 },
    bigAvatar: {
        width: 92, height: 92, borderRadius: 999, borderWidth: 4, borderColor: '#ecfdf5',
        backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
    },
    displayName: { marginTop: 10, fontWeight: '800', color: stylesVars.text, fontSize: 17, letterSpacing: 0.2 },

    /* Grid */
    grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, marginBottom: 4 },

    /* Cards base */
    cardBase: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: stylesVars.border },
    shadow: { shadowColor: '#0b3d1f', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },

    /* Info item */
    infoCard: { width: '48%', padding: 14, marginBottom: 12, marginHorizontal: '1%' },
    infoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    iconBadge: { width: 22, height: 22, borderRadius: 999, backgroundColor: stylesVars.chip, alignItems: 'center', justifyContent: 'center' },
    infoLabel: { marginLeft: 8, color: '#64748b', fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },
    infoValue: { color: stylesVars.text, fontSize: 16, fontWeight: '800' },

    /* Edit form */
    editCard: { marginTop: 10, borderRadius: 18, padding: 16 },
    editTitle: { fontSize: 16, fontWeight: '900', color: stylesVars.text, marginBottom: 10 },
    row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    field: { flex: 1 },
    label: { fontSize: 12, color: stylesVars.sub, marginBottom: 6, fontWeight: '800' },
    input: {
        height: 46, borderRadius: 14, borderWidth: 1, borderColor: '#dbece2',
        paddingHorizontal: 12, backgroundColor: stylesVars.inputBg, color: stylesVars.text, fontWeight: '700',
    },
    inputPicker: { borderColor: '#c7e2ff', backgroundColor: '#f4faff' },
    select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    selectText: { color: stylesVars.text, fontWeight: '700' },
    optionList: { marginTop: 6, borderRadius: 14, overflow: 'hidden' },
    optionItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    optionText: { color: stylesVars.text, fontWeight: '700' },
    editActions: { marginTop: 6, flexDirection: 'row', gap: 10 },
    saveBtn: { flex: 1, height: 46, borderRadius: 12, backgroundColor: stylesVars.success, alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { color: '#fff', fontWeight: '900' },
    cancelBtn: { width: 110, height: 46, borderRadius: 12, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
    cancelBtnText: { color: stylesVars.text, fontWeight: '900' },

    /* Actions */
    actionRow: { marginTop: 12, marginBottom: 14, flexDirection: 'row' },
    primaryBtn: { flex: 1, flexDirection: 'row', height: 48, backgroundColor: stylesVars.primary, borderRadius: 999, alignItems: 'center', justifyContent: 'center', gap: 8 },
    primaryBtnText: { color: '#fff', fontWeight: '900' },

    /* Settings */
    settingsCard: { marginTop: 12, marginBottom: 24, padding: 14, borderRadius: 18 },
    settingsTitle: { fontSize: 16, fontWeight: '900', color: stylesVars.text, marginBottom: 8 },
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
    settingPress: { borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
    settingIcon: { width: 24, height: 24, borderRadius: 999, backgroundColor: stylesVars.chip, alignItems: 'center', justifyContent: 'center' },
    settingLabel: { color: stylesVars.text, fontSize: 14, fontWeight: '800' },
    settingSub: { color: '#64748b', fontSize: 12, marginTop: 2 },

    /* Toast */
    toastOverlay: { position: 'absolute', inset: 0 as any, backgroundColor: 'rgba(2,6,23,0.25)', alignItems: 'center', justifyContent: 'center', zIndex: 999, paddingHorizontal: 24 },
    toastCard: { width: '92%', maxWidth: 420, backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, elevation: 8, borderWidth: 3, borderColor: '#3b82f6' },
    toastBody: { paddingVertical: 18, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    toastIconWrap: { width: 46, height: 46, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
    toastTitle: { color: '#0f172a', fontWeight: '900', fontSize: 16.5, marginBottom: 2 },
    toastSubtitle: { color: '#475569', fontSize: 13.5, fontWeight: '600' },
    toastBottomRow: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', gap: 6, justifyContent: 'center' },
    toastDot: { width: 28, height: 4, borderRadius: 999, backgroundColor: '#16a34a' },

    /* Modal Picker */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.35)', alignItems: 'center', justifyContent: 'center', padding: 20 },
    modalCard: {
        width: '100%', maxWidth: 520, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 2, borderColor: '#3b82f6',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }, android: { elevation: 6 } }),
    },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#c7e2ff', backgroundColor: '#f4faff', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 },
    searchInput: { flex: 1, color: '#0f172a', fontWeight: '700', paddingVertical: 0 },
    optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10 },
    optionRowChecked: { backgroundColor: '#eff6ff' },
    checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
    checkboxChecked: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    optionTxt: { color: '#0f172a', fontWeight: '700' },
    optionTxtChecked: { color: '#1e293b' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
    modalBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
    modalCancel: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
    modalSave: { backgroundColor: '#3b82f6', borderColor: '#2563eb' },
    modalCancelTxt: { color: '#334155', fontWeight: '800' },
    modalSaveTxt: { color: '#fff', fontWeight: '900' },
    optionsList: { height: 280 },
    optionsListContent: { paddingVertical: 4, minHeight: 280 },
    noResult: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
});

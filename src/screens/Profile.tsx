import React, { useState } from 'react';
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
} from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Container from '../components/Container';

/** ----------------- Types ----------------- */
type Profile = {
    name: string;
    age: string;
    height: string;
    weight: string;
    gender: 'Nam' | 'Nữ' | 'Khác';
    goal: 'Giảm cân lành mạnh' | 'Giữ cân' | 'Tăng cân';
    activity: 'Ít vận động' | 'Vận động nhẹ' | 'Vận động vừa' | 'Vận động nhiều' | 'Rất nhiều';
};

const DEFAULT_PROFILE: Profile = {
    name: 'Anh Hải',
    age: '22',
    height: '168',
    weight: '60',
    gender: 'Nam',
    goal: 'Tăng cân',
    activity: 'Vận động nhẹ',
};

const ACTIVITY_OPTIONS: Profile['activity'][] = [
    'Ít vận động',
    'Vận động nhẹ',
    'Vận động vừa',
    'Vận động nhiều',
    'Rất nhiều',
];

export default function ProfileScreen() {
    const [data, setData] = useState<Profile>(DEFAULT_PROFILE);
    const [draft, setDraft] = useState<Profile>(DEFAULT_PROFILE);
    const [showEdit, setShowEdit] = useState(false);

    // Cài đặt chung
    const [allowNotif, setAllowNotif] = useState<boolean>(true);

    const onOpenEdit = () => { setDraft(data); setShowEdit(true); };
    const onCancel = () => setShowEdit(false);
    const onSave = () => { setData(draft); setShowEdit(false); };

    const onLogout = () => {
        // TODO: thay bằng logic đăng xuất thực tế
        Alert.alert('Đăng xuất', 'Bạn đã đăng xuất (demo).');
    };

    const onDeleteAccount = () => {
        Alert.alert(
            'Xóa tài khoản',
            'Hành động này không thể hoàn tác. Bạn chắc chắn muốn xóa tài khoản?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: () => {
                        // TODO: gọi API xóa tài khoản & dọn dẹp dữ liệu cục bộ
                        Alert.alert('Đã xóa', 'Tài khoản của bạn đã được xóa (demo).');
                    },
                },
            ],
        );
    };

    return (
        <Container>
            {/* ===== Header KHÔNG cuộn (CHANGED: đưa ra ngoài ScrollView) ===== */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Hồ sơ Cá nhân</Text>
                <Text style={styles.headerSub}>Quản lý thông tin và mục tiêu dinh dưỡng của bạn</Text>
            </View>

            {/* ===== Nội dung CÓ cuộn ===== */}
            <ScrollView
                style={styles.screen}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            >
                {/* Avatar */}
                <View style={styles.avatarWrap}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600' }}
                        style={styles.avatar}
                    />
                    <Text style={styles.displayName}>{data.name}</Text>
                </View>

                {/* Summary (2 cột) */}
                <View style={styles.grid}>
                    <InfoItem icon="card-account-details-outline" label="Tên" value={data.name} />
                    <InfoItem icon="calendar" label="Tuổi" value={`${data.age}`} />
                    <InfoItem icon="gender-male-female" label="Giới tính" value={data.gender} />
                    <InfoItem icon="human-male-height" label="Chiều cao" value={`${data.height} cm`} />
                    <InfoItem icon="weight-kilogram" label="Cân nặng" value={`${data.weight} kg`} />
                    <InfoItem icon="bullseye-arrow" label="Mục tiêu" value={data.goal} />
                    <InfoItem icon="run-fast" label="Mức độ vận động" value={data.activity} />
                </View>

                {/* Edit Form (hiện trên, đẩy nút xuống) */}
                {showEdit && (
                    <View style={[styles.cardBase, styles.shadow, styles.editCard]}>
                        <Text style={styles.editTitle}>Chỉnh Sửa Thông Tin</Text>

                        <View style={styles.row}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Tên</Text>
                                <TextInput
                                    value={draft.name}
                                    onChangeText={(t) => setDraft({ ...draft, name: t })}
                                    placeholder="Nhập họ tên"
                                    style={styles.input}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>
                            <View style={styles.field}>
                                <Text style={styles.label}>Tuổi</Text>
                                <TextInput
                                    value={draft.age}
                                    keyboardType="number-pad"
                                    onChangeText={(t) => setDraft({ ...draft, age: t })}
                                    placeholder="VD: 25"
                                    style={styles.input}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <Dropdown
                                label="Giới tính"
                                value={draft.gender}
                                options={['Nam', 'Nữ', 'Khác']}
                                onChange={(v) => setDraft({ ...draft, gender: v as Profile['gender'] })}
                            />
                            <View style={styles.field}>
                                <Text style={styles.label}>Chiều cao (cm)</Text>
                                <TextInput
                                    value={draft.height}
                                    keyboardType="number-pad"
                                    onChangeText={(t) => setDraft({ ...draft, height: t })}
                                    placeholder="VD: 175"
                                    style={styles.input}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Cân nặng (kg)</Text>
                                <TextInput
                                    value={draft.weight}
                                    keyboardType="number-pad"
                                    onChangeText={(t) => setDraft({ ...draft, weight: t })}
                                    placeholder="VD: 70"
                                    style={styles.input}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            <Dropdown
                                label="Mục tiêu"
                                value={draft.goal}
                                options={['Giảm cân lành mạnh', 'Giữ cân', 'Tăng cân']}
                                onChange={(v) => setDraft({ ...draft, goal: v as Profile['goal'] })}
                            />
                        </View>

                        <View style={styles.row}>
                            <Dropdown
                                label="Mức độ vận động"
                                value={draft.activity}
                                options={ACTIVITY_OPTIONS}
                                onChange={(v) => setDraft({ ...draft, activity: v as Profile['activity'] })}
                            />
                            <View style={{ flex: 1 }} />
                        </View>

                        <View style={styles.editActions}>
                            <Pressable style={styles.saveBtn} onPress={onSave}>
                                <Text style={styles.saveBtnText}>Lưu Thay Đổi</Text>
                            </Pressable>
                            <Pressable style={styles.cancelBtn} onPress={onCancel}>
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

                    {/* Gửi thông báo */}
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={styles.settingIcon}>
                                <McIcon name="bell-outline" size={16} color={colors.success} />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Gửi thông báo</Text>
                                <Text style={styles.settingSub}>Nhận nhắc nhở và cập nhật dinh dưỡng</Text>
                            </View>
                        </View>
                        <Switch
                            value={allowNotif}
                            onValueChange={setAllowNotif}
                            thumbColor={allowNotif ? '#fff' : '#fff'}
                            trackColor={{ false: '#e5e7eb', true: '#86efac' }}
                        />
                    </View>

                    {/* Đăng xuất */}
                    <Pressable style={[styles.settingRow, styles.settingPress]} onPress={onLogout}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.settingIcon, { backgroundColor: '#ebf5ff' }]}>
                                <McIcon name="logout" size={16} color={colors.primary} />
                            </View>
                            <Text style={styles.settingLabel}>Đăng xuất</Text>
                        </View>
                        <McIcon name="chevron-right" size={18} color="#94a3b8" />
                    </Pressable>

                    {/* Xóa tài khoản */}
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
        </Container>
    );
}

/* ---------- small components ---------- */

function InfoItem({
    icon,
    label,
    value,
}: { icon: string; label: string; value: string }) {
    return (
        <View style={[styles.cardBase, styles.shadow, styles.infoCard]}>
            <View style={styles.infoHeader}>
                <View style={styles.iconBadge}>
                    <McIcon name={icon as any} size={16} color="#16a34a" />
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

const colors = {
    bg: '#f7faf8',
    header: '#43B05C',
    text: '#0f172a',
    sub: '#6b7280',
    border: '#e5efe8',
    chip: '#eafff3',
    inputBg: '#f9fffb',
    primary: '#0ea5e9',
    success: '#16a34a',
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.bg,
        borderRadius: 16,
    },
    scrollContent: { paddingBottom: 28 },

    // Header giữ cố định (phẳng & tối giản)
    header: {
        backgroundColor: 'transparent',
        paddingTop: 14,
        paddingBottom: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        marginTop: 20
    },
    headerTitle: {
        color: colors.text,
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.1,
    },
    headerSub: {
        color: colors.sub,
        fontSize: 13,
        marginTop: 2,
    },

    avatarWrap: {
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 14,
    },
    avatar: {
        width: 92, height: 92, borderRadius: 999, borderWidth: 4, borderColor: '#ecfdf5',
        backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
    },
    displayName: { marginTop: 10, fontWeight: '800', color: colors.text, fontSize: 17, letterSpacing: 0.2 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginTop: 6, marginBottom: 4 },

    /* Base to reuse */
    cardBase: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: colors.border },
    shadow: { shadowColor: '#0b3d1f', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },

    infoCard: { width: '48%', padding: 14, marginBottom: 12, marginHorizontal: '1%' },
    infoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    iconBadge: { width: 22, height: 22, borderRadius: 999, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
    infoLabel: { marginLeft: 8, color: '#64748b', fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },
    infoValue: { color: colors.text, fontSize: 16, fontWeight: '800' },

    editCard: { marginHorizontal: 16, marginTop: 10, borderRadius: 18, padding: 16 },
    editTitle: { fontSize: 16, fontWeight: '900', color: colors.text, marginBottom: 10 },

    row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    field: { flex: 1 },
    label: { fontSize: 12, color: colors.sub, marginBottom: 6, fontWeight: '800' },
    input: {
        height: 46, borderRadius: 14, borderWidth: 1, borderColor: '#dbece2',
        paddingHorizontal: 12, backgroundColor: colors.inputBg, color: colors.text, fontWeight: '700',
    },
    select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    selectText: { color: colors.text, fontWeight: '700' },

    optionList: { marginTop: 6, borderRadius: 14, overflow: 'hidden' },
    optionItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    optionText: { color: colors.text, fontWeight: '700' },

    editActions: { marginTop: 6, flexDirection: 'row', gap: 10 },
    saveBtn: {
        flex: 1, height: 46, borderRadius: 12, backgroundColor: colors.success,
        alignItems: 'center', justifyContent: 'center',
    },
    saveBtnText: { color: '#fff', fontWeight: '900' },
    cancelBtn: { width: 110, height: 46, borderRadius: 12, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
    cancelBtnText: { color: colors.text, fontWeight: '900' },

    actionRow: { paddingHorizontal: 16, marginTop: 12, marginBottom: 14, flexDirection: 'row' },
    primaryBtn: {
        flex: 1, flexDirection: 'row', height: 48, backgroundColor: colors.primary, borderRadius: 999,
        alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    primaryBtnText: { color: '#fff', fontWeight: '900' },

    // -------- Cài đặt chung --------
    settingsCard: {
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 24,
        padding: 14,
        borderRadius: 18,
    },
    settingsTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: colors.text,
        marginBottom: 8,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    settingPress: {
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flexShrink: 1,
    },
    settingIcon: {
        width: 24,
        height: 24,
        borderRadius: 999,
        backgroundColor: colors.chip,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingLabel: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '800',
    },
    settingSub: {
        color: '#64748b',
        fontSize: 12,
        marginTop: 2,
    },
});

import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, Platform } from 'react-native';
import { colors as C } from '../../constants/colors';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import TextComponent from '../TextComponent';
import ViewComponent from '../ViewComponent';

type WithIdName = { id: string; name: string };

type Props<T extends WithIdName> = {
    visible: boolean;
    title: string;
    options: T[];                  // danh sách từ API
    value: T[];                    // danh sách đang chọn (từ cha)
    onSave: (finalSelected: T[]) => void; // ✅ nhấn Lưu → trả danh sách cuối
    onChange?: (next: T[]) => void;       // ⛳ tuỳ chọn: cập nhật "live" khi tick
    onClose: () => void;           // nhấn Hủy hoặc icon X
};

export default function MultiSelectModal<T extends WithIdName>({
    visible,
    title,
    options,
    value,
    onSave,
    onChange,
    onClose,
}: Props<T>) {
    const [search, setSearch] = React.useState('');
    const [localSelected, setLocalSelected] = React.useState<T[]>(value);

    // Đồng bộ local state mỗi khi mở modal hoặc value từ cha đổi
    React.useEffect(() => {
        if (visible) setLocalSelected(value);
    }, [visible, value]);

    // bỏ dấu + lower-case
    const normalizeVN = (s: string) =>
        (s || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();

    const selectedIds = React.useMemo(() => new Set(localSelected.map(v => v.id)), [localSelected]);

    const filtered = React.useMemo(() => {
        const q = normalizeVN(search.trim());
        if (!q) return options;
        return options.filter(o => normalizeVN(o.name).includes(q));
    }, [options, search]);

    const toggle = (item: T) => {
        setLocalSelected(prev => {
            const has = prev.some(v => v.id === item.id);
            const next = has ? prev.filter(v => v.id !== item.id) : [...prev, item];
            onChange?.(next); // ⛳ nếu muốn phản ánh "live" ra cha
            return next;
        });
    };

    const handleSave = () => {
        console.log('✅ Final selected:', localSelected);
        onSave(localSelected);   // ✅ trả danh sách cuối ra cha để cập nhật dữ liệu
        onClose();               // đóng modal sau khi lưu
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <ViewComponent center style={styles.modalOverlay}>
                <ViewComponent style={styles.modalCard}>
                    <ViewComponent row alignItems="center" between mb={8}>
                        <TextComponent text={title} variant="subtitle" weight="bold" />
                        <Pressable onPress={onClose} hitSlop={8}>
                            <McIcon name="close" size={20} color={C.slate600} />
                        </Pressable>
                    </ViewComponent>

                    <ViewComponent row alignItems="center" gap={8} style={styles.searchRow}>
                        <McIcon name="magnify" size={18} color={C.slate600} />
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Tìm kiếm…"
                            placeholderTextColor={C.slate500}
                            style={styles.searchInput}
                            autoCorrect={false}
                            autoCapitalize="none"
                            returnKeyType="search"
                        />
                        {!!search && (
                            <Pressable onPress={() => setSearch('')} hitSlop={8}>
                                <McIcon name="close-circle" size={18} color={C.slate500} />
                            </Pressable>
                        )}
                    </ViewComponent>

                    <ScrollView
                        style={styles.optionsList}
                        contentContainerStyle={styles.optionsListContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="always"
                    >
                        {filtered.map(item => {
                            const checked = selectedIds.has(item.id);
                            return (
                                <Pressable
                                    key={item.id}
                                    onPress={() => toggle(item)}
                                    accessibilityRole="checkbox"
                                    accessibilityState={{ checked }}
                                    hitSlop={6}
                                    style={[styles.optionRow, checked && styles.optionRowChecked]}
                                >
                                    <ViewComponent center style={[styles.checkbox, checked && styles.checkboxChecked]}>
                                        {checked && <McIcon name="check-bold" size={14} color={C.onPrimary} />}
                                    </ViewComponent>

                                    {/* Text 1 dòng, cắt đuôi, fill hàng */}
                                    <TextComponent
                                        text={(item.name ?? '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim()}
                                        weight="bold"
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                        color={checked ? C.slate800 : C.text}
                                        flexFill
                                    />
                                </Pressable>
                            );
                        })}
                        {filtered.length === 0 && (
                            <ViewComponent center py={14}>
                                <TextComponent text="Không tìm thấy mục phù hợp" weight="bold" tone="muted" />
                            </ViewComponent>
                        )}
                    </ScrollView>

                    {/* Footer: Hủy & Lưu */}
                    <ViewComponent row justifyContent="flex-end" gap={10} mt={10}>
                        <Pressable style={[styles.modalBtn, styles.modalCancel]} onPress={onClose}>
                            <TextComponent text="Hủy" weight="bold" color={C.slate700} />
                        </Pressable>
                        <Pressable style={[styles.modalBtn, styles.modalSave]} onPress={handleSave}>
                            <TextComponent text="Lưu" weight="bold" tone="inverse" />
                        </Pressable>
                    </ViewComponent>
                </ViewComponent>
            </ViewComponent>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalCard: {
        width: '100%', maxWidth: 520, backgroundColor: C.white, borderRadius: 16, padding: 14,
        borderWidth: 2, borderColor: C.info, ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
            android: { elevation: 6 },
        }),
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.35)', width: '100%', paddingHorizontal: 16, justifyContent: 'center' },
    searchRow: {
        borderWidth: 1, borderColor: C.accentBorder, backgroundColor: C.accentSurface,
        borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8,
    },
    searchInput: { flex: 1, color: C.text, fontWeight: '700', paddingVertical: 0 },
    optionsList: { maxHeight: 320 },
    optionsListContent: { paddingVertical: 4, minHeight: 200 },
    optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10 },
    optionRowChecked: { backgroundColor: '#eff6ff' },
    checkbox: {
        width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: C.info,
        alignItems: 'center', justifyContent: 'center', backgroundColor: C.white,
    },
    checkboxChecked: { backgroundColor: C.info, borderColor: C.info },
    modalBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
    modalCancel: { backgroundColor: C.slate50, borderColor: C.slate200 },
    modalSave: { backgroundColor: C.info, borderColor: '#2563eb' },
});

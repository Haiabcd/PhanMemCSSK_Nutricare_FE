import React, { useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import ViewComponent from '../../components/ViewComponent';
import TextComponent from '../../components/TextComponent';
import { colors as C } from '../../constants/colors';

type Option = { label: string; value: string };

type Props = {
    label?: string;
    value: string;
    options: Option[];
    onChange: (v: string) => void;
};

export default function Dropdown({ label = '', value, options, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const [anchorRect, setAnchorRect] = useState<{ x: number; y: number; w: number; h: number }>({ x: 0, y: 0, w: 0, h: 0 });
    const anchorRef = useRef<any>(null);

    const currentLabel = options.find(o => o.value === value)?.label ?? '';

    const openDropdown = () => {
        if (anchorRef.current?.measureInWindow) {
            anchorRef.current.measureInWindow((x: number, y: number, w: number, h: number) => {
                setAnchorRect({ x, y, w, h });
                setOpen(true);
            });
        } else setOpen(true);
    };

    const selectOption = (val: string) => {
        onChange(val);
        setOpen(false);
    };

    return (
        <ViewComponent style={{ flex: 1 }}>
            {!!label && <TextComponent text={label} variant="caption" tone="muted" style={{ marginBottom: 6 }} />}
            <Pressable ref={anchorRef} onPress={openDropdown} style={[styles.input, styles.select]}>
                <TextComponent text={currentLabel} weight="bold" />
                <McIcon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={C.slate600} />
            </Pressable>

            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <Pressable style={styles.ddBackdrop} onPress={() => setOpen(false)}>
                    <Pressable
                        onPress={() => { }}
                        style={[
                            styles.ddMenu,
                            { position: 'absolute', top: anchorRect.y + anchorRect.h + 4, left: anchorRect.x, width: Math.max(anchorRect.w, 180) },
                        ]}
                    >
                        <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            {options.map(opt => (
                                <Pressable key={opt.value} onPress={() => selectOption(opt.value)} style={styles.ddItem}>
                                    <TextComponent text={opt.label} weight="bold" />
                                </Pressable>
                            ))}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </ViewComponent>
    );
}

const styles = StyleSheet.create({
    input: {
        height: 46, borderRadius: 14, borderWidth: 1, borderColor: C.slate200,
        paddingHorizontal: 12, backgroundColor: C.white,
    },
    select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    ddBackdrop: { flex: 1, backgroundColor: 'transparent' },
    ddMenu: {
        backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.slate200,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
            android: { elevation: 8 },
        }),
        overflow: 'hidden',
    },
    ddItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.slate100 },
});

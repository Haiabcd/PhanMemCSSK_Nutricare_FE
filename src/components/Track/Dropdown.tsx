import React, { useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Dimensions } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import ViewComponent from '../../components/ViewComponent';
import TextComponent from '../../components/TextComponent';
import { colors as C } from '../../constants/colors';

/** ==================== Types ==================== */
type Option = { label: string; value: string };

type Props = {
    label?: string;
    value: string;
    options: Option[];
    onChange: (v: string) => void;

    /** 👇 Tuỳ chỉnh kích thước menu xổ xuống */
    menuWidth?: number;        // Chiều rộng menu (mặc định = width của nút hoặc 180)
    menuMaxHeight?: number;    // Chiều cao tối đa menu (mặc định = 280)
    menuOffsetY?: number;      // Khoảng cách menu cách nút (mặc định = 4)
};

/** ==================== Component ==================== */
export default function Dropdown({
    label = '',
    value,
    options,
    onChange,
    menuWidth,
    menuMaxHeight,
    menuOffsetY,
}: Props) {
    const [open, setOpen] = useState(false);
    const [anchorRect, setAnchorRect] = useState<{ x: number; y: number; w: number; h: number }>({
        x: 0, y: 0, w: 0, h: 0,
    });
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

    /** ==================== Tính toán vị trí và kích thước menu ==================== */
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max));
    const win = Dimensions.get('window');
    const MIN_MARGIN = 8;

    // Chiều rộng
    const minW = 160;
    const mW = menuWidth ?? Math.max(anchorRect.w, minW);
    const maxW = win.width - MIN_MARGIN * 2;
    const finalW = clamp(mW, minW, maxW);

    // Chiều cao
    const belowSpace = win.height - (anchorRect.y + anchorRect.h) - MIN_MARGIN;
    const mMaxH = menuMaxHeight ?? 280;
    const finalMaxH = Math.min(mMaxH, belowSpace);

    // Vị trí
    const offsetY = menuOffsetY ?? 4;
    const top = anchorRect.y + anchorRect.h + offsetY;
    const left = clamp(anchorRect.x, MIN_MARGIN, win.width - finalW - MIN_MARGIN);

    /** ==================== Render ==================== */
    return (
        <ViewComponent style={{ flex: 1 }}>
            {!!label && (
                <TextComponent
                    text={label}
                    variant="caption"
                    tone="muted"
                    style={{ marginBottom: 6 }}
                />
            )}

            {/* Trigger button */}
            <Pressable ref={anchorRef} onPress={openDropdown} style={[styles.input, styles.select]}>
                <TextComponent text={currentLabel} weight="bold" />
                <McIcon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={C.slate600} />
            </Pressable>

            {/* Menu xổ xuống */}
            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <Pressable style={styles.ddBackdrop} onPress={() => setOpen(false)}>
                    <Pressable
                        onPress={() => { }}
                        style={[
                            styles.ddMenu,
                            { position: 'absolute', top, left, width: finalW },
                        ]}
                    >
                        <ScrollView
                            style={{ maxHeight: finalMaxH }}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {options.map(opt => (
                                <Pressable
                                    key={opt.value}
                                    onPress={() => selectOption(opt.value)}
                                    style={styles.ddItem}
                                >
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

/** ==================== Styles ==================== */
const styles = StyleSheet.create({
    input: {
        height: 46,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.slate200,
        paddingHorizontal: 12,
        backgroundColor: C.white,
    },
    select: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ddBackdrop: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    ddMenu: {
        backgroundColor: C.white,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.slate200,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOpacity: 0.12,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 6 },
            },
            android: { elevation: 8 },
        }),
        overflow: 'hidden',
    },
    ddItem: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: C.slate100,
        justifyContent: 'center',
    },
});

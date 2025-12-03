import React from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import ViewComponent from '../ViewComponent';
import TextComponent from '../TextComponent';
import { colors as C } from '../../constants/colors';

type Props = {
    visible: boolean;
    message: string;
    onClose: () => void;
    onGoLogin: () => void;
};

export default function GoogleLinkedNoticeModal({
    visible,
    message,
    onClose,
    onGoLogin,
}: Props) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <ViewComponent center style={styles.backdrop}>
                <ViewComponent style={styles.card}>
                    {/* Icon + title */}
                    <ViewComponent row alignItems="center" gap={10} mb={10}>
                        <ViewComponent style={styles.iconWrapper} center>
                            <McIcon name="alert-circle-outline" size={26} color="#EA580C" />
                        </ViewComponent>
                        <TextComponent
                            text="Tài khoản Google đã được dùng"
                            weight="bold"
                            size={17}
                            color={C.text}
                        />
                    </ViewComponent>

                    {/* Nội dung chính (message từ server) */}
                    <TextComponent
                        text={message}
                        variant="body"
                        tone="muted"
                        style={{ marginBottom: 12 }}
                    />

                    {/* Gợi ý hành động */}
                    <ViewComponent style={{ marginBottom: 14 }}>
                        <TextComponent
                            text="Bạn có thể chọn:"
                            weight="semibold"
                            variant="caption"
                            color={C.slate600}
                            style={{ marginBottom: 4 }}
                        />
                        <TextComponent
                            text="• Hủy để thử với tài khoản Google khác"
                            variant="caption"
                            tone="muted"
                            style={{ marginBottom: 2 }}
                        />
                        <TextComponent
                            text="• Hoặc quay về màn Đăng nhập để dùng đúng tài khoản đã liên kết trước đó"
                            variant="caption"
                            tone="muted"
                        />
                    </ViewComponent>

                    {/* Buttons */}
                    <ViewComponent row gap={10} mt={6}>
                        <Pressable style={styles.secondaryBtn} onPress={onClose}>
                            <TextComponent
                                text="Hủy"
                                weight="bold"
                                color={C.slate700}
                            />
                        </Pressable>

                        <Pressable style={styles.primaryBtn} onPress={onGoLogin}>
                            <TextComponent
                                text="Quay về đăng nhập"
                                weight="bold"
                                tone="inverse"
                            />
                        </Pressable>
                    </ViewComponent>
                </ViewComponent>
            </ViewComponent>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.45)', // overlay tối
        paddingHorizontal: 24,
    },
    card: {
        width: '100%',
        maxWidth: 420,
        borderRadius: 22,
        paddingHorizontal: 18,
        paddingVertical: 16,
        backgroundColor: C.white,
        // shadow iOS
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        // elevation Android
        elevation: 8,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: '#DCFCE7', // emerald-100
        marginBottom: 10,
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 999,
        backgroundColor: '#FFEDD5', // amber-100
    },
    primaryBtn: {
        flex: 1,
        height: 44,
        borderRadius: 999,
        backgroundColor: C.success,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryBtn: {
        flex: 1,
        height: 44,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: C.slate200,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

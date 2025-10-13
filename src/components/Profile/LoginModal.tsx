import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Platform,
} from 'react-native';
import ViewComponent from '../ViewComponent';
import TextComponent from '../TextComponent';
import { colors as C } from '../../constants/colors';
import BounceButton from '../Welcome/BounceButton';

type Props = {
    visible: boolean;
    onClose: () => void;
    onSelect: (provider: 'google' | 'facebook') => void;
};

export default function LoginChoiceModal({ visible, onClose, onSelect }: Props) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <ViewComponent center style={styles.centerWrap}>
                    {/* chặn click xuyên qua card */}
                    <Pressable onPress={() => { }} style={styles.card}>
                        <TextComponent
                            text="Chọn phương thức đăng nhập"
                            variant="subtitle"
                            weight="bold"
                            style={styles.title}
                        />
                        <TextComponent
                            text="Đăng nhập để đồng bộ và lưu trữ dữ liệu khi đổi thiết bị."
                            variant="caption"
                            tone="muted"
                            style={styles.caption}
                        />

                        {/* Google */}
                        <BounceButton
                            label="Tiếp tục với Google"
                            icon="google"
                            labelSize={16}
                            iconStyle={{ color: '#EA4335', fontSize: 18 }}
                            style={styles.googleBtn}
                            labelStyle={{ fontWeight: '800' }}
                            onPress={() => onSelect('google')}
                        />

                        {/* Facebook */}
                        <BounceButton
                            label="Tiếp tục với Facebook"
                            icon="facebook"
                            labelSize={16}
                            iconStyle={{ color: C.white, fontSize: 18 }}
                            style={styles.facebookBtn}
                            labelStyle={{ color: C.white, fontWeight: '800' }}
                            onPress={() => onSelect('facebook')}
                        />

                        <Pressable style={styles.cancelBtn} onPress={onClose}>
                            <TextComponent text="Hủy" weight="bold" />
                        </Pressable>
                    </Pressable>
                </ViewComponent>
            </Pressable>
        </Modal>
    );
}

/* ============ Styles (compact) ============ */
const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(2,6,23,0.28)',
        width: '100%',
    },
    centerWrap: {
        flex: 1,
        paddingHorizontal: 14,
        width: '100%',
    },
    card: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: C.white,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: C.slate200,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
            },
            android: { elevation: 3 },
        }),
    },
    title: { marginBottom: 6 },
    caption: { marginBottom: 10 },

    /* --- BounceButton compact --- */
    googleBtn: {
        backgroundColor: C.white,
        borderWidth: 1,
        borderColor: C.slate200,
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginBottom: 8,
    },
    facebookBtn: {
        backgroundColor: '#1877F2',
        borderWidth: 1,
        borderColor: '#1877F2',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginBottom: 10,
    },

    cancelBtn: {
        alignItems: 'center',
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: C.slate100,
    },
});

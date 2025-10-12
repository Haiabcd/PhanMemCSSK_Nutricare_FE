import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import ViewComponent from '../../components/ViewComponent';
import TextComponent from '../../components/TextComponent';
import { colors as C } from '../../constants/colors';

export type ToastKind = 'success' | 'danger';

type Props = {
    visible: boolean;
    title: string;
    subtitle?: string;
    kind?: ToastKind;
};

export default function ToastCenter({ visible, title, subtitle, kind = 'success' }: Props) {
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

    const color = kind === 'success' ? C.success : C.red;
    const tint = kind === 'success' ? C.greenSurface : '#fee2e2';

    return (
        <Animated.View pointerEvents="none" style={[styles.toastOverlay, { opacity }]}>
            <Animated.View style={[styles.toastCard, { transform: [{ scale }] }]}>
                <ViewComponent row alignItems="center" gap={12} px={16} py={18}>
                    <ViewComponent center style={{ width: 46, height: 46, borderRadius: 999, backgroundColor: tint }}>
                        <McIcon name={kind === 'success' ? 'check' : 'trash-can-outline'} size={26} color={color} />
                    </ViewComponent>

                    <ViewComponent flex={1}>
                        <TextComponent text={title} variant="h3" />
                        {!!subtitle && <TextComponent text={subtitle} variant="caption" tone="muted" />}
                    </ViewComponent>
                </ViewComponent>

                <ViewComponent row gap={6} justifyContent="center" pb={14} px={16}>
                    <ViewComponent style={{ width: 28, height: 4, borderRadius: 999, backgroundColor: color, opacity: 0.25 }} />
                    <ViewComponent style={{ width: 28, height: 4, borderRadius: 999, backgroundColor: color, opacity: 0.45 }} />
                    <ViewComponent style={{ width: 28, height: 4, borderRadius: 999, backgroundColor: color, opacity: 0.25 }} />
                </ViewComponent>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    toastOverlay: {
        position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
        backgroundColor: 'rgba(2,6,23,0.25)', alignItems: 'center', justifyContent: 'center', zIndex: 999, paddingHorizontal: 24,
    },
    toastCard: {
        width: '92%', maxWidth: 420, backgroundColor: C.white, borderRadius: 24, overflow: 'hidden',
        shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, elevation: 8, borderWidth: 3, borderColor: C.info,
    },
});

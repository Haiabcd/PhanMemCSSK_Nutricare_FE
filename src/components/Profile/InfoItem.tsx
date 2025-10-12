import React from 'react';
import { StyleSheet } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import ViewComponent from '../../components/ViewComponent';
import TextComponent from '../../components/TextComponent';
import { colors as C } from '../../constants/colors';

type Props = {
    icon: string;
    label: string;
    value: string;
    /** Cho phép override style bên ngoài nếu cần */
    style?: object;
};

export default function InfoItem({ icon, label, value, style }: Props) {
    return (
        <ViewComponent variant="card" style={[styles.infoCard, style]}>
            <ViewComponent row alignItems="center" mb={8}>
                <ViewComponent
                    center
                    style={styles.iconBadge}
                >
                    <McIcon name={icon as any} size={16} color={C.success} />
                </ViewComponent>

                <TextComponent
                    text={label}
                    variant="caption"
                    tone="muted"
                    weight="bold"
                    style={styles.label}
                />
            </ViewComponent>

            <TextComponent text={value} weight="bold" />
        </ViewComponent>
    );
}

const styles = StyleSheet.create({
    infoCard: {
        width: '48%',
        padding: 16,
        marginBottom: 14,
        marginHorizontal: '1%',
        borderRadius: 14,
        backgroundColor: C.white,
        borderWidth: 0,
        // thêm bóng đổ nhẹ
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3, // cho Android
    },
    iconBadge: {
        width: 26,
        height: 26,
        borderRadius: 999,
        backgroundColor: C.greenSurface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        marginLeft: 8,
        letterSpacing: 0.3,
    },
});


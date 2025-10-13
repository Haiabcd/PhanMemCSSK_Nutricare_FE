import React from 'react';
import { StyleSheet } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import ViewComponent from '../../components/ViewComponent';
import TextComponent from '../../components/TextComponent';
import { colors as C } from '../../constants/colors';

type Props = {
    icon: string;
    label: string;
    children: React.ReactNode;
    style?: object;
};

export default function FormField({ icon, label, children, style }: Props) {
    return (
        <ViewComponent variant="card" style={[styles.fieldCard, style]}>
            <ViewComponent row alignItems="center" mb={8}>
                <ViewComponent center style={styles.iconBadge}>
                    <McIcon name={icon as any} size={16} color={C.success} />
                </ViewComponent>
                <TextComponent text={label} variant="caption" tone="muted" weight="bold" style={styles.label} />
            </ViewComponent>
            {children}
        </ViewComponent>
    );
}

const styles = StyleSheet.create({
    fieldCard: {
        width: '100%',
        padding: 10,
        marginBottom: 14,
        borderRadius: 14,
        backgroundColor: C.white,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
    },
    iconBadge: {
        width: 26, height: 26, borderRadius: 999, backgroundColor: C.greenSurface, alignItems: 'center', justifyContent: 'center',
    },
    label: { marginLeft: 8, letterSpacing: 0.3 },
});

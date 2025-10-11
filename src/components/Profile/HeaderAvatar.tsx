import React from 'react';
import { Image, StyleSheet } from 'react-native';
import ViewComponent from '../../components/ViewComponent';
import TextComponent from '../../components/TextComponent';
import { colors as C } from '../../constants/colors';

type Props = { name: string; photoUri?: string | null };

export default function HeaderAvatar({ name, photoUri }: Props) {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    if (photoUri) return <Image source={{ uri: photoUri }} style={styles.headerAvatar} />;

    return (
        <ViewComponent center style={styles.headerAvatarFallback} flex={0}>
            <TextComponent text={initials} variant="subtitle" tone="primary" weight="bold" />
        </ViewComponent>
    );
}

const styles = StyleSheet.create({
    headerAvatarFallback: {
        width: 52, height: 52, borderRadius: 999, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    },
    headerAvatar: { width: 52, height: 52, borderRadius: 999 },
});

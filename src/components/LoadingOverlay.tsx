import React, { memo } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import ViewComponent from './ViewComponent';
import TextComponent from './TextComponent';
import { colors } from '../constants/colors';

interface Props {
    visible: boolean;
    label?: string;
}

const LoadingOverlay = memo(({ visible, label = 'Đang đồng bộ...' }: Props) => {
    if (!visible) return null;

    return (
        <ViewComponent
            center
            style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: 'rgba(15,23,42,0.15)' }, // slate900 (#0f172a) @ 0.15
            ]}
        >
            <ActivityIndicator size="large" color={colors.primary} />
            <TextComponent
                text={label}
                variant="body"
                tone="default"
                style={{ marginTop: 8 }}
            />
        </ViewComponent>
    );
});

export default LoadingOverlay;

import React, { memo } from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { colors as C } from '../../constants/colors';

type Props = {
    /** Chiều cao viewport (vùng nhìn thấy) của ScrollView */
    visibleH: number;
    /** Tổng chiều cao nội dung ScrollView */
    contentH: number;
    /** Vị trí cuộn theo trục Y */
    scrollY: number;

    /** Độ rộng thanh scrollbar (mặc định 4) */
    width?: number;
    /** Chiều cao tối thiểu của thumb (mặc định 28) */
    minThumb?: number;
    /** Màu track (nền nhạt của thanh) */
    trackColor?: string;
    /** Màu thumb (ngón tay) */
    thumbColor?: string;
    /** Canh về bên nào của container (mặc định 'right') */
    align?: 'right' | 'left';
    /** Style phụ cho container overlay nếu cần */
    containerStyle?: ViewStyle | ViewStyle[];
};

const GreenScrollbar: React.FC<Props> = memo(({
    visibleH,
    contentH,
    scrollY,
    width = 4,
    minThumb = 28,
    trackColor = 'rgba(67,176,92,0.12)', // nhạt theo brand #43B05C
    thumbColor = C.primary,
    align = 'right',
    containerStyle,
}) => {
    if (contentH <= visibleH || visibleH <= 0) return null;

    const trackH = visibleH;
    const ratio = visibleH / contentH;
    const thumbH = Math.max(minThumb, trackH * ratio);
    const maxScroll = contentH - visibleH;
    const maxThumbTravel = trackH - thumbH;
    const thumbY = maxScroll > 0 ? (scrollY / maxScroll) * maxThumbTravel : 0;

    const alignStyle =
        align === 'right'
            ? { alignItems: 'flex-end', marginRight: 2 }
            : { alignItems: 'flex-start', marginLeft: 2 };

    return (
        <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, alignStyle, (containerStyle as any)]}
        >
            <View
                style={{
                    width,
                    height: trackH,
                    borderRadius: 999,
                    backgroundColor: trackColor,
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                }}
            >
                <View
                    style={[
                        {
                            width,
                            borderRadius: 999,
                            backgroundColor: thumbColor,
                            height: thumbH,
                            transform: [{ translateY: thumbY }],
                        },
                        Platform.select({
                            ios: { shadowColor: thumbColor, shadowOpacity: 0.35, shadowRadius: 3, shadowOffset: { width: 0, height: 0 } },
                            android: { elevation: 2 },
                        }),
                    ]}
                />
            </View>
        </View>
    );
});

export default GreenScrollbar;

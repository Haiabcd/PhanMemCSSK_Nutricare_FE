import React from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from "react-native";

type WheelPickerProps = {
    data: number[];                     // danh sách giá trị
    value: number | null;               // giá trị đang chọn (nếu có)
    onChange: (v: number) => void;      // callback khi chọn xong
    itemHeight?: number;                // mặc định 56
    visibleCount?: number;              // mặc định 5 (nên là số lẻ)
    highlightColor?: string;            // viền ô giữa
    highlightBg?: string;               // nền ô giữa
};

const WheelPicker: React.FC<WheelPickerProps> = ({
    data,
    value,
    onChange,
    itemHeight = 56,
    visibleCount = 5,
    highlightColor = "#22C55E",
    highlightBg = "#E8F8EE",
}) => {
    const listRef = React.useRef<FlatList<number>>(null);
    const [selectedIndex, setSelectedIndex] = React.useState<number>(
        value != null ? Math.max(0, Math.min(data.length - 1, data.indexOf(value))) : -1
    );

    const containerHeight = itemHeight * visibleCount;
    const padV = (containerHeight - itemHeight) / 2;

    // scroll tới giá trị ban đầu (nếu có)
    React.useEffect(() => {
        if (value != null) {
            const idx = Math.max(0, Math.min(data.length - 1, data.indexOf(value)));
            setSelectedIndex(idx);
            requestAnimationFrame(() => {
                listRef.current?.scrollToOffset({
                    offset: idx * itemHeight,
                    animated: false,
                });
            });
        }
    }, [value, data, itemHeight]);

    const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = e.nativeEvent.contentOffset.y;
        const idx = Math.round(y / itemHeight);
        const val = data[idx];
        setSelectedIndex(idx);
        if (typeof val === "number") onChange(val);
    };

    return (
        <View style={[styles.box, { height: containerHeight }]}>
            {/* khung highlight giữa */}
            <View
                pointerEvents="none"
                style={[
                    styles.highlight,
                    {
                        top: (containerHeight - itemHeight) / 2,
                        height: itemHeight,
                        borderColor: highlightColor,
                        backgroundColor: highlightBg,
                    },
                ]}
            />
            <FlatList
                ref={listRef}
                data={data}
                keyExtractor={(item) => String(item)}
                showsVerticalScrollIndicator={false}
                bounces={false}
                snapToInterval={itemHeight}
                decelerationRate="fast"
                onMomentumScrollEnd={onMomentumScrollEnd}
                contentContainerStyle={{ paddingVertical: padV }}
                renderItem={({ item, index }) => {
                    const active = index === selectedIndex;
                    return (
                        <View style={[styles.item, { height: itemHeight }]}>
                            <Text style={[styles.text, active ? styles.textActive : styles.textInactive]}>
                                {item}
                            </Text>
                        </View>
                    );
                }}
            />
        </View>
    );
};

export default WheelPicker;

const styles = StyleSheet.create({
    box: {
        position: "relative",
        overflow: "hidden",
        borderRadius: 16,
        backgroundColor: "#FFFFFF",
    },
    highlight: {
        position: "absolute",
        left: 12,
        right: 12,
        borderRadius: 16,
        borderWidth: 2,
    },
    item: {
        justifyContent: "center",
        alignItems: "center",
    },
    text: { fontWeight: "700" },
    textActive: { fontSize: 24, color: "#111827" },
    textInactive: { fontSize: 20, color: "#9CA3AF", opacity: 0.6 },
});

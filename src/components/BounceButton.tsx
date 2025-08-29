import React, { useMemo, useRef } from "react";
import {
    Animated,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
    Text,
    Image,
    StyleSheet,
    ImageSourcePropType,
    StyleProp,
    ViewStyle,
    TextStyle,
    ImageStyle,
} from "react-native";
import { colors } from "../constants/colors";

type BounceButtonProps = {
    label?: string;
    iconSource?: ImageSourcePropType;
    labelSize?: number;
    containerStyle?: StyleProp<ViewStyle>;
    labelStyle?: StyleProp<TextStyle>;
    iconStyle?: StyleProp<ImageStyle>;
    gap?: number;
    duration?: number;
    pressedScale?: number;
} & Omit<TouchableOpacityProps, "activeOpacity" | "onPressIn" | "onPressOut">;

const BounceButton: React.FC<BounceButtonProps> = ({
    label,
    iconSource,
    labelSize = 16,
    containerStyle,
    labelStyle,
    iconStyle,
    gap = 15,
    duration = 90,
    pressedScale = 0.95,
    children,
    onPress,
    disabled,
    ...touchableProps
}) => {
    const scale = useRef(new Animated.Value(1)).current;

    const animateTo = (toValue: number) => {
        Animated.timing(scale, {
            toValue,
            duration,
            useNativeDriver: true,
        }).start();
    };

    const onPressIn = () => animateTo(pressedScale);
    const onPressOut = () => animateTo(1);

    const content = useMemo(() => {
        // Nếu truyền children thì ưu tiên render children
        if (children) return children;
        return (
            <View style={styles.row}>
                {iconSource ? (
                    <Image source={iconSource} style={[styles.icon, iconStyle]} resizeMode="contain" />
                ) : null}
                {iconSource && label ? <View style={{ width: gap }} /> : null}
                {label ? (
                    <Text style={[styles.label, { fontSize: labelSize }, labelStyle]} numberOfLines={1}>
                        {label}
                    </Text>
                ) : null}
            </View>
        );
    }, [children, iconSource, iconStyle, label, labelSize, labelStyle, gap]);

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                onPress={onPress}
                disabled={disabled}
                style={[styles.buttonBase, disabled && styles.disabled, containerStyle]}
                {...touchableProps}
            >
                {content}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    buttonBase: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        backgroundColor: colors.white,
        paddingVertical: 15,
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    icon: {
        width: 22,
        height: 22,
    },
    label: {
        color: colors.black,
        fontWeight: "700",
    },
    disabled: {
        opacity: 0.5,
    },
});

export default BounceButton;

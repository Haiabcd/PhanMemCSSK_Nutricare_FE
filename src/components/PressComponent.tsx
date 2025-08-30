import React from "react";
import {
    Pressable,
    Text,
    StyleSheet,
    StyleProp,
    ViewStyle,
    TextStyle,
} from "react-native";
import { fontFamilies } from "../constants/fontFamilies";
import { colors } from "../constants/colors";

type Props = {
    label: string;
    onPress: () => void;
    bg?: string;
    color?: string;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
};

const NCButton: React.FC<Props> = ({
    label,
    onPress,
    bg = colors.greenLight,
    color = colors.textWhite,
    disabled = false,
    style,
    textStyle,
}) => {
    return (
        <Pressable
            accessibilityRole="button"
            onPress={disabled ? undefined : onPress}
            style={({ pressed }) => [
                styles.btn,
                { backgroundColor: bg, opacity: disabled ? 0.6 : pressed ? 0.9 : 1 },
                style,
            ]}
            android_ripple={{ color: "rgba(0,0,0,0.08)" }}
            hitSlop={8}
        >
            <Text style={[styles.text, { color }, textStyle]} numberOfLines={1}>
                {label}
            </Text>
        </Pressable>
    );
};

export default NCButton;

const styles = StyleSheet.create({
    btn: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    text: { fontSize: 18, fontWeight: 'bold', fontFamily: fontFamilies.bold },
});

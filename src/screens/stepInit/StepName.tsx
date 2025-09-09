// features/WizardScreens.tsx
import React, { useState } from "react";
import { View, TextInput, StyleSheet, Text, Platform } from "react-native";
import WizardFrame from "../../components/WizardFrame";
import { useWizard } from "../../context/WizardContext";
import { colors } from "../../constants/colors";

const GREEN = colors?.green ?? "#22C55E";
const GREEN_DARK = "#16A34A";
const EMERALD_50 = "#ECFDF5";
const EMERALD_100 = "#D1FAE5";
const SLATE_600 = "#475569";
const SLATE_400 = "#94A3B8";
const SLATE_200 = "#E2E8F0";
const WHITE = colors?.white ?? "#FFFFFF";

export const StepNameScreen = () => {
    const { form, updateForm } = useWizard();
    const [isFocused, setIsFocused] = useState(false);

    return (
        <WizardFrame 
            title="Bạn Tên Là Gì?"
            subtitle="Hãy cho chúng tôi biết tên của bạn để cá nhân hóa trải nghiệm"
        >
            <View style={styles.container}>
                {/* Name Input Section */}
                <View style={styles.inputContainer}>
                    <TextInput
                        placeholder="Nhập tên của bạn..."
                        placeholderTextColor={SLATE_400}
                        value={form.name}
                        onChangeText={(t) => updateForm({ name: t })}
                        style={[
                            styles.input,
                            isFocused && styles.inputFocused
                        ]}
                        returnKeyType="done"
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        maxLength={50}
                        autoCapitalize="words"
                        autoFocus={true}
                    />
                    <Text style={styles.charCount}>
                        {form.name.length}/50 ký tự
                    </Text>
                </View>

                {/* Hint Text */}
                <Text style={styles.hintText}>
                    Bạn có thể sử dụng tên thật hoặc biệt danh mà bạn thích
                </Text>
            </View>
        </WizardFrame>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    inputContainer: {
        width: "100%",
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: SLATE_600,
        marginBottom: 12,
        marginLeft: 4,
    },
    input: {
        width: "100%",
        backgroundColor: WHITE,
        borderWidth: 2,
        borderColor: SLATE_200,
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 18,
        fontSize: 18,
        fontWeight: "500",
        color: SLATE_600,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    inputFocused: {
        borderColor: GREEN,
        backgroundColor: EMERALD_50,
    },
    charCount: {
        fontSize: 12,
        color: SLATE_400,
        textAlign: "right",
        marginTop: 8,
        marginRight: 4,
    },
    hintText: {
        fontSize: 14,
        color: SLATE_400,
        textAlign: "center",
        marginTop: 24,
        lineHeight: 20,
        paddingHorizontal: 20,
    },
});

export default StepNameScreen;
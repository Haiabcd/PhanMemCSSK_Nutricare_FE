// features/WizardScreens.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import ProfilePhoto from "../../components/ProfilePhoto";
import WizardFrame from "../../components/WizardFrame";
import { useWizard } from "../../context/WizardContext";



export const StepGenderScreen = () => {
    const { form, updateForm } = useWizard();
    const options = [
        { key: "male", label: "Nam" },
        { key: "female", label: "Nữ" },
        { key: "other", label: "Khác" },
    ] as const;

    return (
        <WizardFrame title="Giới Tính Của Bạn Là Gì?">
            <View style={{ alignItems: "center", justifyContent: "center", margin: 40 }}>
                <ProfilePhoto sourceImg={require("../../assets/images/ProfileInitialization/gender.png")} />
            </View>

            <View style={styles.radioGroup}>
                {options.map((opt) => {
                    const selected = form.gender === opt.key;
                    return (
                        <Pressable
                            key={opt.key}
                            onPress={() => updateForm({ gender: opt.key })}
                            style={[styles.radioItem, selected && styles.radioItemSelected]}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: selected }}
                            hitSlop={8}
                        >
                            <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                                {selected && <View style={styles.radioInner} />}
                            </View>
                            <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>{opt.label}</Text>
                        </Pressable>
                    );
                })}
            </View>
        </WizardFrame>
    );
}

/** Styles tái dùng */
const styles = StyleSheet.create({
    radioGroup: { flexDirection: "column", alignItems: "flex-start", marginTop: 8 },
    radioItem: {
        flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12,
        borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff",
        borderRadius: 12, width: "100%", marginBottom: 8,
    },
    radioItemSelected: { borderColor: "#22C55E", backgroundColor: "#DCFCE7" },
    radioOuter: {
        width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#9CA3AF",
        alignItems: "center", justifyContent: "center", marginRight: 8,
    },
    radioOuterSelected: { borderColor: "#22C55E" },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#22C55E" },
    radioLabel: { fontSize: 16, color: "#111827", fontWeight: "500" },
    radioLabelSelected: { color: "#065F46" },
});

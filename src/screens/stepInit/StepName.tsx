// features/WizardScreens.tsx
import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import ProfilePhoto from "../../components/ProfilePhoto";
import WizardFrame from "../../components/WizardFrame";
import { useWizard } from "../../context/WizardContext";

export const StepNameScreen = () => {
    const { form, updateForm } = useWizard();
    return (
        <WizardFrame title="Bạn Tên Là Gì ?">
            <View style={{ alignItems: "center", justifyContent: "center", margin: 40 }}>
                <ProfilePhoto sourceImg={require("../../assets/images/ProfileInitialization/name.png")} />
            </View>
            <TextInput
                placeholder="Hãy Nhập Vào Tên Của Bạn"
                value={form.name}
                onChangeText={(t) => updateForm({ name: t })}
                style={styles.input}
                returnKeyType="done"
            />
        </WizardFrame>
    );
}
const styles = StyleSheet.create({
    input: {
        borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff",
        paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
        marginBottom: 16, marginTop: 34, fontSize: 16,
    },
});
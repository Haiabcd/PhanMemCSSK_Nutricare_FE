// features/WizardScreens.tsx
import React from "react";
import { View, Text } from "react-native";
import ProfilePhoto from "../../components/ProfilePhoto";
import WheelPicker from "../../components/WheelPicker";
import WizardFrame from "../../components/WizardFrame";
import { useWizard } from "../../context/WizardContext";


export const StepAgeScreen = () => {
    const { form, updateForm } = useWizard();
    const ages = Array.from({ length: 110 }, (_, i) => i + 1);
    return (
        <WizardFrame title="Bạn Bao Nhiêu Tuổi ?">
            <View style={{ alignItems: "center", justifyContent: "center", margin: 40 }}>
                <ProfilePhoto sourceImg={require("../../assets/images/ProfileInitialization/old.png")} />
            </View>

            <WheelPicker
                data={ages}
                value={form.age}
                onChange={(v) => updateForm({ age: v })}
                itemHeight={56}
                visibleCount={5}
                highlightColor="#22C55E"
                highlightBg="#E8F8EE"
            />
            {form.age == null && (
                <Text style={{ marginTop: 8, textAlign: "center", color: "#6B7280" }}>Kéo để chọn tuổi</Text>
            )}
        </WizardFrame>
    );
}


// features/Wizard.tsx
import React from "react";
import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { Picker } from "@react-native-picker/picker";
import ProfilePhoto from "../components/ProfilePhoto";

import TitleComponent from "../components/TitleComponent";
import WheelPicker from "../components/WheelPicker";

type Gender = "male" | "female" | "other";
// ⬇️ Thêm height/weight và cho phép age = null để hiển thị hint khi chưa chọn
type Form = { name: string; age: number | null; gender: Gender; height: number | null; weight: number | null };

type WizardProps = {
    step: number;
    form: Form;
    setForm: (patch: Partial<Form>) => void;
};

// Step 0: Nhập tên
const StepName: React.FC<Pick<WizardProps, "form" | "setForm">> = ({ form, setForm }) => {
    return (
        <View>
            <TitleComponent text="Bạn Tên Là Gì ?" size={26} style={{ textAlign: 'center' }} />

            <View style={{ alignItems: 'center', justifyContent: 'center', margin: 40 }}>
                <ProfilePhoto sourceImg={require('../assets/images/ProfileInitialization/name.png')} />
            </View>

            <TextInput
                placeholder="Hãy Nhập Vào Tên Của Bạn"
                value={form.name}
                onChangeText={(t) => setForm({ name: t })}
                style={styles.input}
                returnKeyType="done"
            />
        </View>
    );
};

// Step 1: Chọn tuổi
const StepAge: React.FC<Pick<WizardProps, "form" | "setForm">> = ({ form, setForm }) => {
    const ages = Array.from({ length: 110 }, (_, i) => i + 1); // 1..110

    return (
        <View>
            <TitleComponent text="Bạn Bao Nhiêu Tuổi ?" size={26} style={{ textAlign: "center" }} />
            <View style={{ alignItems: "center", justifyContent: "center", margin: 40 }}>
                <ProfilePhoto sourceImg={require("../assets/images/ProfileInitialization/old.png")} />
            </View>

            <WheelPicker
                data={ages}
                value={form.age}
                onChange={(v) => setForm({ age: v })}     // cập nhật form
                itemHeight={56}
                visibleCount={5}
                highlightColor="#22C55E"
                highlightBg="#E8F8EE"
            />

            {form.age == null && (
                <Text style={{ marginTop: 8, textAlign: "center", color: "#6B7280" }}>
                    Kéo để chọn tuổi
                </Text>
            )}
        </View>
    );
};

// Step 2: Chọn giới tính
const StepGender: React.FC<Pick<WizardProps, "form" | "setForm">> = ({ form, setForm }) => {
    return (
        <View>
            <TitleComponent text="Giới Tính Của Bạn Là Gì?" size={26} style={{ textAlign: 'center' }} />

            <View style={{ alignItems: 'center', justifyContent: 'center', margin: 40 }}>
                <ProfilePhoto sourceImg={require('../assets/images/ProfileInitialization/gender.png')} />
            </View>

            <View style={styles.radioGroup}>
                {[
                    { key: "male", label: "Nam" },
                    { key: "female", label: "Nữ" },
                    { key: "other", label: "Khác" },
                ].map((opt) => {
                    const selected = form.gender === (opt.key as Gender);
                    return (
                        <Pressable
                            key={opt.key}
                            onPress={() => setForm({ gender: opt.key as Gender })}
                            style={[styles.radioItem, selected && styles.radioItemSelected]}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: selected }}
                            hitSlop={8}
                        >
                            <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                                {selected && <View style={styles.radioInner} />}
                            </View>
                            <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>
                                {opt.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

// Step 3: Chọn chiều cao, cân nặng
const StepHighWeigh: React.FC<Pick<WizardProps, "form" | "setForm">> = ({ form, setForm }) => {
    const heights = Array.from({ length: 71 }, (_, i) => 140 + i); // 140..210 cm
    const weights = Array.from({ length: 116 }, (_, i) => 35 + i); // 35..150 kg

    return (
        <View>
            <TitleComponent text="Bạn Cao và Nặng Bao Nhiêu ?" size={26} style={{ textAlign: 'center' }} />

            <View style={{ alignItems: 'center', justifyContent: 'center', margin: 40 }}>
                <ProfilePhoto sourceImg={require('../assets/images/ProfileInitialization/heighWeigh.png')} />
            </View>

            <View style={styles.hwRow}>
                {/* Trái: Chiều cao */}
                <View style={styles.hwColLeft}>
                    <Text style={styles.hwLabel}>Chiều cao (cm)</Text>
                    <WheelPicker
                        data={heights}
                        value={form.height}
                        onChange={(v) => setForm({ height: v })}
                        itemHeight={56}
                        visibleCount={5}
                        highlightColor="#22C55E"
                        highlightBg="#DCFCE7"
                    // formatItem={(v) => `${v} cm`}
                    />
                </View>

                {/* Phải: Cân nặng */}
                <View style={styles.hwColRight}>
                    <Text style={styles.hwLabel}>Cân nặng (kg)</Text>
                    <WheelPicker
                        data={weights}
                        value={form.weight}
                        onChange={(v) => setForm({ weight: v })}
                        itemHeight={56}
                        visibleCount={5}
                        highlightColor="#22C55E"
                        highlightBg="#DCFCE7"
                    // formatItem={(v) => `${v} kg`}
                    />
                </View>
            </View>
        </View>
    );
};

// Step 4: Chọn mục tiêu
const StepTarget: React.FC<Pick<WizardProps, "form" | "setForm">> = ({ form, setForm }) => {
    return (
        <View>
            <TitleComponent text="Mục Tiêu Của Bạn Là ?" size={26} style={{ textAlign: 'center' }} />

            <View style={{ alignItems: 'center', justifyContent: 'center', margin: 40 }}>
                <ProfilePhoto sourceImg={require('../assets/images/ProfileInitialization/target.png')} />
            </View>

            <View style={styles.radioGroup}>
                {[
                    { key: "gainWeight", label: " Tăng Cân" },
                    { key: "loseWeight", label: "Giảm Cân" },
                    { key: "maintainWeight", label: "Duy Trì Cân Nặng" },
                ].map((opt) => {
                    const selected = form.gender === (opt.key as Gender);
                    return (
                        <Pressable
                            key={opt.key}
                            onPress={() => setForm({ gender: opt.key as Gender })}
                            style={[styles.radioItem, selected && styles.radioItemSelected]}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: selected }}
                            hitSlop={8}
                        >
                            <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                                {selected && <View style={styles.radioInner} />}
                            </View>
                            <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>
                                {opt.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

// Step 5: Muc do van động
const StepLevel: React.FC<Pick<WizardProps, "form" | "setForm">> = ({ form, setForm }) => {
    return (
        <View>
            <TitleComponent text="Mức Độ Vận Động Của Bạn ?" size={26} style={{ textAlign: 'center' }} />

            <View style={{ alignItems: 'center', justifyContent: 'center', margin: 40 }}>
                <ProfilePhoto sourceImg={require('../assets/images/ProfileInitialization/level.png')} />
            </View>

            <View style={styles.radioGroup}>
                {[
                    { key: "Sedentary", label: "Ít Vận Động" },
                    { key: "LightlyActive", label: "Vận Động Nhẹ" },
                    { key: "ModeratelyActive", label: "Vận Động Trung Bình" },
                    { key: "VeryActive", label: "Vận Động Cao" },
                    { key: "SuperActive", label: "Vận Động Rất Cao/ Vận Động Viên" },
                ].map((opt) => {
                    const selected = form.gender === (opt.key as Gender);
                    return (
                        <Pressable
                            key={opt.key}
                            onPress={() => setForm({ gender: opt.key as Gender })}
                            style={[styles.radioItem, selected && styles.radioItemSelected]}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: selected }}
                            hitSlop={8}
                        >
                            <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                                {selected && <View style={styles.radioInner} />}
                            </View>
                            <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>
                                {opt.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};


const WizardScreen: React.FC<WizardProps> = ({ step, form, setForm }) => {
    const renderStep = () => {
        switch (step) {
            case 0: return <StepName form={form} setForm={setForm} />;
            case 1: return <StepTarget form={form} setForm={setForm} />;
            case 2: return <StepLevel form={form} setForm={setForm} />;
            default: return <Text>Hoàn Tất Hồ Sơ!</Text>;
        }
    };

    return <View style={styles.container}>{renderStep()}</View>;
};

export default WizardScreen;

const styles = StyleSheet.create({
    container: { flex: 1 },

    title: { fontSize: 24, fontWeight: "bold", marginBottom: 8, color: "#111827" },
    subtitle: { fontSize: 16, color: "#6B7280", marginBottom: 16 },

    input: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#fff",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        marginBottom: 16,
        marginTop: 34,
        fontSize: 16,
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 16,
    },
    pickerBox: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        backgroundColor: "#fff",
        overflow: "hidden",
    },
    picker: {
        width: "100%",
        height: 50,
    },
    orText: {
        marginHorizontal: 8,
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "500",
    },

    // --- giới tính (radio dọc) ---
    radioGroup: {
        flexDirection: "column",
        alignItems: "flex-start",
        marginTop: 8,
        gap: 8, // nếu RN cũ không hỗ trợ gap, hãy xoá dòng này và chỉ dùng marginBottom ở radioItem
    },
    radioItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#fff",
        borderRadius: 12,
        width: "100%",
        marginBottom: 8,
    },
    radioItemSelected: {
        borderColor: "#22C55E",
        backgroundColor: "#DCFCE7",
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#9CA3AF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
    },
    radioOuterSelected: { borderColor: "#22C55E" },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#22C55E",
    },
    radioLabel: { fontSize: 16, color: "#111827", fontWeight: "500" },
    radioLabelSelected: { color: "#065F46" },

    // --- chiều cao & cân nặng (2 cột) ---
    hwRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginTop: 0,
    },
    hwColLeft: {
        flex: 1,
        marginRight: 8,
    },
    hwColRight: {
        flex: 1,
        marginLeft: 8,
    },
    hwLabel: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 8,
        fontWeight: "600",
        textAlign: "center",
    },
    hwHint: {
        marginTop: 8,
        textAlign: "center",
        color: "#6B7280",
    },
});

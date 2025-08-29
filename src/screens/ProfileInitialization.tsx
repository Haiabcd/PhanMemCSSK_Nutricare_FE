import React, { useMemo, useRef, useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Animated,
    Easing,
    Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Slider from "@react-native-community/slider";
import { styles } from "../styles/ProfileInitialization.styles";

type StepKey = "name" | "age" | "gender" | "body" | "goal" | "activity";

const STEPS: { key: StepKey; label: string }[] = [
    { key: "name", label: "Tên" },
    { key: "age", label: "Tuổi / Năm sinh" },
    { key: "gender", label: "Giới tính" },
    { key: "body", label: "Chiều cao & Cân nặng" },
    { key: "goal", label: "Mục tiêu" },
    { key: "activity", label: "Mức độ hoạt động" },
];

const GENDER = ["Nam", "Nữ", "Khác"] as const;
const GOALS = ["Giảm cân", "Giữ cân", "Tăng cân", "Tăng cơ"] as const;
const ACTIVITY = ["Ít vận động", "Vận động nhẹ", "Vận động vừa", "Rất năng động"] as const;

const currentYear = new Date().getFullYear();
const AGE_MIN = 1;
const AGE_MAX = 100;
const YEAR_MIN = 1940;

export default function ProfileInit() {
    const [stepIndex, setStepIndex] = useState(0);
    const total = STEPS.length;

    const [form, setForm] = useState({
        name: "",
        age: "",              // tuổi (string số)
        birthYear: "",        // năm sinh (string số)
        gender: "" as "" | (typeof GENDER)[number],
        height: "",           // cm
        weight: "",           // kg
        goal: "" as "" | (typeof GOALS)[number],
        activity: "" as "" | (typeof ACTIVITY)[number],
    });

    const [error, setError] = useState("");

    // Progress bar animation
    const progress = useRef(new Animated.Value(0)).current;
    const progressPct = (stepIndex / total) * 100;
    useEffect(() => {
        Animated.timing(progress, {
            toValue: progressPct,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [progressPct]);

    const curr = STEPS[stepIndex].key;

    // Dữ liệu cho Pickers
    const AGES = useMemo(
        () => Array.from({ length: AGE_MAX - AGE_MIN + 1 }, (_, i) => AGE_MIN + i),
        []
    );
    const YEARS = useMemo(
        () => Array.from({ length: currentYear - YEAR_MIN + 1 }, (_, i) => currentYear - i),
        []
    );

    // Validate bước hiện tại
    const validateCurrent = () => {
        setError("");
        switch (curr) {
            case "name":
                if (!form.name.trim()) return setError("Vui lòng nhập tên."), false;
                return true;
            case "age": {
                const ageNum = Number(form.age);
                const yearNum = Number(form.birthYear);
                let valid = false;

                if (!Number.isNaN(ageNum) && ageNum >= AGE_MIN && ageNum <= AGE_MAX) {
                    valid = true;
                } else if (
                    yearNum >= YEAR_MIN &&
                    yearNum <= currentYear &&
                    currentYear - yearNum >= AGE_MIN &&
                    currentYear - yearNum <= AGE_MAX
                ) {
                    // đồng bộ tuổi nếu chỉ chọn năm
                    setForm((f) => ({ ...f, age: String(currentYear - yearNum) }));
                    valid = true;
                }

                if (!valid) return setError("Chọn tuổi hoặc năm sinh hợp lệ."), false;
                return true;
            }
            case "gender":
                if (!form.gender) return setError("Hãy chọn giới tính."), false;
                return true;
            case "body": {
                const h = Number(form.height);
                const w = Number(form.weight);
                if (!form.height || Number.isNaN(h) || h <= 0)
                    return setError("Chiều cao phải là số > 0 (cm)."), false;
                if (!form.weight || Number.isNaN(w) || w <= 0)
                    return setError("Cân nặng phải là số > 0 (kg)."), false;
                return true;
            }
            case "goal":
                if (!form.goal) return setError("Hãy chọn mục tiêu."), false;
                return true;
            case "activity":
                if (!form.activity) return setError("Hãy chọn mức độ hoạt động."), false;
                return true;
        }
    };

    // Next
    const onNext = () => {
        if (!validateCurrent()) return;
        if (stepIndex < total - 1) setStepIndex((i) => i + 1);
        else Alert.alert("Hoàn tất", "Bạn đã khởi tạo hồ sơ sức khỏe!");
    };

    // UI theo bước
    const StepContent = useMemo(() => {
        switch (curr) {
            case "name":
                return (
                    <>
                        <Text style={styles.fieldLabel}>Tên</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nhập tên của bạn"
                            placeholderTextColor="#9CA3AF"
                            value={form.name}
                            onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
                            returnKeyType="done"
                        />
                    </>
                );
            case "age":
                return (
                    <>
                        <Text style={styles.fieldLabel}>Tuổi hoặc Năm sinh</Text>
                        <View style={styles.row2}>
                            {/* Picker Tuổi */}
                            <View style={styles.col}>
                                <Text style={styles.smallLabel}>Tuổi</Text>
                                <View style={styles.pickerBox}>
                                    <Picker
                                        selectedValue={form.age || ""}
                                        onValueChange={(v) => {
                                            const age = String(v || "");
                                            if (!age) {
                                                setForm((f) => ({ ...f, age: "", birthYear: "" }));
                                                return;
                                            }
                                            const y = String(currentYear - Number(age));
                                            setForm((f) => ({ ...f, age, birthYear: y }));
                                        }}
                                        style={styles.picker}
                                    >
                                        <Picker.Item label="Chọn tuổi" value="" />
                                        {AGES.map((a) => (
                                            <Picker.Item key={a} label={`${a}`} value={a} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            {/* Picker Năm sinh */}
                            <View style={styles.col}>
                                <Text style={styles.smallLabel}>Năm sinh</Text>
                                <View style={styles.pickerBox}>
                                    <Picker
                                        selectedValue={form.birthYear || ""}
                                        onValueChange={(v) => {
                                            const year = String(v || "");
                                            if (!year) {
                                                setForm((f) => ({ ...f, birthYear: "", age: "" }));
                                                return;
                                            }
                                            const a = String(currentYear - Number(year));
                                            setForm((f) => ({ ...f, birthYear: year, age: a }));
                                        }}
                                        style={styles.picker}
                                    >
                                        <Picker.Item label="Chọn năm" value="" />
                                        {YEARS.map((y) => (
                                            <Picker.Item key={y} label={`${y}`} value={y} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>
                        </View>
                    </>
                );
            case "gender":
                return (
                    <>
                        <Text style={styles.fieldLabel}>Giới tính</Text>
                        <View style={styles.chipsRow}>
                            {GENDER.map((g) => {
                                const active = form.gender === g;
                                return (
                                    <Pressable
                                        key={g}
                                        style={[styles.chip, active && styles.chipActive]}
                                        onPress={() => setForm((f) => ({ ...f, gender: g }))}
                                    >
                                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{g}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </>
                );
            case "body":
                return (
                    <>
                        <Text style={styles.fieldLabel}>Chiều cao & Cân nặng</Text>

                        {/* Chiều cao */}
                        <Text style={styles.smallLabel}>Chiều cao (cm)</Text>
                        <View style={styles.sliderRow}>
                            <Slider
                                style={styles.slider}
                                minimumValue={120}
                                maximumValue={220}
                                step={1}
                                value={Number(form.height) || 170}
                                onValueChange={(v) => setForm((f) => ({ ...f, height: String(Math.round(v)) }))}
                                minimumTrackTintColor={colors.primary}
                                maximumTrackTintColor="rgba(255,255,255,0.2)"
                                thumbTintColor={colors.primary}
                            />
                            <TextInput
                                style={styles.inputNarrow}
                                keyboardType="number-pad"
                                value={form.height}
                                placeholder="170"
                                placeholderTextColor="#9CA3AF"
                                onChangeText={(t) => {
                                    const n = t.replace(/[^0-9]/g, "");
                                    if (!n) return setForm((f) => ({ ...f, height: "" }));
                                    const clamped = Math.max(120, Math.min(220, Number(n)));
                                    setForm((f) => ({ ...f, height: String(clamped) }));
                                }}
                            />
                            <Text style={styles.unit}>cm</Text>
                        </View>

                        {/* Cân nặng */}
                        <Text style={[styles.smallLabel, { marginTop: 12 }]}>Cân nặng (kg)</Text>
                        <View style={styles.sliderRow}>
                            <Slider
                                style={styles.slider}
                                minimumValue={30}
                                maximumValue={200}
                                step={0.5}
                                value={Number(form.weight) || 65}
                                onValueChange={(v) => setForm((f) => ({ ...f, weight: String(Number(v.toFixed(1))) }))}
                                minimumTrackTintColor={colors.primary}
                                maximumTrackTintColor="rgba(255,255,255,0.2)"
                                thumbTintColor={colors.primary}
                            />
                            <TextInput
                                style={styles.inputNarrow}
                                keyboardType="numeric"
                                value={form.weight}
                                placeholder="65"
                                placeholderTextColor="#9CA3AF"
                                onChangeText={(t) => {
                                    const n = t.replace(/[^0-9.]/g, "");
                                    if (!n) return setForm((f) => ({ ...f, weight: "" }));
                                    let num = Number(n);
                                    if (Number.isNaN(num)) num = 0;
                                    num = Math.max(30, Math.min(200, num));
                                    setForm((f) => ({ ...f, weight: String(num) }));
                                }}
                            />
                            <Text style={styles.unit}>kg</Text>
                        </View>
                    </>
                );
            case "goal":
                return (
                    <>
                        <Text style={styles.fieldLabel}>Mục tiêu</Text>
                        <View style={styles.chipsWrap}>
                            {GOALS.map((g) => {
                                const active = form.goal === g;
                                return (
                                    <Pressable
                                        key={g}
                                        style={[styles.chip, active && styles.chipActive]}
                                        onPress={() => setForm((f) => ({ ...f, goal: g }))}
                                    >
                                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{g}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </>
                );
            case "activity":
                return (
                    <>
                        <Text style={styles.fieldLabel}>Mức độ hoạt động</Text>
                        <View style={styles.chipsWrap}>
                            {ACTIVITY.map((a) => {
                                const active = form.activity === a;
                                return (
                                    <Pressable
                                        key={a}
                                        style={[styles.chip, active && styles.chipActive]}
                                        onPress={() => setForm((f) => ({ ...f, activity: a }))}
                                    >
                                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{a}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </>
                );
        }
    }, [curr, form]);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            {/* TOP: Thanh tiến độ */}
            <View style={styles.top}>
                <View style={styles.progressTrack}>
                    <Animated.View
                        style={[
                            styles.progressFill,
                            {
                                width: progress.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: ["0%", "100%"],
                                }),
                            },
                        ]}
                    />
                </View>
                <Text style={styles.progressText}>
                    {stepIndex}/{total} hoàn thành
                </Text>
                <Text style={styles.stepTitle}>{STEPS[stepIndex].label}</Text>
            </View>

            {/* CENTER */}
            <ScrollView
                style={styles.center}
                contentContainerStyle={styles.centerContent}
                keyboardShouldPersistTaps="handled"
            >
                {StepContent}
                {!!error && <Text style={styles.error}>{error}</Text>}
            </ScrollView>

            {/* BOTTOM */}
            <View style={styles.bottom}>
                <Pressable onPress={onNext} style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}>
                    <Text style={styles.primaryBtnText}>
                        {stepIndex < total - 1 ? "Tiếp tục" : "Hoàn tất"}
                    </Text>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

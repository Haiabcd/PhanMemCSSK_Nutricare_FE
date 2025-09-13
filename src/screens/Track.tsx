import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    Pressable,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Platform, // 👈 thêm Platform
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Container from "../components/Container";

type TabKey = "scan" | "manual" | "history";
type MealType = "Sáng" | "Trưa" | "Tối" | "Phụ";

export default function Track() {
    // Date + calendar (fake)
    const [date, setDate] = useState(new Date());
    const fmt = (d: Date) =>
        `${String(d.getDate()).padStart(2, "0")}/${String(
            d.getMonth() + 1
        ).padStart(2, "0")}/${d.getFullYear()}`;
    const add = (key: "d" | "m" | "y", n: number) => {
        setDate((prev) => {
            const d = new Date(prev);
            if (key === "d") d.setDate(d.getDate() + n);
            if (key === "m") d.setMonth(d.getMonth() + n);
            if (key === "y") d.setFullYear(d.getFullYear() + n);
            return d;
        });
    };

    // Tabs
    const [tab, setTab] = useState<TabKey>("scan");

    // Manual (UI)
    const [ings, setIngs] = useState<{ name: string; qty: string }[]>([
        { name: "", qty: "" },
    ]);
    const addIng = () => setIngs((p) => [...p, { name: "", qty: "" }]);
    const delIng = (i: number) => setIngs((p) => p.filter((_, idx) => idx !== i));

    // Scan
    const [showResult, setShowResult] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [mealType, setMealType] = useState<MealType>("Sáng");

    // Demo history data (grouped)
    const historyData: Record<
        MealType,
        { name: string; cal: number; p: number; c: number; f: number; ings?: string[] }[]
    > = {
        Sáng: [
            { name: "Bánh mì thịt", cal: 400, p: 22, c: 45, f: 14, ings: ["Bánh mì", "Thịt", "Rau"] },
            { name: "Sữa chua + trái cây", cal: 230, p: 12, c: 30, f: 6 },
        ],
        Trưa: [{ name: "Salad gà", cal: 300, p: 30, c: 20, f: 12 }],
        Tối: [{ name: "Cơm tấm", cal: 520, p: 20, c: 70, f: 15 }],
        Phụ: [{ name: "Táo + hạt", cal: 180, p: 5, c: 22, f: 7 }],
    };

    // Giả lập quy trình quét
    const handleScan = () => {
        if (isScanning) return;
        setShowResult(false);
        setIsScanning(true);
        setTimeout(() => {
            setIsScanning(false);
            setShowResult(true);
        }, 1500);
    };

    return (
        <Container>
            <View style={styles.screen}>
                {/* ===== Header (giống kích thước giao diện trước) ===== */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Theo dõi bữa ăn</Text>
                    <Text style={styles.headerSub}>
                        Quản lý bữa ăn hàng ngày của bạn một cách hiện đại và tiện lợi
                    </Text>
                </View>

                {/* Nội dung cuộn */}
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.inner}>
                        {/* Date with calendar icon + stepper */}
                        <View style={styles.dateRow}>
                            <Pressable style={styles.stepBtn} onPress={() => add("d", -1)}>
                                <Text style={styles.stepText}>◀</Text>
                            </Pressable>
                            <View style={styles.dateField}>
                                <Text style={styles.dateText}>{fmt(date)}</Text>
                                <Image
                                    source={{ uri: "https://cdn-icons-png.flaticon.com/512/747/747310.png" }}
                                    style={styles.calendarIcon}
                                />
                            </View>
                            <Pressable style={styles.stepBtn} onPress={() => add("d", +1)}>
                                <Text style={styles.stepText}>▶</Text>
                            </Pressable>
                        </View>

                        {/* Tabs */}
                        <View style={styles.tabs}>
                            <Tab label="Scan AI" active={tab === "scan"} onPress={() => setTab("scan")} />
                            <Tab label="Nhập thủ công" active={tab === "manual"} onPress={() => setTab("manual")} />
                            <Tab label="Xem lịch sử" active={tab === "history"} onPress={() => setTab("history")} />
                        </View>

                        {/* SCAN */}
                        {tab === "scan" && (
                            <View style={styles.card}>
                                <Text style={styles.sectionTitle}>Nhập bữa ăn bằng AI</Text>
                                <Image
                                    source={{
                                        uri: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/98fb941f-eb1e-49d6-9c4c-7235d38840a5.png",
                                    }}
                                    style={styles.scanImage}
                                />
                                <Pressable
                                    style={[styles.successBtn, isScanning && { opacity: 0.6 }]}
                                    onPress={handleScan}
                                    disabled={isScanning}
                                >
                                    <Text style={styles.successText}>
                                        {isScanning ? "Đang quét..." : "Quét Scan"}
                                    </Text>
                                </Pressable>

                                {/* Đang quét */}
                                {isScanning && (
                                    <View style={styles.scanningBox}>
                                        <ActivityIndicator size="large" />
                                        <Text style={styles.scanHint}>Đang phân tích hình ảnh...</Text>
                                    </View>
                                )}

                                {/* Kết quả sau khi quét */}
                                {showResult && !isScanning && (
                                    <View style={styles.resultBox}>
                                        <Text style={styles.resultTitle}>Kết quả từ AI:</Text>
                                        <Row label="Tên" value="Bữa ăn từ Scan AI" />
                                        <Row label="Calo" value="514 kcal" />
                                        <Row label="Protein" value="27 g" />
                                        <Row label="Carbs" value="35 g" />
                                        <Row label="Fat" value="21 g" />

                                        {/* ComboBox (Picker) */}
                                        <Text style={[styles.label, { marginTop: 8, marginBottom: 6 }]}>
                                            Loại bữa:
                                        </Text>
                                        <View style={styles.pickerWrap}>
                                            <Picker
                                                selectedValue={mealType}
                                                onValueChange={(v) => setMealType(v as MealType)}
                                                style={styles.picker}
                                                // 👇 giữ text rõ ràng trên iOS, Android
                                                itemStyle={Platform.OS === "ios" ? { color: "#111827", fontSize: 16 } : undefined}
                                                {...(Platform.OS === "android"
                                                    ? { mode: "dropdown", dropdownIconColor: "#6b7280" }
                                                    : {})}
                                            >
                                                <Picker.Item label="Sáng" value="Sáng" />
                                                <Picker.Item label="Trưa" value="Trưa" />
                                                <Picker.Item label="Tối" value="Tối" />
                                                <Picker.Item label="Phụ" value="Phụ" />
                                            </Picker>
                                        </View>

                                        <Pressable style={[styles.primaryBtn, { marginTop: 10, alignSelf: "center" }]}>
                                            <Text style={styles.primaryText}>Lưu bữa ăn</Text>
                                        </Pressable>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* MANUAL (UI) */}
                        {tab === "manual" && (
                            <View style={styles.card}>
                                <Text style={styles.sectionTitle}>Nhập bữa ăn thủ công</Text>

                                <Pressable style={styles.selectBox}>
                                    <Text style={styles.placeholderText}>Chọn từ danh sách</Text>
                                    <Text style={styles.caret}>▾</Text>
                                </Pressable>

                                <TextInput placeholder="Hoặc nhập tên bữa ăn tuỳ ý" style={styles.input} />
                                <TextInput placeholder="Calo (kcal)" style={styles.input} keyboardType="numeric" />
                                <TextInput placeholder="Protein (g)" style={styles.input} keyboardType="numeric" />
                                <TextInput placeholder="Carbs (g)" style={styles.input} keyboardType="numeric" />
                                <TextInput placeholder="Fat (g)" style={styles.input} keyboardType="numeric" />

                                <Pressable style={styles.selectBox}>
                                    <Text style={styles.placeholderText}>{mealType}</Text>
                                    <Text style={styles.caret}>▾</Text>
                                </Pressable>

                                <Text style={styles.blockLabel}>Nguyên liệu</Text>
                                {ings.map((_, idx) => (
                                    <View key={idx} style={styles.ingRow}>
                                        <TextInput placeholder="Tên nguyên liệu" style={[styles.input, styles.ingName]} />
                                        <TextInput placeholder="Số lượng" style={[styles.input, styles.ingQty]} />
                                        <Pressable style={styles.removeBtn} onPress={() => delIng(idx)}>
                                            <Text style={{ color: "#ef4444", fontWeight: "700" }}>×</Text>
                                        </Pressable>
                                    </View>
                                ))}
                                <Pressable style={styles.ghostBtn} onPress={addIng}>
                                    <Text style={styles.ghostBtnText}>+ Thêm nguyên liệu</Text>
                                </Pressable>

                                <Pressable style={[styles.primaryBtn, { alignSelf: "center" }]}>
                                    <Text style={styles.primaryText}>Thêm bữa ăn</Text>
                                </Pressable>
                            </View>
                        )}

                        {/* HISTORY (grouped) */}
                        {tab === "history" && (
                            <View style={{ width: "100%" }}>
                                <Text style={styles.sectionTitle}>Lịch sử bữa ăn</Text>
                                {(Object.keys(historyData) as MealType[]).map((type) => (
                                    <View key={type} style={{ marginBottom: 16 }}>
                                        <Text style={styles.groupHeader}>{type}</Text>
                                        {historyData[type].map((m, i) => (
                                            <View key={i} style={styles.historyCard}>
                                                <Text style={styles.mealName}>{m.name}</Text>
                                                <Text>
                                                    Calo: {m.cal} kcal, Protein: {m.p}g, Carbs: {m.c}g, Fat: {m.f}g
                                                </Text>
                                                {m.ings?.length ? (
                                                    <Text style={{ marginTop: 4 }}>
                                                        <Text style={{ fontWeight: "700" }}>Nguyên liệu:</Text> {m.ings.join(", ")}
                                                    </Text>
                                                ) : null}
                                                <View style={styles.rowBtns}>
                                                    <Pressable style={styles.badgeYellow}>
                                                        <Text style={styles.badgeText}>Sửa (demo)</Text>
                                                    </Pressable>
                                                    <Pressable style={styles.badgeRed}>
                                                        <Text style={styles.badgeText}>Xóa (demo)</Text>
                                                    </Pressable>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        </Container>
    );
}

/* helpers */
const Tab = ({
    label,
    active,
    onPress,
}: {
    label: string;
    active: boolean;
    onPress: () => void;
}) => (
    <Pressable
        onPress={onPress}
        style={[styles.tabBtn, { backgroundColor: active ? "#3b82f6" : "#e5e7eb" }]}
    >
        <Text style={{ color: active ? "#fff" : "#111827", fontWeight: "600" }}>{label}</Text>
    </Pressable>
);

const Row = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}:</Text>
        <Text style={styles.value}>{value}</Text>
    </View>
);

/* styles */
const styles = StyleSheet.create({
    header: {
        backgroundColor: 'transparent',
        paddingTop: 14,
        paddingBottom: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5efe8',
        marginTop: 20,
    },
    headerTitle: {
        color: '#0f172a',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.1,
    },
    headerSub: { color: '#6b7280', fontSize: 13, marginTop: 2 },

    /* Scroll content */
    scrollContent: { paddingBottom: 20 },
    inner: { paddingHorizontal: 16, paddingTop: 10, alignItems: "center" },

    dateRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
    stepBtn: {
        backgroundColor: "#e5e7eb",
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    stepText: { fontSize: 18, fontWeight: "700", color: "#374151" },
    dateField: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    dateText: { fontWeight: "600", color: "#111827" },
    calendarIcon: { width: 18, height: 18, marginLeft: 8, opacity: 0.75 },

    tabs: { flexDirection: "row", gap: 12, marginBottom: 16 },
    tabBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },

    card: {
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        marginBottom: 16,
    },
    sectionTitle: { textAlign: "center", fontSize: 18, fontWeight: "700", marginBottom: 12 },

    selectBox: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
        marginBottom: 10,
    },
    placeholderText: { color: "#9ca3af" },
    caret: { color: "#6b7280", fontSize: 16 },

    input: {
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
        marginBottom: 10,
        color: "#111827",
    },
    blockLabel: { marginTop: 6, marginBottom: 6, fontWeight: "700", color: "#111827" },
    ingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    ingName: { flex: 1 },
    ingQty: { width: 110 },
    removeBtn: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#fca5a5",
        backgroundColor: "#fff",
    },

    primaryBtn: {
        backgroundColor: "#3b82f6",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: "center",
    },
    primaryText: { color: "#fff", fontWeight: "700" },

    successBtn: {
        backgroundColor: "#22c55e",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    successText: { color: "#fff", fontWeight: "700" },

    scanImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: "#d1d5db",
        alignSelf: "center",
        marginBottom: 12,
    },

    scanningBox: { marginTop: 12, alignItems: "center" },
    scanHint: { marginTop: 6, color: "#6b7280" },

    resultBox: { marginTop: 20, backgroundColor: "#fff", borderRadius: 12, padding: 16 },
    resultTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12, textAlign: "center" },
    row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    label: { color: "#6b7280" },
    value: { fontWeight: "600" },

    // Picker
    pickerWrap: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        backgroundColor: "#fff",
        // tránh cắt nội dung trên iOS (wheel), giữ dropdown Android gọn gàng
        overflow: Platform.OS === "android" ? "hidden" : "visible",
        justifyContent: "center",
        minHeight: 44,
        paddingLeft: Platform.OS === "android" ? 4 : 0,
        paddingRight: Platform.OS === "android" ? 4 : 0,
    },
    picker: Platform.select({
        android: {
            height: 44,
            width: "100%",
            color: "#111827",
            paddingLeft: 8,
            paddingRight: 36, // chừa chỗ cho icon mũi tên
        },
        ios: {
            height: 44,
            width: "100%",
            color: "#111827",
        },
        default: {
            height: 44,
            width: "100%",
            color: "#111827",
        },
    }) as any,

    // History (grouped)
    groupHeader: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: "#3b82f6",
        paddingLeft: 10,
    },
    historyCard: {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        marginBottom: 10,
    },
    mealName: { fontWeight: "600", marginBottom: 4 },
    rowBtns: { flexDirection: "row", gap: 8, marginTop: 8 },
    badgeYellow: {
        backgroundColor: "#f59e0b",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    badgeRed: {
        backgroundColor: "#ef4444",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    badgeText: { color: "#fff", fontWeight: "700" },

    // (tuỳ chọn) nút thêm nguyên liệu dạng ghost
    ghostBtn: {
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: "#f1f5f9",
        marginBottom: 10,
    },
    ghostBtnText: { color: "#0f172a", fontWeight: "700" },
});

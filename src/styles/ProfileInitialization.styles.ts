import { StyleSheet, Dimensions, Platform, StatusBar } from "react-native";

const { width } = Dimensions.get("window");

// export const colors = {
//     bg: "#55D6BE",
//     panel: "rgba(255,255,255,0.06)",
//     panelBorder: "rgba(255,255,255,0.12)",
//     text: "#E5E7EB",
//     textDim: "#9CA3AF",
//     primary: "#43B05C",
//     danger: "#EF4444",
//     chipBg: "rgba(255,255,255,0.08)",
//     chipActiveBg: "rgba(67,176,92,0.18)",
//     chipText: "#E5E7EB",
//     chipTextActive: "#CFF7D7",

// };

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },

    // TOP
    top: {
        paddingTop:
            (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + 16,
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    progressTrack: {
        width: "100%",
        height: 10,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.12)",
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: colors.primary,
        borderRadius: 999,
    },
    progressText: {
        color: colors.textDim,
        marginTop: 8,
        fontSize: 12,
    },
    stepTitle: {
        color: colors.text,
        marginTop: 6,
        fontSize: 18,
        fontWeight: "700",
    },

    // CENTER
    center: {
        flex: 1,
    },
    centerContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 10,
    },

    fieldLabel: {
        color: colors.text,
        fontSize: 15,
        fontWeight: "700",
        marginBottom: 8,
    },
    smallLabel: {
        color: colors.textDim,
        fontSize: 12,
        marginBottom: 6,
    },
    input: {
        backgroundColor: colors.panel,
        borderWidth: 1,
        borderColor: colors.panelBorder,
        color: colors.text,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === "ios" ? 14 : 10,
        fontSize: 16,
        marginBottom: 16,
    },

    row2: {
        flexDirection: "row",
        gap: 12,
    },
    col: { flex: 1 },

    chipsRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 8,
    },
    chipsWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 8,
    },
    chip: {
        backgroundColor: colors.chipBg,
        borderWidth: 1,
        borderColor: colors.panelBorder,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
    },
    chipActive: {
        backgroundColor: colors.chipActiveBg,
        borderColor: colors.primary,
    },
    chipText: {
        color: colors.chipText,
        fontWeight: "600",
    },
    chipTextActive: {
        color: colors.chipTextActive,
        fontWeight: "700",
    },

    error: {
        color: colors.danger,
        marginTop: 6,
    },

    // BOTTOM
    bottom: {
        padding: 20,
    },
    primaryBtn: {
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    primaryBtnPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.95,
    },
    primaryBtnText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "800",
        letterSpacing: 0.3,
    },
});

import { Image, Text, View, ScrollView, Pressable } from 'react-native'
import React, { useState } from 'react'
import Container from '../components/Container'
import Icon from 'react-native-vector-icons/Entypo'
import { Button } from '@react-navigation/elements'
import Iconshoes from 'react-native-vector-icons/MaterialIcons'

/** ─────────── Calories & Dinh Dưỡng ─────────── */
function NutriBox({ title, current, total }: { title: string; current: number; total: number }) {
    const pct = total === 0 ? 0 : Math.min(100, Math.max(0, (current / total) * 100))
    return (
        <View style={styles.box}>
            <Text style={styles.boxTitle}>{title}</Text>
            <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.boxSub}>{current}/{total}g</Text>
        </View>
    )
}

function CaloriesNutritionSummary() {
    return (
        <View style={styles.calWrap}>
            {/* Hàng trên: vòng tròn Đã nạp + 3 dòng thông tin */}
            <View style={styles.topRow}>
                <View style={styles.badgeWrap}>
                    <View style={styles.badgeCircle}>
                        <Text style={styles.badgeText}>Đã Nạp 0</Text>
                    </View>
                    <View style={styles.badgeDot} />
                </View>

                <View style={styles.infoCol}>
                    <View style={styles.infoRow}>
                        <Icon name="stopwatch" size={16} color="#0ea5e9" />
                        <Text style={styles.infoText}>Cần nạp 2105 calo</Text>
                    </View>
                    <View style={[styles.infoRow, { marginTop: 6 }]}>
                        <Icon name="info-with-circle" size={16} color="#0ea5e9" />
                        <Text style={styles.infoText}>Còn lại 2105 calo</Text>
                    </View>
                    <View style={[styles.infoRow, { marginTop: 6 }]}>
                        <Icon name="man" size={16} color="#0ea5e9" />
                        <Text style={styles.infoText}>Tiêu hao 0</Text>
                    </View>
                </View>
            </View>

            {/* Grid 4 ô dinh dưỡng */}
            <View style={styles.grid}>
                <NutriBox title="Tinh Bột" current={0} total={200} />
                <NutriBox title="Chất đạm" current={0} total={200} />
                <NutriBox title="Chất béo" current={0} total={200} />
                <NutriBox title="Chất xơ" current={0} total={200} />
            </View>

            <View style={styles.line} />

            {/* Card mục tiêu bước chân */}
            <View style={styles.card}>
                <View style={styles.cardCol}>
                    <Text style={styles.cardLabel}>Mục tiêu</Text>
                    <Text style={styles.cardValue}>2000 bước</Text>
                </View>

                <View style={styles.cardIcon}>
                    <Iconshoes name="snowshoeing" size={28} color="#ea580c" />
                </View>

                <View style={styles.cardCol}>
                    <Text style={styles.cardLabel}>Thực tế</Text>
                    <Text style={[styles.cardValue, { color: '#ea580c' }]}>50 bước</Text>
                </View>
            </View>
        </View>
    )
}

/** ─────────── Nhật ký bữa ăn ─────────── */
function MealCardsTabs() {
    const tabs = ['Sáng', 'Trưa', 'Chiều', 'Phụ']
    const [active, setActive] = useState('Sáng')
    const [checked, setChecked] = useState(false)

    const pic = 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200'

    return (
        <View>
            {/* Tabs */}
            <View style={styles2.tabBar}>
                {tabs.map(t => (
                    <Pressable
                        key={t}
                        onPress={() => setActive(t)}
                        style={[styles2.pill, active === t && styles2.pillActive]}
                    >
                        <Text style={[styles2.pillText, active === t && styles2.pillTextActive]}>{t}</Text>
                    </Pressable>
                ))}
            </View>

            {/* Tiêu đề */}
            <Text style={styles2.tabTitle}>{active}</Text>

            {/* Card duy nhất */}
            <View style={styles2.card}>
                <View style={styles2.imageWrap}>
                    <Image source={{ uri: pic }} style={styles2.image} />
                    <Pressable
                        style={[
                            styles2.checkBox,
                            { backgroundColor: checked ? '#3B82F6' : '#e5e7eb' }
                        ]}
                        onPress={() => setChecked(!checked)}
                    >
                        {checked && <Icon name="check" size={12} color="#fff" />}
                    </Pressable>
                </View>

                <View style={styles2.btnRow}>
                    <Pressable style={[styles2.btn, styles2.btnPrimary]}>
                        <Text style={[styles2.btnText, styles2.btnTextPrimary]}>Đổi Món</Text>
                    </Pressable>
                    <Pressable style={[styles2.btn, styles2.btnGhost]}>
                        <Text style={styles2.btnText}>Xem Chi Tiết</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    )
}

/** ─────────── Uống nước ─────────── */
function TrackWater() {
    const [water, setWater] = useState(0) // lít đã uống
    const target = 2.5                    // mục tiêu (lít)
    const step = 0.25                     // mỗi lần tăng/giảm

    const addWater = () => setWater(prev => Math.min(target, +(prev + step).toFixed(2)))
    const removeWater = () => setWater(prev => Math.max(0, +(prev - step).toFixed(2)))

    const percent = target === 0 ? 0 : Math.min(100, Math.max(0, (water / target) * 100))

    return (
        <View style={styles.waterRow}>
            {/* Nút trừ */}
            <View style={styles.waterCol}>
                <Pressable style={styles.circleBtn} onPress={removeWater}>
                    <Icon name="minus" size={20} color="#fff" />
                </Pressable>
                <Text style={styles.waterText}>{step} lt</Text>
                <Text style={styles.waterSub}>Thực tế {water.toFixed(2)} lt</Text>
            </View>

            {/* Cốc nước */}
            <View style={styles.cupWrap}>
                <View style={styles.cupRim} />
                <View style={styles.cupBody}>
                    <View style={styles.cupShineLeft} />
                    <View style={styles.cupShineRight} />

                    <View style={[styles.measureLine, { bottom: '25%' }]} />
                    <View style={[styles.measureLine, { bottom: '50%' }]} />
                    <View style={[styles.measureLine, { bottom: '75%' }]} />

                    <View style={[styles.waterFillGlass, { height: `${percent}%` }]} />
                    <View style={[styles.waterSurface, { bottom: `${percent}%` }]} />
                </View>
                <Text style={styles.waterBoxText}>
                    {water.toFixed(2)} / {target} lt
                </Text>
            </View>

            {/* Nút cộng */}
            <View style={styles.waterCol}>
                <Pressable style={styles.circleBtn} onPress={addWater}>
                    <Icon name="plus" size={20} color="#fff" />
                </Pressable>
                <Text style={styles.waterText}>{step} lt</Text>
                <Text style={styles.waterSub}>Mục tiêu {target} lt</Text>
            </View>
        </View>
    )
}

/** ─────────── Main ─────────── */
const MealPlan = () => {
    return (
        <Container>
            {/* top */}
            <View style={styles.top}>
                <View style={styles.nameAvatar}>
                    <Image
                        source={require('../assets/images/Welcome/Lapkehoachdinhduong.jpg')}
                        style={styles.avatar}
                    />
                    <Text style={styles.textName}> Anh Hải</Text>
                </View>
                <View style={styles.iconContainer}>
                    <Icon name="bell" size={35} color="#fff" style={{ padding: 5 }} />
                </View>
            </View>

            <View style={styles.line} />

            {/* center */}
            <View style={{ flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: 0 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="calendar" size={35} color="#3B82F6" style={{ padding: 5 }} />
                    <Text style={{ fontSize: 17, fontWeight: "bold" }}>Thứ 2, 01 Tháng 09</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}>
                    <Button>Theo Ngày</Button>
                    <View style={{ width: 10 }} />
                    <Button>Theo Tuần</Button>
                </View>
            </View>

            {/* bottom */}
            <View style={{ flex: 6 }}>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: 12 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Calories & Dinh dưỡng */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Calories & Dinh Dưỡng</Text>
                        <CaloriesNutritionSummary />
                    </View>

                    {/* Nhật ký bữa ăn */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Nhật Ký Ăn Uống</Text>
                        <MealCardsTabs />
                    </View>

                    {/* Uống nước */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Uống Nước</Text>
                        <TrackWater />
                    </View>
                </ScrollView>
            </View>
        </Container>
    )
}
export default MealPlan

const styles = {
    top: {
        flex: 0.55,
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20
    },

    avatar: {
        width: 60,
        height: 60,
        borderRadius: 100
    },

    nameAvatar: {
        display: "flex",
        flexDirection: "row"
    },

    textName: {
        fontSize: 14,
        fontWeight: "bold",
        marginTop: 20
    },

    iconContainer: {
        borderWidth: 0,
        width: 50,
        height: 50,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#A7F3D0",
        borderRadius: 10,
    },

    section: {
        backgroundColor: "#D1FAE5",
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
    },

    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: "#94a3b8",
        color: '#3B82F6',
    },

    line: {
        borderBottomWidth: 1,
        borderBottomColor: "#94a3b8",
        marginTop: 12,
        marginBottom: 12,
    },

    /* top row calories */
    calWrap: {

    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5'
    },

    badgeWrap: {
        width: 88,
        alignItems: 'center',
        justifyContent: 'center'
    },

    badgeCircle: {
        width: 99,
        height: 99,
        borderRadius: 999,
        backgroundColor: '#ef4444',
        alignItems: 'center',
        justifyContent: 'center'
    },

    badgeText: { color: '#fff', fontWeight: '700', textAlign: 'center', fontSize: 16 },
    badgeDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: '#22c55e', marginTop: 6 },
    infoCol: { flex: 1 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 20 },
    infoText: { color: '#0f172a', fontSize: 17, marginLeft: 8 },

    /* card */
    card: {
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    cardCol: { alignItems: 'center', minWidth: 100 },
    cardLabel: { color: '#64748b', fontSize: 13, marginBottom: 2, fontWeight: '700' },
    cardValue: { color: '#0f172a', fontSize: 18, fontWeight: '700' },
    cardIcon: {
        width: 48, height: 48, borderRadius: 999, backgroundColor: '#fff',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#e2e8f0',
    },

    /* grid 2x2 */
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 12 },
    box: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    boxTitle: { fontWeight: '700', color: '#0f172a', marginBottom: 8 },
    progressBg: { height: 8, borderRadius: 999, backgroundColor: '#e5e7eb', overflow: 'hidden', marginBottom: 8 },
    progressFill: { height: '100%', backgroundColor: '#cbd5e1' },
    boxSub: { color: '#64748b', fontSize: 12 },

    // Track water common
    waterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    waterCol: { alignItems: 'center', width: 80 },
    circleBtn: { width: 48, height: 48, borderRadius: 999, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    waterText: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
    waterSub: { fontSize: 12, color: '#64748b', textAlign: 'center' },

    // --- cốc nước ---
    cupWrap: { flex: 1, alignItems: 'center', marginHorizontal: 12 },
    cupRim: {
        width: 96, height: 16, borderRadius: 50, backgroundColor: '#ffffff',
        borderWidth: 1, borderColor: '#cbd5e1', marginBottom: -7, zIndex: 2
    },
    cupBody: {
        width: 96, height: 150, borderRadius: 16, borderWidth: 1, borderColor: '#cbd5e1',
        backgroundColor: '#f8fafc', overflow: 'hidden', position: 'relative'
    },
    waterFillGlass: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#3B82F6', opacity: 0.95,
        borderBottomLeftRadius: 16, borderBottomRightRadius: 16
    },
    waterSurface: {
        position: 'absolute', left: 6, right: 6, height: 10, marginBottom: -5,
        backgroundColor: '#60a5fa', borderRadius: 50, opacity: 0.9
    },
    cupShineLeft: {
        position: 'absolute', top: 12, bottom: 12, left: 8,
        width: 6, backgroundColor: '#ffffff', opacity: 0.25, borderRadius: 999
    },
    cupShineRight: {
        position: 'absolute', top: 22, bottom: 22, right: 10,
        width: 3, backgroundColor: '#ffffff', opacity: 0.25, borderRadius: 999
    },
    measureLine: {
        position: 'absolute', left: 12, right: 12, height: 1,
        backgroundColor: '#94a3b8', opacity: 0.25
    },
    waterBoxText: { marginTop: 8, color: '#0f172a', fontWeight: '600' },
}

/* ===== Styles riêng cho Mục 2 (Nhật ký ăn uống) ===== */
const styles2 = {
    tabBar: {
        flexDirection: 'row',
        paddingVertical: 4,
        marginBottom: 8,
        justifyContent: 'space-between',   // CHANGED: dàn đều hàng ngang
    },
    pill: {
        flex: 1,                            // CHANGED: mỗi pill chiếm đều
        backgroundColor: '#e5edf3',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 999,
        marginHorizontal: 4,                // CHANGED: khoảng cách đều hai bên
        alignItems: 'center',
        justifyContent: 'center',
    },
    pillActive: { backgroundColor: '#3B82F6' },
    pillText: { color: '#0f172a', fontWeight: '700', fontSize: 13 },
    pillTextActive: { color: '#fff' },

    tabTitle: { textAlign: 'center', fontWeight: '700', color: '#0f172a', marginBottom: 8 },

    list: { paddingBottom: 8 },

    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },

    imageWrap: {
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#dce6ef',
        position: 'relative',
    },
    image: { width: '100%', height: 110, resizeMode: 'cover' },

    greenDot: {
        width: 14, height: 14, borderRadius: 999,
        backgroundColor: '#22c55e',
        position: 'absolute', top: 8, right: 8,
        borderWidth: 2, borderColor: '#fff',
    },

    btnRow: { flexDirection: 'row', marginTop: 8 },
    btn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnPrimary: { backgroundColor: '#3B82F6', marginRight: 8 },
    btnGhost: { backgroundColor: '#e5e7eb' },
    btnText: { fontWeight: '700', color: '#0f172a', fontSize: 12 },
    btnTextPrimary: { color: '#fff' },

    checkBox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        backgroundColor: '#e5e7eb',   // xám khi chưa chọn
        position: 'absolute',
        top: 8,
        right: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },

}

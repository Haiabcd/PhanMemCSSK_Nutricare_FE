// src/screens/ChatAI.tsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    Image,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Animated,
    Easing,
} from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';

type Role = 'user' | 'assistant';
type Msg = { id: string; role: Role; text: string; time?: string };

const nowHm = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/* ========== Small Avatar (fallback initials) ========== */
function SmallAvatar({
    name,
    photoUri,
    size = 48,
}: { name: string; photoUri?: string | null; size?: number }) {
    const initials = useMemo(
        () => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        [name],
    );
    if (photoUri) {
        return (
            <Image
                source={{ uri: photoUri }}
                style={{ width: size, height: size, borderRadius: 999, borderWidth: 3, borderColor: '#ecfdf5', backgroundColor: '#fff' }}
            />
        );
    }
    return (
        <View
            style={{
                width: size, height: size, borderRadius: 999,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: C.border,
            }}
        >
            <Text style={{ color: C.primary, fontWeight: '900', fontSize: 14 }}>{initials}</Text>
        </View>
    );
}

/* ========== Typing dots ========== */
function TypingDots() {
    const a1 = useRef(new Animated.Value(0)).current;
    const a2 = useRef(new Animated.Value(0)).current;
    const a3 = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const mk = (v: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.timing(v, { toValue: 1, duration: 350, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                    Animated.timing(v, { toValue: 0.2, duration: 350, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
                ])
            ).start();
        mk(a1, 0); mk(a2, 120); mk(a3, 240);
    }, [a1, a2, a3]);
    const Dot = ({ v }: { v: Animated.Value }) => (
        <Animated.View
            style={{
                width: 6, height: 6, borderRadius: 999, marginHorizontal: 3,
                backgroundColor: C.black ?? '#64748b', opacity: v,
            }}
        />
    );
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 2 }}>
            <Dot v={a1} /><Dot v={a2} /><Dot v={a3} />
        </View>
    );
}

/* ========== One Message Bubble ========== */
function Bubble({ item }: { item: Msg }) {
    const isUser = item.role === 'user';
    return (
        <View
            style={[
                s.bubbleRow,
                isUser ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
            ]}
        >
            {!isUser && (
                <View style={s.assistantAvatarWrap}>
                    <McIcon name="robot-outline" size={18} color={C.primary} />
                </View>
            )}

            <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleBot]}>
                <Text style={[s.bubbleText, isUser && { color: C.onPrimary }]}>{item.text}</Text>
                {!!item.time && (
                    <Text style={[s.timeText, isUser ? { color: '#e0f2fe' } : { color: '#64748b' }]}>{item.time}</Text>
                )}
            </View>
        </View>
    );
}

/* ========== Quick Suggestions (chips) — đơn giản & đồng bộ ========== */
const QUICK_SUGGESTS = [
    'Xin chào',
    'Tư vấn bữa ăn',
    'Thực đơn tuần',
    'Tính calo',
    'Nhắc uống nước',
];

/** Nếu render bởi navigator, React Navigation sẽ truyền prop `navigation`.
 *  Nếu render "chay", prop có thể undefined -> dùng optional chaining để tránh crash. */
export default function ChatAI({ navigation }: { navigation?: any }) {
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const listRef = useRef<FlatList<Msg>>(null);

    const [messages, setMessages] = useState<Msg[]>([
        { id: 'm1', role: 'assistant', text: 'Xin chào 👋 Mình là trợ lý dinh dưỡng AI. Bạn muốn lập kế hoạch ăn uống hay tính macro hôm nay?', time: nowHm() },
    ]);

    const send = (text?: string) => {
        const content = (text ?? input).trim();
        if (!content) return;
        const at = nowHm();
        const userMsg: Msg = { id: `u_${Date.now()}`, role: 'user', text: content, time: at };
        setMessages(prev => [userMsg, ...prev]);
        setInput('');
        setTyping(true);

        // giả lập AI trả lời
        setTimeout(() => {
            const botMsg: Msg = {
                id: `b_${Date.now()}`,
                role: 'assistant',
                text:
                    content.toLowerCase().includes('tính') || content.toLowerCase().includes('calo')
                        ? 'Bạn cho mình biết cân nặng, chiều cao, tuổi và mục tiêu nhé. Mình sẽ ước tính TDEE và gợi ý calo/ngày.'
                        : content.toLowerCase().includes('thực đơn')
                            ? 'Ok! Mình có thể gợi ý thực đơn 7 ngày cân bằng. Bạn thích khẩu vị Việt/Âu/Healthy chứ?'
                            : content.toLowerCase().includes('uống nước') || content.toLowerCase().includes('nhắc')
                                ? 'Mình sẽ nhắc bạn uống nước định kỳ và tính tổng nước trong ngày. Bạn muốn nhắc 2 giờ/lần chứ?'
                                : 'Mình sẵn sàng tư vấn bữa ăn, tính calo và gợi ý món phù hợp mục tiêu. Bạn muốn bắt đầu với bữa nào?',
                time: nowHm(),
            };
            setMessages(prev => [botMsg, ...prev]);
            setTyping(false);
        }, 900);
    };

    const onPickQuick = (q: string) => send(q);

    return (
        <Container>
            <ViewComponent row between alignItems="center" mt={20}>
                <ViewComponent row alignItems="center" gap={10} flex={0}>
                    <SmallAvatar
                        name="Anh Hải"
                        photoUri={'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=300'}
                        size={52}
                    />
                    <ViewComponent flex={0}>
                        <TextComponent text="Xin chào," variant="caption" tone="muted" />
                        <TextComponent text="Anh Hải" variant="subtitle" weight="bold" />
                    </ViewComponent>
                </ViewComponent>

                <Pressable
                    style={s.iconContainer}
                    onPress={() => navigation?.navigate?.('Notification')}
                >
                    <Entypo name="bell" size={20} color={C.primary} />
                </Pressable>
            </ViewComponent>

            <View style={s.line} />

            {/* ===== Chips gợi ý nhanh ===== */}
            <ViewComponent mb={8}>
                <FlatList
                    horizontal
                    data={QUICK_SUGGESTS}
                    keyExtractor={(it) => it}
                    contentContainerStyle={{ paddingVertical: 4 }}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <Pressable style={s.chip} onPress={() => onPickQuick(item)}>
                            <McIcon name="chat-processing-outline" size={14} color={'#16a34a'} />
                            <Text style={s.chipTxt}>{item}</Text>
                        </Pressable>
                    )}
                />
            </ViewComponent>

            {/* ===== Message list ===== */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
            >
                <FlatList
                    ref={listRef}
                    data={messages}
                    inverted
                    keyExtractor={(it) => it.id}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => <Bubble item={item} />}
                    ListHeaderComponent={
                        typing ? (
                            <View style={s.typingRow}>
                                <View style={s.assistantAvatarWrap}>
                                    <McIcon name="robot-outline" size={18} color={C.primary} />
                                </View>
                                <View style={[s.bubble, s.bubbleBot]}>
                                    <TypingDots />
                                </View>
                            </View>
                        ) : null
                    }
                />

                {/* ===== Input bar ===== */}
                <View style={s.inputWrap}>
                    <Pressable style={s.inputIconBtn} onPress={() => { /* mở picker ảnh (stub) */ }}>
                        <McIcon name="image-multiple-outline" size={20} color={C.primary} />
                    </Pressable>

                    <TextInput
                        value={input}
                        onChangeText={setInput}
                        placeholder="Nhập tin nhắn…"
                        placeholderTextColor="#94a3b8"
                        style={s.input}
                        multiline
                        maxLength={800}
                    />

                    {!!input.trim() ? (
                        <Pressable style={[s.sendBtn, { backgroundColor: C.primary }]} onPress={() => send()}>
                            <McIcon name="send" size={18} color={C.onPrimary} />
                        </Pressable>
                    ) : (
                        <Pressable style={s.inputIconBtn} onPress={() => { /* voice (stub) */ }}>
                            <McIcon name="microphone-outline" size={20} color={C.primary} />
                        </Pressable>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Container>
    );
}

/* ========== styles ========== */
const s = StyleSheet.create({
    iconContainer: {
        width: 42, height: 42, borderRadius: 12,
        backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: C.border,
    },
    line: { height: 2, backgroundColor: C.border, marginVertical: 12, marginHorizontal: 16 },

    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: '#f0fdf4',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#bbf7d0',
        marginRight: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#0b3d1f',
                shadowOpacity: 0.08,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
            },
            android: { elevation: 2 },
        }),
    },
    chipTxt: { color: C.text, fontWeight: '700', fontSize: 13 },

    bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
    assistantAvatarWrap: {
        width: 26, height: 26, borderRadius: 999, alignItems: 'center', justifyContent: 'center',
        backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, marginRight: 8,
    },
    bubble: {
        maxWidth: '78%',
        paddingHorizontal: 12, paddingVertical: 10,
        borderRadius: 14, borderWidth: 1,
    },
    bubbleBot: {
        backgroundColor: '#ffffff',
        borderColor: C.border,
    },
    bubbleUser: {
        backgroundColor: C.primary,
        borderColor: C.primary,
    },
    bubbleText: { color: C.text, fontSize: 14, fontWeight: '700' },
    timeText: { marginTop: 4, fontSize: 10, fontWeight: '700' },

    typingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },

    inputWrap: {
        flexDirection: 'row', alignItems: 'flex-end', gap: 8,
        borderTopWidth: 1, borderTopColor: C.border,
        paddingVertical: 10, backgroundColor: '#fff',
    },
    input: {
        flex: 1, minHeight: 42, maxHeight: 120,
        borderWidth: 1, borderColor: C.border, backgroundColor: C.bg,
        borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
        color: C.text, fontWeight: '700',
    },
    inputIconBtn: {
        width: 42, height: 42, borderRadius: 12, borderWidth: 1, borderColor: C.border,
        backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
    },
    sendBtn: {
        width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    },
});

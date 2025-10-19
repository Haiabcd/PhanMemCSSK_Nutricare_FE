// src/screens/ChatAI.tsx
import React, { useMemo, useRef, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import Entypo from 'react-native-vector-icons/Entypo';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';

const CHATBASE_URL =
    'https://www.chatbase.co/chatbot-iframe/stChIc4Kqt_784S75UQS6'; // ← nếu 404, thử: https://www.chatbase.co/chatbot/stChIc4Kqt_784S75UQS6

/* ===== Small Avatar (fallback initials) ===== */
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

export default function ChatAI({ navigation }: { navigation?: any }) {
    const webRef = useRef<WebView>(null);
    const [loadingWeb, setLoadingWeb] = useState(true);

    return (
        <Container>
            {/* Header gọn */}
            <ViewComponent row between alignItems="center" mt={20}>
                <ViewComponent row alignItems="center" gap={10} flex={0}>
                    <SmallAvatar
                        name="Anh Hải"
                        photoUri={'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=300'}
                        size={52}
                    />
                    <ViewComponent flex={0}>
                        <TextComponent text="Xin chào," variant="caption" tone="muted" />
                        <TextComponent text="Trợ lý dinh dưỡng AI" variant="subtitle" weight="bold" />
                    </ViewComponent>
                </ViewComponent>

                <Pressable style={s.iconContainer} onPress={() => navigation?.navigate?.('Notification')}>
                    <Entypo name="bell" size={20} color={C.primary} />
                </Pressable>
            </ViewComponent>

            <View style={s.line} />

            {/* Chatbase chiếm toàn bộ còn lại */}
            <View style={{ flex: 1 }}>
                <WebView
                    ref={webRef}
                    source={{ uri: CHATBASE_URL }}
                    onLoadStart={() => setLoadingWeb(true)}
                    onLoadEnd={() => setLoadingWeb(false)}
                    javaScriptEnabled
                    domStorageEnabled
                    startInLoadingState
                    pullToRefreshEnabled
                    onShouldStartLoadWithRequest={() => true}
                    style={{ flex: 1, backgroundColor: '#fff' }}
                />
                {loadingWeb && (
                    <ActivityIndicator size="large" color={C.primary} style={{ position: 'absolute', top: 16, right: 16 }} />
                )}
            </View>
        </Container>
    );
}

const s = StyleSheet.create({
    iconContainer: {
        width: 42, height: 42, borderRadius: 12,
        backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: C.border,
    },
    line: { height: 2, backgroundColor: C.border, marginVertical: 12, marginHorizontal: 16 },
});

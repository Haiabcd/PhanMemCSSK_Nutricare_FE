// ChatAI.tsx
import React, { useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';

const CHATBASE_URL =
  'https://www.chatbase.co/chatbot-iframe/stChIc4Kqt_784S75UQS6';

/* ===================== Screen ===================== */
export default function ChatAI({ navigation }: { navigation?: any }) {
  const webRef = useRef<WebView>(null);
  const [loadingWeb, setLoadingWeb] = useState(true);

  return (
    <Container>
      {/* Header card */}
      <ViewComponent px={16} pt={12}>
        <ViewComponent
          variant="card"
          radius={16}
          px={12}
          py={10}
          style={s.headerCard}
        >
          <ViewComponent row alignItems="center" gap={10}>
            <Pressable
              onPress={() => navigation?.goBack?.()}
              style={s.iconBtn}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={20} color={C.slate700} />
            </Pressable>

            <ViewComponent style={{ flex: 1 }}>
              <TextComponent
                text="Trợ lý dinh dưỡng"
                variant="caption"
                tone="muted"
              />
              <TextComponent
                text="AI Chat"
                variant="h3"
                weight="bold"
                color={C.text}
              />
            </ViewComponent>

            <Pressable
              onPress={() => navigation?.navigate?.('Notification')}
              style={s.iconBtn}
              hitSlop={8}
            >
              <Entypo name="bell" size={18} color={C.primary} />
            </Pressable>
          </ViewComponent>
        </ViewComponent>
      </ViewComponent>

      {/* WebView container */}
      <ViewComponent flex={1} px={16} pb={16} pt={8}>
        <ViewComponent
          radius={16}
          border
          borderColor={C.border}
          style={s.webShell}
        >
          <WebView
            ref={webRef}
            source={{ uri: CHATBASE_URL }}
            onLoadStart={() => setLoadingWeb(true)}
            onLoadEnd={() => setLoadingWeb(false)}
            onError={() => setLoadingWeb(false)}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            pullToRefreshEnabled
            style={{ flex: 1, backgroundColor: C.white, borderRadius: 16 }}
          />

          {loadingWeb && (
            <ViewComponent
              center
              style={s.loadingOverlay}
              radius={16}
              backgroundColor="rgba(255,255,255,0.85)"
            >
              <ActivityIndicator size="large" color={C.primary} />
              <TextComponent
                text="Đang kết nối với AI..."
                variant="caption"
                tone="muted"
                style={{ marginTop: 8 }}
              />
            </ViewComponent>
          )}
        </ViewComponent>
      </ViewComponent>
    </Container>
  );
}

const s = StyleSheet.create({
  headerCard: {
    backgroundColor: C.white,
    borderColor: C.primarySurface,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  webShell: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: C.white,
  },
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
  } as any,
});

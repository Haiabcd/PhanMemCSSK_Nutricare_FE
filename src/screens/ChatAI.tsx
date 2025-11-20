import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';
import { chatAssistant } from '../services/ai.service';
import { launchImageLibrary } from 'react-native-image-picker';

type RNAsset = { uri: string; type?: string; fileName?: string };
type Role = 'user' | 'assistant';

type ChatItem = {
  id: string;
  role: Role;
  text?: string;
  image?: RNAsset;
  status?: 'sending' | 'sent' | 'error';
  errorMsg?: string;
  ts?: number;
};

export default function ChatAI({ navigation }: { navigation?: any }) {
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [input, setInput] = useState('');
  const [attach, setAttach] = useState<RNAsset | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const canSend = useMemo(
    () => (!!input.trim() || !!attach) && !sending,
    [input, attach, sending],
  );

  const addMessage = useCallback((msg: ChatItem) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const updateMessage = useCallback((id: string, patch: Partial<ChatItem>) => {
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const onPickImage = useCallback(async () => {
    const res = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });
    if (res?.assets?.[0]?.uri) {
      const a = res.assets[0];
      setAttach({
        uri: a.uri!,
        fileName: a.fileName || 'photo.jpg',
        type: a.type || 'image/jpeg',
      });
    }
  }, []);

  const onClearImage = useCallback(() => setAttach(undefined), []);

  const send = useCallback(
    async (retryPayload?: { text?: string; file?: RNAsset }) => {
      const text = retryPayload?.text ?? input.trim();
      const file = retryPayload?.file ?? attach;
      if (!text && !file) return;

      const userId = `u_${Date.now()}`;
      const assistantId = `a_${Date.now()}`;

      addMessage({
        id: userId,
        role: 'user',
        text,
        image: file,
        status: 'sent',
        ts: Date.now(),
      });
      addMessage({
        id: assistantId,
        role: 'assistant',
        text: 'Đang soạn trả lời…',
        status: 'sending',
        ts: Date.now() + 1,
      });

      setInput('');
      setAttach(undefined);
      setSending(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const reply = await chatAssistant(
          { message: text || undefined, file: file },
          controller.signal,
        );
        updateMessage(assistantId, {
          text: reply || '(Không có nội dung phản hồi)',
          status: 'sent',
        });
      } catch (err: any) {
        updateMessage(assistantId, {
          text: 'Không gửi được.',
          status: 'error',
          errorMsg: 'Không gửi được. Hãy đợi vài giây rồi thử nhắn tiếp nhé.',
        });
      } finally {
        setSending(false);
        abortRef.current = null;
      }
    },
    [input, attach, addMessage, updateMessage],
  );

  const onRetry = useCallback(
    (failedMsg: ChatItem) => {
      const idx = messages.findIndex(x => x.id === failedMsg.id);
      const lastUser = [...messages.slice(0, idx)]
        .reverse()
        .find(m => m.role === 'user');
      const text = lastUser?.text;
      const file = lastUser?.image;
      if (text || file) send({ text, file });
    },
    [messages, send],
  );

  const onAbort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // Header
  const renderHeader = () => (
    <View>
      <ViewComponent>
        <ViewComponent>
          <ViewComponent row alignItems="center" gap={12}>
            <Pressable
              onPress={() => navigation?.goBack?.()}
              style={s.iconBtn}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={20} color={C.slate700} />
            </Pressable>

            <View style={{ flex: 1 }}>
              <TextComponent
                text="Trợ lý dinh dưỡng"
                variant="h3"
                weight="bold"
                color={C.text}
              />
            </View>

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
    </View>
  );

  // Composer
  const renderComposer = () => (
    <ViewComponent pb={16}>
      {!!attach && (
        <ViewComponent
          row
          alignItems="center"
          gap={10}
          mb={8}
          px={10}
          py={8}
          radius={14}
          style={[s.previewBar, s.shadowSm]}
        >
          <Image
            source={{ uri: attach.uri }}
            style={{ width: 40, height: 40, borderRadius: 8 }}
            resizeMode="cover"
          />
          <View style={{ flex: 1 }}>
            <TextComponent
              text={attach.fileName || 'photo.jpg'}
              variant="caption"
              numberOfLines={1}
            />
            <TextComponent text="Đính kèm ảnh" variant="caption" tone="muted" />
          </View>
          <Pressable onPress={onClearImage} hitSlop={6}>
            <AntDesign name="closecircleo" size={18} color={C.slate600} />
          </Pressable>
        </ViewComponent>
      )}

      <ViewComponent
        row
        alignItems="center"
        px={12}
        py={8}
        radius={20}
        style={[s.inputRow, s.shadowMd]}
      >
        <Pressable
          onPress={onPickImage}
          style={[s.roundBtn, { marginRight: 8 }]}
          hitSlop={8}
        >
          <Ionicons name="image" size={20} color={C.onPrimary} />
        </Pressable>

        <TextInput
          placeholder="Nhập câu hỏi của bạn về dinh dưỡng…"
          placeholderTextColor={C.slate500}
          value={input}
          onChangeText={setInput}
          style={s.textInput}
          multiline
          blurOnSubmit={false}
          underlineColorAndroid="transparent"
        />

        {sending ? (
          <Pressable
            onPress={onAbort}
            style={[s.roundBtn, { backgroundColor: C.red }]}
            hitSlop={8}
          >
            <MaterialIcons name="stop-circle" size={22} color={C.onPrimary} />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => send()}
            disabled={!canSend}
            style={[s.roundBtn, !canSend && { opacity: 0.5 }]}
            hitSlop={8}
          >
            <Ionicons name="send" size={20} color={C.onPrimary} />
          </Pressable>
        )}
      </ViewComponent>
    </ViewComponent>
  );

  // Item
  const renderItem = ({ item }: { item: ChatItem }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          s.bubbleRow,
          isUser
            ? { justifyContent: 'flex-end' }
            : { justifyContent: 'flex-start' },
        ]}
      >
        <View
          style={[
            s.bubble,
            isUser ? s.bubbleUser : s.bubbleAI,
            s.shadowSm,
            item.status === 'error' && { borderColor: C.red, borderWidth: 1 },
          ]}
        >
          {!isUser && (
            <View style={s.aiBadge}>
              <Ionicons name="sparkles" size={12} color={C.onPrimary} />
              <TextComponent
                text="AI"
                variant="caption"
                color={C.onPrimary}
                style={{ marginLeft: 4 }}
              />
            </View>
          )}

          {!!item.image && (
            <Image
              source={{ uri: item.image.uri }}
              style={s.bubbleImage}
              resizeMode="cover"
            />
          )}

          {!!item.text && (
            <TextComponent
              text={item.text}
              variant="body"
              color={isUser ? C.onPrimary : C.text}
            />
          )}

          {item.status === 'sending' && (
            <View style={s.sendingRow}>
              <ActivityIndicator
                size="small"
                color={isUser ? C.onPrimary : C.primary}
              />
              <TextComponent
                text="Đang soạn…"
                variant="caption"
                color={isUser ? C.onPrimary : undefined}
              />
            </View>
          )}

          {item.status === 'error' && (
            <View style={s.errorRow}>
              <MaterialIcons name="error-outline" size={16} color={C.red} />
              <TextComponent
                text={item.errorMsg || 'Lỗi kết nối'}
                variant="caption"
                color={C.red}
                style={{ marginLeft: 6 }}
              />
              <Pressable
                onPress={() => onRetry(item)}
                style={{ marginLeft: 10 }}
              >
                <TextComponent
                  text="Gửi lại"
                  variant="caption"
                  color={C.primary}
                  weight="bold"
                />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Dữ liệu hiển thị theo thứ tự tự nhiên: cũ → mới
  const dataForList = useMemo(
    () => [...messages].sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0)),
    [messages],
  );

  // Auto scroll xuống cuối khi nội dung đổi
  const listRef = useRef<FlatList<ChatItem>>(null);
  const handleContentSizeChange = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  return (
    <Container>
      {renderHeader()}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ViewComponent flex={1} pb={8} pt={8}>
          <ViewComponent
            radius={20}
            border
            borderColor={C.border}
            style={[s.chatShell, s.shadowMd]}
          >
            <FlatList
              ref={listRef}
              data={dataForList}
              keyExtractor={item => item.id}
              renderItem={renderItem}
              onContentSizeChange={handleContentSizeChange}
              contentContainerStyle={{
                padding: 12,
                flexGrow: 1,
              }}
              keyboardShouldPersistTaps="handled"
              removeClippedSubviews={false}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              ListEmptyComponent={
                <View style={s.emptyWrap}>
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop',
                    }}
                    style={s.emptyImg}
                  />
                  <TextComponent
                    text="Xin chào! Mình là trợ lý dinh dưỡng của bạn."
                    variant="h3"
                    weight="bold"
                    style={{ textAlign: 'center', marginTop: 10 }}
                  />
                  <TextComponent
                    text="Hãy hỏi bất kỳ điều gì về bữa ăn, calo, hoặc gửi ảnh món ăn để mình phân tích."
                    variant="caption"
                    tone="muted"
                    style={{ textAlign: 'center', marginTop: 6 }}
                  />
                </View>
              }
            />
          </ViewComponent>
        </ViewComponent>

        {renderComposer()}
      </KeyboardAvoidingView>
    </Container>
  );
}

const s = StyleSheet.create({
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
  chatShell: {
    flex: 1,
    backgroundColor: C.white,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingVertical: 8,
    paddingHorizontal: 10,
    color: C.text,
  },
  inputRow: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBar: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
  },
  bubbleRow: {
    width: '100%',
    flexDirection: 'row',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    padding: 10,
    position: 'relative',
  },
  bubbleUser: {
    backgroundColor: C.primary,
    borderTopRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  bubbleImage: {
    width: 220,
    height: 140,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#eee',
  },
  aiBadge: {
    position: 'absolute',
    top: -10,
    left: -10,
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendingRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 16,
  },
  emptyImg: {
    width: 160,
    height: 120,
    borderRadius: 16,
  },
  shadowSm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  shadowMd: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
});

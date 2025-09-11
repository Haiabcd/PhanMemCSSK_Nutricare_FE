// NutritionGuide.tsx – optimized & polished UI with in-app AI chat modal
import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Animated,
  PanResponder,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Container from '../components/Container';

// ====== Types ======
type Kind = 'all' | 'meal' | 'article' | 'video';

type Item = {
  id: string;
  title: string;
  desc: string;
  kind: Kind;
  cal?: number;
  protein?: number;
  image: string;
  meta?: string;
  weightLine?: string;
  cta?: string;
};

type ChatMsg = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
};

// ====== Data ======
const FILTERS: { key: Kind; label: string; icon: string }[] = [
  { key: 'all', label: 'Tất cả', icon: 'sparkles-outline' },
  { key: 'meal', label: 'Món ăn', icon: 'restaurant' },
  { key: 'article', label: 'Bài báo', icon: 'newspaper-outline' },
  { key: 'video', label: 'Video', icon: 'play-circle-outline' },
];

const DATA: Item[] = [
  {
    id: '1',
    title: 'Salad Gà Ớt',
    desc: 'Món salad tươi ngon, giàu rau củ, phù hợp giảm cân.',
    kind: 'meal',
    cal: 380,
    protein: 18,
    image:
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800&auto=format&fit=crop',
    cta: 'XEM CÔNG THỨC',
  },
  {
    id: '2',
    title: 'Ăn Kiêng Khỏe Mạnh',
    desc: 'Mẹo duy trì chế độ ăn cân bằng và lành mạnh.',
    kind: 'article',
    image:
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=800&auto=format&fit=crop',
    cta: 'ĐỌC BÀI',
  },
  {
    id: '3',
    title: 'Bữa Sáng Cao Protein',
    desc: 'Hướng dẫn nấu nhanh giàu protein để bắt đầu ngày.',
    kind: 'video',
    meta: '10 phút | Video HD',
    image:
      'https://images.unsplash.com/photo-1551782450-17144c3a8f59?q=80&w=800&auto=format&fit=crop',
    cta: 'XEM VIDEO',
  },
  {
    id: '4',
    title: 'Quinoa & Cá Hồi',
    desc: 'Omega-3 từ cá hồi, giàu hạt quinoa cho sức khỏe.',
    kind: 'meal',
    weightLine: '450g | 35g protein',
    image:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop',
    cta: 'XEM CÔNG THỨC',
  },
  {
    id: '5',
    title: 'Ăn Chay Lành Mạnh',
    desc: 'Lợi ích của chế độ ăn vegan cho sức khỏe và môi trường.',
    kind: 'article',
    image:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop',
    cta: 'ĐỌC BÀI',
  },
  {
    id: '6',
    title: 'Smoothie Thấp Calo',
    desc: 'Công thức smoothie ngon miệng mà vẫn nhẹ nhàng.',
    kind: 'video',
    meta: '5 phút | Video nhanh',
    image:
      'https://images.unsplash.com/photo-1556742400-b5b7c5121f90?q=80&w=800&auto=format&fit=crop',
    cta: 'XEM VIDEO',
  },
  {
    id: '7',
    title: 'Sinh Tố Rau Xanh',
    desc: 'Nước ép rau & trái cây, vitamin tự nhiên.',
    kind: 'meal',
    cal: 250,
    protein: 8,
    image:
      'https://images.unsplash.com/photo-1542442828-287225e22b67?q=80&w=800&auto=format&fit=crop',
    cta: 'XEM CÔNG THỨC',
  },
  {
    id: '8',
    title: 'Nguồn Protein Tốt',
    desc: 'Khám phá protein thực vật & động vật có lợi.',
    kind: 'article',
    image:
      'https://images.unsplash.com/photo-1505575972945-280e1d0d4c57?q=80&w=800&auto=format&fit=crop',
    cta: 'ĐỌC BÀI',
  },
];

// ====== Screen ======
export default function NutritionGuide(): JSX.Element {
  const [active, setActive] = useState<Kind>('all');
  const [q, setQ] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const { width: screenW, height: screenH } = useWindowDimensions();

  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return DATA.filter(it => {
      const okKind = active === 'all' ? true : it.kind === active;
      const okQ =
        qLower.length === 0
          ? true
          : [it.title, it.desc].some(t => t.toLowerCase().includes(qLower));
      return okKind && okQ;
    });
  }, [active, q]);

  // 2 columns layout (no overflow)
  const H_PADDING = 12;
  const GUTTER = 12;
  const cardWidth = Math.floor((screenW - H_PADDING * 2 - GUTTER) / 2);

  return (
    <Container>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Khám phá Dinh dưỡng</Text>
          <Text style={s.headerSub}>
            Video · Bài viết · Công thức tốt cho bạn
          </Text>
        </View>

        {/* Search pill */}
        <View style={s.searchWrap}>
          <Ionicons name="search" size={18} color="#64748b" />
          <TextInput
            placeholder="Tìm kiếm nội dung..."
            placeholderTextColor="#94a3b8"
            value={q}
            onChangeText={setQ}
            style={s.searchInput}
            returnKeyType="search"
          />
          {q ? (
            <Pressable onPress={() => setQ('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </Pressable>
          ) : (
            <Ionicons name="mic-outline" size={18} color="#94a3b8" />
          )}
        </View>

        {/* Filters (horizontal to avoid overflow) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filters}
        >
          {FILTERS.map(f => {
            const isActive = active === f.key;
            return (
              <Pressable
                key={f.key}
                style={[s.chip, isActive && s.chipActive]}
                onPress={() => setActive(f.key)}
                accessibilityRole="button"
                accessibilityLabel={`Lọc theo ${f.label}`}
              >
                <Ionicons
                  name={f.icon as any}
                  size={14}
                  color={isActive ? '#fff' : '#0f172a'}
                  style={s.chipIcon}
                />
                <Text style={[s.chipText, isActive && s.chipTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Feed list */}
        <FlatList
          data={filtered}
          keyExtractor={it => it.id}
          numColumns={2}
          columnWrapperStyle={{
            justifyContent: 'space-between',
            paddingHorizontal: H_PADDING,
          }}
          contentContainerStyle={{
            paddingBottom: 24,
            paddingHorizontal: H_PADDING,
            paddingTop: 6,
          }}
          renderItem={({ item }) => <Card item={item} cardWidth={cardWidth} />}
          ItemSeparatorComponent={() => <View style={{ height: GUTTER }} />}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
        />

        {/* Floating AI Chat bubble + modal */}
        <FloatingAssistant
          screenW={screenW}
          screenH={screenH}
          onOpen={() => setChatOpen(true)}
        />
        <ChatModal visible={chatOpen} onClose={() => setChatOpen(false)} />
      </View>
    </Container>
  );
}

// ====== Card ======
const Card = React.memo(function Card({
  item,
  cardWidth,
}: {
  item: Item;
  cardWidth: number;
}) {
  const kindLabel =
    item.kind === 'meal'
      ? 'Món ăn'
      : item.kind === 'article'
      ? 'Bài báo'
      : 'Video';
  const thumbH = Math.round(cardWidth * 0.62);

  // Press animation
  const scale = useRef(new Animated.Value(1)).current;
  const animateIn = useCallback(
    () =>
      Animated.spring(scale, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 15,
        bounciness: 3,
      }).start(),
    [scale],
  );
  const animateOut = useCallback(
    () =>
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 15,
        bounciness: 3,
      }).start(),
    [scale],
  );

  return (
    <Animated.View
      style={[s.card, { width: cardWidth, transform: [{ scale }] }]}
    >
      <Pressable
        onPressIn={animateIn}
        onPressOut={animateOut}
        onPress={() => {
          /* TODO: navigate detail */
        }}
      >
        <View style={[s.thumbWrap, { height: thumbH }]}>
          <Image source={{ uri: item.image }} style={s.thumb} />
          <View style={s.badge}>
            <Text style={s.badgeText}>{kindLabel}</Text>
          </View>
          {item.kind === 'video' && (
            <View style={s.playOverlay}>
              <Ionicons name="play" size={20} color="#fff" />
            </View>
          )}
        </View>

        <View style={s.cardBody}>
          <Text style={s.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={s.cardDesc} numberOfLines={2}>
            {item.desc}
          </Text>

          <View style={s.metaRow}>
            {typeof item.cal === 'number' && (
              <View style={s.metaPill}>
                <McIcon name="fire" size={14} color="#ef4444" />
                <Text style={s.metaText}>{item.cal} kcal</Text>
              </View>
            )}
            {typeof item.protein === 'number' && (
              <View style={s.metaPill}>
                <McIcon name="food-drumstick" size={14} color="#16a34a" />
                <Text style={s.metaText}>{item.protein}g protein</Text>
              </View>
            )}
            {item.weightLine && (
              <Text style={s.metaLoose}>{item.weightLine}</Text>
            )}
            {item.meta && <Text style={s.metaLoose}>{item.meta}</Text>}
          </View>

          {/* Spacer to align CTA bottom */}
          <View style={{ flexGrow: 1 }} />

          <Pressable
            style={s.ctaBtn}
            onPress={() => {
              /* TODO: detail */
            }}
          >
            <Text style={s.ctaText}>{item.cta ?? 'XEM THÊM'}</Text>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
});

// ====== Floating Assistant ======
function FloatingAssistant({
  screenW,
  screenH,
  onOpen,
}: {
  screenW: number;
  screenH: number;
  onOpen: () => void;
}) {
  const SIZE = 56;
  const MARGIN = 12;
  const pos = useRef(
    new Animated.ValueXY({
      x: screenW - SIZE - MARGIN,
      y: Math.max(MARGIN, Math.min(screenH * 0.65, screenH - SIZE - MARGIN)),
    }),
  ).current;
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pos.extractOffset();
      },
      onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        pos.flattenOffset();
        const cur = {
          x: (pos.x as any).__getValue(),
          y: (pos.y as any).__getValue(),
        };
        const snapX =
          cur.x + SIZE / 2 > screenW / 2 ? screenW - SIZE - MARGIN : MARGIN;
        const boundedY = clamp(cur.y, MARGIN, screenH - SIZE - MARGIN);
        Animated.spring(pos, {
          toValue: { x: snapX, y: boundedY },
          useNativeDriver: false,
          bounciness: 8,
        }).start();

        // Treat quick tap
        if (Math.abs(gesture.dx) < 5 && Math.abs(gesture.dy) < 5) onOpen();
      },
    }),
  ).current;

  return (
    <Animated.View
      style={[
        s.chatBall,
        { width: SIZE, height: SIZE, borderRadius: SIZE / 2 },
        pos.getLayout(),
      ]}
      {...panResponder.panHandlers}
      pointerEvents="box-none"
      accessibilityLabel="Mở chat với AI"
      accessibilityRole="button"
    >
      <View style={s.chatInner}>
        <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
      </View>
    </Animated.View>
  );
}

// ====== Chat Modal ======
function ChatModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'm1',
      role: 'assistant',
      text: 'Xin chào! Bạn muốn xem video hay bài viết nào về dinh dưỡng?',
      time: 'now',
    },
  ]);
  const [text, setText] = useState('');

  const send = useCallback(() => {
    const t = text.trim();
    if (!t) return;
    const user: ChatMsg = {
      id: String(Date.now()),
      role: 'user',
      text: t,
      time: 'now',
    };
    setMessages(prev => [
      ...prev,
      user,
      {
        id: String(Date.now() + 1),
        role: 'assistant',
        text: 'Mình đã ghi nhận. (Tích hợp API AI tại đây)',
        time: 'now',
      },
    ]);
    setText('');
  }, [text]);

  const quick = [
    'Gợi ý video tăng cơ',
    'Bài viết về Low-carb',
    'Món ít calo buổi tối',
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          <View style={s.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="sparkles" size={18} color="#10b981" />
              <Text style={s.modalTitle}>Hỏi AI Dinh dưỡng</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={20} color="#0f172a" />
            </Pressable>
          </View>

          <ScrollView
            style={s.chatScroll}
            contentContainerStyle={{ padding: 12 }}
          >
            {messages.map(m => (
              <View
                key={m.id}
                style={[s.msg, m.role === 'user' ? s.msgUser : s.msgAI]}
              >
                <Text
                  style={[
                    s.msgText,
                    m.role === 'user' ? s.msgTextUser : s.msgTextAI,
                  ]}
                >
                  {m.text}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Quick suggestions */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.suggestRow}
          >
            {quick.map(q => (
              <Pressable
                key={q}
                style={s.suggestChip}
                onPress={() => setText(q)}
              >
                <Text style={s.suggestText}>{q}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={s.inputRow}>
              <TextInput
                placeholder="Hãy hỏi: Video ít calo, Bài viết về protein..."
                placeholderTextColor="#94a3b8"
                value={text}
                onChangeText={setText}
                style={s.input}
                multiline
              />
              <Pressable style={s.sendBtn} onPress={send}>
                <Ionicons name="send" size={18} color="#fff" />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}

// ====== Styles ======
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#34d399',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  headerSub: {
    color: '#ecfeff',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },

  searchWrap: {
    marginTop: -18,
    marginHorizontal: 16,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    color: '#0f172a',
    paddingVertical: 8,
    marginHorizontal: 8,
  },

  filters: { paddingHorizontal: 12, paddingVertical: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#10b981' },
  chipIcon: { marginRight: 6 },
  chipText: { color: '#0f172a', fontWeight: '700', fontSize: 12 },
  chipTextActive: { color: '#fff' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    minHeight: 280,
  },
  thumbWrap: { width: '100%' },
  thumb: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(15,23,42,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  playOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardBody: { padding: 12 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  cardDesc: { fontSize: 13, color: '#334155', marginTop: 4 },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 6,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
    marginLeft: 4,
  },
  metaLoose: {
    fontSize: 12,
    color: '#64748b',
    marginRight: 8,
    marginBottom: 6,
  },

  ctaBtn: {
    marginTop: 10,
    alignSelf: 'stretch',
    backgroundColor: '#fce7f3',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#be185d', fontWeight: '900', fontSize: 12 },

  // Floating chat
  chatBall: {
    position: 'absolute',
    zIndex: 20,
    elevation: 12,
    backgroundColor: '#10b981',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  chatInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Chat modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    marginLeft: 6,
    fontWeight: '900',
    fontSize: 14,
    color: '#0f172a',
  },
  chatScroll: { maxHeight: 280 },
  msg: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '85%',
  },
  msgUser: { alignSelf: 'flex-end', backgroundColor: '#dcfce7' },
  msgAI: { alignSelf: 'flex-start', backgroundColor: '#e2e8f0' },
  msgText: { fontSize: 13 },
  msgTextUser: { color: '#14532d', fontWeight: '600' },
  msgTextAI: { color: '#0f172a' },

  suggestRow: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 },
  suggestChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
  },
  suggestText: { fontWeight: '800', fontSize: 12, color: '#0f172a' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#0f172a',
    marginRight: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

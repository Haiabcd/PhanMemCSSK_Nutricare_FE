import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { GuideStackParamList } from '../navigation/GuideNavigator';
import {
    QUICK_GROUPS,
    getNutritionGlossaryAnswer,
    type GlossaryQuickGroup,
} from '../data/nutritionGlossary';

/* ================== Types ================== */
type GlossaryMessage = {
    id: string;
    role: 'user' | 'assistant';
    text: string;
};

type Stage = 'root' | 'groupQuestions';

/* ================== Component ================== */
export default function NutritionGlossary() {
    const navigation =
        useNavigation<NativeStackNavigationProp<GuideStackParamList>>();
    const [messages, setMessages] = useState<GlossaryMessage[]>([]);
    const [sending, setSending] = useState(false);
    const [stage, setStage] = useState<Stage>('root');
    const [selectedGroup, setSelectedGroup] = useState<GlossaryQuickGroup | null>(
        null,
    );
    const listRef = useRef<FlatList<GlossaryMessage>>(null);
    const hasMessages = messages.length > 0;

    const handleAsk = useCallback(
        (question: string) => {
            if (!question.trim() || sending) return;
            const q = question.trim();

            const userMessage: GlossaryMessage = {
                id: `u_${Date.now()}`,
                role: 'user',
                text: q,
            };

            setMessages(prev => [...prev, userMessage]);
            setSending(true);

            setTimeout(() => {
                const answerText = getNutritionGlossaryAnswer(q);
                const botMessage: GlossaryMessage = {
                    id: `a_${Date.now()}`,
                    role: 'assistant',
                    text: answerText,
                };
                setMessages(prev => [...prev, botMessage]);
                setSending(false);

                // Sau khi trả lời xong → quay về màn chọn 4 chủ đề
                setStage('root');
                setSelectedGroup(null);

                requestAnimationFrame(() => {
                    listRef.current?.scrollToEnd({ animated: true });
                });
            }, 220);
        },
        [sending],
    );

    const handleSelectGroup = (group: GlossaryQuickGroup) => {
        setSelectedGroup(group);
        setStage('groupQuestions');
    };

    const renderMessage = ({ item }: { item: GlossaryMessage }) => {
        const isUser = item.role === 'user';

        return (
            <View
                style={[
                    styles.msgRow,
                    { justifyContent: isUser ? 'flex-end' : 'flex-start' },
                ]}
            >
                {/* Avatar bot */}
                {!isUser && (
                    <View style={styles.botAvatarContainer}>
                        <View style={styles.botAvatar}>
                            <MaterialCommunityIcons
                                name="food-apple"
                                size={16}
                                color={C.white}
                            />
                        </View>
                    </View>
                )}

                {/* Bubble */}
                <View
                    style={[
                        isUser ? styles.userBubbleWrapper : styles.botBubbleWrapper,
                    ]}
                >
                    <View
                        style={[
                            styles.bubble,
                            isUser ? styles.userBubble : styles.botBubble,
                        ]}
                    >
                        <TextComponent
                            text={item.text}
                            variant="body"
                            tone={isUser ? 'inverse' : 'default'}
                        />
                    </View>
                </View>

                {/* Avatar user */}
                {isUser && (
                    <View style={styles.userAvatar}>
                        <MaterialCommunityIcons
                            name="account-circle"
                            size={26}
                            color={C.slate500}
                        />
                    </View>
                )}
            </View>
        );
    };

    const IntroHeader = useMemo(
        () => (
            <View style={styles.headerIntro}>
                <View style={styles.headerIconWrap}>
                    <MaterialCommunityIcons
                        name="book-open-page-variant-outline"
                        size={18}
                        color={C.primary}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <TextComponent
                        text="Từ điển dinh dưỡng"
                        variant="h2"
                        weight="bold"
                        style={{ marginBottom: 4 }}
                    />
                    <TextComponent
                        text="Chạm vào chủ đề và câu hỏi gợi ý để xem giải thích nhanh về thuật ngữ, chỉ số và công thức dinh dưỡng."
                        variant="body"
                        tone="muted"
                    />
                </View>
            </View>
        ),
        [],
    );

    // ==== Panel helper (để code gọn, không lặp) ====
    const renderCategoryPanel = () => (
        <View style={styles.categoryPanel}>
            <TextComponent
                text="Chọn chủ đề"
                variant="caption"
                weight="semibold"
                tone="muted"
                style={{
                    marginBottom: 8,
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                }}
            />
            <View style={styles.categoryRow}>
                {QUICK_GROUPS.map(group => (
                    <Pressable
                        key={group.id}
                        onPress={() => handleSelectGroup(group)}
                        style={({ pressed }) => [
                            styles.categoryBtn,
                            pressed && { transform: [{ scale: 0.97 }] },
                        ]}
                    >
                        <MaterialCommunityIcons
                            name="folder-information-outline"
                            size={18}
                            color={C.primary}
                            style={{ marginBottom: 4 }}
                        />
                        <TextComponent
                            text={group.label}
                            variant="body"
                            weight="semibold"
                            style={{ textAlign: 'center' }}
                        />
                    </Pressable>
                ))}
            </View>
        </View>
    );

    const renderQuestionPanel = () => {
        if (!selectedGroup) return null;
        return (
            <View style={styles.questionPanel}>
                <View style={styles.questionHeaderRow}>
                    <View style={styles.sectionLabelRow}>
                        <View style={styles.sectionLabelDot} />
                        <TextComponent
                            text={selectedGroup.label}
                            variant="caption"
                            weight="bold"
                            tone="muted"
                            style={{
                                textTransform: 'uppercase',
                                letterSpacing: 0.6,
                            }}
                        />
                    </View>

                    <Pressable
                        onPress={() => {
                            setStage('root');
                            setSelectedGroup(null);
                        }}
                        hitSlop={8}
                        style={styles.changeTopicBtn}
                    >
                        <Ionicons
                            name="refresh-outline"
                            size={14}
                            color={C.slate600}
                        />
                        <TextComponent
                            text="Chủ đề khác"
                            variant="caption"
                            tone="muted"
                            style={{ marginLeft: 4 }}
                        />
                    </Pressable>
                </View>

                <View style={styles.quickRow}>
                    {selectedGroup.items.map(q => (
                        <Pressable
                            key={q}
                            onPress={() => handleAsk(q)}
                            style={({ pressed }) => [
                                styles.quickChip,
                                pressed && { transform: [{ scale: 0.97 }] },
                            ]}
                            disabled={sending}
                        >
                            <MaterialCommunityIcons
                                name="chat-question-outline"
                                size={14}
                                color={C.slate600}
                                style={{ marginRight: 6 }}
                            />
                            <TextComponent
                                text={q}
                                variant="caption"
                                tone="default"
                                numberOfLines={2}
                            />
                        </Pressable>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <Container>
            {/* Header đơn giản với nút back */}
            <ViewComponent row alignItems="center" style={styles.topBar}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    hitSlop={10}
                    style={{ paddingRight: 8, paddingVertical: 4 }}
                >
                    <Ionicons name="chevron-back" size={22} color={C.slate800} />
                </Pressable>
                <TextComponent text="Từ điển dinh dưỡng" variant="h3" weight="bold" />
            </ViewComponent>

            <View style={styles.screenBody}>
                <View style={styles.chatCard}>
                    <View style={styles.chatCardHeader}>
                        <View style={styles.chatLabelBadge}>
                            <MaterialCommunityIcons
                                name="robot-outline"
                                size={14}
                                color={C.primary}
                                style={{ marginRight: 6 }}
                            />
                            <TextComponent
                                text="Giải thích thuật ngữ"
                                variant="caption"
                                weight="semibold"
                                tone="default"
                            />
                        </View>
                        {sending && (
                            <TextComponent
                                text="Đang tạo giải thích..."
                                variant="caption"
                                tone="muted"
                            />
                        )}
                    </View>

                    <View style={styles.chatBody}>
                        <FlatList
                            ref={listRef}
                            data={messages}
                            keyExtractor={m => m.id}
                            renderItem={renderMessage}
                            contentContainerStyle={styles.chatContent}
                            ListHeaderComponent={IntroHeader}
                            ListEmptyComponent={
                                <View style={styles.emptyHint}>
                                    <TextComponent
                                        text='Bắt đầu bằng cách chọn một chủ đề bên dưới, sau đó chọn câu hỏi, ví dụ: “BMR là gì?”.'
                                        variant="body"
                                        tone="muted"
                                    />
                                </View>
                            }
                            // LẦN ĐẦU: panel nằm trong list (sát trên)
                            ListFooterComponent={
                                !hasMessages ? (
                                    <>
                                        {stage === 'root' && renderCategoryPanel()}
                                        {stage === 'groupQuestions' && renderQuestionPanel()}
                                    </>
                                ) : null
                            }
                            onContentSizeChange={() => {
                                if (hasMessages) {
                                    listRef.current?.scrollToEnd({ animated: true });
                                }
                            }}
                            style={{ flex: 1 }}
                            showsVerticalScrollIndicator={false}
                        />

                        {/* TỪ LẦN SAU: panel cố định ở đáy card */}
                        {hasMessages && (
                            <View style={styles.bottomPanel}>
                                {stage === 'root' && renderCategoryPanel()}
                                {stage === 'groupQuestions' && renderQuestionPanel()}
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Container>
    );
}

/* ================== Styles ================== */

const styles = StyleSheet.create({
    topBar: {
        paddingTop: 10,
        paddingBottom: 4,
    },
    screenBody: {
        flex: 1,
        paddingBottom: 8,
        paddingTop: 4,
        backgroundColor: C.slate50,
    },

    chatCard: {
        flex: 1,
        marginTop: 8,
        borderRadius: 20,
        backgroundColor: C.white,
        borderWidth: 1,
        borderColor: C.slate200,
        paddingVertical: 6,
        paddingHorizontal: 6,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    chatCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 6,
        paddingBottom: 4,
    },
    chatLabelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: C.slate50,
        borderWidth: 1,
        borderColor: C.slate200,
    },
    chatBody: {
        flex: 1,
    },
    chatContent: {
        paddingHorizontal: 4,
        paddingTop: 6,
        paddingBottom: 12,
        flexGrow: 1,
    },

    headerIntro: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    headerIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.primarySurface || C.slate100,
    },

    /* Bubbles */
    msgRow: {
        flexDirection: 'row',
        marginBottom: 14,
        paddingHorizontal: 6,
    },
    bubble: {
        maxWidth: '78%',
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    botBubbleWrapper: {
        maxWidth: '80%',
    },
    botBubble: {
        backgroundColor: C.white,
        borderWidth: 1,
        borderColor: C.slate200,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    userBubbleWrapper: {
        maxWidth: '80%',
    },
    userBubble: {
        backgroundColor: C.primary,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    botAvatarContainer: {
        justifyContent: 'flex-end',
        marginRight: 8,
    },
    botAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: C.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    userAvatar: {
        marginLeft: 8,
    },

    emptyHint: {
        paddingHorizontal: 4,
        paddingVertical: 12,
        alignItems: 'flex-start',
    },

    /* Panel chọn 4 chủ đề */
    categoryPanel: {
        borderTopWidth: 1,
        borderTopColor: C.slate100,
        paddingTop: 10,
        paddingHorizontal: 8,
        paddingBottom: 4,
        // marginTop: 8, // nếu muốn cách message phía trên một chút thì bật lại
    },
    categoryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'space-between',
    },
    categoryBtn: {
        flexBasis: '48%',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 14,
        backgroundColor: C.slate50,
        borderWidth: 1,
        borderColor: C.slate200,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
    },

    questionPanel: {
        borderTopWidth: 1,
        borderTopColor: C.slate100,
        paddingTop: 10,
        paddingHorizontal: 8,
        paddingBottom: 8,
    },
    questionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionLabelDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: C.primary,
        marginRight: 6,
    },
    changeTopicBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: C.slate50,
    },

    quickRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    quickChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: C.white,
        borderWidth: 1,
        borderColor: C.slate200,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
        maxWidth: '100%',
    },

    bottomPanel: {
        borderTopWidth: 1,
        borderTopColor: C.slate100,
        paddingTop: 8,
        paddingHorizontal: 4,
        paddingBottom: 4,
        backgroundColor: C.white,
    },
});

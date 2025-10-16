// screens/NotificationScreen.tsx
import React from 'react';
import { StyleSheet, FlatList, View, Pressable, Image, RefreshControl } from 'react-native';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';
import Entypo from 'react-native-vector-icons/Entypo';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PlanStackParamList } from '../navigation/PlanNavigator';
import { useNotifications } from '../hooks/useNotifications';
import { clearNotiHistory } from '../storage/notifications';

function Avatar({ name, photoUri }: { name: string; photoUri?: string | null }) {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    if (photoUri) return <Image source={{ uri: photoUri }} style={s.avatar} />;
    return (
        <ViewComponent center style={s.avatarFallback} flex={0}>
            <TextComponent text={initials} variant="subtitle" weight="bold" tone="primary" />
        </ViewComponent>
    );
}

export default function NotificationScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<PlanStackParamList>>();
    const { loading, sections, refresh } = useNotifications();

    const onClear = async () => {
        await clearNotiHistory();
    };

    return (
        <Container>
            <ViewComponent row between alignItems="center" mt={20}>
                <ViewComponent row alignItems="center" gap={10} flex={0}>
                    <Avatar name="Anh Hải" />
                    <ViewComponent flex={0}>
                        <TextComponent text="Xin chào," variant="caption" tone="muted" />
                        <TextComponent text="Anh Hải" variant="subtitle" weight="bold" />
                    </ViewComponent>
                </ViewComponent>

                <ViewComponent row gap={10} flex={0}>
                    <Pressable style={s.iconContainer} onPress={onClear}>
                        <Entypo name="trash" size={18} color={C.primary} />
                    </Pressable>
                    <Pressable style={s.iconContainer} onPress={() => { }}>
                        <Entypo name="bell" size={20} color={C.primary} />
                    </Pressable>
                </ViewComponent>
            </ViewComponent>

            <View style={s.line} />

            <ViewComponent row between alignItems="center" mb={16}>
                <TextComponent text="Thông báo" variant="h2" weight="bold" />
            </ViewComponent>

            {sections.length === 0 ? (
                <ViewComponent mt={40} center>
                    <TextComponent text="Chưa có thông báo nào." tone="muted" />
                </ViewComponent>
            ) : (
                <FlatList
                    data={sections}
                    keyExtractor={([day]) => day}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
                    renderItem={({ item: [day, notis] }) => (
                        <View style={{ marginBottom: 28 }}>
                            <TextComponent
                                text={day}
                                weight="bold"
                                tone="primary"
                                style={{ marginBottom: 12 }}
                            />
                            {notis.map(n => {
                                const time = `${String(n.at.getHours()).padStart(2, '0')}:${String(n.at.getMinutes()).padStart(2, '0')}`;
                                const iconName =
                                    n.type === 'meal' ? 'bowl' :
                                        n.type === 'water' ? 'drop' :
                                            n.type === 'suggestion' ? 'light-bulb' : 'bell';

                                return (
                                    <ViewComponent
                                        key={n.id}
                                        row
                                        alignItems="center"
                                        p={14}
                                        mb={12}
                                        radius={16}
                                        style={s.card}
                                    >
                                        <View style={s.iconWrap}>
                                            <Entypo name={iconName} size={20} color={C.primary} />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <TextComponent text={n.title} weight="bold" />
                                            <TextComponent text={n.message} size={13} tone="muted" />
                                        </View>
                                        <TextComponent text={time} size={12} tone="muted" />
                                    </ViewComponent>
                                );
                            })}
                        </View>
                    )}
                />
            )}
        </Container>
    );
}

const s = StyleSheet.create({
    iconContainer: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: C.bg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: C.border,
    },
    avatarFallback: {
        width: 52,
        height: 52,
        borderRadius: 999,
        backgroundColor: C.bg,
        borderWidth: 1,
        borderColor: C.border,
    },
    avatar: { width: 52, height: 52, borderRadius: 999 },
    line: { height: 2, backgroundColor: C.border, marginVertical: 12 },

    card: {
        backgroundColor: C.white,
        borderWidth: 1,
        borderColor: C.border,
        elevation: 1,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.primarySurface,
    },
});

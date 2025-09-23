// screens/NotificationScreen.tsx
import React from 'react';
import { StyleSheet, FlatList, View, Pressable, Image } from 'react-native';
import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';
import Entypo from 'react-native-vector-icons/Entypo';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PlanStackParamList } from '../navigation/PlanNavigator';

type Notification = {
    id: string;
    type: 'meal' | 'water' | 'reminder' | 'suggestion';
    title: string;
    message: string;
    time: string;
    day: string; // "Hôm nay", "Hôm qua"...
};

const DATA: Notification[] = [
    { id: '1', type: 'meal', title: 'Đến giờ ăn trưa', message: 'Hãy bổ sung bữa trưa để duy trì năng lượng.', time: '11:45', day: 'Hôm nay' },
    { id: '2', type: 'water', title: 'Uống nước', message: 'Đã 2 giờ bạn chưa uống nước.', time: '10:30', day: 'Hôm nay' },
    { id: '3', type: 'suggestion', title: 'Gợi ý món ăn', message: 'Salad gà áp chảo ít dầu cho bữa tối.', time: '20:00', day: 'Hôm qua' },
];

/* ============== Avatar fallback ============== */
function Avatar({ name, photoUri }: { name: string; photoUri?: string | null }) {
    const initials = name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    if (photoUri) return <Image source={{ uri: photoUri }} style={s.avatar} />;

    return (
        <ViewComponent center style={s.avatarFallback} flex={0}>
            <TextComponent text={initials} variant="subtitle" weight="bold" tone="primary" />
        </ViewComponent>
    );
}

export default function NotificationScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<PlanStackParamList>>();

    // Gom nhóm theo ngày
    const grouped = DATA.reduce((acc, item) => {
        if (!acc[item.day]) acc[item.day] = [];
        acc[item.day].push(item);
        return acc;
    }, {} as Record<string, Notification[]>);

    const sections = Object.entries(grouped);

    const onOpenSettings = () => {
        // TODO: navigation.navigate('NotificationSettings')
        console.log('Đi đến cài đặt thông báo');
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

                <Pressable style={s.iconContainer} onPress={() => { }}>
                    <Entypo name="bell" size={20} color={C.primary} />
                </Pressable>
            </ViewComponent>

            <View style={s.line} />

            <ViewComponent row between alignItems="center" mb={16}>
                <TextComponent text="Thông báo" variant="h2" weight="bold" />
            </ViewComponent>

            <FlatList
                data={sections}
                keyExtractor={([day]) => day}
                contentContainerStyle={{ paddingBottom: 24 }}
                renderItem={({ item: [day, notis] }) => (
                    <View style={{ marginBottom: 28 }}>
                        {/* Tiêu đề ngày */}
                        <TextComponent
                            text={day}
                            weight="bold"
                            tone="primary"
                            style={{ marginBottom: 12 }}
                        />

                        {notis.map(n => (
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
                                    <Entypo
                                        name={
                                            n.type === 'meal'
                                                ? 'bowl'
                                                : n.type === 'water'
                                                    ? 'drop'
                                                    : n.type === 'reminder'
                                                        ? 'bell'
                                                        : 'light-bulb'
                                        }
                                        size={20}
                                        color={C.primary}
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <TextComponent text={n.title} weight="bold" />
                                    <TextComponent text={n.message} size={13} tone="muted" />
                                </View>
                                <TextComponent text={n.time} size={12} tone="muted" />
                            </ViewComponent>
                        ))}
                    </View>
                )}
            />
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

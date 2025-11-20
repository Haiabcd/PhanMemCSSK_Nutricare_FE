import React from 'react';
import { StyleSheet, Image, ScrollView, Pressable, View } from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';

import Container from '../components/Container';
import TextComponent from '../components/TextComponent';
import ViewComponent from '../components/ViewComponent';
import { colors as C } from '../constants/colors';

type ArticleItem = {
  id: string;
  type: 'article';
  tag: 'Bài báo';
  title: string;
  cover: string;
  excerpt?: string;
  contentText?: string;
};

type Props = {
  route?: { params?: { item: ArticleItem } };
  navigation?: {
    goBack?: () => void;
    canGoBack?: () => boolean;
    navigate?: (name: string, params?: any) => void;
  };
};

export default function NewspaperScreen({ route, navigation }: Props) {
  const item = route?.params?.item as ArticleItem | undefined;

  const fallback: ArticleItem = {
    id: 'a1',
    type: 'article',
    tag: 'Bài báo',
    title: 'Ăn uống lành mạnh giúp sống khỏe',
    cover:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200&auto=format&fit=crop',
    excerpt:
      'Chế độ ăn uống cân bằng là nền tảng cho một cơ thể khỏe mạnh và tinh thần minh mẫn.',
    contentText:
      'Một chế độ ăn uống lành mạnh cần nhiều rau xanh, hoa quả tươi, ngũ cốc nguyên hạt và protein chất lượng cao. Hạn chế đồ ngọt, muối và chất béo bão hòa sẽ giúp giảm nguy cơ bệnh tim mạch, tiểu đường và béo phì.\n\nNgoài dinh dưỡng, việc vận động đều đặn, ngủ đủ giấc và giữ tinh thần thoải mái cũng đóng vai trò quan trọng.\n\nHãy bắt đầu từ những thay đổi nhỏ như uống đủ nước, ăn sáng lành mạnh, và duy trì bữa tối nhẹ nhàng để cải thiện sức khỏe lâu dài.',
  };

  const data = item ?? fallback;

  const goBack = () => {
    if (navigation?.canGoBack?.()) navigation.goBack?.();
    else navigation?.navigate?.('Home', { screen: 'MealPlan' });
  };

  // Demo dữ liệu liên quan
  const related = [
    {
      id: 'r1',
      title: 'Thực đơn xanh: Rau củ đa dạng cho tuần bận rộn',
      img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop',
      read: '5 phút đọc',
    },
    {
      id: 'r2',
      title: 'Protein nhanh gọn: 7 công thức 20 phút',
      img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200&auto=format&fit=crop',
      read: '6 phút đọc',
    },
    {
      id: 'r3',
      title: 'Carb tốt vs Carb xấu — hiểu đúng để ăn đúng',
      img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200&auto=format&fit=crop',
      read: '4 phút đọc',
    },
    {
      id: 'r4',
      title: 'Healthy Snack: 10 gợi ý ít đường, giàu đạm',
      img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200&auto=format&fit=crop',
      read: '7 phút đọc',
    },
  ];

  return (
    <Container>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        <ViewComponent row alignItems="center" mt={8} mb={12}>
          <Pressable onPress={goBack} style={s.backBtn} hitSlop={10}>
            <Entypo name="chevron-left" size={22} color={C.primary} />
          </Pressable>

          <TextComponent
            text={data.title}
            variant="h2"
            weight="bold"
            style={{ flex: 1, marginHorizontal: 8 }}
            numberOfLines={1}
          />

          <View style={s.singleChip}>
            <TextComponent
              text="Bài báo"
              weight="bold"
              size={12}
              color={C.onPrimary}
            />
          </View>
        </ViewComponent>

        {/* Cover lớn */}
        {/* Cover lớn với fallback + debug */}
        <View style={s.coverWrap}>
          <Image
            source={{
              uri:
                data.cover && data.cover.startsWith('http')
                  ? data.cover
                  : 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200&auto=format&fit=crop',
            }}
            style={s.coverImg}
            resizeMode="cover"
            onError={e => {
              console.log('Cover image load error:', e.nativeEvent?.error);
            }}
          />
        </View>

        {/* Excerpt */}
        {!!data.excerpt && (
          <View style={s.excerptBox}>
            <TextComponent text={data.excerpt} style={s.excerptText} />
          </View>
        )}

        {/* Nội dung */}
        <View style={s.articleBox}>
          {data.contentText?.split('\n').map((p, idx) => (
            <TextComponent key={idx} text={p} style={s.paragraph} />
          ))}
        </View>

        {/* Quote */}
        <View style={s.quoteBox}>
          <TextComponent
            text="Bạn chính là những gì bạn ăn. Ăn uống lành mạnh là chìa khóa của sức khỏe. Hãy tập ăn uống cân bằng mỗi ngày! và đừng quên vận động đều đặn.
                        sức khỏe không chỉ là không có bệnh tật, mà còn là trạng thái hoàn hảo về thể chất, tinh thần và xã hội.
                        Nếu bạn không chăm sóc cơ thể mình, bạn sẽ phải chăm sóc bệnh tật của mình. Bạn xứng đáng có một cuộc sống khỏe mạnh và hạnh phúc. Hãy bắt đầu từ hôm nay!
                        Luôn lắng nghe cơ thể bạn và điều chỉnh chế độ ăn uống phù hợp với nhu cầu riêng của bạn. Sức khỏe là hành trình dài, không phải đích đến ngắn hạn.
                        Thức ăn là nhiên liệu cho cơ thể bạn. Hãy chọn những thực phẩm giàu dinh dưỡng để nuôi dưỡng sức khỏe và tinh thần."
            style={s.quoteText}
          />
        </View>

        {/* Bài viết liên quan (Grid 2 cột, không dùng tính toán width) */}
        <TextComponent
          text="Bài viết liên quan"
          variant="h3"
          weight="bold"
          style={s.relatedTitle}
        />
        <View style={s.relatedGrid}>
          {related.map(r => (
            <Pressable
              key={r.id}
              style={s.relatedCard}
              onPress={() => {
                /* điều hướng chi tiết nếu cần */
              }}
            >
              <Image source={{ uri: r.img }} style={s.relatedImg} />
              <View style={s.relatedBody}>
                <TextComponent text={r.title} numberOfLines={2} weight="bold" />
                <TextComponent text={r.read} size={12} tone="muted" />
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Container>
  );
}

const s = StyleSheet.create({
  scroll: { paddingBottom: 40 },

  /* Header */
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  singleChip: {
    backgroundColor: C.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Cover */
  coverWrap: { paddingHorizontal: 16 },
  coverImg: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
    backgroundColor: '#f1f5f9',
  },

  /* Excerpt */
  excerptBox: {
    marginHorizontal: 16,
    padding: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  excerptText: {
    fontStyle: 'italic',
    fontSize: 15.5,
    lineHeight: 24,
    color: '#334155',
  },

  /* Content */
  articleBox: { marginTop: 20, marginHorizontal: 16 },
  paragraph: {
    fontSize: 15.5,
    lineHeight: 26,
    color: '#0f172a',
    marginBottom: 16,
  },

  /* Quote */
  quoteBox: {
    marginHorizontal: 16,
    marginTop: 28,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: C.primary,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
  },
  quoteText: { fontSize: 15.5, lineHeight: 25, color: '#065f46', marginTop: 6 },

  /* Related grid 2 cột — không tính width: dùng % để tránh tràn */
  relatedTitle: {
    marginHorizontal: 16,
    marginTop: 28,
    marginBottom: 12,
    fontSize: 18,
  },
  relatedGrid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // chia đều 2 cột
  },
  relatedCard: {
    width: '48%', // 2 cột ổn định, không tràn
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 14, // khoảng cách dọc giữa các hàng
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  relatedImg: {
    width: '100%',
    height: 120,
  },
  relatedBody: {
    padding: 10,
  },
});

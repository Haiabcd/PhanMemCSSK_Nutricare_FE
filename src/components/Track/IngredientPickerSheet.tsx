import React, { useEffect, useState, useRef } from 'react';
import {
  Modal,
  View,
  Pressable,
  TextInput,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import V from '../ViewComponent';
import Text from '../TextComponent';
import { colors } from '../../constants/colors';
import type { IngredientResponse } from '../../types/food.type';
import { autocompleteIngredients } from '../../services/food.service';
import { safeNum } from '../../helpers/number.helper';

const PLACEHOLDER_COLOR = '#94a3b8';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function IngredientPickerSheet({
  visible,
  onClose,
  onPick,
  insetsBottom = 0,
  keyboardH = 0,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (item: IngredientResponse) => void;
  insetsBottom?: number;
  keyboardH?: number;
}) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<IngredientResponse[]>([]);
  const acRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
      setLoading(false);
      acRef.current?.abort?.();
      return;
    }
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    acRef.current = ac;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const list = await autocompleteIngredients(query.trim(), 20, ac.signal);
        setResults(Array.isArray(list) ? list : []);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [visible, query]);

  const getThumb = (f?: { imageUrl?: string }) =>
    f?.imageUrl ||
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=300&q=80';

  // Tính toán chiều cao động dựa trên màn hình và bàn phím (responsive cho đa màn hình)
  const maxSheetHeight = SCREEN_HEIGHT * 0.95 - keyboardH; // Tăng từ 0.9 lên 0.95 để sheet lớn hơn trên đa màn hình
  const listMaxHeight = maxSheetHeight - 100; // Giảm từ 120 xuống 100 để dành nhiều không gian hơn cho danh sách
  // Tính chiều cao danh sách: tối thiểu 300px (cho màn hình nhỏ), tối đa 50% màn hình trừ keyboard (cho màn hình lớn)
  const listHeight = Math.max(
    300,
    Math.min(listMaxHeight, SCREEN_HEIGHT * 0.5 - keyboardH),
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheetWrap}>
          <V
            style={[
              styles.sheet,
              {
                paddingBottom: 12 + insetsBottom + keyboardH,
                maxHeight: maxSheetHeight,
              },
            ]}
          >
            <V row between alignItems="center" style={styles.sheetHeader}>
              <Text text="Chọn nguyên liệu" variant="h3" />
              <Pressable onPress={onClose} hitSlop={10}>
                <Text text="Đóng" color={colors.primary} weight="bold" />
              </Pressable>
            </V>

            <TextInput
              placeholder="Nhập tên nguyên liệu"
              style={styles.input}
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator />
              </View>
            ) : results.length === 0 && query.trim() ? (
              <View style={styles.emptyContainer}>
                <Text text="Không tìm thấy nguyên liệu" tone="muted" />
              </View>
            ) : (
              <View style={{ height: listHeight }}>
                <FlatList
                  keyboardShouldPersistTaps="handled"
                  data={results}
                  keyExtractor={(it: IngredientResponse) => String(it.id)}
                  ItemSeparatorComponent={() => <View style={styles.sep} />}
                  style={{ flex: 1, minHeight: 300 }} // Thêm minHeight để fallback
                  contentContainerStyle={{ flexGrow: 1 }}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => {
                        onPick(item);
                        onClose();
                      }}
                      style={styles.item}
                    >
                      <V row alignItems="center" style={{ gap: 10 }}>
                        <Image
                          source={{ uri: getThumb(item) }}
                          style={styles.thumb}
                        />
                        <V style={{ flex: 1 }}>
                          <Text
                            text={item.name}
                            weight="semibold"
                            numberOfLines={1}
                          />
                          <Text
                            text={`${item.unit} • per 100: ${Math.round(
                              safeNum(item.per100?.kcal),
                            )} kcal`}
                            tone="muted"
                            variant="caption"
                          />
                        </V>
                      </V>
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    !query.trim() ? (
                      <View style={styles.emptyContainer}>
                        <Text
                          text="Nhập tên nguyên liệu để tìm kiếm"
                          tone="muted"
                        />
                      </View>
                    ) : null
                  }
                />
              </View>
            )}

            <Pressable
              onPress={onClose}
              style={[
                styles.actionBtn,
                { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
              ]}
            >
              <Text text="Hủy" weight="bold" color={colors.text} />
            </Pressable>
          </V>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 8,
    color: colors.text,
    fontSize: 16,
  },
  item: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  sep: { height: 1, backgroundColor: '#eef2f7', marginLeft: 58 },
  actionBtn: {
    height: 48,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  loadingContainer: {
    flex: 1,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
});

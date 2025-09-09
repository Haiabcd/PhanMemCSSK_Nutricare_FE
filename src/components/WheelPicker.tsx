import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";



type Props = {
  value: number | null;
  onChange: (year: number) => void;
};


const ITEM_HEIGHT = 56;
const VISIBLE_COUNT = 5; 
const HIL_COLOR = "#22C55E";
const HIL_BG = "rgba(34,197,94,0.10)";
const TEXT_ACTIVE = "#0F172A";
const TEXT_INACTIVE = "#94A3B8";

const getYear = () => new Date().getFullYear();
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const WheelPicker: React.FC<Props> = React.memo(({ value, onChange }) => {
  const [currentYear, setCurrentYear] = React.useState(getYear());
  React.useEffect(() => {
    const now = new Date();
    const nextYearStart = new Date(now.getFullYear() + 1, 0, 1).getTime();
    const timer = setTimeout(() => setCurrentYear(getYear()), nextYearStart - now.getTime());
    return () => clearTimeout(timer);
  }, [currentYear]);

  const minValidYear = currentYear - 100; 
  const maxValidYear = currentYear - 13;  
  const years = React.useMemo(() => {
    const len = maxValidYear - minValidYear + 1;
    return Array.from({ length: len }, (_, i) => maxValidYear - i);
  }, [minValidYear, maxValidYear]);

  const selectedIndex = React.useMemo(() => {
    if (value == null) return 0;
    const safe = clamp(value, minValidYear, maxValidYear);
    const idx = years.indexOf(safe);
    return idx >= 0 ? idx : 0;
  }, [value, years, minValidYear, maxValidYear]);

  const listRef = React.useRef<FlatList<number>>(null);
  React.useEffect(() => {
    if (selectedIndex >= 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({
          offset: selectedIndex * ITEM_HEIGHT,
          animated: false,
        });
      });
    }
  }, [selectedIndex]);

  const padV = ((ITEM_HEIGHT * VISIBLE_COUNT) - ITEM_HEIGHT) / 2;

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_HEIGHT);
    const val = years[clamp(idx, 0, years.length - 1)];
    if (typeof val === "number") onChange(val);
  };

  const renderItem = React.useCallback(
    ({ item, index }: { item: number; index: number }) => {
      const active = index === selectedIndex;
      return (
        <View style={[styles.item, { height: ITEM_HEIGHT }]}>
          <Text style={[styles.text, active ? styles.textActive : styles.textInactive]}>
            {item}
          </Text>
        </View>
      );
    },
    [selectedIndex]
  );

  const keyExtractor = React.useCallback((item: number) => String(item), []);
  const getItemLayout = React.useCallback(
    (_: unknown, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  return (
    <View style={{ height: ITEM_HEIGHT * VISIBLE_COUNT }}>
      {/* Highlight ô giữa */}
      <View
        pointerEvents="none"
        style={[
          styles.highlight,
          {
            top: ((ITEM_HEIGHT * VISIBLE_COUNT) - ITEM_HEIGHT) / 2,
            height: ITEM_HEIGHT,
            borderColor: HIL_COLOR,
            backgroundColor: HIL_BG,
          },
        ]}
      />
      <FlatList
        ref={listRef}
        data={years}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        initialNumToRender={15}
        windowSize={7}
        maxToRenderPerBatch={15}
        updateCellsBatchingPeriod={50}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        bounces={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: padV }}
        onMomentumScrollEnd={onMomentumScrollEnd}
      />
    </View>
  );
});

export default WheelPicker;

const styles = StyleSheet.create({
  highlight: {
    position: "absolute",
    left: 12,
    right: 12,
    borderRadius: 14,
    borderWidth: 2,
  },
  item: {
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  textActive: {
    fontSize: 28,
    color: TEXT_ACTIVE,
  },
  textInactive: {
    fontSize: 18,
    color: TEXT_INACTIVE,
  },
});

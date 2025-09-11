// ViewComponent.tsx
import React, { ReactNode, memo } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../constants/colors';

type Variant = 'none' | 'card' | 'surface';

interface Props {
  children: ReactNode;
  // layout
  row?: boolean;
  flex?: number;
  gap?: number;
  wrap?: boolean;

  center?: boolean;
  between?: boolean;
  around?: boolean;
  evenly?: boolean;

  justifyContent?: ViewStyle['justifyContent'];
  alignItems?: ViewStyle['alignItems'];

  variant?: Variant; // 'card' | 'surface' | 'none'
  backgroundColor?: string;
  radius?: number;
  border?: boolean;
  borderColor?: string;

  style?: StyleProp<ViewStyle>;

  // spacing shorthands
  m?: number;
  mx?: number;
  my?: number;
  mt?: number;
  mr?: number;
  mb?: number;
  ml?: number;
  p?: number;
  px?: number;
  py?: number;
  pt?: number;
  pr?: number;
  pb?: number;
  pl?: number;
}

const ViewComponent = memo(
  ({
    children,
    row,
    flex,
    gap = 0,
    wrap = false,

    center,
    between,
    around,
    evenly,

    justifyContent,
    alignItems,

    variant = 'none',
    backgroundColor,
    radius,
    border,
    borderColor = colors.border,

    style,

    m,
    mx,
    my,
    mt,
    mr,
    mb,
    ml,
    p,
    px,
    py,
    pt,
    pr,
    pb,
    pl,
  }: Props) => {
    const spacing: ViewStyle = {};

    // margin
    if (m !== undefined) spacing.margin = m;
    if (mx !== undefined) spacing.marginHorizontal = mx;
    if (my !== undefined) spacing.marginVertical = my;
    if (mt !== undefined) spacing.marginTop = mt;
    if (mr !== undefined) spacing.marginRight = mr;
    if (mb !== undefined) spacing.marginBottom = mb;
    if (ml !== undefined) spacing.marginLeft = ml;

    // padding
    if (p !== undefined) spacing.padding = p;
    if (px !== undefined) spacing.paddingHorizontal = px;
    if (py !== undefined) spacing.paddingVertical = py;
    if (pt !== undefined) spacing.paddingTop = pt;
    if (pr !== undefined) spacing.paddingRight = pr;
    if (pb !== undefined) spacing.paddingBottom = pb;
    if (pl !== undefined) spacing.paddingLeft = pl;

    // shortcuts
    const jc: ViewStyle['justifyContent'] = center
      ? 'center'
      : between
      ? 'space-between'
      : around
      ? 'space-around'
      : evenly
      ? 'space-evenly'
      : justifyContent ?? 'flex-start';

    const ai: ViewStyle['alignItems'] = center
      ? 'center'
      : alignItems ?? 'stretch';

    // presets
    const preset: ViewStyle | undefined =
      variant === 'card'
        ? {
            backgroundColor: colors.white,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
          }
        : variant === 'surface'
        ? { backgroundColor: colors.bg }
        : undefined;

    return (
      <View
        style={[
          preset,
          spacing,
          {
            flexDirection: row ? 'row' : 'column',
            justifyContent: jc,
            alignItems: ai,
            gap,
            flex,
            flexWrap: wrap ? 'wrap' : 'nowrap',
            backgroundColor, // cho phép override preset
            borderRadius: radius ?? preset?.borderRadius,
            ...(border ? { borderWidth: 1, borderColor } : null),
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  },
);

export default ViewComponent;

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';

interface Props {
  children: ReactNode;
  // layout
  justifyContent?: ViewStyle['justifyContent'];
  alignItems?: ViewStyle['alignItems'];
  flex?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;

  // spacing shorthands
  m?: number; // margin
  mx?: number; // marginHorizontal
  my?: number; // marginVertical
  mt?: number;
  mr?: number;
  mb?: number;
  ml?: number;

  p?: number; // padding
  px?: number; // paddingHorizontal
  py?: number; // paddingVertical
  pt?: number;
  pr?: number;
  pb?: number;
  pl?: number;
}

const RowComponent = ({
  children,
  justifyContent = 'space-between',
  alignItems = 'center',
  flex,
  gap = 0,
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

  // margin precedence
  if (m !== undefined) spacing.margin = m;
  if (mx !== undefined) spacing.marginHorizontal = mx;
  if (my !== undefined) spacing.marginVertical = my;
  if (mt !== undefined) spacing.marginTop = mt;
  if (mr !== undefined) spacing.marginRight = mr;
  if (mb !== undefined) spacing.marginBottom = mb;
  if (ml !== undefined) spacing.marginLeft = ml;

  // padding precedence
  if (p !== undefined) spacing.padding = p;
  if (px !== undefined) spacing.paddingHorizontal = px;
  if (py !== undefined) spacing.paddingVertical = py;
  if (pt !== undefined) spacing.paddingTop = pt;
  if (pr !== undefined) spacing.paddingRight = pr;
  if (pb !== undefined) spacing.paddingBottom = pb;
  if (pl !== undefined) spacing.paddingLeft = pl;

  return (
    <View
      style={[
        styles.container,
        spacing,
        {
          justifyContent,
          alignItems,
          flex: flex !== undefined ? flex : 1,
          gap,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default RowComponent;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
});

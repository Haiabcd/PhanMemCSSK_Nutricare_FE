// TextComponent.tsx
import React, { memo } from 'react';
import { Text, TextStyle, StyleProp, TextProps } from 'react-native';
import { fontFamilies } from '../constants/fontFamilies';
import { colors } from '../constants/colors';

type Weight = 'regular' | 'medium' | 'semibold' | 'bold' | 'italic';
type Variant = 'h1' | 'h2' | 'h3' | 'subtitle' | 'body' | 'caption';
type Tone = 'default' | 'muted' | 'primary' | 'success' | 'danger' | 'inverse';

interface Props extends Omit<TextProps, 'style' | 'children'> {
  text: string;
  size?: number;
  color?: string;
  weight?: Weight;
  align?: TextStyle['textAlign'];
  variant?: Variant;
  tone?: Tone;
  style?: StyleProp<TextStyle>;
  flexFill?: boolean;
}

const WEIGHT_TO_FAMILY: Partial<Record<Weight, string>> = {
  regular: fontFamilies.regular,
  medium: (fontFamilies as any).medium,
  semibold: (fontFamilies as any).semiBold,
  bold: (fontFamilies as any).bold,
  italic: (fontFamilies as any).italic,
};

const VARIANT: Record<Variant, { size: number; weight: Weight; lh: number }> = {
  h1: { size: 28, weight: 'bold', lh: 1.25 },
  h2: { size: 22, weight: 'bold', lh: 1.28 },
  h3: { size: 18, weight: 'bold', lh: 1.3 },
  subtitle: { size: 15, weight: 'semibold', lh: 1.32 },
  body: { size: 15, weight: 'regular', lh: 1.35 },
  caption: { size: 12, weight: 'regular', lh: 1.25 },
};

const TONE: Record<Tone, string> = {
  default: colors.text,
  muted: colors.sub,
  primary: colors.primary,
  success: colors.success,
  danger: colors.red,
  inverse: colors.textWhite,
};

const TextComponent = memo(
  ({
    text,
    variant = 'body',
    tone = 'default',
    size,
    color,
    weight,
    align,
    numberOfLines,
    allowFontScaling = true,
    flexFill = false,
    style,
    ...rest
  }: Props) => {
    const preset = VARIANT[variant];
    const finalSize = size ?? preset.size;
    const finalWeight = weight ?? preset.weight;
    const finalColor = color ?? TONE[tone] ?? colors.text;
    const lineHeight = Math.round(finalSize * preset.lh);
    const family = WEIGHT_TO_FAMILY[finalWeight] || fontFamilies.regular;

    return (
      <Text
        allowFontScaling={allowFontScaling}
        numberOfLines={numberOfLines}
        {...rest}
        style={[
          {
            includeFontPadding: false,
            fontSize: finalSize,
            lineHeight,
            color: finalColor,
            fontFamily: family,
            textAlign: align,
          },
          flexFill && { flex: 1, minWidth: 0 },
          style,
        ]}
      >
        {text}
      </Text>
    );
  },
);

export default TextComponent;

import React from 'react';
import { Pressable } from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import TextComponent from '../TextComponent';
import ViewComponent from '../ViewComponent';
import { colors as C } from '../../constants/colors';

export interface DateButtonProps {
  date: Date;
  label?: string;
  onPress?: () => void;
  iconSize?: number;
  formatter?: (d: Date) => string;
}

const defaultFmt = (d: Date) =>
  `${d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })}`;

export default function DateButton({
  date,
  label,
  onPress,
  iconSize = 18,
  formatter = defaultFmt,
}: DateButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label || 'Chọn ngày'}
    >
      <ViewComponent row center gap={8} flex={0}>
        <Entypo name="calendar" size={iconSize} color={C.primary} />
        <TextComponent
          text={formatter(date)}
          variant="subtitle"
          weight="bold"
        />
      </ViewComponent>
    </Pressable>
  );
}

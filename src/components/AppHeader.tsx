import React, { useMemo } from 'react';
import { Image, StyleSheet, Pressable } from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import ViewComponent from './ViewComponent';
import TextComponent from './TextComponent';
import { colors as C } from '../constants/colors';
import { useHeader } from '../context/HeaderProvider';

type AppHeaderProps = {
  loading?: boolean;
  greetingText?: string;
  onBellPress?: () => void;
};

const Avatar = React.memo(function Avatar({
  name,
  photoUri,
}: {
  name: string;
  photoUri?: string | null;
}) {
  const [imgError, setImgError] = React.useState(false);
  const initials =
    (name || 'U')
      .trim()
      .split(/\s+/)
      .map(n => n[0]?.toUpperCase() || '')
      .join('')
      .slice(0, 2) || 'U';
  const showInitials = !photoUri || photoUri.trim() === '' || imgError;

  if (showInitials) {
    return (
      <ViewComponent center style={s.avatarFallback} flex={0}>
        <TextComponent
          text={initials}
          variant="subtitle"
          weight="bold"
          tone="primary"
        />
      </ViewComponent>
    );
  }
  return (
    <Image
      source={{ uri: photoUri }}
      style={s.avatar}
      onError={() => setImgError(true)}
    />
  );
});

export default function AppHeader({
  loading,
  greetingText = 'Xin chào,',
  onBellPress = () => {},
}: AppHeaderProps) {
  const { header, loading: headerLoading } = useHeader();
  const displayName = useMemo(
    () => header?.name?.trim() || 'bạn',
    [header?.name],
  );

  const disabled = headerLoading || loading;

  return (
    <ViewComponent row between alignItems="center">
      <ViewComponent row alignItems="center" gap={10} flex={0}>
        <Avatar name={displayName} photoUri={header?.avatarUrl} />
        <ViewComponent flex={0}>
          <TextComponent text={greetingText} variant="caption" tone="muted" />
          <TextComponent text={displayName} variant="subtitle" weight="bold" />
        </ViewComponent>
      </ViewComponent>

      <Pressable
        style={({ pressed }) => [
          s.iconContainer,
          (pressed || disabled) && { opacity: 0.5 },
        ]}
        onPress={onBellPress}
        accessibilityRole="button"
        accessibilityLabel="Mở thông báo"
        hitSlop={8}
        disabled={disabled}
      >
        <Entypo name="bell" size={20} color={C.primary} />
      </Pressable>
    </ViewComponent>
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
    borderWidth: 2,
    borderColor: C.primary,
  },
  avatar: { width: 52, height: 52, borderRadius: 999 },
});

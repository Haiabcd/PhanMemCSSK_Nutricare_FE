// components/AppHeader.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Pressable, InteractionManager } from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import { useFocusEffect } from '@react-navigation/native';

import ViewComponent from './ViewComponent'; // chỉnh path nếu khác
import TextComponent from './TextComponent'; // chỉnh path nếu khác
import { colors as C } from '../constants/colors'; // chỉnh path nếu khác

import { getHeader } from '../services/user.service';
import type { HeaderResponse } from '../types/user.type';

type AppHeaderProps = {
  loading?: boolean;
  onPressBell?: () => void;
  greetingText?: string; // mặc định: "Xin chào,"
};

const Avatar = React.memo(function Avatar({
  name,
  photoUri,
}: {
  name: string;
  photoUri?: string | null;
}) {
  const [imgError, setImgError] = useState(false);
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
  onPressBell,
  greetingText = 'Xin chào,',
}: AppHeaderProps) {
  const [header, setHeader] = useState<HeaderResponse | null>(null);

  const fetchHeader = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await getHeader(signal);
      if (signal?.aborted) return;
      setHeader(res?.data ?? null);
    } catch {
      if (!signal?.aborted) setHeader(null);
    }
  }, []);

  // Lần đầu sau interaction
  useEffect(() => {
    const ac = new AbortController();
    const task = InteractionManager.runAfterInteractions(() => {
      fetchHeader(ac.signal);
    });
    return () => {
      ac.abort();
      // @ts-ignore
      task?.cancel?.();
    };
  }, [fetchHeader]);

  // Refetch khi màn focus
  useFocusEffect(
    useCallback(() => {
      const ac = new AbortController();
      fetchHeader(ac.signal);
      return () => ac.abort();
    }, [fetchHeader]),
  );

  const displayName = useMemo(
    () => header?.name?.trim() || 'bạn',
    [header?.name],
  );

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
        style={s.iconContainer}
        onPress={onPressBell}
        accessibilityRole="button"
        accessibilityLabel="Mở thông báo"
        hitSlop={8}
        disabled={loading}
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

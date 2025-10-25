import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import TextComponent from '../TextComponent';
import ViewComponent from '../ViewComponent';
import { colors as C } from '../../constants/colors';

// ⬇️ Tuỳ chọn blur trên iOS: cài @react-native-community/blur
// yarn add @react-native-community/blur && pod install
let BlurView: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  BlurView = require('@react-native-community/blur').BlurView;
} catch (_) {
  /* không có blur thì fallback về backdrop đen mờ */
}

type Props = {
  visible: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmLogoutModal({
  visible,
  loading,
  onCancel,
  onConfirm,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // animate out nhanh và mượt
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 140,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.96,
          duration: 140,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacity, scale]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.wrap}>
        {/* Backdrop */}
        {Platform.OS === 'ios' && BlurView ? (
          <BlurView
            style={StyleSheet.absoluteFill}
            blurAmount={20}
            blurType="dark"
          />
        ) : (
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.backdrop, { opacity }]}
          />
        )}

        {/* Card */}
        <Animated.View
          style={[styles.card, { opacity, transform: [{ scale }] }]}
        >
          <TextComponent
            text="Đăng xuất khỏi tài khoản?"
            weight="bold"
            variant="subtitle"
            style={styles.title}
          />
          <TextComponent
            text="Bạn sẽ cần đăng nhập lại để đồng bộ dữ liệu trên nhiều thiết bị."
            tone="muted"
            variant="caption"
            style={styles.subtitle}
          />

          <ViewComponent row gap={10} mt={6}>
            <Pressable
              onPress={onCancel}
              disabled={loading}
              android_ripple={{ color: '#e5e7eb' }}
              style={[
                styles.btn,
                styles.cancelBtn,
                loading && { opacity: 0.6 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Huỷ đăng xuất"
            >
              <TextComponent text="Huỷ" weight="bold" />
            </Pressable>

            <Pressable
              onPress={onConfirm}
              disabled={loading}
              android_ripple={{ color: '#fecaca' }}
              style={[
                styles.btn,
                styles.dangerBtn,
                loading && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Xác nhận đăng xuất"
            >
              {loading ? (
                <ActivityIndicator />
              ) : (
                <View style={styles.rowCenter}>
                  <McIcon
                    name="logout"
                    size={16}
                    color="#fff"
                    style={{ marginRight: 6 }}
                  />
                  <TextComponent
                    text="Đăng xuất"
                    weight="bold"
                    tone="inverse"
                  />
                </View>
              )}
            </Pressable>
          </ViewComponent>
        </Animated.View>
      </View>
    </Modal>
  );
}

const CARD_BG = '#ffffff';

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: CARD_BG,

    // Shadow iOS
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },

    // Elevation Android
    elevation: 8,
  },
  title: {
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dangerBtn: {
    backgroundColor: '#EF4444',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

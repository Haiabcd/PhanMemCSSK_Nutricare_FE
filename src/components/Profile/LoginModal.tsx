import React from 'react';
import { Modal, Pressable, StyleSheet, Platform, View } from 'react-native';
import ViewComponent from '../ViewComponent';
import TextComponent from '../TextComponent';
import { colors as C } from '../../constants/colors';
import BounceButton from '../Welcome/BounceButton';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (provider: 'google' | 'facebook') => void;
};

export default function LoginChoiceModal({
  visible,
  onClose,
  onSelect,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Root overlay full-screen */}
      <View style={styles.overlayRoot}>
        <Pressable style={styles.overlayTouchable} onPress={onClose} />

        <View style={styles.cardWrap}>
          <ViewComponent style={styles.card}>
            <ViewComponent row between alignItems="center" mb={8}>
              <TextComponent
                text="Chọn phương thức đăng nhập"
                variant="subtitle"
                weight="bold"
                style={styles.title}
              />
              <Pressable
                onPress={onClose}
                hitSlop={10}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Đóng"
              >
                <TextComponent
                  text="×"
                  weight="bold"
                  style={{ fontSize: 20 }}
                />
              </Pressable>
            </ViewComponent>

            <TextComponent
              text="Đăng nhập để đồng bộ và lưu trữ dữ liệu khi đổi thiết bị."
              variant="caption"
              tone="muted"
              style={styles.caption}
            />

            <BounceButton
              label="Tiếp tục với Google"
              icon="google"
              labelSize={16}
              iconStyle={{ color: '#EA4335', fontSize: 18 }}
              style={styles.googleBtn}
              labelStyle={{ fontWeight: '800', color: C.text }}
              onPress={() => onSelect('google')}
            />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <TextComponent text="hoặc" variant="caption" tone="muted" />
              <View style={styles.divider} />
            </View>

            <BounceButton
              label="Tiếp tục với Facebook"
              icon="facebook"
              labelSize={16}
              iconStyle={{ color: C.white, fontSize: 18 }}
              style={styles.facebookBtn}
              labelStyle={{ color: C.white, fontWeight: '800' }}
              onPress={() => onSelect('facebook')}
            />

            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <TextComponent text="Hủy" weight="bold" color={C.text} />
            </Pressable>
          </ViewComponent>
        </View>
      </View>
    </Modal>
  );
}

/* ============ Styles ============ */
const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },

  cardWrap: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 16,
  },

  card: {
    width: '100%',
    backgroundColor: C.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: C.slate200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 6 },
      default: {},
    }),
  },

  title: { marginRight: 28 },
  caption: { marginBottom: 12, fontSize: 12 },

  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.slate100,
  },

  googleBtn: {
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.slate200,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 2 },
    }),
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  divider: { flex: 1, height: 1, backgroundColor: C.slate200 },

  facebookBtn: {
    backgroundColor: '#1877F2',
    borderWidth: 1,
    borderColor: '#1877F2',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },

  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 1 },
    }),
  },
});

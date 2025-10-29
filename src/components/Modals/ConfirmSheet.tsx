import React from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import Text from '../TextComponent';
import V from '../ViewComponent';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel = 'Xóa',
  cancelLabel = 'Hủy',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable style={styles.modalBackdrop} onPress={onCancel}>
        <V variant="card" style={styles.modalCard}>
          <Text text={title} variant="h3" align="center" />
          <Text
            text={message}
            tone="muted"
            align="center"
            style={{ marginTop: 6, marginBottom: 10 }}
          />
          <V row gap={10}>
            <Pressable
              style={[
                styles.actionBtn,
                { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', flex: 1 },
              ]}
              onPress={onCancel}
            >
              <Text text={cancelLabel} weight="bold" color={colors.text} />
            </Pressable>
            <Pressable
              style={[
                styles.actionBtn,
                {
                  backgroundColor: colors.red,
                  borderColor: '#fca5a5',
                  flex: 1,
                },
              ]}
              onPress={onConfirm}
            >
              <Text
                text={confirmLabel}
                weight="bold"
                color={colors.onPrimary}
              />
            </Pressable>
          </V>
        </V>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtn: {
    height: 48,
    borderRadius: 12,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    alignSelf: 'stretch',
  },
});

import React from 'react';
import { Modal, Pressable, StyleSheet, View as RNView } from 'react-native';
import { colors } from '../../constants/colors';
import Text from '../TextComponent';
import V from '../ViewComponent';

const ORANGE = {
  bg: '#FFF7ED',
  border: '#FDBA74',
  text: '#7C2D12',
  solid: '#F59E0B',
};

type Props = {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
};

export default function AlertSheet({
  visible,
  title = 'Thông báo',
  message,
  onClose,
}: Props) {
  const lines = (message || '')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
  const lead = lines[0] || '';
  const bullets = lines.slice(1);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <V
          variant="card"
          style={[
            styles.modalCard,
            {
              borderColor: ORANGE.border,
              backgroundColor: ORANGE.bg,
              paddingTop: 18,
              paddingBottom: 14,
              maxWidth: 480,
            },
          ]}
        >
          {/* Header: Icon + Title */}
          <V row alignItems="center" style={{ marginBottom: 10 }}>
            <V
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
                backgroundColor: '#FED7AA',
                borderWidth: 1,
                borderColor: '#FDBA74',
              }}
            >
              <Text text="⚠️" style={{ fontSize: 18 }} />
            </V>
            <Text
              text={title}
              variant="h3"
              weight="bold"
              style={{ color: ORANGE.text }}
            />
          </V>

          {/* Lead */}
          {lead ? (
            <Text
              text={lead}
              style={{
                color: ORANGE.text,
                marginBottom: 8,
                lineHeight: 22,
                fontWeight: '600',
              }}
            />
          ) : null}

          {/* Bullets */}
          {bullets.length > 0 && (
            <RNView
              style={{
                maxHeight: 220,
                borderWidth: 1,
                borderColor: ORANGE.border,
                borderRadius: 12,
                backgroundColor: '#FFF9F3',
                padding: 10,
                marginBottom: 12,
              }}
            >
              {bullets.map((item, i) => (
                <V row key={i} style={{ marginBottom: 6 }}>
                  <Text
                    text="•"
                    style={{
                      color: ORANGE.text,
                      marginRight: 8,
                      lineHeight: 22,
                      fontSize: 16,
                    }}
                  />
                  <Text
                    text={item}
                    style={{ color: ORANGE.text, lineHeight: 22 }}
                  />
                </V>
              ))}
            </RNView>
          )}

          {/* Button */}
          <Pressable
            onPress={onClose}
            style={[
              styles.actionBtn,
              { backgroundColor: ORANGE.solid, borderColor: ORANGE.solid },
            ]}
          >
            <Text text="OK" weight="bold" color={colors.onPrimary} />
          </Pressable>
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

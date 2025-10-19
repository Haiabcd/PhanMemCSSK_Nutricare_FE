import React from 'react';
import { StyleSheet } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import ViewComponent from '../../components/ViewComponent';
import TextComponent from '../../components/TextComponent';
import { colors as C } from '../../constants/colors';

type Props = {
  icon: string;
  label: string;
  children: React.ReactNode;
  style?: object;
};

export default function FormField({ icon, label, children, style }: Props) {
  return (
    <ViewComponent variant="card" style={[styles.fieldCard, style]}>
      {/* Header: cho phép label wrap nhiều dòng */}
      <ViewComponent
        row
        alignItems="flex-start" // 👈 Quan trọng: để Text có thể cao theo nhiều dòng
        mb={8}
        style={styles.headerRow} // 👈 minWidth:0 để bật wrapping trong flex row
      >
        <ViewComponent center style={styles.iconBadge}>
          <McIcon name={icon as any} size={16} color={C.success} />
        </ViewComponent>

        {/* Bọc label để cho phép co giãn */}
        <ViewComponent style={styles.labelWrap}>
          <TextComponent
            text={label}
            variant="caption"
            tone="muted"
            weight="bold"
            numberOfLines={3} // 👈 Giới hạn 3 dòng (tùy chỉnh nếu muốn)
            style={styles.labelText}
          />
        </ViewComponent>
      </ViewComponent>

      {children}
    </ViewComponent>
  );
}

const styles = StyleSheet.create({
  fieldCard: {
    width: '100%',
    padding: 10,
    marginBottom: 14,
    borderRadius: 14,
    backgroundColor: C.white,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  headerRow: {
    minWidth: 0, // 👈 BẮT BUỘC để Text trong flex row có thể wrap
  },
  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: C.greenSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  labelWrap: {
    flex: 1,
    minWidth: 0, // 👈 Cho phép Text co giãn và xuống dòng
    marginLeft: 8,
    paddingTop: 2,
  },
  labelText: {
    letterSpacing: 0.3,
    lineHeight: 16,
    // Các thuộc tính dưới giúp tránh tràn:
    flexShrink: 1,
    flexGrow: 1,
    flexBasis: 0,
  },
});

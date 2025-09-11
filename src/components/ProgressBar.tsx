import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

interface Props {
  progress: number;
}

export default function ProgressBar(props: Props) {
  const { progress } = props;
  return (
    <View style={styles.bg}>
      <View
        style={[
          styles.fill,
          { width: `${Math.min(1, Math.max(0, progress)) * 100}%` },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    height: 8,
    backgroundColor: '#A9D6DD',
    borderRadius: 999,
    overflow: 'hidden',
    flex: 1,
    marginHorizontal: 12,
  },
  fill: {
    height: 8,
    backgroundColor: colors.greenLight,
    borderRadius: 999,
  },
});

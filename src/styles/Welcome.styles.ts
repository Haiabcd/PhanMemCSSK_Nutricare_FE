import { Dimensions, StyleSheet } from "react-native";
import { colors as C } from '../constants/colors';

export const { width, height } = Dimensions.get('window');

export const s = StyleSheet.create({
    bgList: {
      ...StyleSheet.absoluteFillObject,
    },
    bgImage: {
      width,
      height,
    },
    title: {
      marginTop: 8,
    },
    bottom: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 24,
    },
    btnPrimary: {
      backgroundColor: C.primary,
    },
    btnPrimaryLabel: {
      color: C.onPrimary,
    },
    termsText: {
      color: C.textWhite,
      textAlign: 'center',
      marginTop: 8,
    },
    termsLink: {
      textDecorationLine: 'underline',
      fontWeight: '700',
      color: C.blue,
    },
  });
  
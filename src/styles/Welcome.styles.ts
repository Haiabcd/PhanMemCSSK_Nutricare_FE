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

    subtitleWrap: {
      alignSelf: 'center',
      backgroundColor: 'rgba(255,255,255,0.92)', 
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginTop: 8,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3, 
    },
    subtitleText: {
      color: C.slate900, 
    },
  });
  
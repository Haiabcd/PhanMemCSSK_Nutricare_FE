import { StyleSheet } from 'react-native';
import { colors as C } from '../constants/colors';

export const s = StyleSheet.create({
  bgList: {
    ...StyleSheet.absoluteFillObject, 
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
    color: C.textBlack,
    textAlign: 'center',
    marginTop: 15,
  },
  termsLink: {
    textDecorationLine: 'underline',
    fontWeight: '700',
    color: C.blue,
  },
});

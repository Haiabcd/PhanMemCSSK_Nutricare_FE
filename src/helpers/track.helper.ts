import { colors } from '../constants/colors';
type NoticeTone = 'default' | 'success' | 'warning' | 'danger' | 'info';

export function toneToColor(t: NoticeTone) {
    switch (t) {
      case 'success':
        return {
          bg: colors.primarySurface,
          border: colors.primaryBorder,
          text: colors.primaryDark,
        };
      case 'warning':
        return {
          bg: colors.accentSurface,
          border: colors.accentBorder,
          text: colors.accentDark,
        };
      case 'danger':
        return { bg: '#fee2e2', border: '#fecaca', text: '#7f1d1d' };
      case 'info':
        return { bg: '#eff6ff', border: '#bfdbfe', text: '#1e3a8a' };
      default:
        return { bg: colors.bg, border: colors.border, text: colors.text };
    }
  }
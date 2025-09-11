import React, { useMemo, useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  Text,
  Image,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../../constants/colors';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

type BounceButtonProps = {
  label?: string;
  icon?: string;
  labelSize?: number;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  iconStyle?: StyleProp<TextStyle>;
  gap?: number;
  duration?: number;
  pressedScale?: number;
} & Omit<TouchableOpacityProps, 'activeOpacity' | 'onPressIn' | 'onPressOut'>;

const BounceButton: React.FC<BounceButtonProps> = ({
  label,
  icon,
  labelSize = 16,
  containerStyle,
  labelStyle,
  iconStyle,
  gap = 15,
  duration = 90,
  pressedScale = 0.95,
  children,
  onPress,
  disabled,
  ...touchableProps
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.timing(scale, {
      toValue,
      duration,
      useNativeDriver: true,
    }).start();
  };

  const onPressIn = () => animateTo(pressedScale);
  const onPressOut = () => animateTo(1);

  const content = useMemo(() => {
    // Nếu truyền children thì ưu tiên render children
    if (children) return children;
    return (
      <View style={styles.row}>
        {icon ? (
          icon === 'google' ? (
            <Image
              source={require('../../assets/images/common/gg.png')}
              style={[{ width: 24, height: 24 }]}
              resizeMode="contain"
              accessibilityLabel="Google logo"
            />
          ) : (
            <FontAwesome5 name={icon} size={23} style={iconStyle} />
          )
        ) : null}
        {icon && label ? <View style={{ width: gap }} /> : null}
        {label ? (
          <Text
            style={[styles.label, { fontSize: labelSize }, labelStyle]}
            numberOfLines={1}
          >
            {label}
          </Text>
        ) : null}
      </View>
    );
  }, [children, icon, iconStyle, label, labelSize, labelStyle, gap]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        disabled={disabled}
        style={[styles.buttonBase, disabled && styles.disabled, containerStyle]}
        {...touchableProps}
      >
        {content}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingVertical: 15,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.black,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default BounceButton;

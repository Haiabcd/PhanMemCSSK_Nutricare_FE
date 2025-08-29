import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native'
import React from 'react'
import { fontFamilies } from '../constants/fontFamilies';
import { colors } from '../constants/colors';


interface Props {
    text: string;
    size?: number;
    font?: string;
    color?: string;
    style?: StyleProp<TextStyle>;

}

const TextComponent = (props: Props) => {
    const { text, size, font, color, style } = props;
    return (
        <Text style={[styles.text, { fontFamily: font ?? fontFamilies.regular, fontSize: size ?? 14, color: color ?? colors.black }, style]}>{text}</Text>
    )
}

export default TextComponent

const styles = StyleSheet.create({
    text: {
        fontWeight: 'bold',
    }
})


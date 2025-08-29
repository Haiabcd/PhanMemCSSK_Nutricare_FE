import { StyleSheet, Text } from 'react-native'
import React from 'react'
import { fontFamilies } from '../constants/fontFamilies';
import { colors } from '../constants/colors';


interface Props {
    text: string;
    size?: number;
    color?: string;
    style?: object;
}

const TextComponent = (props: Props) => {
    const { text, size, color, style } = props;
    return (
        <Text style={[
            styles.text,
            { fontSize: size ?? 15, color: color ?? colors.textBlack },
            style
        ]}>
            {text}
        </Text>
    )
}

export default TextComponent

const styles = StyleSheet.create({
    text: {
        fontFamily: fontFamilies.regular,
    }
})
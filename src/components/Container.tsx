import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import React, { ReactNode } from 'react'
import { spacing } from '../constants/spacings';
import { colors } from '../constants/colors';


interface Props {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
}


const Container = (props: Props) => {

    const { children, style } = props;


    return (
        <View style={[styles.container, style]}>
            {children}
        </View>
    )
}

export default Container

const styles = StyleSheet.create({
    container: {
        paddingTop: 30,
        flex: 1,
        backgroundColor: colors.bg,
        // backgroundColor: "red",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
});
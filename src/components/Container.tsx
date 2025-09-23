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
        flex: 1,
        backgroundColor: colors.bg,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xl,
        paddingVertical: spacing.md,
    },
});
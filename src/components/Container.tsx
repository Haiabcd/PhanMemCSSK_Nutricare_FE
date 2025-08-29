import { StyleSheet, View } from 'react-native'
import React, { ReactNode } from 'react'
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacings';


interface Props {
    children: ReactNode;
}


const Container = (props: Props) => {

    const { children } = props;


    return (
        <View style={styles.container}>
            {children}
        </View>
    )
}

export default Container

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.black,
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.md,
    },
});
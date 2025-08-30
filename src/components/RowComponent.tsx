import { StyleSheet, View } from 'react-native'
import React, { ReactNode } from 'react'
import { colors } from '../constants/colors';


interface Props {
    children: ReactNode;
}

const RowComponent = (props: Props) => {
    const { children } = props;
    return (
        <View style={styles.container}>
            {children}
        </View>
    )
}

export default RowComponent

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.greenLight2,
    }
})
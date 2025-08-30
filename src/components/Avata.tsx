import { Image, ImageSourcePropType, StyleSheet } from 'react-native'
import React from 'react'


interface Props {
    sourceImg: ImageSourcePropType;
}

const Avatar = (props: Props) => {
    const { sourceImg } = props;
    return (
        <Image
            style={styles.avata}
            source={sourceImg}
        />
    )
}

export default Avatar

const styles = StyleSheet.create({
    avata: {
        width: 70,
        height: 70,
    }
})
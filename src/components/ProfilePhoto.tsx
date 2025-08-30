import { Image, ImageSourcePropType, StyleSheet } from 'react-native'
import React from 'react'


interface Props {
    sourceImg: ImageSourcePropType;
}

const ProfilePhoto = (props: Props) => {
    const { sourceImg } = props;
    return (
        <Image
            style={styles.ProfilePhoto}
            source={sourceImg}
        />
    )
}

export default ProfilePhoto

const styles = StyleSheet.create({
    ProfilePhoto: {
        width: 210,
        height: 210,
        resizeMode: 'repeat',
    }
})
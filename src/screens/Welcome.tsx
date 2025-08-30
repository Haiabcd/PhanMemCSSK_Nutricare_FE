import { View, Image, FlatList, Dimensions, StatusBar, Text } from 'react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { styles } from '../styles/Welcome.styles';
import Container from '../components/Container';
import { colors } from '../constants/colors';
import TitleComponent from '../components/TitleComponent';
import BounceButton from '../components/BounceButton';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';


const { width } = Dimensions.get('window');
//------------List Image------------//
const IMAGES = [
    require('../assets/images/Welcome/Track.png'),
    require('../assets/images/Welcome/Theodoibuaan.jpg'),
    require('../assets/images/Welcome/Dexuatthucpham.jpg'),
    require('../assets/images/Welcome/Lapkehoachdinhduong.jpg'),
]
//------------Image Transfer Time ------------//
const AUTO_PLAY_MS = 3000;

const Welcome = () => {
    const listRef = useRef<FlatList<number>>(null);
    const [index, setIndex] = useState(0);
    const DATA = useMemo(() => IMAGES.map((_, i) => i), []);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    // ----------- Animation---------//
    useEffect(() => {
        const id = setInterval(() => {
            const next = (index + 1) % DATA.length;
            listRef.current?.scrollToOffset({
                offset: next * width,
                animated: true,
            });
            setIndex(next);
        }, AUTO_PLAY_MS);

        return () => clearInterval(id);
    }, [index, DATA.length]);



    return (
        <Container>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            <FlatList
                ref={listRef}
                data={DATA}
                keyExtractor={(i) => String(i)}
                renderItem={({ item }) => (
                    <Image source={IMAGES[item]} style={styles.bgImage} resizeMode="cover" />
                )}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEnabled={false}
                getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
                onMomentumScrollEnd={(e) => {
                    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
                    setIndex(newIndex);
                }}
                style={styles.bgList}
            />

            <View style={styles.top}>
                <TitleComponent text="Nutricare" size={36} color={colors.green} />
                <TitleComponent text=" Hành trình sức khỏe của bạn bắt đầu từ đây" size={22} color={colors.textSub} style={styles.title} />
            </View>


            <View style={styles.bottom}>
                {/* Bắt đầu ngay */}
                <BounceButton
                    label="Bắt đầu ngay"
                    containerStyle={[styles.btnStart]}
                    labelStyle={styles.labelStart}
                    labelSize={18}
                    onPress={() => navigation.navigate('Wizard')}
                />

                <TitleComponent text="HOẶC" size={16} color={colors.textWhite} style={styles.textOr} />

                {/* Tiếp tục với Google */}
                <BounceButton
                    label="Tiếp tục với Google"
                    iconSource={require("../assets/images/Welcome/Google.png")}
                    labelSize={18}
                />

                {/* Tiếp tục với Facebook */}
                <BounceButton
                    label="Tiếp tục với Facebook"
                    iconSource={require("../assets/images/Welcome/Facebook.png")}
                    labelSize={18}
                />

                <Text style={styles.termsText}>
                    Bằng cách tiếp tục, bạn đồng ý với{" "}
                    <Text style={styles.termsLink}>Điều khoản sử dụng</Text>
                    {" và "}
                    <Text style={styles.termsLink}>Chính sách bảo mật</Text>
                    {" của chúng tôi"}
                </Text>

            </View>
        </Container>
    )
}

export default Welcome

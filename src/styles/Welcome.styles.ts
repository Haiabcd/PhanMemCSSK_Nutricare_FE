import { StyleSheet, Dimensions } from "react-native";
import { colors } from "../constants/colors";
import { fontFamilies } from "../constants/fontFamilies";
const { width, height } = Dimensions.get("window");

export const styles = StyleSheet.create({
    //--------------Background--------------//
    bgList: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    bgImage: {
        width,
        height,
    },
    //--------------Top--------------//
    top: {
        flex: 4,
        zIndex: 2,
        marginTop: 50,
        alignItems: "center",
    },

    title: {
        textAlign: "center",
        marginTop: 15,
    },
    //--------------Bottom (buttons)--------------//
    bottom: {
        flex: 2,
        zIndex: 2,
        width: "100%",
        justifyContent: "space-around",
        paddingBottom: 20,
    },

    btnStart: {
        backgroundColor: colors.greenLight,
    },
    labelStart: {
        color: colors.textWhite,
        fontFamily: fontFamilies.bold
    },
    textOr: {
        alignSelf: "center",
    },
    termsText: {
        textAlign: "center",
        color: colors.textWhite,
        fontSize: 15,
        fontFamily: fontFamilies.regular
    },
    termsLink: {
        color: colors.blue,
        textDecorationLine: "underline"
    }
    
});
